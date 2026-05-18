"use client";

import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { X, Camera, RefreshCw, Loader2, CreditCard } from "lucide-react";
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
  const [idNumber, setIdNumber] = useState("");
  const [rfidUid, setRfidUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const webcamRef = useRef<Webcam>(null);

  // Focus RFID input automatically when on step 3
  const rfidInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === 3 && rfidInputRef.current) {
      rfidInputRef.current.focus();
    }
  }, [step]);

  const handleCapture = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    if (step === 1) {
      setIdPhotoUrl(imageSrc);
      setStep(2);
    } else if (step === 2) {
      setVisitorPhotoUrl(imageSrc);
      setStep(3);
    }
  };

  const handleConfirm = async () => {
    if (!rfidUid) {
      setError("Please scan an RFID card");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/receptionist/visits/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: visit.id,
          rfidUid,
          idPhotoUrl,
          visitorPhotoUrl,
          idNumber,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to confirm visit");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>Confirm Visitor: {visit.visitor.fullName}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.visitorInfo}>
            <p><strong>Destination:</strong> {visit.destinations.map((d: any) => d.destination.name).join(", ")}</p>
            <p><strong>Reason:</strong> {visit.reason || "—"}</p>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          {step < 3 ? (
            <div className={styles.webcamSection}>
              <h3>{step === 1 ? "Scan ID Document" : "Capture Visitor Photo"}</h3>
              <p className={styles.instruction}>
                {step === 1 ? "Please ask the visitor for their ID and position it in the camera." : "Please ask the visitor to look at the camera."}
              </p>
              
              <div className={styles.webcamWrapper}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className={styles.webcamVideo}
                  videoConstraints={{ facingMode: "user" }}
                />
              </div>

              <button onClick={handleCapture} className={styles.captureBtn}>
                <Camera size={20} /> Capture Photo
              </button>

              <div className={styles.skipSection}>
                <button onClick={() => setStep(step + 1)} className={styles.skipBtn}>
                  Skip this step
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.rfidSection}>
              <h3>Assign RFID Card</h3>
              <p className={styles.instruction}>
                Please tap an available RFID card on the reader to register time-in.
              </p>
              
              <div className={styles.rfidInputContainer}>
                <CreditCard size={24} className={styles.rfidIcon} />
                <input
                  ref={rfidInputRef}
                  type="text"
                  value={rfidUid}
                  onChange={(e) => setRfidUid(e.target.value)}
                  placeholder="Scanning..."
                  className={styles.rfidInput}
                  autoFocus
                />
              </div>

              <div className={styles.idNumberSection}>
                <label>ID Number (Optional)</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Manually enter ID number"
                  className={styles.idInput}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className={styles.backBtn}>
              Back
            </button>
          )}
          <div className={styles.spacer} />
          {step === 3 && (
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || !rfidUid}
              className={styles.confirmBtn}
            >
              {isSubmitting ? <><Loader2 size={16} className={styles.spin} /> Processing</> : "Confirm & Time In"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
