"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileText,
  User,
  ArrowRight,
  Search,
  X,
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

// Built-in standard reasons for the clean minimalist setup
const VISITOR_REASONS = [
  "Meeting",
  "Interview",
  "Delivery",
  "Maintenance",
  "Personal",
  "Other",
];

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
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const [isScanningId, setIsScanningId] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardScroll = useKeyboardAwareScroll();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await fetch("/api/destinations");
        if (res.ok) {
          const data = await res.json();
          setDestinations(data);
        } else {
          // Fallback dummy data for visual testing if API fails
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
      } finally {
        setIsLoadingDestinations(false);
      }
    };
    fetchDestinations();
  }, []);

  const floors = useMemo(() => {
    const uniqueFloors = Array.from(
      new Set(destinations.map((d) => d.floor)),
    ).sort((a, b) => parseInt(a) - parseInt(b));
    return uniqueFloors.length > 0 ? uniqueFloors : ["1", "2", "3", "4", "5"]; // Fallbacks
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return destinations.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.headName.toLowerCase().includes(q) ||
          d.floor.toLowerCase().includes(q),
      );
    }
    if (!selectedFloor) return [];
    return destinations.filter((d) => d.floor === selectedFloor);
  }, [destinations, selectedFloor, searchQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step, selectedFloor]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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
        idPhotoUrl: "https://example.com/id.jpg",
      }));
      setIsScanningId(false);
    }, 1500);
  };

  const simulateVisitorPhoto = () => {
    setIsTakingPhoto(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        visitorPhotoUrl: "https://example.com/visitor.jpg",
      }));
      setIsTakingPhoto(false);
    }, 1000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSuccess(true);
    } catch {
      console.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Destination" },
    { num: 2, label: "Purpose" },
    { num: 3, label: "Identity" },
    { num: 4, label: "Review" },
  ];

  // ── Success Screen ──
  if (isSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successScreen}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h1 className={styles.successTitle}>You're all set</h1>
          <p className={styles.successDesc}>
            Your registration is complete. Please proceed to the desk to print
            your visitor badge.
          </p>
          <div className={styles.statusPill}>
            <Loader2 size={18} className={styles.spin} />
            <span>Badge generating...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Hero / Standby Screen (Full Screen Tap) ──
  if (step === 0) {
    const timeStr = mounted 
      ? currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : "";
    const dateStr = mounted 
      ? currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
      : "";

    return (
      <div className={styles.page} onClick={() => setStep(1)}>
        <div className={styles.hero}>
          <div className={styles.heroBackground} />
          <div className={styles.heroContent}>
            <div className={styles.heroLogoLarge}>VMS</div>

            <div className={styles.heroTime}>
              <div className={styles.heroTimeDisplay}>{timeStr}</div>
              <div className={styles.heroDateDisplay}>{dateStr}</div>
            </div>

            <h1 className={styles.heroTitle}>Welcome to SGW</h1>
            <p className={styles.heroSubtitle}>Visitor Registration Kiosk</p>

            <div className={styles.tapIndicator}>
              <span>Tap anywhere to begin</span>
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form Flow ──
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand} onClick={() => setStep(0)}>
            <div className={styles.brandLogo}>VMS</div>
            <span className={styles.brandName}>SGW Global</span>
          </div>
        </div>

        <div className={styles.stepTracker}>
          {steps.map((s) => (
            <div
              key={s.num}
              className={`${styles.stepItem} ${step === s.num ? styles.active : ""} ${
                step > s.num ? styles.completed : ""
              }`}
            >
              <div className={styles.stepDot}>
                {step > s.num ? (
                  <CheckCircle2 size={16} strokeWidth={3} />
                ) : (
                  s.num
                )}
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Form Area */}
      <main className={styles.main} ref={scrollRef}>
        <div className={styles.formCard}>
          {/* STEP 1: Destination */}
          {step === 1 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Where are you heading?</h2>
                <p className={styles.stepDesc}>
                  {searchQuery.trim()
                    ? `Found ${filteredDestinations.length} matching locations`
                    : selectedFloor
                      ? `Select an office on Floor ${selectedFloor}`
                      : "Select the floor or search for your destination"}
                </p>
              </div>

              <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} size={20} />
                  <input
                    type="text"
                    placeholder="Search department, head, or floor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button
                      className={styles.searchClear}
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {!selectedFloor && !searchQuery.trim() ? (
                <div className={styles.gridSelection}>
                  {floors.map((floor) => (
                    <button
                      key={floor}
                      className={styles.selectionCard}
                      onClick={() => setSelectedFloor(floor)}
                    >
                      <span className={styles.floorNumber}>{floor}</span>
                      <span className={styles.floorLabel}>Floor</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {!searchQuery.trim() && (
                    <button
                      className={styles.backLink}
                      onClick={() => setSelectedFloor(null)}
                    >
                      <ChevronLeft size={16} /> Back to Floors
                    </button>
                  )}

                  <div className={styles.destinationList}>
                    {filteredDestinations.map((dest) => {
                      const selected = formData.destinationIds.includes(
                        dest.id,
                      );
                      return (
                        <button
                          key={dest.id}
                          onClick={() => toggleDestination(dest.id)}
                          className={`${styles.destCard} ${selected ? styles.selected : ""}`}
                        >
                          <div className={styles.destInfo}>
                            <div className={styles.destNameRow}>
                              <span className={styles.destName}>{dest.name}</span>
                              {(searchQuery.trim() || !selectedFloor) && (
                                <span className={styles.floorBadge}>
                                  Floor {dest.floor}
                                </span>
                              )}
                            </div>
                            <span className={styles.destMeta}>
                              {dest.headName}
                            </span>
                          </div>
                          {selected && (
                            <CheckCircle2
                              size={24}
                              className={styles.destCheck}
                            />
                          )}
                        </button>
                      );
                    })}

                    {searchQuery.trim() && filteredDestinations.length === 0 && (
                      <div className={styles.noResults}>
                        <p>No destinations found matching "{searchQuery}"</p>
                        <button 
                          className={styles.clearSearchBtn}
                          onClick={() => setSearchQuery("")}
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: Purpose */}
          {step === 2 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Purpose of visit</h2>
                <p className={styles.stepDesc}>
                  Please select your primary reason
                </p>
              </div>

              <div className={styles.gridSelection}>
                {VISITOR_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, reason: r }))
                    }
                    className={`${styles.selectionCard} ${formData.reason === r ? styles.selected : ""}`}
                  >
                    <span className={styles.reasonText}>{r}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Identity */}
          {step === 3 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Your Details</h2>
                <p className={styles.stepDesc}>
                  Scan ID for quick entry or type manually
                </p>
              </div>

              <div className={styles.scanRow}>
                <button
                  onClick={simulateIdScan}
                  className={`${styles.scanBtn} ${formData.idPhotoUrl ? styles.done : ""}`}
                  disabled={isScanningId || isTakingPhoto}
                >
                  {isScanningId ? (
                    <Loader2 size={28} className={styles.spin} />
                  ) : (
                    <FileText size={28} />
                  )}
                  <span>
                    {isScanningId
                      ? "Scanning..."
                      : formData.idPhotoUrl
                        ? "ID Scanned"
                        : "Scan ID"}
                  </span>
                </button>

                <button
                  onClick={simulateVisitorPhoto}
                  className={`${styles.scanBtn} ${formData.visitorPhotoUrl ? styles.done : ""}`}
                  disabled={isScanningId || isTakingPhoto}
                >
                  {isTakingPhoto ? (
                    <Loader2 size={28} className={styles.spin} />
                  ) : (
                    <User size={28} />
                  )}
                  <span>
                    {isTakingPhoto
                      ? "Capturing..."
                      : formData.visitorPhotoUrl
                        ? "Photo Taken"
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
                  placeholder="e.g. John Doe"
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
                    placeholder="Passport, License..."
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
                    placeholder="Enter ID number"
                    {...keyboardScroll}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Review Info</h2>
                <p className={styles.stepDesc}>
                  Confirm details before generating your pass
                </p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Contact Number (Required)
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="+63 9XX XXX XXXX"
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
                  <span className={styles.summaryKey}>Purpose</span>
                  <span className={styles.summaryVal}>
                    {formData.reason || "—"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Contact</span>
                  <span className={styles.summaryVal}>
                    {formData.contactNumber || "—"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Destinations</span>
                  <span className={styles.summaryVal}>
                    {formData.destinationIds.length} location(s)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Navigation */}
      <footer className={styles.footer}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className={styles.btnBack}>
            <ChevronLeft size={20} /> Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && formData.destinationIds.length === 0) ||
              (step === 2 && !formData.reason)
            }
            className={styles.btnNext}
          >
            Continue <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.fullName ||
              formData.destinationIds.length === 0 ||
              !formData.contactNumber
            }
            className={styles.btnNext}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className={styles.spin} /> Processing
              </>
            ) : (
              <>Complete Registration</>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
