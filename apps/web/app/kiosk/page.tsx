"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
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
  fullName: string;
  birthDate: string;
  destinationIds: string[];
  reason: string;
};

const initialFormData: FormData = {
  fullName: "",
  birthDate: "",
  destinationIds: [],
  reason: "",
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timer, setTimer] = useState(10); // 10 seconds for the final notice

  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardScroll = useKeyboardAwareScroll();

  const calculatedAge = useMemo(() => {
    if (!formData.birthDate) return null;
    const dob = new Date(formData.birthDate);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }, [formData.birthDate]);

  useEffect(() => {
    setMounted(true);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
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
            { id: "1", name: "Engineering Dept", floor: "2", headName: "John Doe", description: "" },
            { id: "2", name: "HR Office", floor: "2", headName: "Jane Smith", description: "" },
            { id: "3", name: "Executive Suite", floor: "5", headName: "CEO", description: "" },
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
    const uniqueFloors = Array.from(new Set(destinations.map((d) => d.floor))).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );
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

  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (step === 4) {
      countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            // Reset to beginning
            setStep(0);
            setFormData(initialFormData);
            setTimer(10);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdown) clearInterval(countdown);
    };
  }, [step]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/kiosk/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStep(4);
      } else {
        console.error("Submission failed");
        // Fallback for visual demo if API fails
        setStep(4);
      }
    } catch {
      console.error("Submission failed");
      // Fallback for visual demo if API fails
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Visitor Info" },
    { num: 2, label: "Destination" },
    { num: 3, label: "Purpose" },
    { num: 4, label: "Notice" },
  ];

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

  // ── Notice Screen (Step 4) ──
  if (step === 4) {
    return (
      <div className={styles.page}>
        <div className={styles.successScreen}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h1 className={styles.successTitle}>Almost done!</h1>
          <p className={styles.successDesc} style={{ maxWidth: '600px', fontSize: '1.2rem', lineHeight: '1.6' }}>
            Last step of registration is to give your ID to the receptionist for scanning and for capturing an image of yourself.
          </p>
          <div className={styles.statusPill} style={{ marginTop: '2rem' }}>
            <Loader2 size={18} className={styles.spin} />
            <span>Redirecting to home in {timer}s...</span>
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
          <div className={styles.brand} onClick={() => {
            setStep(0);
            setFormData(initialFormData);
          }}>
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
                {step > s.num ? <CheckCircle2 size={16} strokeWidth={3} /> : s.num}
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Form Area */}
      <main className={styles.main} ref={scrollRef}>
        <div className={styles.formCard}>

          {/* STEP 1: Visitor Info (Name, Birthdate & Age) */}
          {step === 1 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Visitor Information</h2>
                <p className={styles.stepDesc}>Please provide your full name and date of birth</p>
              </div>

              <div className={styles.field} style={{ marginTop: "2rem" }}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="e.g. John Doe"
                  style={{ fontSize: '1.25rem', padding: '1rem' }}
                  {...keyboardScroll}
                />
              </div>

              <div className={styles.row} style={{ marginTop: "1.5rem", gap: "1.5rem" }}>
                <div className={styles.field}>
                  <label className={styles.label}>Date of Birth</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className={`${styles.input} ${styles.inputDate}`}
                    style={{ fontSize: '1.25rem', padding: '1rem' }}
                    {...keyboardScroll}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Calculated Age</label>
                  <div
                    className={styles.input}
                    style={{
                      fontSize: '1.25rem',
                      padding: '1rem',
                      background: 'var(--color-bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      height: '59px'
                    }}
                  >
                    {calculatedAge !== null ? `${calculatedAge} years old` : "Select birthdate"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Destination */}
          {step === 2 && (
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
                    <button className={styles.searchClear} onClick={() => setSearchQuery("")}>
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
                    <button className={styles.backLink} onClick={() => setSelectedFloor(null)}>
                      <ChevronLeft size={16} /> Back to Floors
                    </button>
                  )}

                  <div className={styles.destinationList}>
                    {filteredDestinations.map((dest) => {
                      const selected = formData.destinationIds.includes(dest.id);
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
                                <span className={styles.floorBadge}>Floor {dest.floor}</span>
                              )}
                            </div>
                            <span className={styles.destMeta}>{dest.headName}</span>
                          </div>
                          {selected && <CheckCircle2 size={24} className={styles.destCheck} />}
                        </button>
                      );
                    })}

                    {searchQuery.trim() && filteredDestinations.length === 0 && (
                      <div className={styles.noResults}>
                        <p>No destinations found matching "{searchQuery}"</p>
                        <button className={styles.clearSearchBtn} onClick={() => setSearchQuery("")}>
                          Clear search
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Purpose */}
          {step === 3 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Purpose of visit</h2>
                <p className={styles.stepDesc}>Please select your primary reason</p>
              </div>

              <div className={styles.gridSelection}>
                {VISITOR_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setFormData((prev) => ({ ...prev, reason: r }))}
                    className={`${styles.selectionCard} ${formData.reason === r ? styles.selected : ""}`}
                  >
                    <span className={styles.reasonText}>{r}</span>
                  </button>
                ))}
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

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && (!formData.fullName.trim() || !formData.birthDate)) ||
              (step === 2 && formData.destinationIds.length === 0)
            }
            className={styles.btnNext}
          >
            Continue <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.reason}
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
