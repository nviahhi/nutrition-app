import React from 'react';
import { LiferayUser } from '../types';

interface PatientSelectorProps {
  patients: LiferayUser[];
  onSelect: (patientId: number) => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({ patients, onSelect }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (id) onSelect(id);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ marginRight: '10px', fontWeight: 'bold' }}>👤 Patient:</label>
      <select onChange={handleChange} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}>
        <option value="">-- Choose patient --</option>
        {patients.map(p => (
          <option key={p.id} value={p.id}>{p.name || `Пациент ${p.id}`}</option>
        ))}
      </select>
    </div>
  );
};