"use client";

import React, { useState, useEffect } from "react";
import { Camera, CheckCircle2, ChevronRight, User, FileText, ChevronLeft, Loader2, Sparkles, Building2 } from "lucide-react";
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

export default function KioskRegistrationPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  
  // States for simulated actions
  const [isScanningId, setIsScanningId] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  
  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDestination = (id: string) => {
    setFormData((prev) => {
      const isSelected = prev.destinationIds.includes(id);
      if (isSelected) {
        return { ...prev, destinationIds: prev.destinationIds.filter((d) => d !== id) };
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
    } catch (error) {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.layout}>
        <div className={styles.noiseOverlay}></div>
        <div className={styles.successWrapper} style={{ width: '100%' }}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={64} />
          </div>
          <h1>You are set!</h1>
          <p>Please wait for the receptionist to issue your visitor ID card.</p>
          <div className={styles.statusPill}>
            <Loader2 size={24} className={styles.spin} />
            <span>Waiting for Receptionist</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.noiseOverlay}></div>
      
      {/* Left Pane - Branding & Atmosphere */}
      <div className={styles.leftPane}>
        <div className={styles.orbPrimary}></div>
        <div className={styles.orbSecondary}></div>
        
        <div className={styles.branding}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}></div>
            NEXUS
          </div>
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome<br />to the<br />Building.</h1>
          <p className={styles.heroSubtitle}>Please complete your registration to receive your visitor pass.</p>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>
          Secure Identity Verification System
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className={styles.rightPane}>
        <div className={styles.formContainer}>
          
          <div className={styles.stepTracker}>
            {[
              { num: 1, label: "Destination" },
              { num: 2, label: "Identity" },
              { num: 3, label: "Review" }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`${styles.stepItem} ${step >= s.num ? styles.stepItemActive : ''}`}>
                  <div className={styles.stepNumber}>
                    {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                  </div>
                  <span className={styles.stepLabel}>{s.label}</span>
                </div>
                {idx < 2 && <div className={styles.stepSeparator} />}
              </React.Fragment>
            ))}
          </div>

          <div className={styles.formContent}>
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className={styles.fadeIn}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Where to?</h2>
                  <p className={styles.stepDescription}>Select the department or contact you are visiting.</p>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Destinations</label>
                  {isLoadingDestinations ? (
                    <div className={styles.emptyState}>
                      <Loader2 size={24} className={styles.spin} style={{ margin: '0 auto 1rem', color: '#4db8ff' }} />
                      <p>Loading destinations...</p>
                    </div>
                  ) : destinations.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Building2 size={32} style={{ margin: '0 auto 1rem', color: '#64748b' }} />
                      <p>No destinations available.</p>
                      <span style={{ fontSize: '0.875rem', color: '#64748b', display: 'block', marginTop: '0.5rem' }}>
                        Please ask the receptionist for assistance.
                      </span>
                    </div>
                  ) : (
                    <div className={styles.destinationList}>
                      {destinations.map((dest) => (
                        <div
                          key={dest.id}
                          onClick={() => toggleDestination(dest.id)}
                          className={`${styles.destinationCard} ${
                            formData.destinationIds.includes(dest.id) ? styles.destinationCardSelected : ''
                          }`}
                        >
                          <div className={styles.destinationInfo}>
                            <h3>{dest.name}</h3>
                            <p>Floor {dest.floor} • Contact: {dest.headName}</p>
                          </div>
                          {formData.destinationIds.includes(dest.id) && (
                            <CheckCircle2 size={24} color="#4db8ff" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Reason for Visit (Optional)</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="e.g. Interview, Delivery..."
                    className={`${styles.input} ${styles.textarea}`}
                  />
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className={styles.fadeIn}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Identity</h2>
                  <p className={styles.stepDescription}>Verify your identity to proceed.</p>
                </div>

                <div className={styles.scanGrid}>
                  <div className={`${styles.scanBox} ${formData.idPhotoUrl ? styles.scanBoxSuccess : ''}`} onClick={simulateIdScan}>
                    <div className={styles.scanIconWrap}>
                      {isScanningId ? <Loader2 size={24} className={styles.spin} /> : <FileText size={24} />}
                    </div>
                    <div className={styles.scanText}>
                      {isScanningId ? "Scanning..." : formData.idPhotoUrl ? "ID Scanned" : "Scan ID"}
                    </div>
                  </div>

                  <div className={`${styles.scanBox} ${formData.visitorPhotoUrl ? styles.scanBoxSuccess : ''}`} onClick={simulateVisitorPhoto}>
                    <div className={styles.scanIconWrap}>
                      {isTakingPhoto ? <Loader2 size={24} className={styles.spin} /> : <User size={24} />}
                    </div>
                    <div className={styles.scanText}>
                      {isTakingPhoto ? "Capturing..." : formData.visitorPhotoUrl ? "Photo Taken" : "Take Photo"}
                    </div>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>ID Type</label>
                    <input
                      type="text"
                      name="idType"
                      value={formData.idType}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Passport"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>ID Number</label>
                    <input
                      type="text"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="XXX-XXXX"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Birth Date</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className={`${styles.input} ${styles.inputDate}`}
                  />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className={styles.fadeIn}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Final Step</h2>
                  <p className={styles.stepDescription}>Review your details and complete registration.</p>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className={styles.summaryPanel}>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <div className={styles.label}>Name</div>
                      <div className={styles.value}>{formData.fullName || "—"}</div>
                    </div>
                    <div className={styles.summaryItem}>
                      <div className={styles.label}>Contact</div>
                      <div className={styles.value}>{formData.contactNumber || "—"}</div>
                    </div>
                    <div className={styles.summaryItem}>
                      <div className={styles.label}>ID Document</div>
                      <div className={styles.value}>{formData.idType ? `${formData.idType} (${formData.idNumber})` : "—"}</div>
                    </div>
                    <div className={styles.summaryItem}>
                      <div className={styles.label}>Destinations</div>
                      <div className={styles.value}>{formData.destinationIds.length > 0 ? `${formData.destinationIds.length} selected` : "—"}</div>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className={styles.errorBanner}>
                    {errorMessage}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Footer */}
            <div className={styles.footer}>
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className={styles.btnBack}
                >
                  <ChevronLeft size={20} />
                  <span>Back</span>
                </button>
              ) : (
                <div></div> // Spacing
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && formData.destinationIds.length === 0}
                  className={styles.btnNext}
                >
                  <span>Continue</span>
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.fullName || formData.destinationIds.length === 0}
                  className={`${styles.btnNext} ${styles.btnSubmit}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className={styles.spin} />
                      <span>Submitting</span>
                    </>
                  ) : (
                    <>
                      <span>Complete</span>
                      <Sparkles size={20} />
                    </>
                  )}
                </button>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
