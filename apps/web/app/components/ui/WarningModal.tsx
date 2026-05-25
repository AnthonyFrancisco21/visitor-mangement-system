"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Info, XCircle, Loader2 } from "lucide-react";
import styles from "./WarningModal.module.css";

interface WarningModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: "danger" | "warning" | "info";
}

export default function WarningModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  type = "danger",
}: WarningModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <XCircle size={28} />;
      case "warning":
        return <AlertTriangle size={28} />;
      case "info":
        return <Info size={28} />;
    }
  };

  const getIconClass = () => {
    switch (type) {
      case "danger":
        return styles.iconDanger;
      case "warning":
        return styles.iconWarning;
      case "info":
        return styles.iconInfo;
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case "danger":
        return styles.btnConfirmDanger;
      case "warning":
        return styles.btnConfirmWarning;
      case "info":
        return styles.btnConfirmInfo;
    }
  };

  return (
    <div className={styles.overlay} onClick={!isLoading ? onCancel : undefined}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.content}>
          <div className={`${styles.iconWrapper} ${getIconClass()}`}>
            {getIcon()}
          </div>
          <h2 id="modal-title" className={styles.title}>{title}</h2>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          <button 
            className={`${styles.btn} ${styles.btnCancel}`} 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`${styles.btn} ${getConfirmBtnClass()} ${isLoading ? styles.btnDisabled : ""}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className={styles.spin} />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
