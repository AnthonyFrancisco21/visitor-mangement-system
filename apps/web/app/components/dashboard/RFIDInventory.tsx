'use client';

import { useState, useEffect } from 'react';
import styles from './RFIDInventory.module.css';

type RfidCard = {
  id: string;
  uid: string;
  label: string | null;
  status: 'AVAILABLE' | 'IN_USE' | 'LOST' | 'RETIRED';
  updatedAt: string;
};

export default function RFIDInventory() {
  const [cards, setCards] = useState<RfidCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/rfid');
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Failed to fetch RFID cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/rfid/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh the list
        fetchCards();
      } else {
        alert('Failed to update card status');
      }
    } catch (error) {
      console.error('Error updating card status:', error);
      alert('An error occurred while updating card status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return styles.statusAvailable;
      case 'IN_USE': return styles.statusInUse;
      case 'LOST': return styles.statusLost;
      case 'RETIRED': return styles.statusRetired;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>RFID Inventory</h1>
        <p className={styles.subtitle}>Track and manage physical visitor cards.</p>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading inventory...</div>
      ) : (
        <div className={styles.grid}>
          {cards.map((card) => (
            <div key={card.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>{card.label || 'Unnamed Card'}</span>
                <span className={`${styles.statusBadge} ${getStatusColor(card.status)}`}>
                  {card.status.replace('_', ' ')}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>UID:</span>
                  <span className={styles.infoValue}>{card.uid}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Last Updated:</span>
                  <span className={styles.infoValue}>
                    {new Date(card.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                {card.status === 'AVAILABLE' && (
                  <button 
                    className={styles.lostBtn}
                    onClick={() => handleStatusUpdate(card.id, 'LOST')}
                  >
                    Mark as Lost
                  </button>
                )}
                {card.status === 'LOST' && (
                  <button 
                    className={styles.availableBtn}
                    onClick={() => handleStatusUpdate(card.id, 'AVAILABLE')}
                  >
                    Found / Set Available
                  </button>
                )}
                {card.status === 'IN_USE' && (
                  <span className={styles.actionNote}>Card currently with visitor</span>
                )}
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <div className={styles.empty}>No RFID cards found in the system.</div>
          )}
        </div>
      )}
    </div>
  );
}
