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

  // Manual entry is now self-contained (creates ACTIVE visit directly).
  // No need to switch to pending tab or refresh it after manual success.
  const handleManualSuccess = () => {
    // Stay on manual tab — visitor is already checked in.
    // The entry wizard resets itself automatically.
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
