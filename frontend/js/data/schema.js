/* ==========================================
   SCHEMA — entity shapes and enumerations
   ==========================================
   Documentation for the data model. The runtime store
   uses these as templates via `Schema.newXxx()`.
*/

const Schema = {
  // ----- Enums -----
  Gender: ['M', 'F'],
  PaymentStatus: ['pending', 'deposit', 'paid', 'overdue', 'cancelled'],
  DocStatus: ['missing', 'submitted', 'verified', 'expired', 'expiring'],
  BookingType: ['flight', 'hotel', 'activity', 'transfer', 'insurance'],
  BookingStatus: ['quoted', 'pending', 'confirmed', 'cancelled'],
  ActivityType: ['included', 'ticketed', 'optional'],
  CommType: ['email', 'sms', 'whatsapp', 'letter'],
  TripStatus: ['draft', 'open', 'closed', 'in-progress', 'complete', 'cancelled'],

  // ----- Factories -----
  newTrip(overrides = {}) {
    return {
      id: Fmt.uid('trip'),
      code: 'MVS-NEW-26',
      name: 'New Trip',
      destination: '',
      startDate: null,
      endDate: null,
      status: 'draft',
      gradesAllowed: [6, 7, 8, 9],
      seatsTotal: 40,
      costPerPupil: 0,
      currency: 'USD',
      chaperones: 0,
      description: '',
      installments: [],
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  newPupil(overrides = {}) {
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
      ...overrides
    };
  },

  newPayment(overrides = {}) {
    return {
      id: Fmt.uid('pay'),
      tripId: null,
      pupilId: null,
      amount: 0,
      currency: 'USD',
      method: 'bank-transfer',
      reference: '',
      notes: '',
      paidAt: new Date().toISOString(),
      recordedBy: 'system',
      ...overrides
    };
  },

  newDocument(overrides = {}) {
    return {
      id: Fmt.uid('doc'),
      tripId: null,
      pupilId: null,
      typeId: null,
      status: 'missing',
      filename: '',
      uploadedAt: null,
      verifiedAt: null,
      verifiedBy: null,
      expiresAt: null,
      notes: '',
      ...overrides
    };
  },

  newDocumentType(overrides = {}) {
    return {
      id: Fmt.uid('dtype'),
      name: '',
      abbr: '',
      required: true,
      requiresExpiry: false,
      description: '',
      ...overrides
    };
  },

  newBooking(overrides = {}) {
    return {
      id: Fmt.uid('bk'),
      tripId: null,
      type: 'activity',
      status: 'quoted',
      supplier: '',
      reference: '',
      title: '',
      description: '',
      date: null,
      time: '',
      pax: 0,
      unitPrice: 0,
      totalCost: 0,
      currency: 'USD',
      paidAmount: 0,
      paidAt: null,
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  newActivity(overrides = {}) {
    return {
      id: Fmt.uid('act'),
      tripId: null,
      day: 1,
      title: '',
      description: '',
      startTime: '',
      duration: '',
      type: 'included',
      perPupilCost: 0,
      currency: 'USD',
      capacity: null,
      bookedCount: 0,
      supplier: '',
      notes: '',
      ...overrides
    };
  },

  newCommunication(overrides = {}) {
    return {
      id: Fmt.uid('msg'),
      tripId: null,
      type: 'email',
      subject: '',
      body: '',
      recipientIds: [],
      recipientCount: 0,
      sentAt: new Date().toISOString(),
      sentBy: 'Reginah M.',
      ...overrides
    };
  }
};
