"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
  Download,
  Search,
  X,
  CreditCard,
  MapPin,
  Clock,
  User,
  FileText,
  Pencil,
  Check,
  Phone,
  IdCard,
  MapPinned,
} from "lucide-react";
import styles from "./VisitorListDashboard.module.css";

interface VisitorListDashboardProps {
  roleBadge: string;
}

type VisitorRecord = {
  id: string;
  visitorId: string;
  visitorName: string;
  birthDate: string | null;
  contactNumber: string;
  address: string;
  idType: string;
  idNumber: string;
  rfidCard: string;
  destinations: string;
  timeIn: string;
  timeOut: string | null;
  status: "ACTIVE" | "COMPLETED" | "REVOKED";
  reason: string;
  revokeReason: string | null;
  revokeNote: string | null;
  visitorPhotoUrl: string | null;
  idPhotoUrl: string | null;
  rfidCardUid: string;
  rfidCardLabel: string;
};

export default function VisitorListDashboard({
  roleBadge,
}: VisitorListDashboardProps) {
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<VisitorRecord | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Inline name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const url = `/api/visitor?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      } else {
        console.error("Failed to fetch visitor list records");
      }
    } catch (error) {
      console.error("Error fetching visitor list records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return styles.statusActive;
      case "COMPLETED":
        return styles.statusCompleted;
      case "REVOKED":
        return styles.statusRevoked;
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active In Building";
      case "COMPLETED":
        return "Checked Out";
      case "REVOKED":
        return "Revoked Checkout";
      default:
        return status;
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "—";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getDuration = (timeInStr: string, timeOutStr: string | null) => {
    if (!timeOutStr) return "—";
    try {
      const start = new Date(timeInStr);
      const end = new Date(timeOutStr);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 0) return "0m";
      if (diffMins < 60) {
        return `${diffMins}m`;
      }
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      return `${diffHours}h ${remainingMins}m`;
    } catch {
      return "—";
    }
  };

  const computeAge = (birthDateStr: string | null) => {
    if (!birthDateStr) return null;
    try {
      const birth = new Date(birthDateStr);
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const filteredRecords = records.filter((rec) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (rec.visitorName || "").toLowerCase().includes(query) ||
      rec.destinations.toLowerCase().includes(query) ||
      rec.rfidCard.toLowerCase().includes(query) ||
      rec.rfidCardUid.toLowerCase().includes(query) ||
      rec.reason.toLowerCase().includes(query)
    );
  });

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditingName) {
          cancelEditName();
        } else {
          closeModal();
        }
      }
    };
    if (selectedRecord) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRecord, isEditingName]);

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const downloadCSV = () => {
    if (records.length === 0) return;
    const url = `/api/visitor?startDate=${startDate}&endDate=${endDate}&format=csv`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Visitor_Report_${startDate}_to_${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setIsEditingName(false);
    setEditingName("");
    setSaveError(null);
  };

  const startEditName = () => {
    if (!selectedRecord) return;
    setEditingName(selectedRecord.visitorName || "");
    setIsEditingName(true);
    setSaveError(null);
  };

  const cancelEditName = () => {
    setIsEditingName(false);
    setEditingName("");
    setSaveError(null);
  };

  /** Save updated visitor name via PATCH using visitorId */
  const saveName = async () => {
    if (!selectedRecord) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      setSaveError("Name cannot be empty");
      return;
    }
    setIsSavingName(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/visitors/${selectedRecord.visitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        // Update local state immediately
        const updatedRecord = { ...selectedRecord, visitorName: trimmed };
        setSelectedRecord(updatedRecord);
        setRecords((prev) =>
          prev.map((r) => (r.id === selectedRecord.id ? updatedRecord : r)),
        );
        setIsEditingName(false);
        setEditingName("");
      } else {
        const errData = await res.json().catch(() => null);
        setSaveError(errData?.error || "Failed to update name");
      }
    } catch (e) {
      console.error(e);
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditName();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>{roleBadge}</div>
          <h1 className={styles.title}>Visitor List</h1>
          <p className={styles.desc}>
            View and search all registered visitors checked in or out of the
            building.
          </p>
        </div>
      </div>

      {/* Date Range & Search Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.searchGroup}>
          <label htmlFor="search-input">Search Directory</label>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              id="search-input"
              type="text"
              placeholder="Search name, destination, RFID, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={styles.clearSearchBtn}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={fetchRecords}
          className={styles.refreshBtn}
          disabled={isLoading}
          aria-label="Refresh visitor list"
        >
          <RefreshCw size={16} className={isLoading ? styles.spin : ""} />
          Refresh
        </button>

        <button
          onClick={downloadCSV}
          className={styles.downloadBtn}
          disabled={isLoading || records.length === 0}
          aria-label="Download CSV report"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Main Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Checked-In Logs Directory</h2>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spin} />
            <p>Loading visitor session logs...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <h3>No Records Found</h3>
            <p>
              {searchQuery
                ? "No visitor sessions match your search query."
                : "There are no recorded visitor check-ins for the selected date range."}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Destination</th>
                <th>RFID Card</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
                <th>Duration Spent</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className={styles.tableRow}
                  onClick={() => {
                    setSelectedRecord(rec);
                    setIsEditingName(false);
                    setEditingName("");
                    setSaveError(null);
                  }}
                  title="Click to view visitor details"
                >
                  <td>
                    {rec.visitorName ? (
                      <strong className={styles.visitorName}>
                        {rec.visitorName}
                      </strong>
                    ) : (
                      <span className={styles.noNameTag}>
                        <User size={12} />
                        No Name Yet
                      </span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: "#334155", fontSize: "0.88rem" }}>
                      {rec.destinations}
                    </strong>
                    <span className={styles.subText}>Reason: {rec.reason}</span>
                  </td>
                  <td>
                    <span className={styles.rfidTag}>{rec.rfidCard}</span>
                  </td>
                  <td>{formatTime(rec.timeIn)}</td>
                  <td>
                    {rec.timeOut ? (
                      formatTime(rec.timeOut)
                    ) : (
                      <span style={{ color: "#2563eb", fontWeight: 600 }}>
                        Inside
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeClass(rec.status)}`}
                    >
                      {getStatusLabel(rec.status)}
                    </span>
                    {rec.status === "REVOKED" && rec.revokeReason && (
                      <span
                        className={styles.subText}
                        style={{ color: "#b91c1c", fontStyle: "italic" }}
                      >
                        Reason: {rec.revokeReason}
                      </span>
                    )}
                  </td>
                  <td>{getDuration(rec.timeIn, rec.timeOut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Visitor Detail Modal */}
      {selectedRecord && (
        <div
          className={styles.modalOverlay}
          onClick={closeModal}
        >
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div>
                <h2>Visitor Profile Detail</h2>
                <p className={styles.modalSubtitle}>
                  Session ID: {selectedRecord.id}
                </p>
              </div>
              <button
                className={styles.closeBtn}
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                {/* Section: Personal Info */}
                <div className={styles.infoSection}>
                  <div className={styles.sectionTitle}>
                    <User size={18} className={styles.sectionIcon} />
                    <h3>Personal Information</h3>
                  </div>
                  <div className={styles.detailsGrid}>
                    {/* Editable Name Field */}
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Full Name</span>
                      {isEditingName ? (
                        <div className={styles.nameEditRow}>
                          <input
                            ref={nameInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleNameKeyDown}
                            className={styles.nameEditInput}
                            placeholder="Enter visitor name..."
                            disabled={isSavingName}
                          />
                          <button
                            className={styles.nameEditSaveBtn}
                            onClick={saveName}
                            disabled={isSavingName || !editingName.trim()}
                            title="Save name"
                          >
                            {isSavingName ? (
                              <Loader2 size={14} className={styles.spin} />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            className={styles.nameEditCancelBtn}
                            onClick={cancelEditName}
                            disabled={isSavingName}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.nameDisplayRow}>
                          {selectedRecord.visitorName ? (
                            <strong className={styles.detailValue}>
                              {selectedRecord.visitorName}
                            </strong>
                          ) : (
                            <span className={styles.noNameInline}>
                              No name provided
                            </span>
                          )}
                          <button
                            className={styles.nameEditTrigger}
                            onClick={startEditName}
                            title={selectedRecord.visitorName ? "Edit name" : "Add name"}
                          >
                            <Pencil size={13} />
                            <span>{selectedRecord.visitorName ? "Edit" : "Add Name"}</span>
                          </button>
                        </div>
                      )}
                      {saveError && (
                        <span className={styles.nameEditError}>
                          <AlertCircle size={12} />
                          {saveError}
                        </span>
                      )}
                    </div>

                    {/* Birth Date & Age */}
                    {selectedRecord.birthDate && selectedRecord.birthDate !== "—" && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Birth Date</span>
                        <span className={styles.detailValue}>
                          {selectedRecord.birthDate}
                          {computeAge(selectedRecord.birthDate) !== null && (
                            <span className={styles.ageTag}>
                              {computeAge(selectedRecord.birthDate)} yrs old
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Contact Number */}
                    {selectedRecord.contactNumber && selectedRecord.contactNumber !== "—" && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Contact Number</span>
                        <span className={styles.detailValue}>
                          <Phone size={13} className={styles.inlineIcon} />
                          {selectedRecord.contactNumber}
                        </span>
                      </div>
                    )}

                    {/* Address */}
                    {selectedRecord.address && selectedRecord.address !== "—" && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Address</span>
                        <span className={styles.detailValue}>
                          <MapPinned size={13} className={styles.inlineIcon} />
                          {selectedRecord.address}
                        </span>
                      </div>
                    )}

                    {/* ID Type & Number */}
                    {selectedRecord.idType && selectedRecord.idType !== "—" && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>ID Document</span>
                        <span className={styles.detailValue}>
                          <IdCard size={13} className={styles.inlineIcon} />
                          {selectedRecord.idType}
                          {selectedRecord.idNumber && selectedRecord.idNumber !== "—" && (
                            <span className={styles.idNumberTag}>
                              #{selectedRecord.idNumber}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: RFID Details */}
                <div className={styles.infoSection}>
                  <div className={styles.sectionTitle}>
                    <CreditCard size={18} className={styles.sectionIcon} />
                    <h3>RFID Assignment</h3>
                  </div>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Card Label</span>
                      <span
                        className={`${styles.detailValue} ${styles.rfidCardValue}`}
                      >
                        {selectedRecord.rfidCardLabel ||
                          selectedRecord.rfidCard ||
                          "—"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>
                        Card Hardware UID
                      </span>
                      <span
                        className={styles.detailValue}
                        style={{ fontFamily: "monospace" }}
                      >
                        {selectedRecord.rfidCardUid || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: Visit Details */}
                <div className={styles.infoSection}>
                  <div className={styles.sectionTitle}>
                    <Clock size={18} className={styles.sectionIcon} />
                    <h3>Visit Tracking</h3>
                  </div>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Destination</span>
                      <strong
                        className={styles.detailValue}
                        style={{ color: "#2563eb" }}
                      >
                        {selectedRecord.destinations}
                      </strong>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>
                        Reason for Visit
                      </span>
                      <span className={styles.detailValue}>
                        {selectedRecord.reason}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Time In</span>
                      <span className={styles.detailValue}>
                        {formatTime(selectedRecord.timeIn)} (
                        {new Date(selectedRecord.timeIn).toLocaleDateString()})
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Time Out</span>
                      <span className={styles.detailValue}>
                        {selectedRecord.timeOut ? (
                          `${formatTime(selectedRecord.timeOut)} (${new Date(selectedRecord.timeOut).toLocaleDateString()})`
                        ) : (
                          <span style={{ color: "#2563eb", fontWeight: 700 }}>
                            Still Checked In
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Visit Duration</span>
                      <span className={styles.detailValue}>
                        {getDuration(
                          selectedRecord.timeIn,
                          selectedRecord.timeOut,
                        )}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Current Status</span>
                      <span
                        className={`${styles.statusBadge} ${getStatusBadgeClass(selectedRecord.status)}`}
                      >
                        {getStatusLabel(selectedRecord.status)}
                      </span>
                    </div>
                  </div>
                  {selectedRecord.status === "REVOKED" &&
                    selectedRecord.revokeReason && (
                      <div className={styles.revokeInfoCard}>
                        <strong>Revocation Details:</strong>
                        <p>Reason: {selectedRecord.revokeReason || "—"}</p>
                        {selectedRecord.revokeNote && (
                          <p>Notes: {selectedRecord.revokeNote}</p>
                        )}
                      </div>
                    )}
                </div>

                {/* Section: Media Attachments */}
                <div className={styles.mediaSection}>
                  <h3>Captured Media Records</h3>
                  <div className={styles.mediaGrid}>
                    {/* Visitor Live Face Photo */}
                    <div className={styles.mediaCard}>
                      <span className={styles.mediaCardTitle}>
                        Live Visitor Image
                      </span>
                      <div className={styles.mediaFrame}>
                        {selectedRecord.visitorPhotoUrl ? (
                          <img
                            src={selectedRecord.visitorPhotoUrl}
                            alt={`Live face capture of ${selectedRecord.visitorName || "visitor"}`}
                            className={styles.mediaImage}
                          />
                        ) : (
                          <div className={styles.mediaPlaceholder}>
                            <User size={40} />
                            <span>No live photo captured</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ID Document Photo */}
                    <div className={styles.mediaCard}>
                      <span className={styles.mediaCardTitle}>
                        Captured ID Document
                      </span>
                      <div className={styles.mediaFrame}>
                        {selectedRecord.idPhotoUrl ? (
                          <img
                            src={selectedRecord.idPhotoUrl}
                            alt="Government-issued ID scanned record"
                            className={styles.mediaImage}
                          />
                        ) : (
                          <div className={styles.mediaPlaceholder}>
                            <FileText size={40} />
                            <span>No ID document photo captured</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                className={styles.actionBtn}
                onClick={closeModal}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
