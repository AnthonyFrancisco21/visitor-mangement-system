import styles from './receptionist.module.css';

export const metadata = {
  title: 'Receptionist — VisitorPass',
};

export default function ReceptionistPage() {
  return (
    <div className={styles.content}>
      <div className={styles.badge}>Receptionist</div>
      <h1 className={styles.title}>Receptionist Dashboard</h1>
      <p className={styles.desc}>
        Visitor registrations, RFID check-ins, live dashboard, and
        checkout management will live here. Coming soon.
      </p>
    </div>
  );
}
