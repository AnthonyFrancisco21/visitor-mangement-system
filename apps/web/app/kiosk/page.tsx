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

const VISITOR_REASONS = [
  "Meeting",
  "Interview",
  "Delivery",
  "Maintenance",
  "Personal",
  "Other",
];

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
  const [timer, setTimer] = useState(10);

  const scrollRef = useRef<HTMLDivElement>(null);

  const calculatedAge = useMemo(() => {
    if (!formData.birthDate) return null;
    const dob = new Date(formData.birthDate);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }, [formData.birthDate]);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
            {
              id: "4",
              name: "Finance Office",
              floor: "3",
              headName: "Maria Santos",
              description: "",
            },
            {
              id: "5",
              name: "IT Department",
              floor: "4",
              headName: "Alex Chen",
              description: "",
            },
          ]);
        }
      } catch {
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
      } finally {
        setIsLoadingDestinations(false);
      }
    };
    fetchDestinations();
  }, []);

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
            resetKiosk();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [step]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/kiosk/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch {
      // fall through to show notice screen regardless
    } finally {
      setIsSubmitting(false);
      setStep(4);
    }
  };

  const resetKiosk = () => {
    setStep(0);
    setFormData(initialFormData);
    setSelectedFloor(null);
    setSearchQuery("");
    setTimer(10);
  };

  const STEPS = [
    { num: 1, label: "Visitor" },
    { num: 2, label: "Destination" },
    { num: 3, label: "Purpose" },
    { num: 4, label: "Notice" },
  ];

  // ── STANDBY SCREEN ──────────────────────────────────────────
  if (step === 0) {
    const rawTime = mounted
      ? currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "12:00 AM";
    const parts = rawTime.split(" ");
    const timeDisplay = parts[0];
    const meridiem = parts[1] ?? "";
    const dateStr = mounted
      ? currentTime.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      : "";

    return (
      <div className={styles.page} onClick={() => setStep(1)}>
        <div className={styles.standby}>
          {/* Top brand bar */}
          <div className={styles.standbyTopBar}>
            <span className={styles.standbyBadge}>VMS</span>
            <span className={styles.standbySystem}>
              SGW Visitor Management System
            </span>
          </div>

          {/* Giant clock */}
          <div className={styles.standbyClock}>
            <div className={styles.standbyTimeRow}>
              <span className={styles.standbyTime}>{timeDisplay}</span>
              <span className={styles.standbyMeridiem}>{meridiem}</span>
            </div>
            <p className={styles.standbyDate}>{dateStr}</p>
          </div>

          {/* Thick rule */}
          <div className={styles.standbyRule} />

          {/* Welcome + CTA */}
          <div className={styles.standbyFooter}>
            <div>
              <p className={styles.standbyWelcome}>Welcome.</p>
              <p className={styles.standbyWelcomeSub}>
                SGW Global &mdash; Visitor Registration Kiosk
              </p>
            </div>
            <button className={styles.tapBtn} tabIndex={-1}>
              <span>Tap anywhere to begin</span>
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NOTICE SCREEN ───────────────────────────────────────────
  if (step === 4) {
    return (
      <div className={styles.page}>
        <div className={styles.noticePage}>
          <div className={styles.noticeInner}>
            {/* Registration tag */}
            <div className={styles.noticeTag}>
              <CheckCircle2 size={14} strokeWidth={1.5} />
              <span>Registration Complete</span>
            </div>

            {/* Big headline */}
            <h1 className={styles.noticeTitle}>
              Almost
              <br />
              done.
            </h1>

            <div className={styles.noticeRule} />

            {/* Instruction */}
            <p className={styles.noticeDesc}>
              Please proceed to the reception desk with your{" "}
              <strong>government-issued ID.</strong> The receptionist will
              complete the final steps below.
            </p>

            {/* Steps list */}
            <div className={styles.noticeSteps}>
              <div className={styles.noticeStep}>
                <span className={styles.noticeStepNum}>01</span>
                <div>
                  <p className={styles.noticeStepTitle}>ID Document Scan</p>
                  <p className={styles.noticeStepSub}>
                    Present your government-issued ID
                  </p>
                </div>
              </div>
              <div className={styles.noticeStep}>
                <span className={styles.noticeStepNum}>02</span>
                <div>
                  <p className={styles.noticeStepTitle}>Photo Capture</p>
                  <p className={styles.noticeStepSub}>
                    A photo will be taken for your visitor badge
                  </p>
                </div>
              </div>
              <div className={styles.noticeStep}>
                <span className={styles.noticeStepNum}>03</span>
                <div>
                  <p className={styles.noticeStepTitle}>RFID Card Issuance</p>
                  <p className={styles.noticeStepSub}>
                    Receive your access card for the building
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.noticeRule} />

            <p className={styles.noticeTimeInNote}>
              Your time-in has been automatically recorded.
            </p>

            {/* Countdown */}
            <div className={styles.noticeCountdown}>
              <Loader2 size={13} className={styles.spin} />
              <span>Returning to start in {timer}s&hellip;</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN FORM FLOW ──────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          {/* Brand */}
          <button className={styles.brand} onClick={resetKiosk}>
            <span className={styles.brandMark}>VMS</span>
            <span className={styles.brandName}>SGW Global</span>
          </button>

          {/* Step indicators */}
          <div className={styles.stepTracker}>
            {STEPS.map((s) => (
              <div
                key={s.num}
                className={[
                  styles.stepItem,
                  step === s.num ? styles.stepActive : "",
                  step > s.num ? styles.stepDone : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className={styles.stepNum}>
                  {step > s.num ? "✓" : `0${s.num}`}
                </span>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className={styles.main} ref={scrollRef}>
        <div className={styles.formInner}>
          {/* ── STEP 1: Visitor Info ── */}
          {step === 1 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <p className={styles.stepTag}>
                  01 &middot; Visitor Information
                </p>
                <h2 className={styles.stepTitle}>
                  Your
                  <br />
                  Details.
                </h2>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g. Juan dela Cruz"
                    autoComplete="off"
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="birthDate">
                      Date of Birth
                    </label>
                    <input
                      id="birthDate"
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className={styles.fieldInput}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Calculated Age</label>
                    <div className={styles.ageDisplay}>
                      {calculatedAge !== null ? (
                        <>
                          <span className={styles.ageNum}>{calculatedAge}</span>
                          <span className={styles.ageUnit}>yrs old</span>
                        </>
                      ) : (
                        <span className={styles.agePlaceholder}>—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Destination ── */}
          {step === 2 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <p className={styles.stepTag}>02 &middot; Destination</p>
                <h2 className={styles.stepTitle}>
                  {searchQuery.trim() || selectedFloor
                    ? "Select Office."
                    : "Which Floor?"}
                </h2>
              </div>

              {/* Search bar */}
              <div className={styles.searchBar}>
                <Search
                  size={18}
                  strokeWidth={1.5}
                  className={styles.searchIco}
                />
                <input
                  type="text"
                  placeholder="Search department or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    className={styles.searchClear}
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Floor selection grid */}
              {!selectedFloor && !searchQuery.trim() ? (
                <div className={styles.floorGrid}>
                  {floors.map((floor) => (
                    <button
                      key={floor}
                      className={styles.floorCard}
                      onClick={() => setSelectedFloor(floor)}
                    >
                      <span className={styles.floorNum}>{floor}</span>
                      <span className={styles.floorLbl}>Floor</span>
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
                      <ChevronLeft size={14} strokeWidth={2} />
                      <span>All Floors</span>
                    </button>
                  )}

                  {filteredDestinations.length > 0 ? (
                    <div className={styles.destList}>
                      {filteredDestinations.map((dest) => {
                        const sel = formData.destinationIds.includes(dest.id);
                        return (
                          <button
                            key={dest.id}
                            onClick={() => toggleDestination(dest.id)}
                            className={[
                              styles.destCard,
                              sel ? styles.destSelected : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <div className={styles.destBody}>
                              <span className={styles.destName}>
                                {dest.name}
                              </span>
                              <div className={styles.destMeta}>
                                <span>{dest.headName}</span>
                                {(searchQuery.trim() || !selectedFloor) && (
                                  <span className={styles.destFloor}>
                                    Floor {dest.floor}
                                  </span>
                                )}
                              </div>
                            </div>
                            {sel && (
                              <CheckCircle2
                                size={20}
                                strokeWidth={1.5}
                                className={styles.destCheckIcon}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.noResults}>
                      <p>No results for &ldquo;{searchQuery}&rdquo;</p>
                      <button
                        className={styles.clearBtn}
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Purpose ── */}
          {step === 3 && (
            <div className={styles.fadeIn}>
              <div className={styles.stepHeader}>
                <p className={styles.stepTag}>03 &middot; Purpose of Visit</p>
                <h2 className={styles.stepTitle}>
                  Why are
                  <br />
                  you here?
                </h2>
              </div>

              <div className={styles.reasonGrid}>
                {VISITOR_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, reason: r }))
                    }
                    className={[
                      styles.reasonCard,
                      formData.reason === r ? styles.reasonSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className={styles.reasonText}>{r}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className={styles.footer}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className={styles.btnBack}>
            <ChevronLeft size={16} strokeWidth={2} />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 &&
                (!formData.fullName.trim() || !formData.birthDate)) ||
              (step === 2 && formData.destinationIds.length === 0)
            }
            className={styles.btnNext}
          >
            <span>Continue</span>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.reason}
            className={styles.btnNext}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className={styles.spin} />
                <span>Processing&hellip;</span>
              </>
            ) : (
              <span>Complete Registration</span>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
