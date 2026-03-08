export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DashboardEmailOccurrence {
  dayOfWeek: DayOfWeek;
  executionTime: string;
}

export interface DashboardEmailScheduleResponse {
  scheduleKey: 'DASHBOARD_EMAIL' | string;
  enabled: boolean;
  timezone: string;
  occurrences: DashboardEmailOccurrence[];
}

export interface DashboardEmailScheduleRequest {
  enabled: boolean;
  timezone: string;
  occurrences: DashboardEmailOccurrence[];
}
