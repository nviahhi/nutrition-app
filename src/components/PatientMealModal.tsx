import React, { useState, useEffect  } from 'react';

interface PatientMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ingredients: string, comment: string) => void;
  onDelete: () => void;
  mealTitle: string;
  ingredients: string;
  comment?: string | null;
  doctorComment?: string | null;
  status?: string | null;
  isNew?: boolean;
}

export const PatientMealModal: React.FC<PatientMealModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  ingredients: initialIngredients,
  comment: initialComment,
  doctorComment,
  status,
  isNew = false
}) => {
  const [ingredients, setIngredients] = useState(initialIngredients || '');
  const [comment, setComment] = useState(initialComment || '');

  useEffect(() => {
    if (isOpen) {
      setIngredients(initialIngredients || '');
      setComment(initialComment || '');
    }
  }, [isOpen, initialIngredients, initialComment]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(ingredients, comment);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete entry?')) {
      onDelete();
      onClose();
    }
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
        <h3 style={{ marginTop: 0 }}>🍽️ Edit meal</h3>

        <div style={{ marginBottom: '16px' }}>
          <textarea
            value={ingredients} 
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="For example - soup"
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

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            💬 Comment or question (optional):
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="For example: What are some good alternatives to the soup?"
            rows={2}
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

        {doctorComment && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            borderLeft: '4px solid #ffc107',
          }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              💬 Nutritionist comments:
            </label>
            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>{doctorComment}</p>
          </div>
        )}

        {status && (
          <div style={{
            marginBottom: '16px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: status === 'good' ? '#d4edda' : '#fff3cd',
            color: status === 'good' ? '#155724' : '#856404',
            fontSize: '14px',
          }}>
            Rate: <strong>{status === 'good' ? '✅ Good' : '⚠️ Attention'}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {!isNew && (
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: 'auto',
              }}
            >
              🗑️ Delete
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};