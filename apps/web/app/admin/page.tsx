import styles from './admin.module.css';

export const metadata = {
  title: 'Admin Dashboard — VisitorPass',
};

export default function AdminPage() {
  return (
    <main className={styles.placeholder}>
      <div className={styles.content}>
        <div className={styles.badge}>Admin</div>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.desc}>
          Reports, analytics, system management, and full visitor oversight
          will live here. Coming soon.
        </p>
      </div>
    </main>
  );
}
