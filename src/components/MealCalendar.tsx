import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventDropArg, EventClickArg } from '@fullcalendar/core';
import { createMealEntry, updateMealEntry, deleteMealEntry, saveReview, getCurrentUserFromThemeDisplay } from '../api';
import { MealEntry, Review } from '../types';
import { ReviewModal } from './ReviewModal';
import { PatientMealModal } from './PatientMealModal';
import { AddMealModal } from './AddMealModal';
import { getStatusKey } from '../utils/statusUtils';

interface MealCalendarProps {
  patientId: number;
  currentUserRole: 'Patient' | 'Nutritionist';
  entries: MealEntry[];
  reviews: Record<number, Review>;
  onEntryAdd: (entry: MealEntry) => void;
  onEntryUpdate: (entry: MealEntry) => void;
  onEntryDelete: (entryId: number) => void;  
  onReviewUpdate: (review: Review) => void;
}

export const MealCalendar: React.FC<MealCalendarProps> = ({ patientId, currentUserRole, entries, reviews, onEntryAdd, onEntryUpdate, onEntryDelete, onReviewUpdate  }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [currentEventStatus, setCurrentEventStatus] = useState<string | null>(null);
  const [doctorComment, setDoctorComment] = useState<string | null>(null);
  const [patientComment, setPatientComment] = useState<string | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedMealEntry, setSelectedMealEntry] = useState<MealEntry | null>(null);  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<DateSelectArg | null>(null);  

  const handleSelect = (selectInfo: DateSelectArg) => {
    if (currentUserRole !== 'Patient') return;

    const patientIdNumber = Number(patientId);
    if (isNaN(patientIdNumber) || patientIdNumber <= 0) {
      console.error('Invalid patientId:', patientId);
      return;
    }

    setSelectedSlotInfo(selectInfo);
    setIsAddModalOpen(true);
  };

  const handleAddMeal = async (ingredients: string, comment: string) => {
    if (!selectedSlotInfo) return;

    const patientIdNumber = Number(patientId);
    if (isNaN(patientIdNumber) || patientIdNumber <= 0) {
      console.error('Invalid patientId:', patientId);
      return;
    }

    const newEntry: Omit<MealEntry, 'id' | 'createdDate'> = {
      dateTime: selectedSlotInfo.start.toISOString(),
      ingredients: ingredients || 'Not defined',
      comment: comment || '',
      r_patientId_userId: patientIdNumber,
    };

    try {
      const created = await createMealEntry(newEntry);
      if (created.id) {
        onEntryAdd(created);
        setIsAddModalOpen(false);
        setSelectedSlotInfo(null);
      }
    } catch (error) {
      console.error('Failed to create meal entry:', error);
      alert('Error');
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedMealEntry?.id) return;

    try {
      await deleteMealEntry(selectedMealEntry.id);
      onEntryDelete(selectedMealEntry.id);
      setIsPatientModalOpen(false);
      setSelectedMealEntry(null);
    } catch (error) {
      console.error('Failed to delete meal entry:', error);
      alert('Ошибка при удалении записи');
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    if (!event.start) return;
    const updated = {
      dateTime: event.start.toISOString(),
    };
    try {
      const result = await updateMealEntry(Number(event.id), updated);
      if (result) {
        onEntryUpdate(result);
      }
    } catch (error) {
      console.error('Failed to update meal entry:', error);
      alert('Ошибка при обновлении времени');
      dropInfo.revert();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
    setDoctorComment('');
  }; 

const handleEventClick = (clickInfo: EventClickArg) => {
  const eventId = Number(clickInfo.event.id);
  const review = reviews[eventId];
  const entry = entries.find(e => e.id === eventId);
  
  const status = review ? getStatusKey(review.mealStatus) : null;
  const doctorComment = review?.comment || '';
  const patientComment = entry?.comment || '';

  setSelectedEventTitle(clickInfo.event.title);
  setCurrentEventStatus(status);
  setDoctorComment(doctorComment);

  if (currentUserRole === 'Nutritionist') {
    setSelectedEventId(eventId);
    setPatientComment(patientComment);
    setIsModalOpen(true);
  } else {
    if (entry) {
      setSelectedMealEntry(entry);
      setIsPatientModalOpen(true);
    }
  }
};

const handlePatientSave = async (newIngredients: string, newComment: string) => {
  if (!selectedMealEntry) return;
  try {
    const updated = await updateMealEntry(selectedMealEntry.id!, {
      ingredients: newIngredients,
      comment: newComment
    });

    if (updated) {
      onEntryUpdate(updated);
      setIsPatientModalOpen(false);
      setSelectedMealEntry(null);
    }
  } catch (error) {
    console.error('Failed to update meal entry:', error);
    alert('Error');
  }
};

const handleSaveReview = async (status: 'good' | 'attention', comment: string) => {
  if (!selectedEventId) return;
  const currentUser = getCurrentUserFromThemeDisplay();
  if (!currentUser) {
    alert('Ошибка: пользователь не авторизован');
    return;
  }

  const currentReview = reviews[selectedEventId];

  const review: Omit<Review, 'createdDate'> = {
    id: currentReview?.id,
    r_mealEntryId_c_mealEntryId: selectedEventId,
    r_nutritionistId_userId: Number(currentUser.userId),
    mealStatus: status,
    comment: comment
  };

  try {
    const saved = await saveReview(review);
    if (saved.r_mealEntryId_c_mealEntryId) {
      onReviewUpdate(saved);
      setIsModalOpen(false);
      setSelectedEventId(null);
      setDoctorComment('');
    }
  } catch (error) {
    console.error('Failed to save review:', error);
    alert('Error');
  }
};

const getEventColor = (eventId: number): string => {
  const review = reviews[eventId];
  if (!review) return '#3174ad';

  const status = typeof review.mealStatus === 'object' 
  ? review.mealStatus?.key 
  : review.mealStatus;
  
  if (status === 'good') return '#28a745';
  if (status === 'attention') return '#ffc107';
  return '#3174ad';
};
  
const calendarEvents = useMemo(() => {
  return entries
    .filter((entry): entry is MealEntry & { id: number } => entry.id != null)
    .map(entry => ({
      id: String(entry.id),
      title: entry.ingredients,
      start: new Date(entry.dateTime),
      end: new Date(entry.dateTime),
      color: getEventColor(entry.id),
      extendedProps: entry,
    }));
}, [entries, reviews]);

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

return (
  <>
    {currentUserRole === 'Patient' && (
      <PatientMealModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setSelectedMealEntry(null);
        }}
        onSave={handlePatientSave}
        onDelete={handleDeleteEntry} 
        mealTitle={selectedEventTitle}
        ingredients={selectedMealEntry?.ingredients || ''}
        comment={selectedMealEntry?.comment || ''} 
        doctorComment={doctorComment}
        status={currentEventStatus}
        isNew={!selectedMealEntry?.id}
      />
    )}
    {currentUserRole === 'Patient' && (
      <AddMealModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedSlotInfo(null);
        }}
        onSave={handleAddMeal}
      />
    )}       
    {currentUserRole === 'Nutritionist' && (
      <ReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveReview}
        currentStatus={currentEventStatus}
        currentComment={doctorComment}
        patientComment={patientComment}
        mealTitle={selectedEventTitle}
      />
    )}    
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      firstDay={1}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      events={calendarEvents}
      editable={currentUserRole === 'Patient'}
      selectable={currentUserRole === 'Patient'}
      select={handleSelect}
      selectConstraint={{
        start: '2024-01-01', 
        end: tomorrowStr
      }}        
      eventDrop={handleEventDrop}
      eventClick={handleEventClick}
      slotMinTime="06:00:00"
      slotMaxTime="24:00:00"
      allDaySlot={false}
      height="auto"
      locale="en"
      buttonText={{
        today: 'Today',
        month: 'Month',
        week: 'Week',
        day: 'Day'
      }}
      timeZone="local"
    />
  </>
  );
};