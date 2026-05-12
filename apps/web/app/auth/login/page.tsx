'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

// ─── Icons (inline SVG, no extra dependency) ──────────────────────────────────

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: { success?: boolean; role?: string; error?: string } = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Login failed. Please try again.');
        return;
      }

      // Role-based redirect
      if (data.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/receptionist');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      {/* ── Left decorative panel ── */}
      <aside className={styles.leftPanel} aria-hidden="true">
        <div className={styles.blob + ' ' + styles.blob1} />
        <div className={styles.blob + ' ' + styles.blob2} />
        <div className={styles.blob + ' ' + styles.blob3} />
        <div className={styles.gridOverlay} />

        <div className={styles.leftTop}>
          <div className={styles.brandMark}>
            <div className={styles.brandIcon}>
              <div className={styles.brandIconInner} />
            </div>
            <span className={styles.brandName}>VisitorPass</span>
          </div>
        </div>

        <div className={styles.leftCenter}>
          <h2 className={styles.tagline}>
            Smart access.<br />
            <span className={styles.taglineAccent}>Total control.</span>
          </h2>
          <p className={styles.taglineDesc}>
            Manage visitor registrations, RFID check-ins, and real-time
            building access — all from one unified dashboard.
          </p>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>30+</div>
            <div className={styles.statLabel}>RFID Cards</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>Live</div>
            <div className={styles.statLabel}>Tracking</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>24/7</div>
            <div className={styles.statLabel}>Records</div>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <section className={styles.rightPanel}>
        <div className={styles.formWrapper}>

          {/* Header */}
          <header className={styles.formHeader}>
            {/* Visible on mobile only */}
            <div className={styles.mobileBrand}>
              <div className={styles.mobileBrandIcon}>
                <div className={styles.mobileBrandIconInner} />
              </div>
              <span className={styles.mobileBrandName}>VisitorPass</span>
            </div>

            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSubtitle}>Sign in to your staff account to continue</p>
          </header>

          {/* Error */}
          {error && (
            <div className={styles.errorBox} role="alert">
              <span className={styles.errorIcon}><AlertIcon /></span>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldset}>

              {/* Email */}
              <div className={styles.field}>
                <label htmlFor={emailId} className={styles.label}>Email address</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><MailIcon /></span>
                  <input
                    id={emailId}
                    type="email"
                    className={styles.input}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className={styles.field}>
                <label htmlFor={passwordId} className={styles.label}>Password</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><LockIcon /></span>
                  <input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          {/* Divider + role hint */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>Access levels</span>
            <div className={styles.dividerLine} />
          </div>

          <div className={styles.roleChips} aria-label="Access level descriptions">
            <div className={styles.roleChip}>
              <div className={styles.roleChipIcon}>👤</div>
              <span className={styles.roleChipLabel}>Receptionist</span>
            </div>
            <div className={styles.roleChip}>
              <div className={styles.roleChipIcon}>🛡️</div>
              <span className={styles.roleChipLabel}>Admin</span>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.trustedBadge}>
            <span className={styles.trustedDot} />
            Secured with encrypted sessions
          </div>
        </div>
      </section>
    </main>
  );
}
