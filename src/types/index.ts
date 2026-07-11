export interface MealEntry {
  id?: number;
  dateTime: string;       
  ingredients: string;
  r_patientId_userId: number; 
  createdDate?: string;
}

export interface Review {
  id?: number;
  r_mealEntryId_c_mealEntryId: number;
  r_nutritionistId_userId: number;
  mealStatus: { key: string; name: string } | string | null;
  comment?: string;
  createdDate?: string;
}

export interface LiferayUser {
  id: number;
  email?: string;
  name: string;
  roleNames?: string[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  extendedProps: MealEntry;
}