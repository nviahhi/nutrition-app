
import { LiferayUser, MealEntry, Review, DailyReview } from './types';

const LIFERAY_URL = window.location.origin || 'http://localhost:8080';

function getCsrfToken(): string {
  if (typeof Liferay !== 'undefined' && Liferay.authToken) {
    return Liferay.authToken;
  }
  return '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const csrfToken = getCsrfToken();

  const response = await fetch(`${LIFERAY_URL}${endpoint}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}


export function getCurrentUserFromThemeDisplay(): { userId: number; name: string } | null {
  try {
    if (typeof Liferay === 'undefined' || !Liferay.ThemeDisplay) {
      console.warn('Liferay.ThemeDisplay not available');
      return null;
    }

    const userId = Liferay.ThemeDisplay.getUserId();
    if (!userId || userId === 0) {
      console.warn('User not authenticated');
      return null;
    }

    let userName = Liferay.ThemeDisplay.getUserName();
    
    if (!userName || userName === 'Guest') {
      try {
        const user = Liferay.ThemeDisplay.getUser();
        if (user) {
          if (typeof user.getName === 'function') {
            userName = user.getName();
          } else if (user.firstName || user.lastName) {
            userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          }
        }
      } catch (e) {
        console.warn('Could not get user name:', e);
      }
    }

    if (!userName || userName === 'Guest') {
      userName = `Пользователь ${userId}`;
    }

    return {
      userId: userId,
      name: userName,
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}


export async function getUserRoles(userId: number): Promise<string[]> {
  try {
    const roles = await request<any[]>(`/api/jsonws/role/get-user-roles/user-id/${userId}`, {
      method: 'GET',
    });
    
    return roles.map((role: any) => role.name || role.getName?.() || '');
  } catch (error) {
    console.error('Failed to fetch user roles:', error);
    return [];
  }
}


export async function getCurrentUserWithRole(): Promise<{
  user: LiferayUser;
  role: 'Patient' | 'Nutritionist' | null;
} | null> {
  try {
    const userInfo = getCurrentUserFromThemeDisplay();
    if (!userInfo) return null;

    const roles = await getUserRoles(userInfo.userId);
    const role = roles.includes('Nutritionist') ? 'Nutritionist' : 'Patient';

    const user: LiferayUser = {
      id: userInfo.userId,
      name: userInfo.name,
    };

    return { user, role };
  } catch (error) {
    console.error('Failed to get user with role:', error);
    return null;
  }
}

export async function getMealEntries(patientId?: number): Promise<MealEntry[]> {
  const filter = patientId ? `?pageSize=-1&filter=r_patientId_userId%20eq%20'${patientId}'` : '';
  const response = await request<{ items: MealEntry[] }>(`/o/c/mealentries${filter}`);
  return response.items || [];
}


export async function createMealEntry(entry: Omit<MealEntry, 'id' | 'createdDate'>): Promise<MealEntry> {
  const patientId = Number(entry.r_patientId_userId);
  if (isNaN(patientId) || patientId <= 0) {
    console.error('Invalid r_patientId_userId in entry:', entry);
    throw new Error('Invalid patientId: must be a positive number');
  }

  const payload = {
    dateTime: entry.dateTime,
    ingredients: entry.ingredients,
    comment: entry.comment || '',
    r_patientId_userId: patientId
  };


  return request<MealEntry>('/o/c/mealentries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMealEntry(id: number, updates: Partial<MealEntry>): Promise<MealEntry> {
  return request<MealEntry>(`/o/c/mealentries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteMealEntry(id: number): Promise<void> {
  return request<void>(`/o/c/mealentries/${id}`, { method: 'DELETE' });
}

export async function getReviews(mealEntryId?: number): Promise<Review[]> {
  const filter = mealEntryId ? `&filter=mealEntryId%20eq%20'${mealEntryId}'` : '';
  const response = await request<{ items: Review[] }>(`/o/c/reviews?pageSize=-1${filter}`);
  return response.items || [];
}

export async function saveReview(review: Omit<Review, 'createdDate'>): Promise<Review> {
  if (review.id) {
    return request<Review>(`/o/c/reviews/${review.id}`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    });
  } else {
    return request<Review>('/o/c/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }
}


export async function getRoleIdByName(roleName: string): Promise<number | null> {
  try {
    const roles = await request<any[]>('/api/jsonws/role/get-roles?type=1&subtype=', {
      method: 'GET',
    });
    
    const role = roles.find((r: any) => r.name === roleName);
    return role ? role.roleId : null;
  } catch (error) {
    console.error('Failed to get role by name:', error);
    return null;
  }
}


export async function getPatients(): Promise<LiferayUser[]> {
  try {
    const roleId = await getRoleIdByName('Patient');
    if (!roleId) {
      console.warn('Role "Patient" not found');
      return [];
    }
    const users = await request<any[]>(`/api/jsonws/user/get-role-user-ids?roleId=${roleId}`, {
      method: 'GET',
    });

    const patients: LiferayUser[] = [];
    for (const userId of users) {
      try {
        const user = await request<any>(`/api/jsonws/user/get-user-by-id?userId=${userId}`, {
          method: 'GET',
        });
        
        if (user) {
          patients.push({
            id: user.userId,
            name: user.fullName || user.screenName || user.emailAddress || `Пользователь ${user.userId}`,
          });
        }
      } catch (error) {
        console.warn(`Failed to get user ${userId}:`, error);
      }
    }

    return patients;

  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return [];
  }
}

export async function getDailyReview(date: string, patientId: number): Promise<DailyReview | null> {
  try {
    const response = await request<{ items: DailyReview[] }>(
      `/o/c/dailyreviews?filter=date%20eq%20'${date}'%20and%20r_dRPatientId_userId%20eq%20'${patientId}'`
    );
    return response.items?.[0] || null;
  } catch (error) {
    console.error('Failed to get daily review:', error);
    return null;
  }
}

export async function getDailyReviews(patientId?: number): Promise<DailyReview[]> {
  try {
    const url = patientId 
      ? `/o/c/dailyreviews?pageSize=-1&filter=r_dRPatientId_userId%20eq%20'${patientId}'`
      : '/o/c/dailyreviews?pageSize=-1';
    const response = await request<{ items: DailyReview[] }>(url);
    return response.items || [];
  } catch (error) {
    console.error('Failed to get daily reviews:', error);
    return [];
  }
}

export async function saveDailyReview(review: Omit<DailyReview, 'createdDate'>): Promise<DailyReview> {
  if (review.id) {
    return request<DailyReview>(`/o/c/dailyreviews/${review.id}`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    });
  } else {
    return request<DailyReview>('/o/c/dailyreviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }
}