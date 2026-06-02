// apps/web/components/dashboard/PendingRegistrations.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw, UserCheck, Trash2 } from "lucide-react";
import styles from "./PendingRegistrations.module.css";
import ConfirmModal from "./ConfirmModal";
import WarningModal from "@/app/components/ui/WarningModal";

interface PendingRegistrationsProps {
  roleBadge: string;
}

export default function PendingRegistrations({
  roleBadge,
}: PendingRegistrationsProps) {
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteVisit = (visitId: string) => {
    setVisitToDelete(visitId);
  };

  const confirmDelete = async () => {
    if (!visitToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/receptionist/visits/pending", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visitId: visitToDelete }),
      });

      if (res.ok) {
        fetchVisits();
        setVisitToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete pending registration");
      }
    } catch (err) {
      console.error("Error deleting pending registration:", err);
      alert("An error occurred while deleting the registration.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to get display name
  const getVisitorDisplayName = (visit: any) => {
    const fullName = visit.visitor.fullName;

    // If fullName exists and is not empty, show it
    if (fullName && fullName.trim()) {
      return fullName;
    }

    // Otherwise show placeholder with light styling
    return (
      <span className={styles.visitorNamePending}>
        Visitor name not registered yet
      </span>
    );
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
        <button
          onClick={fetchVisits}
          className={styles.refreshBtn}
          disabled={isLoading}
        >
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
                <tr key={visit.id} className={styles.tableRow}>
                  <td>{getVisitorDisplayName(visit)}</td>
                  <td>
                    {visit.destinations
                      .map((d: any) => d.destination.name)
                      .join(", ")}
                  </td>
                  <td>{visit.reason || "—"}</td>
                  <td>
                    {new Date(visit.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <div className={styles.actionsContainer}>
                      <button
                        onClick={() => setSelectedVisit(visit)}
                        className={styles.confirmBtn}
                      >
                        <UserCheck size={16} />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleDeleteVisit(visit.id)}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
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

      <WarningModal
        isOpen={!!visitToDelete}
        title="Reject Registration"
        message="Are you sure you want to reject and delete this pending registration? This action cannot be undone."
        confirmText="Delete Registration"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => !isDeleting && setVisitToDelete(null)}
      />
    </div>
  );
}
