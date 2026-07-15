import React, { useState, useEffect } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (status: 'good' | 'attention', comment: string) => void;
  currentStatus: string | null;
  currentComment?: string | null;
  patientComment?: string | null;
  mealTitle: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentStatus,
  currentComment,
  patientComment,
  mealTitle,
}) => {

  const [comment, setComment] = useState(currentComment || '');

  useEffect(() => {
    if (isOpen) {
      setComment(currentComment || '');
    }
  }, [isOpen, currentComment]);  

  if (!isOpen) return null;

  const handleSave = (status: 'good' | 'attention') => {
    onSave(status, comment);
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };  

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
        <h3 style={{ marginTop: 0 }}>🍽️ Rate meal entry</h3>
        <p style={{ marginBottom: '8px', color: '#555' }}>
          <strong>{mealTitle}</strong>
        </p>

        {patientComment && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            borderLeft: '4px solid #1976d2',
          }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              💬 Patient comment or question:
            </label>
            <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{patientComment}</p>
          </div>
        )}

        <p style={{ marginBottom: '16px', color: '#888', fontSize: '14px' }}>
          Rate: <strong>{currentStatus || 'not rated'}</strong>
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            Comment (optional):
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comment"
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
            onClick={() => handleSave('good')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentStatus === 'good' ? '#28a745' : '#e9ecef',
              color: currentStatus === 'good' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
          >
            ✅ Good
          </button>
          <button
            onClick={() => handleSave('attention')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentStatus === 'attention' ? '#ffc107' : '#e9ecef',
              color: currentStatus === 'attention' ? 'black' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
          >
            ⚠️ Attention
          </button>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '6px 16px',
              backgroundColor: 'transparent',
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