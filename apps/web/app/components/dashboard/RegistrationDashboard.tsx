// apps/web/components/dashboard/RegistrationDashboard.tsx

"use client";

import React, { useState } from "react";
import { Plus, List } from "lucide-react";
import PendingRegistrations from "./PendingRegistrations";
import ManualVisitorEntry from "./Manualvisitorentry";
import styles from "./RegistrationDashboard.module.css";

interface RegistrationDashboardProps {
  roleBadge: string;
}

export default function RegistrationDashboard({
  roleBadge,
}: RegistrationDashboardProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "manual">("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleManualSuccess = () => {
    // Trigger refresh of pending registrations
    setRefreshTrigger((prev) => prev + 1);
    // Return to pending tab to show updated list
    setActiveTab("pending");
  };

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <div className={styles.tabButtons}>
          <button
            onClick={() => setActiveTab("pending")}
            className={`${styles.tabBtn} ${activeTab === "pending" ? styles.tabBtnActive : ""}`}
          >
            <List size={18} />
            <span>Pending Registrations</span>
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`${styles.tabBtn} ${activeTab === "manual" ? styles.tabBtnActive : ""}`}
          >
            <Plus size={18} />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "pending" && (
          <div key={`pending-${refreshTrigger}`} className={styles.tabPane}>
            <PendingRegistrations roleBadge={roleBadge} />
          </div>
        )}

        {activeTab === "manual" && (
          <div className={styles.tabPane}>
            <ManualVisitorEntry
              onSuccess={handleManualSuccess}
              onClose={() => setActiveTab("pending")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
