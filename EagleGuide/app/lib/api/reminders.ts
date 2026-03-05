import { http } from '../http';

export type DayOfWeek =
  | 'sunday' | 'monday' | 'tuesday' | 'wednesday'
  | 'thursday' | 'friday' | 'saturday';

export type Reminder = {
  reminderId: string;
  userId: string;
  label: string;
  destinationGeom: { type: 'Point'; coordinates: [number, number] } | null;
  destinationLabel: string | null;
  remindTime: string;          // "HH:MM:SS" from Postgres TIME
  daysOfWeek: DayOfWeek[];
  activeFrom: string | null;
  activeUntil: string | null;
  savedRouteId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateReminderPayload = {
  label: string;
  destination_geom: { lat: number; lon: number };
  destination_label?: string;
  remind_time: string;         // "HH:MM"
  days_of_week: DayOfWeek[];
  active_from?: string | null;
  active_until?: string | null;
  saved_route_id?: string | null;
};

export type UpdateReminderPayload = Partial<Omit<CreateReminderPayload, 'destination_geom'>> & {
  destination_geom?: { lat: number; lon: number };
};

export async function getReminders(): Promise<Reminder[]> {
  const res = await http.get<{ reminders: Reminder[] }>('/reminders');
  return res.data.reminders;
}

export async function createReminder(payload: CreateReminderPayload): Promise<Reminder> {
  const res = await http.post<{ reminder: Reminder }>('/reminders', payload);
  return res.data.reminder;
}

export async function updateReminder(id: string, payload: UpdateReminderPayload): Promise<Reminder> {
  const res = await http.patch<{ reminder: Reminder }>(`/reminders/${id}`, payload);
  return res.data.reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  await http.delete(`/reminders/${id}`);
}
