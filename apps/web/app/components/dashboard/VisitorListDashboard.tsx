"use client";

import React, { useState, useEffect } from "react";
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
  FileText
} from "lucide-react";
import styles from "./VisitorListDashboard.module.css";

interface VisitorListDashboardProps {
  roleBadge: string;
}

type VisitorRecord = {
  id: string;
  visitorName: string;
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

export default function VisitorListDashboard({ roleBadge }: VisitorListDashboardProps) {
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
  const [selectedRecord, setSelectedRecord] = useState<VisitorRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      case "ACTIVE": return styles.statusActive;
      case "COMPLETED": return styles.statusCompleted;
      case "REVOKED": return styles.statusRevoked;
      default: return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Active In Building";
      case "COMPLETED": return "Checked Out";
      case "REVOKED": return "Revoked Checkout";
      default: return status;
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "—";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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

  const filteredRecords = records.filter((rec) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      rec.visitorName.toLowerCase().includes(query) ||
      rec.destinations.toLowerCase().includes(query) ||
      rec.rfidCard.toLowerCase().includes(query) ||
      rec.rfidCardUid.toLowerCase().includes(query) ||
      rec.reason.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedRecord(null);
      }
    };
    if (selectedRecord) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRecord]);

  const downloadCSV = () => {
    if (records.length === 0) return;
    const url = `/api/visitor?startDate=${startDate}&endDate=${endDate}&format=csv`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Visitor_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>{roleBadge}</div>
          <h1 className={styles.title}>Visitor List</h1>
          <p className={styles.desc}>
            View and search all registered visitors checked in or out of the building.
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
                : "There are no recorded visitor check-ins for the selected date range."
              }
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
                  onClick={() => setSelectedRecord(rec)}
                  title="Click to view visitor details"
                >
                  <td>
                    <strong className={styles.visitorName}>{rec.visitorName}</strong>
                  </td>
                  <td>
                    <strong style={{ color: "#334155", fontSize: "0.88rem" }}>{rec.destinations}</strong>
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
                      <span style={{ color: "#2563eb", fontWeight: 600 }}>Inside</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(rec.status)}`}>
                      {getStatusLabel(rec.status)}
                    </span>
                    {rec.status === "REVOKED" && rec.revokeReason && (
                      <span className={styles.subText} style={{ color: "#b91c1c", fontStyle: "italic" }}>
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

      {/* Visitor Details Modal */}
      {selectedRecord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRecord(null)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div>
                <h2>Visitor Profile Detail</h2>
                <p className={styles.modalSubtitle}>Session ID: {selectedRecord.id}</p>
              </div>
              <button 
                className={styles.closeBtn} 
                onClick={() => setSelectedRecord(null)}
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
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Full Name</span>
                      <strong className={styles.detailValue}>{selectedRecord.visitorName}</strong>
                    </div>
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
                      <span className={`${styles.detailValue} ${styles.rfidCardValue}`}>
                        {selectedRecord.rfidCardLabel || selectedRecord.rfidCard || "—"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Card Hardware UID</span>
                      <span className={styles.detailValue} style={{ fontFamily: "monospace" }}>
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
                      <strong className={styles.detailValue} style={{ color: "#2563eb" }}>
                        {selectedRecord.destinations}
                      </strong>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Reason for Visit</span>
                      <span className={styles.detailValue}>{selectedRecord.reason}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Time In</span>
                      <span className={styles.detailValue}>
                        {formatTime(selectedRecord.timeIn)} ({new Date(selectedRecord.timeIn).toLocaleDateString()})
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Time Out</span>
                      <span className={styles.detailValue}>
                        {selectedRecord.timeOut ? (
                          `${formatTime(selectedRecord.timeOut)} (${new Date(selectedRecord.timeOut).toLocaleDateString()})`
                        ) : (
                          <span style={{ color: "#2563eb", fontWeight: 700 }}>Still Checked In</span>
                        )}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Visit Duration</span>
                      <span className={styles.detailValue}>{getDuration(selectedRecord.timeIn, selectedRecord.timeOut)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Current Status</span>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedRecord.status)}`}>
                        {getStatusLabel(selectedRecord.status)}
                      </span>
                    </div>
                  </div>

                  {selectedRecord.status === "REVOKED" && (
                    <div className={styles.revokeInfoCard}>
                      <strong>Revocation Details:</strong>
                      <p>Reason: {selectedRecord.revokeReason || "—"}</p>
                      {selectedRecord.revokeNote && <p>Notes: {selectedRecord.revokeNote}</p>}
                    </div>
                  )}
                </div>

              </div>

              {/* Section: Media Attachments */}
              <div className={styles.mediaSection}>
                <h3>Captured Media Records</h3>
                <div className={styles.mediaGrid}>
                  
                  {/* Visitor Live Face Photo */}
                  <div className={styles.mediaCard}>
                    <span className={styles.mediaCardTitle}>Live Visitor Image</span>
                    <div className={styles.mediaFrame}>
                      {selectedRecord.visitorPhotoUrl ? (
                        <img 
                          src={selectedRecord.visitorPhotoUrl} 
                          alt={`Live face capture of ${selectedRecord.visitorName}`} 
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
                    <span className={styles.mediaCardTitle}>Captured ID Document</span>
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

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button className={styles.actionBtn} onClick={() => setSelectedRecord(null)}>
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
