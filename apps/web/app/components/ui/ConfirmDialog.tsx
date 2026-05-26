"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import styles from "./ConfirmDialog.module.css";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
      case "warning":
        return <AlertTriangle size={24} />;
      case "info":
        return <Info size={24} />;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={`${styles.iconWrapper} ${styles[type]}`}>
            {getIcon()}
          </div>
          <div className={styles.titleWrapper}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.message}>{message}</div>
          </div>
        </div>
        
        <div className={styles.footer}>
          <button 
            className={`${styles.btn} ${styles.cancelBtn}`} 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button 
            className={`${styles.btn} ${styles.confirmBtn} ${styles[type]}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 size={16} className={styles.spin} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
