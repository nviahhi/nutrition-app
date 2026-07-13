import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventDropArg, EventClickArg } from '@fullcalendar/core';
import { createMealEntry, updateMealEntry, saveReview, getCurrentUserFromThemeDisplay } from '../api';
import { MealEntry, Review, CalendarEvent } from '../types';
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
  onReviewUpdate: (review: Review) => void;
}

export const MealCalendar: React.FC<MealCalendarProps> = ({ patientId, currentUserRole, entries, reviews, onEntryAdd, onReviewUpdate  }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [currentEventStatus, setCurrentEventStatus] = useState<string | null>(null);
  const [currentComment, setCurrentComment] = useState<string | null>(null);
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

  const handleAddMeal = async (ingredients: string) => {
  if (!selectedSlotInfo) return;

  const patientIdNumber = Number(patientId);
  if (isNaN(patientIdNumber) || patientIdNumber <= 0) {
    console.error('Invalid patientId:', patientId);
    return;
  }

  const newEntry: Omit<MealEntry, 'id' | 'createdDate'> = {
    dateTime: selectedSlotInfo.start.toISOString(),
    ingredients: ingredients || 'not defined',
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

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    if (!event.start) return;
    const updated = {
      dateTime: event.start.toISOString(),
    };
    await updateMealEntry(Number(event.id), updated);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
    setCurrentComment('');
  }; 

const handleEventClick = (clickInfo: EventClickArg) => {
  const eventId = Number(clickInfo.event.id);
  const review = reviews[eventId];
  if (currentUserRole !== 'Nutritionist') {
    const entry = entries.find(e => e.id === eventId);
    if (entry) {
      setSelectedMealEntry(entry);
      setSelectedEventTitle(clickInfo.event.title);
      setCurrentComment(review?.comment || '');
      setCurrentEventStatus(review ? getStatusKey(review.mealStatus) : null);
      setIsPatientModalOpen(true);
    }
    return;
  }

  const status = review ? getStatusKey(review.mealStatus) : null;
  const comment = review?.comment || '';

  setSelectedEventId(eventId);
  setSelectedEventTitle(clickInfo.event.title);
  setCurrentEventStatus(status);
  setCurrentComment(comment);
  setIsModalOpen(true);
};


const handlePatientSave = async (newIngredients: string) => {
  if (!selectedMealEntry) return;
  try {
    const updated = await updateMealEntry(selectedMealEntry.id!, {
      ingredients: newIngredients,
    });

    if (updated) {
      onEntryAdd(updated);
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
      setCurrentComment('');
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
        mealTitle={selectedEventTitle}
        ingredients={selectedMealEntry?.ingredients || ''}
        comment={currentComment}
        status={currentEventStatus}
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
        currentComment={currentComment}
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
      slotMaxTime="22:00:00"
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