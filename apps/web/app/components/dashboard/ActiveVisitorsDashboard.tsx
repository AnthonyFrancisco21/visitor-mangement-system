"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Users, Clock, AlertCircle, ArrowRight } from "lucide-react";
import styles from "./ActiveVisitorsDashboard.module.css";

interface ActiveVisitorsDashboardProps {
  roleBadge: string;
  rolePath: "receptionist" | "admin";
}

export default function ActiveVisitorsDashboard({ roleBadge, rolePath }: ActiveVisitorsDashboardProps) {
  const [activeVisits, setActiveVisits] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch active visits
      const resActive = await fetch("/api/receptionist/visits/active");
      if (resActive.ok) {
        const data = await resActive.json();
        setActiveVisits(data);
      }

      // Fetch pending visits count
      const resPending = await fetch("/api/receptionist/visits/pending");
      if (resPending.ok) {
        const data = await resPending.json();
        setPendingCount(data.length);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckout = async (visitId: string) => {
    setIsCheckingOut(visitId);
    setMessage("");
    try {
      const res = await fetch("/api/receptionist/visits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId }),
      });

      if (res.ok) {
        setMessage("Visitor checked out successfully");
        fetchData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to checkout visitor");
      }
    } catch (err) {
      console.error("Error checking out:", err);
    } finally {
      setIsCheckingOut(null);
    }
  };

  // Helper to calculate time spent in building
  const getDuration = (timeInStr: string) => {
    const timeIn = new Date(timeInStr);
    const now = new Date();
    const diffMs = now.getTime() - timeIn.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>{roleBadge}</div>
          <h1 className={styles.title}>Live Dashboard</h1>
          <p className={styles.desc}>
            Real-time status of visitors inside the building.
          </p>
        </div>
        <button onClick={fetchData} className={styles.refreshBtn} disabled={isLoading}>
          <RefreshCw size={18} className={isLoading ? styles.spin : ""} />
          Refresh
        </button>
      </div>

      {message && <div className={styles.successAlert}>{message}</div>}

      {/* Stats Section */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.activeCard}`}>
          <div className={styles.statIconWrapper}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Currently in Building</span>
            <span className={styles.statValue}>{activeVisits.length}</span>
          </div>
        </div>

        <Link href={`/${rolePath}/registration`} className={`${styles.statCard} ${styles.pendingCard}`}>
          <div className={styles.statIconWrapper}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pending Registrations</span>
            <span className={styles.statValue}>
              {pendingCount}
              {pendingCount > 0 && <span className={styles.pulseBadge} />}
            </span>
          </div>
          <ArrowRight size={20} className={styles.arrowIcon} />
        </Link>
      </div>

      {/* Live Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Active Visitors</h2>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot} /> LIVE
          </span>
        </div>

        {isLoading && activeVisits.length === 0 ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spin} />
            <p>Loading active visitor log...</p>
          </div>
        ) : activeVisits.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} className={styles.emptyIcon} />
            <h3>No Visitors Logged In</h3>
            <p>There are currently no active visitors inside the building.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>RFID Card</th>
                <th>Destination</th>
                <th>Time In</th>
                <th>Duration Spent</th>
              </tr>
            </thead>
            <tbody>
              {activeVisits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <strong className={styles.visitorName}>{visit.visitor.fullName}</strong>
                  </td>
                  <td>
                    <span className={styles.rfidTag}>
                      {visit.rfidCard?.label || visit.rfidCard?.uid || "—"}
                    </span>
                  </td>
                  <td>
                    {visit.destinations.map((d: any) => d.destination.name).join(", ")}
                  </td>
                  <td>
                    {new Date(visit.timeIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className={styles.duration}>
                    {getDuration(visit.timeIn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
