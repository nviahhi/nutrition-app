import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { MealCalendar } from './components/MealCalendar';
import { PatientSelector } from './components/PatientSelector';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { getCurrentUserWithRole, getPatients, getMealEntries, getReviews } from './api';
import { LiferayUser, MealEntry, Review } from './types';
import './styles.css';


const AppContent: React.FC<{
  userId: number;
  userRole: 'Patient' | 'Nutritionist';
  userName: string;  
  }> = ({ userId, userRole, userName }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    userRole === 'Patient' ? userId : null
  );
  const [patients, setPatients] = useState<LiferayUser[]>([]);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Record<number, Review>>({});

  const addEntries = useCallback((newEntry: MealEntry) => {
    setEntries(prev => [...prev, newEntry]);
  }, []);

  const updateEntries = useCallback((updatedEntry: MealEntry) => {
    setEntries(prev => prev.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    ));
  }, []);

  const updateReviewsMap = useCallback((newReview: Review) => {
    setReviewsMap(prev => ({
      ...prev,
      [newReview.r_mealEntryId_c_mealEntryId]: newReview,
    }));
  }, []);  

  const loadData = useCallback(async (patientId: number) => {
    if (!patientId) return;
    
    try {
      const entriesData = await getMealEntries(patientId);
      setEntries(entriesData);

      const reviewsData = await getReviews();
      const reviewMap: Record<number, Review> = {};
      reviewsData.forEach((r) => {
        const entryId = r.r_mealEntryId_c_mealEntryId;
        if (entryId) {
          reviewMap[entryId] = r;
        }
      });
      setReviewsMap(reviewMap);

    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    const targetPatientId = userRole === 'Patient' ? userId : selectedPatientId;
    if (targetPatientId) {
      loadData(targetPatientId);
    } else {
      setEntries([]);
      setReviewsMap({});
    }
  }, [userId, userRole, selectedPatientId, loadData]);

  useEffect(() => {
    if (userRole === 'Nutritionist') {
      getPatients().then(setPatients);
    }
  }, [userRole]);

  if (userRole === 'Nutritionist') {
    return (
      <div style={{ padding: '20px' }}>
        <h1>👩‍⚕️ Nutritionist panel</h1>
        <p>Hello, <strong>{userName}</strong></p>
        <PatientSelector patients={patients} onSelect={setSelectedPatientId} />
        {selectedPatientId && (
          <>
            <MealCalendar patientId={selectedPatientId} entries={entries} reviews={reviewsMap} onEntryAdd={addEntries} onEntryUpdate={updateEntries} onReviewUpdate={updateReviewsMap} currentUserRole="Nutritionist" />
            <AnalyticsDashboard entries={entries} reviews={reviewsMap}/>
          </>
        )}
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>🥗 My Meal Calendar</h1>
      <p>Hello, <strong>{userName}</strong>!</p>
      <MealCalendar patientId={userId} entries={entries} reviews={reviewsMap} onEntryAdd={addEntries} onEntryUpdate={updateEntries} onReviewUpdate={updateReviewsMap} currentUserRole="Patient" />
      <AnalyticsDashboard entries={entries} reviews={reviewsMap} />
    </div>
  );
};

class NutritionAppWidget extends HTMLElement {
  private root: ReturnType<typeof createRoot> | null = null;

  async connectedCallback() {
    try {
      const result = await getCurrentUserWithRole();

      if (!result) {
        this.innerHTML = `
          <div style="padding: 20px; color: #721c24; background: #f8d7da; border-radius: 4px;">
            <strong>Ошибка авторизации:</strong> Пожалуйста, войдите в портал Liferay.
          </div>
        `;
        return;
      }

      const { user, role } = result;

      if (!user || !role) {
        this.innerHTML = `
          <div style="padding: 20px; color: #856404; background: #fff3cd; border-radius: 4px;">
            <strong>Внимание:</strong> Не удалось определить роль пользователя. Обратитесь к администратору.
          </div>
        `;
        return;
      }

      this.root = createRoot(this);
      this.root.render(
        <AppContent
          userId={user.id}
          userRole={role}
          userName={result.user.name}
        />
      );
    } catch (error) {
      console.error('[NutritionAppWidget] Error:', error);
      this.innerHTML = `
        <div style="padding: 20px; color: #721c24; background: #f8d7da; border-radius: 4px;">
          <strong>Ошибка:</strong> ${error instanceof Error ? error.message : 'Неизвестная ошибка'}
        </div>
      `;
    }
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
    }
  }
}

const ELEMENT_NAME = 'my-nutrition-app';

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, NutritionAppWidget);
}

export default NutritionAppWidget;