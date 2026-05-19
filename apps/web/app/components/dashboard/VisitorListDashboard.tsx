"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  Calendar
} from "lucide-react";
import styles from "./VisitorListDashboard.module.css";

interface VisitorListDashboardProps {
  roleBadge: string;
}

type VisitorRecord = {
  id: string;
  visitorName: string;
  birthDate: string;
  contactNumber: string;
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
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

      {/* Date Range Filters */}
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

        <button 
          onClick={fetchRecords} 
          className={styles.refreshBtn}
          disabled={isLoading}
          aria-label="Refresh visitor list"
        >
          <RefreshCw size={16} className={isLoading ? styles.spin : ""} />
          Refresh
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
        ) : records.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <h3>No Records Found</h3>
            <p>There are no recorded visitor check-ins for the selected date range.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Government ID</th>
                <th>Destination</th>
                <th>RFID Card</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
                <th>Duration Spent</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className={styles.tableRow}>
                  <td>
                    <strong className={styles.visitorName}>{rec.visitorName}</strong>
                    <span className={styles.subText}>{rec.contactNumber}</span>
                  </td>
                  <td>
                    <span className={styles.subText} style={{ fontWeight: 600 }}>{rec.idType}</span>
                    <span className={styles.subText}>{rec.idNumber}</span>
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
    </div>
  );
}
