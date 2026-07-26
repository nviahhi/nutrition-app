import React from 'react';

type ReviewerType = 'human' | 'ai';

interface ReviewerSelectorProps {
  selected: ReviewerType;
  onChange: (type: ReviewerType) => void;
}

export const ReviewerSelector: React.FC<ReviewerSelectorProps> = ({ selected, onChange }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      lineHeight: '2',
      alignItems: 'start',
      padding: '8px 16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '16px',
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Who gives the rating:</span>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
        <input
          type="radio"
          name="reviewer"
          value="human"
          checked={selected === 'human'}
          onChange={() => onChange('human')}
        />
        👨‍⚕️ Nutritionist
      </label>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
        <input
          type="radio"
          name="reviewer"
          value="ai"
          checked={selected === 'ai'}
          onChange={() => onChange('ai')}
        />
        AI
      </label>
    </div>
  );
};