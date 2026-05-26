'use client';

import { useState, useEffect, useRef } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';
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

  // New Card Registration State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [scannedUid, setScannedUid] = useState('');
  const [cardLabel, setCardLabel] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [cardToDelete, setCardToDelete] = useState<RfidCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Auto-focus input for scanner when modal opens
  useEffect(() => {
    if (isRegisterModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRegisterModalOpen]);

  const handleRegisterCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedUid) return;

    setIsRegistering(true);
    try {
      const res = await fetch('/api/rfid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: scannedUid, label: cardLabel }),
      });

      if (res.ok) {
        setIsRegisterModalOpen(false);
        setScannedUid('');
        setCardLabel('');
        fetchCards();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to register card');
      }
    } catch (error) {
      console.error('Error registering card:', error);
      alert('An error occurred during registration');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleContainerClick = () => {
    if (inputRef.current && !scannedUid) {
      inputRef.current.focus();
    }
  };

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

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/rfid/${cardToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCardToDelete(null);
        fetchCards();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete card');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('An error occurred while deleting card');
    } finally {
      setIsDeleting(false);
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
      <div className={styles.headerActions}>
        <div className={styles.header}>
          <h1 className={styles.title}>RFID Inventory</h1>
          <p className={styles.subtitle}>Track and manage physical visitor cards.</p>
        </div>
        <button 
          className={styles.registerBtn}
          onClick={() => {
            setIsRegisterModalOpen(true);
            setScannedUid('');
            setCardLabel('');
          }}
        >
          Register New Card
        </button>
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
                  <>
                    <button 
                      className={styles.lostBtn}
                      onClick={() => handleStatusUpdate(card.id, 'LOST')}
                    >
                      Mark as Lost
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => setCardToDelete(card)}
                    >
                      Delete
                    </button>
                  </>
                )}
                {card.status === 'LOST' && (
                  <>
                    <button 
                      className={styles.availableBtn}
                      onClick={() => handleStatusUpdate(card.id, 'AVAILABLE')}
                    >
                      Found / Set Available
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => setCardToDelete(card)}
                    >
                      Delete
                    </button>
                  </>
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

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRegisterModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Register New Card</h2>
            <p className={styles.modalSubtitle}>Tap a new RFID card on the reader to register it.</p>
            
            <form onSubmit={handleRegisterCard}>
              <div className={styles.listeningBox} onClick={handleContainerClick}>
                {!scannedUid ? (
                  <>
                    <div className={styles.listeningIcon}>📡</div>
                    <span className={styles.listeningText}>Listening for card tap...</span>
                  </>
                ) : (
                  <>
                    <div className={styles.listeningIcon} style={{ animation: 'none' }}>✅</div>
                    <span className={styles.listeningText}>Card Read Successfully</span>
                  </>
                )}
                
                {/* Hidden input to catch scanner keystrokes */}
                <input 
                  type="text" 
                  ref={inputRef}
                  value={scannedUid}
                  onChange={(e) => setScannedUid(e.target.value)}
                  autoFocus
                />
              </div>

              {scannedUid && (
                <>
                  <div className={styles.formGroup}>
                    <label>Card UID</label>
                    <input type="text" value={scannedUid} readOnly />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Card Label (Optional)</label>
                    <input 
                      type="text" 
                      value={cardLabel}
                      onChange={(e) => setCardLabel(e.target.value)}
                      placeholder="e.g. VISITOR NO. 11" 
                    />
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setIsRegisterModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={!scannedUid || isRegistering}
                >
                  {isRegistering ? 'Registering...' : 'Register Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!cardToDelete}
        title="Delete RFID Card"
        message={
          <>
            Are you sure you want to delete the card{" "}
            <strong>{cardToDelete?.label || cardToDelete?.uid}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete Card"
        cancelLabel="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteCard}
        onCancel={() => setCardToDelete(null)}
      />
    </div>
  );
}
