export interface PicklistStatus {
  key: string;
  name: string;
}

export function getStatusKey(status: string | PicklistStatus | null | undefined): string {
  if (!status) return '';
  if (typeof status === 'string') return status;
  return status.key;
}

export function getStatusName(status: string | PicklistStatus | null | undefined): string {
  if (!status) return '';
  if (typeof status === 'string') return status;
  return status.name;
}

export function isStatusGood(status: string | PicklistStatus | null | undefined): boolean {
  return getStatusKey(status) === 'good';
}

export function isStatusAttention(status: string | PicklistStatus | null | undefined): boolean {
  return getStatusKey(status) === 'attention';
}