"use client";

import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw, UserCheck } from "lucide-react";
import styles from "./PendingRegistrations.module.css";
import ConfirmModal from "./ConfirmModal";

interface PendingRegistrationsProps {
  roleBadge: string;
}

export default function PendingRegistrations({ roleBadge }: PendingRegistrationsProps) {
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);

  const fetchVisits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/receptionist/visits/pending");
      if (res.ok) {
        const data = await res.json();
        setVisits(data);
      }
    } catch (err) {
      console.error("Error fetching pending registrations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleSuccess = () => {
    setSelectedVisit(null);
    fetchVisits();
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>{roleBadge}</div>
          <h1 className={styles.title}>Pending Registrations</h1>
          <p className={styles.desc}>
            Review and confirm visitor registrations submitted via the kiosk.
          </p>
        </div>
        <button onClick={fetchVisits} className={styles.refreshBtn} disabled={isLoading}>
          <RefreshCw size={18} className={isLoading ? styles.spin : ""} />
          Refresh
        </button>
      </div>

      <div className={styles.tableContainer}>
        {isLoading && visits.length === 0 ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spin} />
            <p>Loading pending registrations...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className={styles.emptyState}>
            <UserCheck size={48} className={styles.emptyIcon} />
            <h3>All Caught Up</h3>
            <p>No pending visitor registrations at the moment.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Destination</th>
                <th>Reason</th>
                <th>Time Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id} onClick={() => setSelectedVisit(visit)} className={styles.clickableRow}>
                  <td>
                    <strong className={styles.visitorName}>{visit.visitor.fullName}</strong>
                  </td>
                  <td>
                    {visit.destinations.map((d: any) => d.destination.name).join(", ")}
                  </td>
                  <td>{visit.reason || "—"}</td>
                  <td>
                    {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <button className={styles.actionBtn}>
                      Confirm
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedVisit && (
        <ConfirmModal
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
