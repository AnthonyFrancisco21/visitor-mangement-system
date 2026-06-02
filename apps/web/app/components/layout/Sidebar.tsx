"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: "ADMIN" | "RECEPTIONIST";
  userName?: string;
}

// ─── Simplified Minimal Icons ────────────────────────────────────────────────

const Icons = {
  Dashboard: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  Registration: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Kiosk: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Destination: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  TimeOut: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Reports: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Accounts: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  Analytics: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  RFID: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h10" />
      <path d="M7 14h4" />
    </svg>
  ),
  Logout: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const NAV_ITEMS = {
  ADMIN: [
    { label: "Live Dashboard", href: "/admin", icon: <Icons.Dashboard /> },
    {
      label: "Registration",
      href: "/admin/registration",
      icon: <Icons.Registration />,
    },
    {
      label: "Visitor List",
      href: "/admin/visitor-list",
      icon: <Icons.Reports />,
    },
    {
      label: "Destination",
      href: "/admin/destinations",
      icon: <Icons.Destination />,
    },
    { label: "RFID Inventory", href: "/admin/rfid", icon: <Icons.RFID /> },
    {
      label: "Visitor's time out",
      href: "/admin/checkout",
      icon: <Icons.TimeOut />,
    },
    {
      label: "Accounts Management",
      href: "/admin/accounts",
      icon: <Icons.Accounts />,
    },
    { label: "Analytics", href: "/admin/analytics", icon: <Icons.Analytics /> },
  ],
  RECEPTIONIST: [
    {
      label: "Live Dashboard",
      href: "/receptionist",
      icon: <Icons.Dashboard />,
    },
    {
      label: "Registration",
      href: "/receptionist/registration",
      icon: <Icons.Registration />,
    },
    {
      label: "Visitor List",
      href: "/receptionist/visitor-list",
      icon: <Icons.Reports />,
    },
    {
      label: "Destination",
      href: "/receptionist/destinations",
      icon: <Icons.Destination />,
    },
    {
      label: "RFID Inventory",
      href: "/receptionist/rfid",
      icon: <Icons.RFID />,
    },
    {
      label: "Visitor's Time out",
      href: "/receptionist/checkout",
      icon: <Icons.TimeOut />,
    },
  ],
};

export default function Sidebar({
  isOpen,
  onClose,
  role,
  userName = "User",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS[role] || [];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <div className={styles.logoIconInner} />
          </div>
          <span className={styles.logoText}>SGW-VMS</span>
        </div>

        <nav className={styles.nav}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.activeItem : ""}`}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>
                {role === "ADMIN" ? "Admin" : "Receptionist"}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <Icons.Logout />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
