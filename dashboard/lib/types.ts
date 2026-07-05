import axios from 'axios';

export type EmergencyType = 'medical' | 'accident' | 'fire' | 'crime' | 'natural_disaster' | 'other';
export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyStatus = 'active' | 'responded' | 'resolved' | 'cancelled' | 'false_alarm';
export type ResponderStatus = 'en_route' | 'arrived' | 'helping' | 'completed';

export interface ReporterInfo {
  _id: string;
  name: string;
  phone: string;
  bloodGroup?: string;
  medicalInfo?: string;
}

export interface EmergencyResponder {
  user: { _id: string; name: string } | string;
  acceptedAt: string;
  arrivedAt?: string;
  status: ResponderStatus;
  currentLocation?: { type: 'Point'; coordinates: [number, number] };
}

export interface EmergencyTimelineEvent {
  event: string;
  timestamp: string;
  actor?: string;
}

export interface EmergencyLocation {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
}

export interface Emergency {
  _id: string;
  reporter: ReporterInfo;
  type: EmergencyType;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  description?: string;
  photos: string[];
  location: EmergencyLocation;
  responders: EmergencyResponder[];
  notifiedUsers: string[];
  notifiedServices: { ambulance: boolean; police: boolean; hospital: string | null };
  timeline: EmergencyTimelineEvent[];
  resolvedAt?: string;
  responseTimeSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

// Replaces `catch (e: any) { e.response?.data?.message }` patterns with a
// typed, safe extraction that works whether the error came from axios,
// is a plain Error, or something unexpected.
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string } | undefined)?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
