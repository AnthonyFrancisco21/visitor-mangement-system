"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
  Mail,
  Key,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import styles from "./AccountsDashboard.module.css";

type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "RECEPTIONIST";
  isActive: boolean;
  createdAt: string;
};

interface AccountsDashboardProps {
  currentUserId: string;
  initialUsers: UserAccount[];
}

export default function AccountsDashboard({
  currentUserId,
  initialUsers,
}: AccountsDashboardProps) {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [modalError, setModalError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/accounts");
      if (!res.ok) {
        console.error("Failed to load accounts");
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(""), 4000);
  };

  const openModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setModalError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setModalError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!name.trim() || !email.trim() || !password.trim()) {
      setModalError("Name, email, and password are required.");
      return;
    }

    if (password.length < 8) {
      setModalError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setModalError("");

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || "Unable to create account.");
        return;
      }

      showSuccess("Receptionist account created successfully.");
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error creating account:", error);
      setModalError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUser = users.find((item) => item.id === currentUserId);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>Admin</div>
          <h1 className={styles.title}>Accounts Management</h1>
          <p className={styles.desc}>
            View your own admin account and manage receptionist staff accounts.
            Only receptionist accounts may be registered from this page.
          </p>
        </div>

        <div className={styles.actionsRow}>
          <button
            onClick={fetchUsers}
            className={styles.refreshBtn}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? styles.spin : ""} />
            Refresh
          </button>
          <button onClick={openModal} className={styles.addBtn}>
            <Plus size={16} /> Register New Receptionist
          </button>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successAlert}>{successMessage}</div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Staff Accounts</h2>
          <span className={styles.subtleText}>
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>

        {isLoading && users.length === 0 ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spin} />
            <p>Loading account list...</p>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <ShieldCheck size={48} className={styles.emptyIcon} />
            <h3>No accounts found</h3>
            <p>Create the first receptionist account to get started.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.avatar}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong className={styles.userName}>{user.name}</strong>
                        {user.id === currentUserId && (
                          <span className={styles.currentBadge}>You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={styles.emailCell}>{user.email}</td>
                  <td>
                    <span
                      className={
                        user.role === "ADMIN"
                          ? styles.roleAdmin
                          : styles.roleReceptionist
                      }
                    >
                      {user.role === "ADMIN" ? "Admin" : "Receptionist"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${user.isActive ? styles.statusActive : styles.statusInactive}`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3>Create Receptionist Account</h3>
                <p className={styles.modalSubtitle}>
                  An email and password are required. The new account will be
                  created as Receptionist.
                </p>
              </div>
              <button
                className={styles.closeBtn}
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className={styles.modalBody} onSubmit={handleSubmit}>
              {modalError && (
                <div className={styles.errorAlert}>
                  <AlertTriangle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Doe"
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="receptionist@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={closeModal}
                  className={styles.cancelBtn}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className={styles.spin} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
