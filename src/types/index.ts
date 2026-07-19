export interface MealEntry {
  id?: number;
  dateTime: string;       
  ingredients: string;
  comment?: string;
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

export interface DailyReview {
  id?: number;
  r_dRPatientId_userId: number;     
  r_dRNutritionistId_userId: number;
  date: string; 
  dateStatus: string | { key: string; name: string } | null;
  comment?: string;
  createdDate?: string;
}