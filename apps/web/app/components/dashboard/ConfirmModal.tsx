"use client";

import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { 
  X, 
  Camera, 
  Loader2, 
  CreditCard, 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  RotateCcw, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import styles from "./ConfirmModal.module.css";

type ConfirmModalProps = {
  visit: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ConfirmModal({ visit, onClose, onSuccess }: ConfirmModalProps) {
  const [step, setStep] = useState(1);
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [visitorPhotoUrl, setVisitorPhotoUrl] = useState<string | null>(null);
  const [rfidUid, setRfidUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rfidAssignedTo, setRfidAssignedTo] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);

  // Automatically focus RFID input on step 4
  useEffect(() => {
    if (step === 4) {
      const focusTimer = setTimeout(() => {
        rfidInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, [step]);

  // Constantly ensure RFID input stays focused while on step 4
  useEffect(() => {
    if (step !== 4) return;

    const handleFocusBack = () => {
      rfidInputRef.current?.focus();
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't intercept clicks on buttons or links
      if (
        target.tagName === "BUTTON" || 
        target.tagName === "A" || 
        target.closest("button") || 
        target.closest("a")
      ) {
        return;
      }
      rfidInputRef.current?.focus();
    };

    window.addEventListener("focus", handleFocusBack);
    document.addEventListener("click", handleDocumentClick);
    
    return () => {
      window.removeEventListener("focus", handleFocusBack);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [step]);

  const handleCapture = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    if (step === 2) {
      setIdPhotoUrl(imageSrc);
    } else if (step === 3) {
      setVisitorPhotoUrl(imageSrc);
    }
  };

  const handleRetake = () => {
    if (step === 2) {
      setIdPhotoUrl(null);
    } else if (step === 3) {
      setVisitorPhotoUrl(null);
    }
  };

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return "—";
    try {
      const birthDate = new Date(birthDateString);
      if (isNaN(birthDate.getTime())) return "—";
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch {
      return "—";
    }
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const cleanRfid = rfidUid.trim();
    if (!cleanRfid) {
      setError("Please scan an RFID card");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setRfidAssignedTo(null);

    try {
      const res = await fetch("/api/receptionist/visits/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: visit.id,
          rfidUid: cleanRfid,
          idPhotoUrl,
          visitorPhotoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isAlreadyInUse) {
          setRfidAssignedTo(data.assignedTo || "another visitor");
          throw new Error(`RFID card is already in use by ${data.assignedTo || "another visitor"}`);
        }
        throw new Error(data.error || "Failed to confirm visit");
      }

      // Transition to Success Step
      setStep(5);
      
      // Auto-trigger onSuccess callback after a delay for visual confirmation
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.message);
      setRfidUid(""); // Reset input immediately to allow rescanning
      setTimeout(() => {
        rfidInputRef.current?.focus();
      }, 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Human-readable format of visitor birthdate
  const formatBirthdate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const currentStepPercentage = () => {
    return ((step - 1) / 4) * 100;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2>Confirm Registration</h2>
            <p className={styles.subtitle}>{visit.visitor.fullName}</p>
          </div>
          {step < 5 && (
            <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step Indicator Tracker */}
        {step < 5 && (
          <div className={styles.stepTracker}>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${currentStepPercentage()}%` }} 
              />
            </div>
            <div className={styles.stepDots}>
              <div className={`${styles.stepDot} ${step >= 1 ? styles.activeDot : ""} ${step > 1 ? styles.completedDot : ""}`}>
                <span className={styles.dotNumber}>{step > 1 ? "✓" : "1"}</span>
                <span className={styles.dotLabel}>Overview</span>
              </div>
              <div className={`${styles.stepDot} ${step >= 2 ? styles.activeDot : ""} ${step > 2 ? styles.completedDot : ""}`}>
                <span className={styles.dotNumber}>{step > 2 ? "✓" : "2"}</span>
                <span className={styles.dotLabel}>Government ID</span>
              </div>
              <div className={`${styles.stepDot} ${step >= 3 ? styles.activeDot : ""} ${step > 3 ? styles.completedDot : ""}`}>
                <span className={styles.dotNumber}>{step > 3 ? "✓" : "3"}</span>
                <span className={styles.dotLabel}>Visitor Photo</span>
              </div>
              <div className={`${styles.stepDot} ${step >= 4 ? styles.activeDot : ""} ${step > 4 ? styles.completedDot : ""}`}>
                <span className={styles.dotNumber}>4</span>
                <span className={styles.dotLabel}>RFID Card</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorAlert}>
              <AlertTriangle size={18} className={styles.errorIcon} />
              <div className={styles.errorMessage}>
                <strong>Scan Error</strong>
                <p>{error}</p>
                {rfidAssignedTo && (
                  <span className={styles.errorHint}>
                    Please retrieve this card or scan a different available RFID card.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: VISITOR OVERVIEW */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.sectionHeader}>
                <h3>Verify Visitor Details</h3>
                <p>Ensure the visitor information matches their physical presence.</p>
              </div>

              <div className={styles.overviewGrid}>
                <div className={styles.infoCard}>
                  <div className={styles.infoIconWrapper}>
                    <User size={18} />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.label}>Full Name</span>
                    <span className={styles.value}>{visit.visitor.fullName}</span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoIconWrapper}>
                    <Calendar size={18} />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.label}>Birthdate (Age)</span>
                    <span className={styles.value}>
                      {formatBirthdate(visit.visitor.birthDate)} ({calculateAge(visit.visitor.birthDate)} years old)
                    </span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoIconWrapper}>
                    <MapPin size={18} />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.label}>Destination & Contact</span>
                    <span className={styles.value}>
                      {visit.destinations.map((d: any) => d.destination.name).join(", ")}
                      {visit.destinations[0]?.destination?.headName && (
                        <span className={styles.subValue}>
                          Host: {visit.destinations.map((d: any) => d.destination.headName).join(", ")}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoIconWrapper}>
                    <Clock size={18} />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.label}>Reason for Visit</span>
                    <span className={styles.value}>{visit.reason || "General Visit"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CAPTURE ID */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.sectionHeader}>
                <h3>Government ID</h3>
                <p>Position the visitor's government ID inside the camera frame.</p>
              </div>

              {idPhotoUrl === null ? (
                <div className={styles.cameraContainer}>
                  <div className={styles.webcamWrapper}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className={styles.webcamVideo}
                      videoConstraints={{ facingMode: "user" }}
                    />
                    <div className={styles.overlayFrame}>
                      <div className={styles.cornerTL} />
                      <div className={styles.cornerTR} />
                      <div className={styles.cornerBL} />
                      <div className={styles.cornerBR} />
                      <span className={styles.frameInstruction}>PLACE GOVERNMENT ID HERE</span>
                    </div>
                  </div>
                  <button onClick={handleCapture} className={styles.actionBtn}>
                    <Camera size={18} /> Capture ID Photo
                  </button>
                  <button onClick={() => setStep(3)} className={styles.skipBtn}>
                    Skip ID Capture
                  </button>
                </div>
              ) : (
                <div className={styles.previewContainer}>
                  <div className={styles.previewCard}>
                    <div className={styles.imageFrame}>
                      <img src={idPhotoUrl} alt="Captured ID Document" className={styles.capturedImage} />
                    </div>
                    <div className={styles.previewForm}>
                      <button onClick={handleRetake} className={styles.outlineBtn}>
                        <RotateCcw size={16} /> Retake ID Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CAPTURE VISITOR PHOTO */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.sectionHeader}>
                <h3>Capture Visitor Photo</h3>
                <p>Ask the visitor to look directly at the webcam.</p>
              </div>

              {visitorPhotoUrl === null ? (
                <div className={styles.cameraContainer}>
                  <div className={styles.webcamWrapper}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className={styles.webcamVideo}
                      videoConstraints={{ facingMode: "user" }}
                    />
                    <div className={styles.overlayFace}>
                      <div className={styles.faceOval} />
                      <span className={styles.frameInstruction}>ALIGN VISITOR FACE HERE</span>
                    </div>
                  </div>
                  <button onClick={handleCapture} className={styles.actionBtn}>
                    <Camera size={18} /> Capture Visitor Photo
                  </button>
                  <button onClick={() => setStep(4)} className={styles.skipBtn}>
                    Skip Photo Capture
                  </button>
                </div>
              ) : (
                <div className={styles.previewContainer}>
                  <div className={styles.previewCard}>
                    <div className={styles.imageFrameFace}>
                      <img src={visitorPhotoUrl} alt="Captured Visitor Face" className={styles.capturedImageFace} />
                    </div>
                    <div className={styles.previewFormFace}>
                      <p className={styles.previewConfirmText}>Visitor photo captured successfully.</p>
                      <button onClick={handleRetake} className={styles.outlineBtn}>
                        <RotateCcw size={16} /> Retake Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ASSIGN RFID CARD */}
          {step === 4 && (
            <form onSubmit={handleConfirm} className={styles.stepContent}>
              <div className={styles.sectionHeader}>
                <h3>Assign RFID Card</h3>
                <p>Tap a physical RFID card on the reader to complete registration.</p>
              </div>

              <div className={styles.rfidListeningArea} onClick={() => rfidInputRef.current?.focus()}>
                <div className={styles.rfidScannerGraphic}>
                  <div className={`${styles.radarPulse} ${styles.pulse1}`} />
                  <div className={`${styles.radarPulse} ${styles.pulse2}`} />
                  <div className={styles.scannerIconWrapper}>
                    <CreditCard size={48} className={styles.scannerCardIcon} />
                  </div>
                </div>
                
                <span className={styles.listeningStatus}>
                  {isSubmitting ? "Registering visit details..." : "System Listening for Card Tap..."}
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
                    if (error) {
                      setError("");
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
                  <button type="submit" className={styles.actionBtn}>
                    Submit Card (ID: {rfidUid})
                  </button>
                </div>
              )}
            </form>
          )}

          {/* STEP 5: SUCCESS SCREEN */}
          {step === 5 && (
            <div className={styles.successWrapper}>
              <div className={styles.successBanner}>
                <div className={styles.successRing}>
                  <div className={styles.successPulseBg} />
                  <div className={styles.successCheckmark}>
                    <Check size={36} strokeWidth={3} />
                  </div>
                </div>
                <h3>Check-In Successful!</h3>
                <p>The visitor's registration is complete. Hand over their RFID card.</p>
              </div>

              <div className={styles.successInfoSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.sumLabel}>Visitor</span>
                  <span className={styles.sumVal}>{visit.visitor.fullName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.sumLabel}>Destination</span>
                  <span className={styles.sumVal}>
                    {visit.destinations.map((d: any) => d.destination.name).join(", ")}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.sumLabel}>RFID Card</span>
                  <span className={styles.sumVal}>Assigned & Active</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.sumLabel}>Time In</span>
                  <span className={styles.sumVal}>{new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <p className={styles.autoCloseNotice}>Closing and returning to receptionist dashboard...</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {step < 5 && (
          <div className={styles.modalFooter}>
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className={styles.backBtn}>
                Back
              </button>
            ) : (
              <div />
            )}

            <div className={styles.footerActions}>
              {step === 1 && (
                <button onClick={() => setStep(2)} className={styles.nextBtn}>
                  Next: Government ID →
                </button>
              )}
              {step === 2 && idPhotoUrl !== null && (
                <button onClick={() => setStep(3)} className={styles.nextBtn}>
                  Next: Visitor Photo →
                </button>
              )}
              {step === 3 && visitorPhotoUrl !== null && (
                <button onClick={() => setStep(4)} className={styles.nextBtn}>
                  Next: Assign Card →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
