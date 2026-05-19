"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Building2, 
  AlertCircle, 
  X,
  RefreshCw
} from "lucide-react";
import styles from "./DestinationsDashboard.module.css";

type Destination = {
  id: string;
  name: string;
  floor: string;
  headName: string;
  description: string | null;
  isActive: boolean;
};

interface DestinationsDashboardProps {
  roleBadge: string;
}

export default function DestinationsDashboard({ roleBadge }: DestinationsDashboardProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [modalError, setModalError] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [headName, setHeadName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchDestinations = async () => {
    setIsLoading(true);
    try {
      // Admin/receptionist management page should see all destinations (both active and soft-deleted)
      const res = await fetch("/api/destinations?all=true");
      if (res.ok) {
        const data = await res.json();
        setDestinations(data);
      } else {
        console.error("Failed to fetch destinations");
      }
    } catch (error) {
      console.error("Error fetching destinations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  const handleOpenAdd = () => {
    setEditingDestination(null);
    setName("");
    setFloor("");
    setHeadName("");
    setDescription("");
    setIsActive(true);
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dest: Destination) => {
    setEditingDestination(dest);
    setName(dest.name);
    setFloor(dest.floor);
    setHeadName(dest.headName);
    setDescription(dest.description || "");
    setIsActive(dest.isActive);
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim() || !floor.trim() || !headName.trim()) {
      setModalError("Please fill out all required fields (Name, Floor, Host).");
      return;
    }

    setIsSubmitting(true);
    setModalError("");

    const payload = {
      name: name.trim(),
      floor: floor.trim(),
      headName: headName.trim(),
      description: description.trim() || null,
      isActive,
    };

    try {
      let res;
      if (editingDestination) {
        res = await fetch("/api/destinations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDestination.id,
            ...payload,
          }),
        });
      } else {
        res = await fetch("/api/destinations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (res.ok) {
        showSuccess(
          editingDestination 
            ? "Destination updated successfully." 
            : "Destination created successfully."
        );
        setIsModalOpen(false);
        fetchDestinations();
      } else {
        setModalError(data.error || "Failed to save destination.");
      }
    } catch (err) {
      console.error("Error saving destination:", err);
      setModalError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, destName: string) => {
    if (!confirm(`Are you sure you want to delete "${destName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/destinations?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess(data.message || "Destination deleted successfully.");
        fetchDestinations();
      } else {
        alert(data.error || "Failed to delete destination.");
      }
    } catch (err) {
      console.error("Error deleting destination:", err);
      alert("An unexpected error occurred while deleting.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>{roleBadge}</div>
          <h1 className={styles.title}>Destinations</h1>
          <p className={styles.desc}>
            Manage rooms, departments, offices, and hosts available for kiosks and registrations.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={fetchDestinations} className={styles.editBtn} style={{ padding: "0.65rem 1rem" }} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? styles.spin : ""} />
          </button>
          <button onClick={handleOpenAdd} className={styles.addBtn}>
            <Plus size={18} /> Add Destination
          </button>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successAlert}>
          {successMessage}
        </div>
      )}

      {/* Main Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Building Locations Directory</h2>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spin} />
            <p>Loading destinations log...</p>
          </div>
        ) : destinations.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} className={styles.emptyIcon} />
            <h3>No Destinations Configured</h3>
            <p>Get started by adding the first room or office location.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Department / Room Name</th>
                <th>Floor</th>
                <th>Host Person</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((dest) => (
                <tr key={dest.id} className={styles.tableRow}>
                  <td>
                    <strong className={styles.destName}>{dest.name}</strong>
                  </td>
                  <td>
                    <span className={styles.floorTag}>Lvl {dest.floor}</span>
                  </td>
                  <td>{dest.headName}</td>
                  <td style={{ color: "#64748b", fontSize: "0.88rem" }}>
                    {dest.description || "—"}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${dest.isActive ? styles.statusActive : styles.statusInactive}`}>
                      {dest.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsContainer}>
                      <button onClick={() => handleOpenEdit(dest)} className={styles.editBtn}>
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(dest.id, dest.name)} className={styles.deleteBtn}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Dialog Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3>{editingDestination ? "Modify Destination" : "New Destination"}</h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                {modalError && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="dest-name">Location / Department Name *</label>
                  <input
                    id="dest-name"
                    type="text"
                    placeholder="e.g. Finance & Accounting"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dest-floor">Floor / Level *</label>
                  <input
                    id="dest-floor"
                    type="text"
                    placeholder="e.g. 3, Penthouse, G/F"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dest-head">Host Name *</label>
                  <input
                    id="dest-head"
                    type="text"
                    placeholder="e.g. Jose Reyes"
                    value={headName}
                    onChange={(e) => setHeadName(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dest-desc">Optional Details</label>
                  <input
                    id="dest-desc"
                    type="text"
                    placeholder="e.g. Room 302, Left Wing"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={styles.input}
                  />
                </div>

                {editingDestination && (
                  <label className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active (Display on Registration forms)</span>
                  </label>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 size={14} className={styles.spin} />}
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
