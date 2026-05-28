"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ScanText,
} from "lucide-react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import styles from "./Manualvisitorentry.module.css";

interface Destination {
  id: string;
  name: string;
  floor: string;
  headName: string;
  description: string | null;
}

interface ManualFormData {
  fullName: string;
  idPhotoUrl: string;
  visitorPhotoUrl: string;
  destinationIds: string[];
  reason: string;
}

const VISITOR_REASONS = [
  "Meeting",
  "Interview",
  "Delivery",
  "Maintenance",
  "Personal",
  "Other",
];

interface ManualVisitorEntryProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ManualVisitorEntry({
  onSuccess,
  onClose,
}: ManualVisitorEntryProps) {
  // Step Wizard: 1: ID Capture -> 2: Review ID & Name -> 3: Face -> 4: Dest -> 5: Reason -> 6: Success
  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState<ManualFormData>({
    fullName: "",
    idPhotoUrl: "",
    visitorPhotoUrl: "",
    destinationIds: [],
    reason: "",
  });

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // OCR State
  const [isExtractingText, setIsExtractingText] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  // Fetch destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await fetch("/api/destinations");
        if (res.ok) {
          setDestinations(await res.json());
        } else {
          setDestinations([
            {
              id: "1",
              name: "Engineering Dept",
              floor: "2",
              headName: "John Doe",
              description: "",
            },
            {
              id: "2",
              name: "HR Office",
              floor: "2",
              headName: "Jane Smith",
              description: "",
            },
            {
              id: "3",
              name: "Executive Suite",
              floor: "5",
              headName: "CEO",
              description: "",
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch destinations", error);
      }
    };
    fetchDestinations();
  }, []);

  const floors = useMemo(() => {
    const unique = Array.from(new Set(destinations.map((d) => d.floor))).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );
    return unique.length > 0 ? unique : ["1", "2", "3", "4", "5"];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return destinations.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.headName.toLowerCase().includes(q) ||
          d.floor.includes(q),
      );
    }
    if (!selectedFloor) return [];
    return destinations.filter((d) => d.floor === selectedFloor);
  }, [destinations, selectedFloor, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDestination = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      destinationIds: prev.destinationIds.includes(id)
        ? prev.destinationIds.filter((d) => d !== id)
        : [...prev.destinationIds, id],
    }));
  };

  // Extract Text from ID using Tesseract
  const extractTextFromId = async (imageSrc: string) => {
    setIsExtractingText(true);
    try {
      const result = await Tesseract.recognize(imageSrc, "eng");
      // Add optional chaining (?.) to safely read the text
      const text = result?.data?.text || "";

      // Basic heuristic to find a name: Look for lines with 2-3 words, capitalized.
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 4 &&
            !l.toLowerCase().includes("republic") &&
            !l.toLowerCase().includes("id"),
        );

      // Add a strict check for lines[0] to satisfy TypeScript
      if (lines.length > 0 && lines[0]) {
        setFormData((prev) => ({
          ...prev,
          fullName: lines[0].replace(/[^a-zA-Z\s]/g, ""),
        }));
      }
    } catch (error) {
      console.error("OCR Extraction failed:", error);
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleCaptureId = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setFormData((prev) => ({ ...prev, idPhotoUrl: imageSrc }));
      setStep(2); // Move to review step
      extractTextFromId(imageSrc); // Start background OCR
    }
  };

  const handleCaptureFace = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setFormData((prev) => ({ ...prev, visitorPhotoUrl: imageSrc }));
      setStep(4); // Move to destination
    }
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/kiosk/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, isManualEntry: true }),
      });

      if (res.ok) {
        setStep(6);
        setTimeout(() => {
          onSuccess?.();
          setStep(1);
          setFormData({
            fullName: "",
            idPhotoUrl: "",
            visitorPhotoUrl: "",
            destinationIds: [],
            reason: "",
          });
          setSelectedFloor(null);
          setSearchQuery("");
        }, 2500);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to register visitor");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render wizard progress
  const renderProgress = () => (
    <div className={styles.progressContainer}>
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={`${styles.progressDot} ${step >= s ? styles.activeDot : ""}`}
        />
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      {step < 6 && (
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title}>Visitor Intake</h2>
              <p className={styles.subtitle}>Step {step} of 5</p>
            </div>
            {onClose && (
              <button className={styles.closeBtn} onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>
          {renderProgress()}
        </div>
      )}

      <div className={styles.formContent}>
        {/* STEP 1: CAPTURE ID */}
        {step === 1 && (
          <div className={styles.stepBlock}>
            <h3 className={styles.stepTitle}>Scan Government ID</h3>
            <p className={styles.stepDesc}>
              Place the ID clearly in the frame.
            </p>

            <div className={styles.cameraBox}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className={styles.webcamVideo}
                videoConstraints={{ facingMode: "user" }}
              />
              <div className={styles.idOverlayGuide} />
            </div>
            <button onClick={handleCaptureId} className={styles.primaryBtn}>
              <Camera size={18} /> Capture ID
            </button>
          </div>
        )}

        {/* STEP 2: REVIEW ID & NAME (OCR) */}
        {step === 2 && (
          <div className={styles.stepBlock}>
            <h3 className={styles.stepTitle}>Verify Details</h3>
            <p className={styles.stepDesc}>
              Review the scanned ID and edit the extracted name if necessary.
            </p>

            <div className={styles.reviewLayout}>
              <div className={styles.previewBox}>
                <img
                  src={formData.idPhotoUrl}
                  alt="ID"
                  className={styles.capturedImg}
                />
                <button onClick={() => setStep(1)} className={styles.retakeBtn}>
                  <RotateCcw size={14} /> Retake ID
                </button>
              </div>

              <div className={styles.dataBox}>
                <label className={styles.label}>
                  Extracted Name <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Enter visitor's full name"
                    autoComplete="off"
                  />
                  {isExtractingText && (
                    <div className={styles.extractingBadge}>
                      <Loader2 size={14} className={styles.spin} />
                      <span>Scanning text...</span>
                    </div>
                  )}
                  {!isExtractingText && formData.fullName && (
                    <div className={styles.successBadge}>
                      <ScanText size={14} /> Text Extracted
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={() => setStep(1)} className={styles.backBtn}>
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.fullName.trim()}
                className={styles.primaryBtn}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CAPTURE FACE */}
        {step === 3 && (
          <div className={styles.stepBlock}>
            <h3 className={styles.stepTitle}>Capture Visitor Photo</h3>
            <p className={styles.stepDesc}>
              Ask the visitor to look at the camera.
            </p>

            {!formData.visitorPhotoUrl ? (
              <>
                <div className={styles.cameraBox}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={styles.webcamVideo}
                    videoConstraints={{ facingMode: "user" }}
                  />
                  <div className={styles.faceOverlayGuide} />
                </div>
                <div className={styles.actions}>
                  <button onClick={() => setStep(2)} className={styles.backBtn}>
                    Back
                  </button>
                  <button
                    onClick={handleCaptureFace}
                    className={styles.primaryBtn}
                  >
                    <Camera size={18} /> Capture Photo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.previewBox}>
                  <img
                    src={formData.visitorPhotoUrl}
                    alt="Face"
                    className={styles.capturedImg}
                  />
                  <button
                    onClick={() =>
                      setFormData((p) => ({ ...p, visitorPhotoUrl: "" }))
                    }
                    className={styles.retakeBtn}
                  >
                    <RotateCcw size={14} /> Retake Photo
                  </button>
                </div>
                <div className={styles.actions}>
                  <button onClick={() => setStep(2)} className={styles.backBtn}>
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className={styles.primaryBtn}
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4: DESTINATION */}
        {step === 4 && (
          <div className={styles.stepBlock}>
            <h3 className={styles.stepTitle}>Select Destination</h3>

            <input
              type="text"
              placeholder="Search department, head name, or floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoComplete="off"
            />

            <div className={styles.scrollArea}>
              {!selectedFloor && !searchQuery.trim() ? (
                <div className={styles.floorGrid}>
                  {floors.map((floor) => (
                    <button
                      key={floor}
                      className={styles.floorCard}
                      onClick={() => setSelectedFloor(floor)}
                    >
                      <span className={styles.floorNum}>{floor}</span>
                      <span className={styles.floorLabel}>Floor</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.destSection}>
                  {!searchQuery.trim() && (
                    <button
                      className={styles.backLink}
                      onClick={() => setSelectedFloor(null)}
                    >
                      <ChevronLeft size={16} /> Back to Floors
                    </button>
                  )}
                  {filteredDestinations.map((dest) => {
                    const selected = formData.destinationIds.includes(dest.id);
                    return (
                      <label
                        key={dest.id}
                        className={`${styles.destCard} ${selected ? styles.destSelected : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleDestination(dest.id)}
                          hidden
                        />
                        <div className={styles.destInfo}>
                          <span className={styles.destName}>{dest.name}</span>
                          <span className={styles.destMeta}>
                            {dest.headName} (Floor {dest.floor})
                          </span>
                        </div>
                        {selected && (
                          <CheckCircle2
                            size={20}
                            className={styles.checkIcon}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button onClick={() => setStep(3)} className={styles.backBtn}>
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={formData.destinationIds.length === 0}
                className={styles.primaryBtn}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: REASON */}
        {step === 5 && (
          <div className={styles.stepBlock}>
            <h3 className={styles.stepTitle}>Purpose of Visit</h3>

            <div className={styles.reasonGrid}>
              {VISITOR_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`${styles.reasonCard} ${formData.reason === reason ? styles.reasonSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={formData.reason === reason}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, reason: e.target.value }))
                    }
                    hidden
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {errorMessage && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} /> <span>{errorMessage}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button onClick={() => setStep(4)} className={styles.backBtn}>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.reason || isSubmitting}
                className={styles.submitBtn}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className={styles.spin} /> Processing...
                  </>
                ) : (
                  "Submit Registration"
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: SUCCESS */}
        {step === 6 && (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={48} />
            </div>
            <h3 className={styles.successTitle}>Registration Complete</h3>
            <p className={styles.successMessage}>
              {formData.fullName} has been successfully checked in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
