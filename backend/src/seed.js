/**
 * First-run demo seed for client testing. Idempotent — guarded by the
 * `mvs-trips:seeded` flag in the kv-store. Re-running the API on a fresh
 * volume always produces the same data; on subsequent boots the seed is
 * skipped so user edits persist.
 *
 * Set RESEED=1 to wipe the flag and re-seed (handy for local resets).
 */

const SEED_FLAG = 'mvs-trips:seeded';

function readKey(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return fallback; }
}

function writeKey(db, key, value) {
  db.prepare(
    `INSERT INTO kv_store (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
  ).run(key, JSON.stringify(value));
}

const NOW = '2026-05-04T08:00:00.000Z';

const TRIPS = [
  {
    id: 'trip_dub',
    code: 'KE-DUB-26',
    name: 'Dubai Discovery',
    destination: 'Dubai · Abu Dhabi',
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    status: 'open',
    tripType: 'international',
    clubIds: [],
    gradesAllowed: [7, 8, 9],
    seatsTotal: 30,
    costPerPupil: 2400,
    currency: 'USD',
    chaperones: 4,
    assignedStaffIds: ['staff_amina', 'staff_kevin'],
    parentsJoining: 2,
    description:
      'Seven-day immersion in modern UAE — Burj Khalifa, desert safari, Sheikh Zayed Mosque, and a STEM workshop at Dubai Future Foundation.',
    installments: [],
    createdAt: NOW,
  },
  {
    id: 'trip_nrb',
    code: 'KE-NRB-26',
    name: 'Nairobi National Park · Conservation Week',
    destination: 'Nairobi National Park · Sheldrick Trust',
    startDate: '2026-05-08',
    endDate: '2026-05-12',
    status: 'in-progress',
    tripType: 'local',
    clubIds: [],
    gradesAllowed: [6, 7, 8],
    seatsTotal: 22,
    costPerPupil: 850,
    currency: 'USD',
    chaperones: 3,
    assignedStaffIds: ['staff_amina'],
    parentsJoining: 1,
    description:
      'Field studies on Kenyan wildlife conservation. Day trips into the park, an elephant orphanage visit, and ranger Q&A.',
    installments: [],
    createdAt: NOW,
  },
  {
    id: 'trip_mom',
    code: 'KE-MOM-25',
    name: 'Mombasa Coast & Culture',
    destination: 'Diani Beach · Fort Jesus',
    startDate: '2025-11-02',
    endDate: '2025-11-06',
    status: 'complete',
    tripType: 'local',
    clubIds: [],
    gradesAllowed: [6, 7, 8],
    seatsTotal: 25,
    costPerPupil: 1100,
    currency: 'USD',
    chaperones: 3,
    assignedStaffIds: ['staff_kevin'],
    parentsJoining: 0,
    description: 'Coastal heritage and marine biology trip. Snorkelling, Swahili history, and dhow sailing.',
    installments: [],
    createdAt: NOW,
  },
];

// Pupil rows are intentionally varied so the Top-5 chase leaderboard,
// payment statuses, and seat utilisation all render with realistic data.
const PUPILS = [
  // Dubai trip — 6 enrolled, mixed payment progress
  { id: 'pup_dub_01', tripId: 'trip_dub', admissionNo: 'A2401', firstName: 'Liam',     lastName: 'Otieno',  grade: 8, gender: 'M', guardianName: 'Grace Otieno',  guardianPhone: '+254 722 100 001', guardianEmail: 'grace.otieno@example.com',   paymentStatus: 'paid' },
  { id: 'pup_dub_02', tripId: 'trip_dub', admissionNo: 'A2402', firstName: 'Aisha',    lastName: 'Mwangi',  grade: 8, gender: 'F', guardianName: 'David Mwangi',  guardianPhone: '+254 722 100 002', guardianEmail: 'david.mwangi@example.com',   paymentStatus: 'deposit' },
  { id: 'pup_dub_03', tripId: 'trip_dub', admissionNo: 'A2403', firstName: 'Noah',     lastName: 'Kariuki', grade: 9, gender: 'M', guardianName: 'Esther Kariuki', guardianPhone: '+254 722 100 003', guardianEmail: 'esther.kariuki@example.com', paymentStatus: 'pending' },
  { id: 'pup_dub_04', tripId: 'trip_dub', admissionNo: 'A2404', firstName: 'Zara',     lastName: 'Wambui',  grade: 7, gender: 'F', guardianName: 'Peter Wambui',   guardianPhone: '+254 722 100 004', guardianEmail: 'peter.wambui@example.com',   paymentStatus: 'overdue' },
  { id: 'pup_dub_05', tripId: 'trip_dub', admissionNo: 'A2405', firstName: 'Ethan',    lastName: 'Njoroge', grade: 9, gender: 'M', guardianName: 'Mary Njoroge',   guardianPhone: '+254 722 100 005', guardianEmail: 'mary.njoroge@example.com',   paymentStatus: 'overdue' },
  { id: 'pup_dub_06', tripId: 'trip_dub', admissionNo: 'A2406', firstName: 'Maya',     lastName: 'Achieng', grade: 8, gender: 'F', guardianName: 'Joseph Achieng', guardianPhone: '+254 722 100 006', guardianEmail: 'joseph.achieng@example.com', paymentStatus: 'deposit' },

  // Nairobi (in-progress) — 4 enrolled, all paid
  { id: 'pup_nrb_01', tripId: 'trip_nrb', admissionNo: 'A2501', firstName: 'Ivy',      lastName: 'Cheruiyot', grade: 7, gender: 'F', guardianName: 'Sarah Cheruiyot', guardianPhone: '+254 722 200 001', guardianEmail: 'sarah.cheruiyot@example.com', paymentStatus: 'paid' },
  { id: 'pup_nrb_02', tripId: 'trip_nrb', admissionNo: 'A2502', firstName: 'Luca',     lastName: 'Omondi',    grade: 6, gender: 'M', guardianName: 'James Omondi',    guardianPhone: '+254 722 200 002', guardianEmail: 'james.omondi@example.com',    paymentStatus: 'paid' },
  { id: 'pup_nrb_03', tripId: 'trip_nrb', admissionNo: 'A2503', firstName: 'Tasha',    lastName: 'Wanjiku',   grade: 8, gender: 'F', guardianName: 'Lucy Wanjiku',    guardianPhone: '+254 722 200 003', guardianEmail: 'lucy.wanjiku@example.com',    paymentStatus: 'paid' },
  { id: 'pup_nrb_04', tripId: 'trip_nrb', admissionNo: 'A2504', firstName: 'Brian',    lastName: 'Kiprop',    grade: 7, gender: 'M', guardianName: 'Ann Kiprop',      guardianPhone: '+254 722 200 004', guardianEmail: 'parent@example.com',          paymentStatus: 'paid' },

  // Mombasa (past, fully reconciled) — 3 enrolled, all paid
  { id: 'pup_mom_01', tripId: 'trip_mom', admissionNo: 'A2301', firstName: 'Halima',   lastName: 'Yusuf',     grade: 7, gender: 'F', guardianName: 'Fatuma Yusuf',    guardianPhone: '+254 722 300 001', guardianEmail: 'fatuma.yusuf@example.com',   paymentStatus: 'paid' },
  { id: 'pup_mom_02', tripId: 'trip_mom', admissionNo: 'A2302', firstName: 'Daniel',   lastName: 'Maina',     grade: 8, gender: 'M', guardianName: 'Robert Maina',    guardianPhone: '+254 722 300 002', guardianEmail: 'robert.maina@example.com',    paymentStatus: 'paid' },
  { id: 'pup_mom_03', tripId: 'trip_mom', admissionNo: 'A2303', firstName: 'Layla',    lastName: 'Said',      grade: 6, gender: 'F', guardianName: 'Khadija Said',    guardianPhone: '+254 722 300 003', guardianEmail: 'khadija.said@example.com',    paymentStatus: 'paid' },
].map((p) => ({
  guardianRelationship: 'parent',
  medicalNotes: '',
  dietaryNotes: '',
  note: '',
  flagged: false,
  siblingIds: [],
  status: 'active',
  enrolledAt: NOW,
  ...p,
}));

// Payments are sized so Dubai produces a clear chase list:
//   Liam   2400/2400  paid in full
//   Aisha   800/2400  deposit
//   Noah      0/2400  no payment yet
//   Zara    400/2400  partial · overdue
//   Ethan   200/2400  small deposit · overdue
//   Maya  1200/2400  half down
const PAYMENTS = [
  // Dubai
  { id: 'pay_dub_01', tripId: 'trip_dub', pupilId: 'pup_dub_01', amount: 2400, currency: 'USD', method: 'bank', reference: 'TRX-2401', paidAt: '2026-04-12', createdAt: '2026-04-12T09:30:00.000Z' },
  { id: 'pay_dub_02', tripId: 'trip_dub', pupilId: 'pup_dub_02', amount:  800, currency: 'USD', method: 'mpesa', reference: 'MPE-9011', paidAt: '2026-04-18', createdAt: '2026-04-18T14:10:00.000Z' },
  { id: 'pay_dub_04', tripId: 'trip_dub', pupilId: 'pup_dub_04', amount:  400, currency: 'USD', method: 'cash',  reference: 'CSH-001',  paidAt: '2026-03-22', createdAt: '2026-03-22T11:00:00.000Z' },
  { id: 'pay_dub_05', tripId: 'trip_dub', pupilId: 'pup_dub_05', amount:  200, currency: 'USD', method: 'mpesa', reference: 'MPE-9050', paidAt: '2026-03-15', createdAt: '2026-03-15T08:45:00.000Z' },
  { id: 'pay_dub_06', tripId: 'trip_dub', pupilId: 'pup_dub_06', amount: 1200, currency: 'USD', method: 'bank',  reference: 'TRX-2406', paidAt: '2026-04-21', createdAt: '2026-04-21T10:00:00.000Z' },

  // Nairobi — fully paid
  { id: 'pay_nrb_01', tripId: 'trip_nrb', pupilId: 'pup_nrb_01', amount: 850, currency: 'USD', method: 'bank',  reference: 'TRX-2501', paidAt: '2026-04-02', createdAt: '2026-04-02T09:00:00.000Z' },
  { id: 'pay_nrb_02', tripId: 'trip_nrb', pupilId: 'pup_nrb_02', amount: 850, currency: 'USD', method: 'mpesa', reference: 'MPE-2502', paidAt: '2026-04-05', createdAt: '2026-04-05T09:00:00.000Z' },
  { id: 'pay_nrb_03', tripId: 'trip_nrb', pupilId: 'pup_nrb_03', amount: 850, currency: 'USD', method: 'bank',  reference: 'TRX-2503', paidAt: '2026-04-08', createdAt: '2026-04-08T09:00:00.000Z' },
  { id: 'pay_nrb_04', tripId: 'trip_nrb', pupilId: 'pup_nrb_04', amount: 850, currency: 'USD', method: 'mpesa', reference: 'MPE-2504', paidAt: '2026-04-10', createdAt: '2026-04-10T09:00:00.000Z' },

  // Mombasa — fully paid (qualifies as Past)
  { id: 'pay_mom_01', tripId: 'trip_mom', pupilId: 'pup_mom_01', amount: 1100, currency: 'USD', method: 'bank',  reference: 'TRX-2301', paidAt: '2025-10-12', createdAt: '2025-10-12T09:00:00.000Z' },
  { id: 'pay_mom_02', tripId: 'trip_mom', pupilId: 'pup_mom_02', amount: 1100, currency: 'USD', method: 'mpesa', reference: 'MPE-2302', paidAt: '2025-10-15', createdAt: '2025-10-15T09:00:00.000Z' },
  { id: 'pay_mom_03', tripId: 'trip_mom', pupilId: 'pup_mom_03', amount: 1100, currency: 'USD', method: 'cash',  reference: 'CSH-2303', paidAt: '2025-10-20', createdAt: '2025-10-20T09:00:00.000Z' },
];

const ACTIVITIES = [
  // Dubai itinerary highlights — enough to populate days 1–4
  { id: 'act_dub_d1_a', tripId: 'trip_dub', day: 1, title: 'Arrival & Marina sunset walk',         description: 'Hotel check-in, then a guided sunset walk along Dubai Marina.', startTime: '17:00', duration: '2h', type: 'included', perPupilCost: 0,   currency: 'USD', supplier: '' },
  { id: 'act_dub_d2_a', tripId: 'trip_dub', day: 2, title: 'Burj Khalifa — At The Top',           description: 'Skyline views from the 124th floor with educator commentary.', startTime: '10:00', duration: '2h', type: 'ticketed',  perPupilCost: 60,  currency: 'USD', supplier: 'Emaar Tickets' },
  { id: 'act_dub_d2_b', tripId: 'trip_dub', day: 2, title: 'Dubai Mall — STEM scavenger hunt',    description: 'Worksheet-led exploration of the aquarium and Apple Store.', startTime: '13:30', duration: '3h', type: 'included', perPupilCost: 0,   currency: 'USD', supplier: '' },
  { id: 'act_dub_d3_a', tripId: 'trip_dub', day: 3, title: 'Sheikh Zayed Grand Mosque',           description: 'Cultural visit — modest dress required.',                       startTime: '09:00', duration: '3h', type: 'included', perPupilCost: 0,   currency: 'USD', supplier: '' },
  { id: 'act_dub_d4_a', tripId: 'trip_dub', day: 4, title: 'Desert safari + dune workshop',       description: 'Geomorphology field session and overnight Bedouin camp.',       startTime: '15:00', duration: '6h', type: 'ticketed',  perPupilCost: 95,  currency: 'USD', supplier: 'Arabian Adventures' },

  // Nairobi
  { id: 'act_nrb_d1_a', tripId: 'trip_nrb', day: 1, title: 'Game drive — sector 4',                description: 'Morning drive through the open plains.',                        startTime: '06:30', duration: '4h', type: 'included', perPupilCost: 0,   currency: 'USD', supplier: '' },
  { id: 'act_nrb_d2_a', tripId: 'trip_nrb', day: 2, title: 'Sheldrick elephant orphanage',         description: 'Behind-the-scenes feeding session and ranger Q&A.',             startTime: '11:00', duration: '2h', type: 'ticketed',  perPupilCost: 25,  currency: 'USD', supplier: 'DSWT' },
];

const INTERESTS = [
  { id: 'int_dub_01', tripId: 'trip_dub', status: 'new',       parentName: 'Wangari Kamau',  parentEmail: 'wangari.kamau@example.com',  parentPhone: '+254 722 400 001', parentRelationship: 'parent',    pupilName: 'Eli Kamau',     pupilGrade: 8, dob: '2018-03-12', medicalNotes: '', dietaryNotes: 'Vegetarian',          additionalNotes: 'Works in finance, may help chaperone fundraising.', createdAt: '2026-04-28T07:30:00.000Z', submittedAt: '2026-04-28T07:30:00.000Z' },
  { id: 'int_dub_02', tripId: 'trip_dub', status: 'contacted', parentName: 'Sam Kibet',      parentEmail: 'sam.kibet@example.com',      parentPhone: '+254 722 400 002', parentRelationship: 'guardian',  pupilName: 'Tinashe Kibet', pupilGrade: 7, dob: '2019-06-04', medicalNotes: 'Mild asthma — inhaler.', dietaryNotes: '', additionalNotes: '',                                                  createdAt: '2026-04-22T11:10:00.000Z', submittedAt: '2026-04-22T11:10:00.000Z' },
  { id: 'int_dub_03', tripId: 'trip_dub', status: 'converted', parentName: 'Nadia Hassan',   parentEmail: 'nadia.hassan@example.com',   parentPhone: '+254 722 400 003', parentRelationship: 'parent',    pupilName: 'Imani Hassan',  pupilGrade: 8, dob: '2018-11-19', medicalNotes: '', dietaryNotes: 'Halal',               additionalNotes: 'Already enrolled — kept here for record.',           createdAt: '2026-04-15T15:45:00.000Z', submittedAt: '2026-04-15T15:45:00.000Z' },
];

const STAFF = [
  { id: 'staff_amina', firstName: 'Amina',  lastName: 'Mohamed', role: 'teacher',    title: 'Geography HOD',  email: 'amina.mohamed@mvs.test', phone: '+254 711 010 001', department: 'Humanities',  active: true,  notes: '', createdAt: NOW },
  { id: 'staff_kevin', firstName: 'Kevin',  lastName: 'Otieno',  role: 'operations', title: 'Trips Logistics', email: 'kevin.otieno@mvs.test',  phone: '+254 711 010 002', department: 'Operations',  active: true,  notes: '', createdAt: NOW },
];

const CLUBS = [
  { id: 'club_football', name: 'Football',     emoji: '⚽', colour: '#2c7a3a', description: 'Inter-house and inter-school football.', leadStaff: 'staff_kevin', assistants: [], meetingDay: 'Wednesday', meetingTime: '16:00', venue: 'Main field',     status: 'active', createdAt: NOW },
  { id: 'club_drama',    name: 'Drama Club',  emoji: '🎭', colour: '#8a4f7d', description: 'Annual stage production + improv nights.', leadStaff: 'staff_amina', assistants: [], meetingDay: 'Friday',    meetingTime: '15:30', venue: 'Drama studio',   status: 'active', createdAt: NOW },
];

const SETTINGS = { activeTripId: 'trip_dub' };

function runSeed(db) {
  const reseed = process.env.RESEED === '1';
  if (reseed) {
    db.prepare('DELETE FROM kv_store WHERE key = ?').run(SEED_FLAG);
  }
  if (readKey(db, SEED_FLAG)) {
    return { seeded: false, reason: 'already-seeded' };
  }

  const tx = db.transaction(() => {
    writeKey(db, 'mvs-trips:trips', TRIPS);
    writeKey(db, 'mvs-trips:pupils', PUPILS);
    writeKey(db, 'mvs-trips:payments', PAYMENTS);
    writeKey(db, 'mvs-trips:activities', ACTIVITIES);
    writeKey(db, 'mvs-trips:interests', INTERESTS);
    writeKey(db, 'mvs-trips:staff', STAFF);
    writeKey(db, 'mvs-trips:clubs', CLUBS);
    writeKey(db, 'mvs-trips:settings', SETTINGS);
    writeKey(db, SEED_FLAG, true);
  });
  tx();

  return {
    seeded: true,
    counts: {
      trips: TRIPS.length,
      pupils: PUPILS.length,
      payments: PAYMENTS.length,
      activities: ACTIVITIES.length,
      interests: INTERESTS.length,
      staff: STAFF.length,
      clubs: CLUBS.length,
    },
  };
}

module.exports = runSeed;
