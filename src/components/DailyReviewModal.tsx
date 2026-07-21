import React, { useState, useEffect } from 'react';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (status: 'good' | 'attention', comment: string) => void;
  currentStatus: string | null;
  currentComment: string;
  date: string;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentStatus,
  currentComment,
  date,
}) => {
  const [comment, setComment] = useState(currentComment);

  useEffect(() => {
    if (isOpen) {
      setComment(currentComment || '');
    }
  }, [isOpen, currentComment]);

  if (!isOpen) return null;

  const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <h3 style={{ marginTop: 0 }}>📅 {formattedDate}</h3>
        
        <p style={{ marginBottom: '16px', color: '#888' }}>
          Current status: <strong>{currentStatus || 'not defined'}</strong>
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            Comment:
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comment..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => onSave('good', comment)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✅ Good day
          </button>
          <button
            onClick={() => onSave('attention', comment)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ⚠️ Attention
          </button>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};