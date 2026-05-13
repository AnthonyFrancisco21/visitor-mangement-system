"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Building2,
  FileText,
  User,
} from "lucide-react";
import styles from "./kiosk.module.css";

type Destination = {
  id: string;
  name: string;
  floor: string;
  headName: string;
  description: string | null;
};

type FormData = {
  destinationIds: string[];
  reason: string;
  fullName: string;
  birthDate: string;
  idType: string;
  idNumber: string;
  contactNumber: string;
  idPhotoUrl: string;
  visitorPhotoUrl: string;
};

const initialFormData: FormData = {
  destinationIds: [],
  reason: "",
  fullName: "",
  birthDate: "",
  idType: "",
  idNumber: "",
  contactNumber: "",
  idPhotoUrl: "",
  visitorPhotoUrl: "",
};

/**
 * Scrolls an element into view when the virtual keyboard appears on mobile/tablet.
 * Uses scrollIntoView with a small delay to let the keyboard finish animating.
 */
function useKeyboardAwareScroll() {
  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };
  return { onFocus: handleFocus };
}

export default function KioskRegistrationPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);

  const [isScanningId, setIsScanningId] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardScroll = useKeyboardAwareScroll();

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await fetch("/api/destinations");
        if (res.ok) {
          const data = await res.json();
          setDestinations(data);
        }
      } catch (error) {
        console.error("Failed to fetch destinations", error);
      } finally {
        setIsLoadingDestinations(false);
      }
    };
    fetchDestinations();
  }, []);

  // Scroll to top of form area on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDestination = (id: string) => {
    setFormData((prev) => {
      const isSelected = prev.destinationIds.includes(id);
      if (isSelected) {
        return {
          ...prev,
          destinationIds: prev.destinationIds.filter((d) => d !== id),
        };
      } else {
        return { ...prev, destinationIds: [...prev.destinationIds, id] };
      }
    });
  };

  const simulateIdScan = () => {
    setIsScanningId(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        fullName: "Jane Doe",
        birthDate: "1990-05-15",
        idType: "Driver's License",
        idNumber: "D12-345-6789",
        idPhotoUrl: "https://example.com/simulated-id-photo.jpg",
      }));
      setIsScanningId(false);
    }, 2000);
  };

  const simulateVisitorPhoto = () => {
    setIsTakingPhoto(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        visitorPhotoUrl: "https://example.com/simulated-visitor-photo.jpg",
      }));
      setIsTakingPhoto(false);
    }, 1500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/kiosk/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to register. Please try again.");
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Destination" },
    { num: 2, label: "Identity" },
    { num: 3, label: "Review" },
  ];

  if (isSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successScreen}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={48} />
          </div>
          <h1 className={styles.successTitle}>You&apos;re all set!</h1>
          <p className={styles.successDesc}>
            Please wait for the receptionist to issue your visitor ID card.
          </p>
          <div className={styles.statusPill}>
            <Loader2 size={18} className={styles.spin} />
            <span>Waiting for Receptionist…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <div className={styles.brandDot} />
          <span className={styles.brandName}>SGW-VMS</span>
        </div>

        {/* Step tracker */}
        <div className={styles.stepTracker} role="list" aria-label="Form steps">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div
                className={`${styles.stepItem} ${step >= s.num ? styles.stepActive : ""} ${step > s.num ? styles.stepDone : ""}`}
                role="listitem"
              >
                <div className={styles.stepDot}>
                  {step > s.num ? <CheckCircle2 size={12} /> : s.num}
                </div>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
              {idx < 2 && <div className={`${styles.stepLine} ${step > s.num ? styles.stepLineDone : ""}`} />}
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* ── Scrollable Form Area ── */}
      <main className={styles.main} ref={scrollRef}>
        <div className={styles.formCard}>

          {/* STEP 1: Destination */}
          {step === 1 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Where to?</h2>
                <p className={styles.stepDesc}>
                  Select the department or person you are visiting.
                </p>
              </div>

              {isLoadingDestinations ? (
                <div className={styles.emptyState}>
                  <Loader2 size={24} className={styles.spin} />
                  <p>Loading destinations…</p>
                </div>
              ) : destinations.length === 0 ? (
                <div className={styles.emptyState}>
                  <Building2 size={28} />
                  <p>No destinations available.</p>
                  <span>Please ask the receptionist for assistance.</span>
                </div>
              ) : (
                <div className={styles.destinationList}>
                  {destinations.map((dest) => {
                    const selected = formData.destinationIds.includes(dest.id);
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => toggleDestination(dest.id)}
                        className={`${styles.destCard} ${selected ? styles.destCardSelected : ""}`}
                      >
                        <div className={styles.destInfo}>
                          <span className={styles.destName}>{dest.name}</span>
                          <span className={styles.destMeta}>
                            Floor {dest.floor} · {dest.headName}
                          </span>
                        </div>
                        {selected && (
                          <CheckCircle2
                            size={20}
                            className={styles.destCheck}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>
                  Reason for visit{" "}
                  <span className={styles.labelOptional}>(optional)</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="e.g. Interview, Delivery, Meeting…"
                  rows={3}
                  {...keyboardScroll}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Identity */}
          {step === 2 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Identity</h2>
                <p className={styles.stepDesc}>
                  Scan your ID or fill in your details manually.
                </p>
              </div>

              {/* Scan Buttons */}
              <div className={styles.scanRow}>
                <button
                  type="button"
                  onClick={simulateIdScan}
                  className={`${styles.scanBtn} ${formData.idPhotoUrl ? styles.scanBtnDone : ""}`}
                >
                  {isScanningId ? (
                    <Loader2 size={22} className={styles.spin} />
                  ) : (
                    <FileText size={22} />
                  )}
                  <span>
                    {isScanningId
                      ? "Scanning…"
                      : formData.idPhotoUrl
                        ? "ID Scanned ✓"
                        : "Scan ID"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={simulateVisitorPhoto}
                  className={`${styles.scanBtn} ${formData.visitorPhotoUrl ? styles.scanBtnDone : ""}`}
                >
                  {isTakingPhoto ? (
                    <Loader2 size={22} className={styles.spin} />
                  ) : (
                    <User size={22} />
                  )}
                  <span>
                    {isTakingPhoto
                      ? "Capturing…"
                      : formData.visitorPhotoUrl
                        ? "Photo Taken ✓"
                        : "Take Photo"}
                  </span>
                </button>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  {...keyboardScroll}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>ID Type</label>
                  <input
                    type="text"
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Passport"
                    {...keyboardScroll}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>ID Number</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="XXX-XXXX"
                    {...keyboardScroll}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`${styles.input} ${styles.inputDate}`}
                  {...keyboardScroll}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Final Step</h2>
                <p className={styles.stepDesc}>
                  Confirm your contact and review your details.
                </p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="+63 9XX XXX XXXX"
                  autoComplete="tel"
                  {...keyboardScroll}
                />
              </div>

              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Name</span>
                  <span className={styles.summaryVal}>
                    {formData.fullName || "—"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Contact</span>
                  <span className={styles.summaryVal}>
                    {formData.contactNumber || "—"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>ID Document</span>
                  <span className={styles.summaryVal}>
                    {formData.idType
                      ? `${formData.idType} · ${formData.idNumber}`
                      : "—"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Destinations</span>
                  <span className={styles.summaryVal}>
                    {formData.destinationIds.length > 0
                      ? `${formData.destinationIds.length} selected`
                      : "—"}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className={styles.errorBanner}>{errorMessage}</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky Footer Navigation ── */}
      <footer className={styles.footer}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className={styles.btnBack}
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && formData.destinationIds.length === 0}
            className={styles.btnNext}
          >
            <span>Continue</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.fullName ||
              formData.destinationIds.length === 0
            }
            className={`${styles.btnNext} ${styles.btnSubmit}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className={styles.spin} />
                <span>Submitting…</span>
              </>
            ) : (
              <>
                <span>Complete</span>
                <CheckCircle2 size={18} />
              </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
