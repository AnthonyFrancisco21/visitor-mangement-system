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
  User,
  MapPin,
  FileText,
  CreditCard,
  Check,
  AlertTriangle,
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

const TOTAL_STEPS = 7; // 1-ID, 2-Name, 3-Face, 4-Dest, 5-Reason, 6-Summary, 7-RFID

export default function ManualVisitorEntry({
  onSuccess,
  onClose,
}: ManualVisitorEntryProps) {
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

  // RFID state
  const [rfidUid, setRfidUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfidError, setRfidError] = useState("");
  const [rfidAssignedTo, setRfidAssignedTo] = useState<string | null>(null);

  // OCR State
  const [isExtractingText, setIsExtractingText] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-focus RFID input on Step 7
  useEffect(() => {
    if (step === 7) {
      const t = setTimeout(() => rfidInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Keep RFID input focused while on Step 7
  useEffect(() => {
    if (step !== 7) return;

    const handleFocusBack = () => rfidInputRef.current?.focus();
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a")
      )
        return;
      rfidInputRef.current?.focus();
    };

    window.addEventListener("focus", handleFocusBack);
    document.addEventListener("click", handleDocumentClick);
    return () => {
      window.removeEventListener("focus", handleFocusBack);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [step]);

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

  const selectedDestinations = useMemo(
    () => destinations.filter((d) => formData.destinationIds.includes(d.id)),
    [destinations, formData.destinationIds],
  );

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

  const extractTextFromId = async (imageSrc: string) => {
    setIsExtractingText(true);
    try {
      const result = await Tesseract.recognize(imageSrc, "eng");
      const text = result?.data?.text || "";
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 4 &&
            !l.toLowerCase().includes("republic") &&
            !l.toLowerCase().includes("id"),
        );
      if (lines.length > 0 && lines[0]) {
        setFormData((prev) => ({
          ...prev,
          fullName: lines[0]!.replace(/[^a-zA-Z\s]/g, ""),
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
      setStep(2);
      extractTextFromId(imageSrc);
    }
  };

  const handleCaptureFace = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setFormData((prev) => ({ ...prev, visitorPhotoUrl: imageSrc }));
      setStep(4);
    }
  };

  /** Called when RFID input detects a card tap (Enter key or hardware submit) */
  const handleRfidSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const cleanRfid = rfidUid.trim();
    if (!cleanRfid) {
      setRfidError("Please scan an RFID card first.");
      return;
    }

    setIsSubmitting(true);
    setRfidError("");
    setRfidAssignedTo(null);

    try {
      const res = await fetch("/api/receptionist/visits/manual-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rfidUid: cleanRfid }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isAlreadyInUse) {
          setRfidAssignedTo(data.assignedTo ?? "another visitor");
        }
        throw new Error(data.error || "Failed to check in visitor.");
      }

      // Success — move to final step
      setStep(8);
      setTimeout(() => {
        onSuccess?.();
        // Reset wizard
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
        setRfidUid("");
        setRfidError("");
        setRfidAssignedTo(null);
      }, 2500);
    } catch (err: any) {
      setRfidError(err.message);
      setRfidUid("");
      setTimeout(() => rfidInputRef.current?.focus(), 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress dots for steps 1-7
  const renderProgress = () => (
    <div className={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`${styles.progressDot} ${step >= s ? styles.activeDot : ""}`}
        />
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      {step < 8 && (
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title}>Visitor Intake</h2>
              <p className={styles.subtitle}>
                Step {step} of {TOTAL_STEPS}
              </p>
            </div>
            {onClose && step < 7 && (
              <button className={styles.closeBtn} onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>
          {renderProgress()}
        </div>
      )}

      <div className={styles.formContent}>
        {/* ── STEP 1: CAPTURE ID ── */}
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

        {/* ── STEP 2: REVIEW ID & NAME (OCR) ── */}
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
                  Extracted Name{" "}
                  <span className={styles.optional}>(Optional)</span>
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
              <button onClick={() => setStep(3)} className={styles.primaryBtn}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CAPTURE FACE ── */}
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

        {/* ── STEP 4: DESTINATION ── */}
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

        {/* ── STEP 5: REASON ── */}
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
            <div className={styles.actions}>
              <button onClick={() => setStep(4)} className={styles.backBtn}>
                Back
              </button>
              <button
                onClick={() => setStep(6)}
                disabled={!formData.reason}
                className={styles.primaryBtn}
              >
                Review Summary <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: REVIEW SUMMARY ── */}
        {step === 6 && (
          <div className={styles.stepBlock}>
            <h3 className={styles.stepTitle}>Review & Confirm</h3>
            <p className={styles.stepDesc}>
              Verify all information before assigning an RFID card.
            </p>

            <div className={styles.summaryCard}>
              {/* Name */}
              <div className={styles.summaryRow}>
                <span className={styles.summaryIcon}>
                  <User size={16} />
                </span>
                <div className={styles.summaryDetail}>
                  <span className={styles.summaryLabel}>Full Name</span>
                  <strong className={styles.summaryValue}>
                    {formData.fullName}
                  </strong>
                </div>
              </div>

              {/* Destination */}
              <div className={styles.summaryRow}>
                <span className={styles.summaryIcon}>
                  <MapPin size={16} />
                </span>
                <div className={styles.summaryDetail}>
                  <span className={styles.summaryLabel}>Destination(s)</span>
                  <strong className={styles.summaryValue}>
                    {selectedDestinations.map((d) => d.name).join(", ")}
                  </strong>
                  <span className={styles.summaryMeta}>
                    {selectedDestinations
                      .map((d) => `${d.headName} · Floor ${d.floor}`)
                      .join(" | ")}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className={styles.summaryRow}>
                <span className={styles.summaryIcon}>
                  <FileText size={16} />
                </span>
                <div className={styles.summaryDetail}>
                  <span className={styles.summaryLabel}>Reason for Visit</span>
                  <strong className={styles.summaryValue}>
                    {formData.reason}
                  </strong>
                </div>
              </div>

              {/* Photos */}
              {(formData.idPhotoUrl || formData.visitorPhotoUrl) && (
                <div className={styles.summaryPhotos}>
                  {formData.idPhotoUrl && (
                    <div className={styles.summaryPhotoBox}>
                      <img
                        src={formData.idPhotoUrl}
                        alt="ID"
                        className={styles.summaryPhoto}
                      />
                      <span className={styles.summaryPhotoLabel}>
                        ID Document
                      </span>
                    </div>
                  )}
                  {formData.visitorPhotoUrl && (
                    <div className={styles.summaryPhotoBox}>
                      <img
                        src={formData.visitorPhotoUrl}
                        alt="Face"
                        className={styles.summaryPhoto}
                      />
                      <span className={styles.summaryPhotoLabel}>
                        Visitor Photo
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button onClick={() => setStep(5)} className={styles.backBtn}>
                Back
              </button>
              <button onClick={() => setStep(7)} className={styles.primaryBtn}>
                Assign RFID Card <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 7: RFID LISTENING ── */}
        {step === 7 && (
          <form onSubmit={handleRfidSubmit} className={styles.stepBlock}>
            <h3 className={styles.stepTitle}>Assign RFID Card</h3>
            <p className={styles.stepDesc}>
              Tap a physical RFID card on the reader to complete registration.
            </p>

            {rfidError && (
              <div className={styles.rfidErrorAlert}>
                <AlertTriangle size={18} className={styles.rfidErrorIcon} />
                <div className={styles.rfidErrorMessage}>
                  <strong>Scan Error</strong>
                  <p>{rfidError}</p>
                  {rfidAssignedTo && (
                    <span className={styles.rfidErrorHint}>
                      Please retrieve this card or scan a different available
                      RFID card.
                    </span>
                  )}
                </div>
              </div>
            )}

            <div
              className={styles.rfidListeningArea}
              onClick={() => rfidInputRef.current?.focus()}
            >
              <div className={styles.rfidScannerGraphic}>
                <div className={`${styles.radarPulse} ${styles.pulse1}`} />
                <div className={`${styles.radarPulse} ${styles.pulse2}`} />
                <div className={styles.scannerIconWrapper}>
                  <CreditCard size={48} className={styles.scannerCardIcon} />
                </div>
              </div>
              <span className={styles.listeningStatus}>
                {isSubmitting
                  ? "Registering visit..."
                  : "System Listening for Card Tap..."}
              </span>
              <p className={styles.listeningSub}>
                Place the card flat against the desktop RFID reader
              </p>
              <input
                ref={rfidInputRef}
                type="text"
                value={rfidUid}
                onChange={(e) => {
                  setRfidUid(e.target.value);
                  if (rfidError) {
                    setRfidError("");
                    setRfidAssignedTo(null);
                  }
                }}
                placeholder="Scan output goes here..."
                className={styles.hiddenRfidInput}
                autoComplete="off"
              />
            </div>

            {rfidUid && !isSubmitting && (
              <div className={styles.manualConfirmRow}>
                <button type="submit" className={styles.submitBtn}>
                  Confirm Card (ID: {rfidUid})
                </button>
              </div>
            )}

            {isSubmitting && (
              <div className={styles.actions}>
                <Loader2 size={20} className={styles.spin} />
                <span>Processing...</span>
              </div>
            )}
          </form>
        )}

        {/* ── STEP 8: SUCCESS ── */}
        {step === 8 && (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <Check size={48} />
            </div>
            <h3 className={styles.successTitle}>Check-In Successful!</h3>
            <p className={styles.successMessage}>
              {formData.fullName
                ? `${formData.fullName} has been`
                : "Visitor has been"}{" "}
              checked in. Hand over the RFID card to the visitor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
