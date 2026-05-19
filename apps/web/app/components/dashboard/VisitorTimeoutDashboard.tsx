"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CreditCard, 
  Check, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import styles from "./VisitorTimeoutDashboard.module.css";

interface VisitorTimeoutDashboardProps {
  roleBadge: string;
}

type SuccessData = {
  visitorName: string;
  cardLabel: string;
  timeIn: string;
  timeOut: string;
  duration: string;
};

export default function VisitorTimeoutDashboard({ roleBadge }: VisitorTimeoutDashboardProps) {
  const [rfidUid, setRfidUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const rfidInputRef = useRef<HTMLInputElement>(null);

  // Focus the hidden RFID input on mount
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      rfidInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(focusTimer);
  }, []);

  // Ensure RFID input stays focused
  useEffect(() => {
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
  }, []);

  // Auto-clear success card after 5 seconds of inactivity
  useEffect(() => {
    if (successData) {
      const timer = setTimeout(() => {
        setSuccessData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successData]);

  const handleTimeout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanRfid = rfidUid.trim();
    if (!cleanRfid) return;

    setIsSubmitting(true);
    setError("");
    setSuccessData(null);

    try {
      const res = await fetch("/api/receptionist/visits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfidUid: cleanRfid }),
      });

      const data = await res.json();

      if (res.ok) {
        // Calculate duration spent in building
        const timeIn = new Date(data.result.timeIn);
        const timeOut = new Date(data.result.timeOut);
        const diffMs = timeOut.getTime() - timeIn.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        let durationStr = `${diffMins}m`;

        if (diffMins >= 60) {
          const diffHours = Math.floor(diffMins / 60);
          const remainingMins = diffMins % 60;
          durationStr = `${diffHours}h ${remainingMins}m`;
        }

        setSuccessData({
          visitorName: data.visitorName || "Visitor",
          cardLabel: data.result.rfidCard?.label || cleanRfid,
          timeIn: timeIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timeOut: timeOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          duration: durationStr,
        });

        setRfidUid("");
      } else {
        throw new Error(data.error || "Failed to check out visitor.");
      }
    } catch (err: any) {
      setError(err.message);
      setRfidUid(""); // Reset input to allow rescanning immediately
      setTimeout(() => {
        rfidInputRef.current?.focus();
      }, 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}>{roleBadge}</div>
        <h1 className={styles.title}>Visitor Checkout</h1>
        <p className={styles.desc}>
          Tap the physical RFID visitor card on the desktop reader to log their departure.
        </p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <AlertTriangle size={20} className={styles.errorIcon} />
          <div className={styles.errorMessage}>
            <strong>Checkout Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successData && (
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper}>
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h3>Checked Out Successfully</h3>
          <p>The card is now unlinked and ready for reallocation.</p>

          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Visitor</span>
              <span className={styles.infoValue}>{successData.visitorName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>RFID Card</span>
              <span className={styles.infoValue}>{successData.cardLabel}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Time In</span>
              <span className={styles.infoValue}>{successData.timeIn}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Time Out</span>
              <span className={styles.infoValue}>{successData.timeOut}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Total Duration</span>
              <span className={styles.infoValue}>{successData.duration}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleTimeout}>
        <div className={styles.rfidListeningArea} onClick={() => rfidInputRef.current?.focus()}>
          <div className={styles.rfidScannerGraphic}>
            <div className={`${styles.radarPulse} ${styles.pulse1}`} />
            <div className={`${styles.radarPulse} ${styles.pulse2}`} />
            <div className={styles.scannerIconWrapper}>
              <CreditCard size={40} className={styles.scannerCardIcon} />
            </div>
          </div>

          <span className={styles.listeningStatus}>
            {isSubmitting ? "Processing checkout..." : "System Listening for Card Tap..."}
          </span>
          <p className={styles.listeningSub}>
            Position the physical visitor card on the reader to complete check-out
          </p>

          <input
            ref={rfidInputRef}
            type="text"
            value={rfidUid}
            onChange={(e) => {
              setRfidUid(e.target.value);
              if (error) setError("");
              if (successData) setSuccessData(null);
            }}
            placeholder="Scan output goes here..."
            className={styles.hiddenRfidInput}
            autoComplete="off"
          />
        </div>
      </form>
    </div>
  );
}
