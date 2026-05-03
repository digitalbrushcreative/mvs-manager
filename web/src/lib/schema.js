/**
 * Entity factories and enumerations. Mirrors frontend/js/data/schema.js so the
 * shapes persisted in kv_store remain compatible with the legacy app.
 */

import { Fmt } from './format';

export const Enums = {
  Gender: ['M', 'F'],
  PaymentStatus: ['pending', 'deposit', 'paid', 'overdue', 'cancelled'],
  DocStatus: ['missing', 'submitted', 'verified', 'expired', 'expiring'],
  BookingType: ['flight', 'hotel', 'activity', 'transfer', 'insurance'],
  BookingStatus: ['quoted', 'pending', 'confirmed', 'cancelled'],
  ActivityType: ['included', 'ticketed', 'optional'],
  CommType: ['email', 'sms', 'whatsapp', 'letter'],
  TripStatus: ['draft', 'open', 'closed', 'in-progress', 'complete', 'cancelled'],
  TripType: ['local', 'international'],
  ClubStatus: ['active', 'paused', 'archived'],
  ClubMemberRole: ['member', 'captain', 'committee'],
  StaffRole: ['teacher', 'admin', 'marketing', 'operations', 'medical', 'finance', 'support', 'other'],
  UserRole: ['admin', 'parent', 'pupil'],
};

export function newTrip(overrides = {}) {
  return {
    id: Fmt.uid('trip'),
    code: 'MVS-NEW-26',
    name: 'New Trip',
    destination: '',
    startDate: null,
    endDate: null,
    status: 'draft',
    tripType: 'international',
    clubIds: [],
    gradesAllowed: [6, 7, 8, 9],
    seatsTotal: 40,
    costPerPupil: 0,
    currency: 'USD',
    chaperones: 0,
    assignedStaffIds: [],
    parentsJoining: 0,
    description: '',
    installments: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function newPupil(overrides = {}) {
  return {
    id: Fmt.uid('pup'),
    tripId: null,
    admissionNo: '',
    firstName: '',
    lastName: '',
    grade: 6,
    gender: 'M',
    dob: null,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: 'parent',
    medicalNotes: '',
    dietaryNotes: '',
    paymentStatus: 'pending',
    note: '',
    flagged: false,
    siblingIds: [],
    status: 'active',
    enrolledAt: new Date().toISOString(),
    ...overrides,
  };
}

export function newStaff(overrides = {}) {
  return {
    id: Fmt.uid('staff'),
    firstName: '',
    lastName: '',
    role: 'teacher',
    title: '',
    email: '',
    phone: '',
    department: '',
    active: true,
    notes: '',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function newClub(overrides = {}) {
  return {
    id: Fmt.uid('club'),
    name: '',
    emoji: '🎯',
    colour: '#2c3f6b',
    description: '',
    leadStaff: '',
    assistants: [],
    meetingDay: 'Wednesday',
    meetingTime: '16:00',
    venue: '',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export const STAFF_ROLE_META = {
  teacher: { label: 'Teacher', colour: '#2c3f6b' },
  admin: { label: 'Admin', colour: '#5b6e8f' },
  marketing: { label: 'Marketing', colour: '#8a4f7d' },
  operations: { label: 'Operations', colour: '#3a7d5e' },
  medical: { label: 'Medical', colour: '#b85c5c' },
  finance: { label: 'Finance', colour: '#a07a3a' },
  support: { label: 'Support', colour: '#4a7a8a' },
  other: { label: 'Other', colour: '#6b6b6b' },
};
