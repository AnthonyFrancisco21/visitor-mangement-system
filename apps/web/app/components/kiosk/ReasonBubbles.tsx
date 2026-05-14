"use client";

import React from 'react';
import styles from './ReasonBubbles.module.css';

interface Reason {
  id: string;
  label: string;
}

const REASONS: Reason[] = [
  { id: 'meeting', label: 'Business Meeting / Client Meeting' },
  { id: 'interview', label: 'Interview / Candidate' },
  { id: 'vendor', label: 'Vendor / Contractor / Service' },
  { id: 'delivery', label: 'Delivery / Courier' },
  { id: 'personal', label: 'Personal Guest / Visitor' },
  { id: 'event', label: 'Event / Training' },
];

interface ReasonBubblesProps {
  selectedReason: string;
  onSelect: (reason: string) => void;
}

export const ReasonBubbles: React.FC<ReasonBubblesProps> = ({ selectedReason, onSelect }) => {
  return (
    <div className={styles.container}>
      <div className={styles.bubbleGrid}>
        {REASONS.map((reason) => {
          const isSelected = selectedReason === reason.label;
          return (
            <button
              key={reason.id}
              type="button"
              onClick={() => onSelect(reason.label)}
              className={`${styles.bubble} ${isSelected ? styles.selected : ''}`}
            >
              <span className={styles.label}>{reason.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
