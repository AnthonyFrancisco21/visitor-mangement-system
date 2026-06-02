"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Webcam from "react-webcam";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ArrowRight,
  Search,
  X,
  MapPin,
  Clock,
  CreditCard,
  Camera,
  RotateCcw,
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
  idPhotoUrl: string;
  visitorPhotoUrl: string;
  destinationIds: string[];
  reason: string;
};

const initialFormData: FormData = {
  fullName: "",
  idPhotoUrl: "",
  visitorPhotoUrl: "",
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

  const webcamRef = useRef<Webcam>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (step === 6) {
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

  const handleCaptureId = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) setFormData((prev) => ({ ...prev, idPhotoUrl: imageSrc }));
  };

  const handleRetakeId = () => {
    setFormData((prev) => ({ ...prev, idPhotoUrl: "" }));
  };

  const handleCaptureFace = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc)
      setFormData((prev) => ({ ...prev, visitorPhotoUrl: imageSrc }));
  };

  const handleRetakeFace = () => {
    setFormData((prev) => ({ ...prev, visitorPhotoUrl: "" }));
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
      // fall through
    } finally {
      setIsSubmitting(false);
      setStep(6);
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
    { num: 1, label: "Scan ID" },
    { num: 2, label: "Photo" },
    { num: 3, label: "Destination" },
    { num: 4, label: "Purpose" },
  ];

  // Prevent hydration mismatch by returning a skeleton on initial render
  if (!mounted) {
    return (
      <div className={styles.page}>
        <div className={styles.standby}>
          <div className={styles.standbyGlow} />
        </div>
      </div>
    );
  }

  // ── STANDBY SCREEN ──────────────────────────────────────────
  if (step === 0) {
    const rawTime = mounted
      ? currentTime.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "12:00 AM";
    const parts = rawTime.split(" ");
    const timeDisplay = parts[0];
    const meridiem = parts[1] ?? "";
    const dateStr = mounted
      ? currentTime.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

    return (
      <div className={styles.page} onClick={() => setStep(1)}>
        <div className={styles.standby}>
          {/* Decorative ambient glow */}
          <div className={styles.standbyGlow} />

          {/* Top brand bar */}
          <div className={styles.standbyTopBar}>
            <div className={styles.standbyBrandBlock}>
              <span className={styles.standbyBrandMark}>VMS</span>
              <span className={styles.standbyBrandSep} />
              <span className={styles.standbyBrandName}>
                SGW Visitor Management
              </span>
            </div>
          </div>

          {/* Clock centrepiece */}
          <div className={styles.standbyCenter}>
            <p className={styles.standbyCenterLabel}>Current Time</p>

            <div className={styles.standbyClockRow}>
              <span className={styles.standbyTime}>{timeDisplay}</span>
              <span className={styles.standbyMeridiem}>{meridiem}</span>
            </div>

            {/* Gold rule */}
            <div className={styles.standbyGoldRule} />

            <p className={styles.standbyDate}>{dateStr}</p>
          </div>

          {/* Bottom welcome section */}
          <div className={styles.standbyBottom}>
            {/* Section-label style rule */}
            <div className={styles.standbyTitleRow}>
              <span className={styles.standbyTitleRule} />
              <h1 className={styles.standbyTitle}>Welcome to SGW</h1>
              <span className={styles.standbyTitleRule} />
            </div>
            <p className={styles.standbySubtitle}>Visitor Registration Kiosk</p>

            <button className={styles.tapBtn} tabIndex={-1}>
              <span>Tap anywhere to begin</span>
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NOTICE / COMPLETION SCREEN ──────────────────────────────
  if (step === 6) {
    return (
      <div className={styles.page}>
        <div className={styles.noticePage}>
          {/* Ambient glow */}
          <div className={styles.noticeGlow} />

          <div className={styles.noticeInner}>
            {/* Success badge */}
            <div className={styles.noticeBadge}>
              <CheckCircle2 size={20} strokeWidth={1.5} />
              <span>Registration Complete</span>
            </div>

            {/* Headline */}
            <h1 className={styles.noticeTitle}>
              Almost
              <br />
              <em>done.</em>
            </h1>

            {/* Gold rule */}
            <div className={styles.noticeGoldRule} />

            {/* Description */}
            <p className={styles.noticeDesc}>
              Please proceed to the reception desk. The receptionist will
              complete the final steps on your behalf.
            </p>

            {/* Numbered reception steps */}
            <div className={styles.noticeSteps}>
              <div className={styles.noticeStep}>
                <div className={styles.noticeStepIcon}>
                  <MapPin size={18} strokeWidth={1.5} />
                </div>
                <div className={styles.noticeStepBody}>
                  <p className={styles.noticeStepLabel}>
                    01 &mdash; Verify Information
                  </p>
                  <p className={styles.noticeStepDesc}>
                    Receptionist will verify your details
                  </p>
                </div>
              </div>

              <div className={styles.noticeStep}>
                <div className={styles.noticeStepIcon}>
                  <CreditCard size={18} strokeWidth={1.5} />
                </div>
                <div className={styles.noticeStepBody}>
                  <p className={styles.noticeStepLabel}>
                    02 &mdash; RFID Card Issuance
                  </p>
                  <p className={styles.noticeStepDesc}>
                    Receive your access card for the building
                  </p>
                </div>
              </div>
            </div>

            {/* Thin rule */}
            <div className={styles.noticeDivider} />

            {/* Auto time-in note */}
            <p className={styles.noticeTimeNote}>
              ✦ Your time-in will be automatically recorded upon card issuance.
            </p>

            {/* Countdown */}
            <div className={styles.noticeCountdown}>
              <Loader2 size={15} className={styles.spin} />
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
        <div className={styles.headerInner}>
          {/* Brand */}
          <button className={styles.brand} onClick={resetKiosk}>
            <span className={styles.brandMark}>VMS</span>
            <span className={styles.brandSep} />
            <span className={styles.brandName}>SGW Global</span>
          </button>

          {/* Step progress */}
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
                <span className={styles.stepDot}>
                  {step > s.num ? (
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                  ) : (
                    s.num
                  )}
                </span>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Scrollable form area */}
      <main className={styles.main} ref={scrollRef}>
        <div className={styles.formInner}>
          {/* ── STEP 1: SCAN ID ── */}
          {step === 1 && (
            <div className={styles.fadeIn}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionRule} />
                <span className={styles.sectionLabelText}>Government ID</span>
                <span className={styles.sectionRule} />
              </div>

              <h2 className={styles.stepTitle}>
                Scan your
                <br />
                ID Document.
              </h2>

              {!formData.idPhotoUrl ? (
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
                      <span className={styles.frameInstruction}>
                        PLACE ID IN FRAME
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCaptureId}
                    className={styles.actionBtn}
                  >
                    <Camera size={18} /> Capture ID Photo
                  </button>
                </div>
              ) : (
                <div className={styles.previewContainer}>
                  <div className={styles.previewCard}>
                    <div className={styles.imageFrame}>
                      <img
                        src={formData.idPhotoUrl}
                        alt="Captured ID Document"
                        className={styles.capturedImage}
                      />
                    </div>
                    <div className={styles.previewForm}>
                      <button
                        onClick={handleRetakeId}
                        className={styles.outlineBtn}
                      >
                        <RotateCcw size={16} /> Retake ID Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: CAPTURE FACE ── */}
          {step === 2 && (
            <div className={styles.fadeIn}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionRule} />
                <span className={styles.sectionLabelText}>Visitor Photo</span>
                <span className={styles.sectionRule} />
              </div>

              <h2 className={styles.stepTitle}>
                Take a<br />
                Selfie.
              </h2>

              {!formData.visitorPhotoUrl ? (
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
                      <span className={styles.frameInstruction}>
                        ALIGN FACE HERE
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCaptureFace}
                    className={styles.actionBtn}
                  >
                    <Camera size={18} /> Capture Photo
                  </button>
                </div>
              ) : (
                <div className={styles.previewContainer}>
                  <div className={styles.previewCard}>
                    <div className={styles.imageFrame}>
                      <img
                        src={formData.visitorPhotoUrl}
                        alt="Captured Visitor Face"
                        className={styles.capturedImage}
                      />
                    </div>
                    <div className={styles.previewForm}>
                      <button
                        onClick={handleRetakeFace}
                        className={styles.outlineBtn}
                      >
                        <RotateCcw size={16} /> Retake Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Destination ── */}
          {step === 3 && (
            <div className={styles.fadeIn}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionRule} />
                <span className={styles.sectionLabelText}>Destination</span>
                <span className={styles.sectionRule} />
              </div>

              <h2 className={styles.stepTitle}>
                {searchQuery.trim() || selectedFloor
                  ? "Select an Office."
                  : "Which Floor?"}
              </h2>

              {/* Search */}
              <div className={styles.searchBar}>
                <Search
                  size={20}
                  strokeWidth={1.5}
                  className={styles.searchIco}
                />
                <input
                  type="text"
                  placeholder="Search by department or contact name..."
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
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Floor grid or destination list */}
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
                      <ChevronLeft size={15} strokeWidth={2} />
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
                                  <span className={styles.destFloorBadge}>
                                    Floor {dest.floor}
                                  </span>
                                )}
                              </div>
                            </div>
                            {sel && (
                              <CheckCircle2
                                size={22}
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

          {/* ── STEP 4: Purpose ── */}
          {step === 4 && (
            <div className={styles.fadeIn}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionRule} />
                <span className={styles.sectionLabelText}>
                  Purpose of Visit
                </span>
                <span className={styles.sectionRule} />
              </div>

              <h2 className={styles.stepTitle}>
                Why are
                <br />
                you here?
              </h2>

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
            <ChevronLeft size={18} strokeWidth={2} />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !formData.idPhotoUrl) ||
              (step === 2 && !formData.visitorPhotoUrl) ||
              (step === 3 && formData.destinationIds.length === 0)
            }
            className={styles.btnNext}
          >
            <span>Continue</span>
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.reason}
            className={styles.btnNext}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className={styles.spin} />
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
