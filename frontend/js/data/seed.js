/* ==========================================
   SEED DATA — deterministic mock dataset
   ==========================================
   All names, phone numbers, and email addresses are
   synthetic and generated deterministically. Safe for
   demos, tests, and public repos.
*/

const Seed = {
  build() {
    const tripId = 'trip_malaysia_2026';

    const trips = [
      {
        id: tripId,
        code: 'MVS-MYS-26',
        name: 'Malaysia Discovery Expedition',
        destination: 'Kuala Lumpur · Langkawi · Penang',
        startDate: '2026-07-28',
        endDate: '2026-08-08',
        status: 'open',
        tripType: 'international',
        gradesAllowed: [6, 7, 8, 9],
        seatsTotal: 80,
        costPerPupil: 3000,
        currency: 'USD',
        chaperones: 4,
        parentsJoining: 6,
        description: '12-day expedition across Malaysia covering cultural heritage, natural wonders, and educational visits.',
        installments: [
          { id: 'i1', name: 'Deposit', amount: 500, dueDate: '2026-02-15' },
          { id: 'i2', name: 'First instalment', amount: 1000, dueDate: '2026-03-20' },
          { id: 'i3', name: 'Second instalment', amount: 1000, dueDate: '2026-05-15' },
          { id: 'i4', name: 'Final balance', amount: 500, dueDate: '2026-06-30' }
        ],
        createdAt: '2026-01-10T00:00:00Z'
      },
      {
        id: 'trip_uk_2026',
        code: 'MVS-UK-26',
        name: 'United Kingdom Cultural Tour',
        destination: 'London · Oxford · Edinburgh',
        startDate: '2026-06-15',
        endDate: '2026-06-28',
        status: 'closed',
        tripType: 'international',
        gradesAllowed: [7, 8, 9],
        seatsTotal: 40,
        costPerPupil: 4500,
        currency: 'USD',
        chaperones: 3,
        parentsJoining: 4,
        description: 'Educational tour of UK universities, museums, and historical sites.',
        installments: [],
        createdAt: '2025-11-01T00:00:00Z'
      },
      {
        id: 'trip_coast_2026',
        code: 'MVS-COAST-26',
        name: 'Kenyan Coast Marine Biology Trip',
        destination: 'Watamu · Kilifi · Mombasa',
        startDate: '2026-10-05',
        endDate: '2026-10-12',
        status: 'draft',
        tripType: 'local',
        gradesAllowed: [5, 6, 7],
        seatsTotal: 50,
        costPerPupil: 450,
        currency: 'USD',
        chaperones: 4,
        parentsJoining: 2,
        description: 'Hands-on marine conservation programme along the Kenyan coast.',
        installments: [],
        createdAt: '2026-03-01T00:00:00Z'
      },
      {
        id: 'trip_amboseli_2026',
        code: 'MVS-AMB-26',
        name: 'Amboseli Wildlife Conservation',
        destination: 'Amboseli National Park',
        startDate: '2026-11-18',
        endDate: '2026-11-22',
        status: 'draft',
        tripType: 'local',
        gradesAllowed: [4, 5, 6],
        seatsTotal: 60,
        costPerPupil: 280,
        currency: 'USD',
        chaperones: 5,
        parentsJoining: 3,
        description: '5-day wildlife and conservation experience.',
        installments: [],
        createdAt: '2026-03-15T00:00:00Z'
      }
    ];

    const documentTypes = [
      { id: 'dt_passport', name: 'Passport', abbr: 'P', required: true, requiresExpiry: true, description: 'Valid passport with at least 6 months validity after travel dates.' },
      { id: 'dt_consent', name: 'Consent form', abbr: 'C', required: true, requiresExpiry: false, description: 'Signed parental consent form.' },
      { id: 'dt_medical', name: 'Medical form', abbr: 'M', required: true, requiresExpiry: false, description: 'Medical declaration and emergency contact details.' },
      { id: 'dt_insurance', name: 'Travel insurance', abbr: 'I', required: true, requiresExpiry: true, description: 'Comprehensive travel insurance certificate.' },
      { id: 'dt_visa', name: 'Visa', abbr: 'V', required: false, requiresExpiry: true, description: 'Travel visa for destination country if required.' },
      { id: 'dt_photo', name: 'ID photo', abbr: 'Ph', required: false, requiresExpiry: false, description: 'Recent passport-style photograph.' }
    ];

    // Deterministic mock dataset — no real names, numbers or emails.
    const pupilsRaw = (function makeMockPupils() {
      const F = ['Amina','Brenda','Cynthia','Damaris','Esther','Faith','Gloria','Hellen','Imani','Joy','Kendi','Leah','Mercy','Naomi','Olivia','Priscilla','Ruth','Sarah','Tabitha','Vivian','Wambui','Yasmin','Zawadi'];
      const M = ['Arnold','Brian','Collins','Dennis','Eric','Felix','George','Henry','Isaac','James','Kevin','Luke','Martin','Noah','Peter','Ryan','Samuel','Victor','Wesley','Xavier','Zachary'];
      const L = ['Achieng','Bundi','Chege','Daudi','Eshiwani','Gatheru','Hamisi','Irungu','Juma','Kamau','Mutiso','Nderitu','Odhiambo','Ruhiu','Sifuna','Thuku','Wanjiku','Yebei'];
      const notes = [
        'Awaiting guardian confirmation',
        'Paying in full on agreed date',
        'Will confirm attendance this week',
        'Awaiting decision',
        'Deposit received',
        'Deposit received — documents filed',
        'Paying this week',
        'Concerned about pricing',
        'Parent worried about safety',
        'No response yet',
        'Passport not yet issued',
        'Attending — documents complete',
        'Misread deadline, paying shortly',
        'Parent unreachable, retrying',
        'Awaiting instalment 1',
        ''
      ];
      const docMix = [
        { P:'verified',  C:'verified',  M:'submitted', I:'missing'   },
        { P:'verified',  C:'verified',  M:'verified',  I:'verified'  },
        { P:'submitted', C:'submitted', M:'missing',   I:'missing'   },
        { P:'missing',   C:'missing',   M:'missing',   I:'missing'   },
        { P:'verified',  C:'verified',  M:'verified',  I:'submitted' },
        { P:'verified',  C:'submitted', M:'submitted', I:'missing'   },
        { P:'missing',   C:'submitted', M:'missing',   I:'missing'   },
        { P:'verified',  C:'verified',  M:'submitted', I:'verified'  }
      ];
      const statuses = ['pending','pending','pending','deposit','deposit','deposit','paid','overdue'];
      // Grade distribution: 8 × g6, 7 × g7, 15 × g8, 25 × g9 = 55
      const grades = [
        ...Array(8).fill(6),
        ...Array(7).fill(7),
        ...Array(15).fill(8),
        ...Array(25).fill(9)
      ];

      const pad3 = (n) => String(n).padStart(3, '0');

      return grades.map((grade, idx) => {
        const female = idx % 3 !== 0;
        const firstPool = female ? F : M;
        const first = firstPool[idx % firstPool.length];
        const last = L[(idx * 7) % L.length];
        const gFirst = (female ? M : F)[(idx + 5) % (female ? M.length : F.length)];
        const gLast = L[(idx * 11 + 3) % L.length];
        return {
          a: `25${pad3(idx + 1)}`,                     // mock admission number e.g. 25001
          n: `${first} ${last}`,
          g: grade,
          s: female ? 'F' : 'M',
          gn: `${gFirst} ${gLast}`,
          gp: `0710-${pad3((idx * 17) % 1000)}-${pad3((idx * 29 + 400) % 1000)}`,
          ge: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
          ps: statuses[idx % statuses.length],
          note: notes[idx % notes.length],
          fl: idx % 7 === 0,
          docs: docMix[idx % docMix.length]
        };
      });
    })();

    const pupils = [];
    const documents = [];
    const payments = [];

    pupilsRaw.forEach((p, idx) => {
      const [firstName, ...rest] = p.n.split(' ');
      const lastName = rest.join(' ');
      const pupilId = `pup_${p.a}`;
      pupils.push({
        id: pupilId,
        tripId,
        admissionNo: p.a,
        firstName,
        lastName,
        grade: p.g,
        gender: p.s,
        dob: null,
        guardianName: p.gn,
        guardianPhone: p.gp,
        guardianEmail: p.ge,
        guardianRelationship: 'parent',
        medicalNotes: '',
        dietaryNotes: '',
        paymentStatus: p.ps,
        note: p.note,
        flagged: p.fl,
        siblingIds: [],
        status: 'active',
        enrolledAt: new Date(2026, 0, 15 + (idx % 30)).toISOString()
      });

      // Generate documents from the short-form doc map
      documentTypes.slice(0, 4).forEach(type => {
        const key = type.abbr;
        const status = p.docs[key] || 'missing';
        documents.push({
          id: `doc_${pupilId}_${type.id}`,
          tripId,
          pupilId,
          typeId: type.id,
          status,
          filename: status !== 'missing' ? `${type.name.toLowerCase()}_${p.a}.pdf` : '',
          uploadedAt: status !== 'missing' ? new Date(2026, 1, 10 + (idx % 20)).toISOString() : null,
          verifiedAt: status === 'verified' ? new Date(2026, 1, 15 + (idx % 18)).toISOString() : null,
          verifiedBy: status === 'verified' ? 'Trips Coordinator' : null,
          expiresAt: type.requiresExpiry && status !== 'missing'
            ? new Date(2027 + (idx % 5), 5, 1).toISOString()
            : null,
          notes: ''
        });
      });

      // Generate payment records
      if (p.ps === 'paid') {
        payments.push({
          id: `pay_${pupilId}_i1`,
          tripId,
          pupilId,
          amount: 1500,
          currency: 'USD',
          method: 'bank-transfer',
          reference: `MVS${p.a}-I1`,
          notes: 'Deposit + first instalment',
          paidAt: new Date(2026, 2, 1 + (idx % 10)).toISOString(),
          recordedBy: 'Trips Coordinator'
        });
      } else if (p.ps === 'deposit') {
        payments.push({
          id: `pay_${pupilId}_dep`,
          tripId,
          pupilId,
          amount: 500,
          currency: 'USD',
          method: 'bank-transfer',
          reference: `MVS${p.a}-DEP`,
          notes: 'Deposit',
          paidAt: new Date(2026, 1, 10 + (idx % 15)).toISOString(),
          recordedBy: 'Trips Coordinator'
        });
      }
    });

    const activities = [
      { id: 'act_1', tripId, day: 1, title: 'Arrival & welcome briefing', description: 'Airport transfer and hotel check-in. Welcome dinner with itinerary walkthrough.', startTime: '18:00', duration: '2h', type: 'included', perPupilCost: 0, currency: 'USD', capacity: 70, bookedCount: 70, supplier: 'Sunrise Travels', notes: '' },
      { id: 'act_2', tripId, day: 2, title: 'Petronas Twin Towers · Observation Deck', description: 'Guided tour of the iconic Twin Towers with access to Skybridge and Observation Deck.', startTime: '09:00', duration: '2h 30m', type: 'ticketed', perPupilCost: 18, currency: 'USD', capacity: 70, bookedCount: 70, supplier: 'KL Tours', notes: 'Group rate secured' },
      { id: 'act_3', tripId, day: 3, title: 'Batu Caves heritage walk & cultural workshop', description: 'Visit to the iconic Batu Caves followed by a hands-on cultural workshop.', startTime: '10:00', duration: 'Half day', type: 'included', perPupilCost: 0, currency: 'USD', capacity: 70, bookedCount: 70, supplier: 'Heritage Tours KL', notes: '' },
      { id: 'act_4', tripId, day: 4, title: 'KLCC Park & Aquaria', description: 'Morning at KLCC Park followed by Aquaria underwater tunnel experience.', startTime: '09:30', duration: 'Full day', type: 'ticketed', perPupilCost: 22, currency: 'USD', capacity: 70, bookedCount: 70, supplier: 'KL Tours', notes: '' },
      { id: 'act_5', tripId, day: 5, title: 'Langkawi SkyCab & rainforest canopy walk', description: 'Cable car ride to Mount Mat Cincang and canopy walk in protected rainforest.', startTime: '08:00', duration: 'Full day', type: 'optional', perPupilCost: 42, currency: 'USD', capacity: 66, bookedCount: 41, supplier: 'Langkawi Adventures', notes: 'Weather-dependent' },
      { id: 'act_6', tripId, day: 6, title: 'Underwater World Langkawi', description: 'Marine aquarium visit with educational programme.', startTime: '10:00', duration: 'Half day', type: 'included', perPupilCost: 0, currency: 'USD', capacity: 66, bookedCount: 66, supplier: 'Underwater World', notes: '' },
      { id: 'act_7', tripId, day: 7, title: 'Island hopping & snorkelling excursion', description: 'Boat trip to surrounding islands with snorkelling stops.', startTime: '08:30', duration: 'Full day', type: 'optional', perPupilCost: 55, currency: 'USD', capacity: 66, bookedCount: 58, supplier: 'Island Hopper Co.', notes: 'Includes lunch and equipment' },
      { id: 'act_8', tripId, day: 8, title: 'Transfer to Penang', description: 'Ferry and coach transfer to Penang.', startTime: '10:00', duration: '6h', type: 'included', perPupilCost: 0, currency: 'USD', capacity: 66, bookedCount: 66, supplier: 'Sunrise Travels', notes: '' },
      { id: 'act_9', tripId, day: 9, title: 'Penang heritage & street-art trail', description: 'Guided walking tour through George Town, UNESCO World Heritage site.', startTime: '09:00', duration: 'Half day', type: 'included', perPupilCost: 0, currency: 'USD', capacity: 66, bookedCount: 66, supplier: 'Penang Heritage Tours', notes: '' },
      { id: 'act_10', tripId, day: 10, title: 'Penang Hill funicular & The Habitat', description: 'Funicular ride to Penang Hill and eco-park canopy walk.', startTime: '09:30', duration: 'Full day', type: 'ticketed', perPupilCost: 32, currency: 'USD', capacity: 66, bookedCount: 66, supplier: 'Penang Adventures', notes: '' },
      { id: 'act_11', tripId, day: 11, title: 'Cultural centre & farewell dinner', description: 'Traditional Malaysian cultural show with themed dinner.', startTime: '18:00', duration: '4h', type: 'included', perPupilCost: 0, currency: 'USD', capacity: 70, bookedCount: 70, supplier: 'Heritage Tours', notes: '' },
      { id: 'act_12', tripId, day: 12, title: 'Departure', description: 'Transfer to Penang International Airport.', startTime: '06:00', duration: '2h', type: 'included', perPupilCost: 0, currency: 'USD', capacity: 70, bookedCount: 70, supplier: 'Sunrise Travels', notes: '' }
    ];

    const bookings = [
      { id: 'bk_1', tripId, type: 'flight', status: 'confirmed', supplier: 'Kenya Airways', reference: 'KQ0886 / EK348', title: 'NBO → KUL via DXB (outbound)', description: 'Kenya Airways NBO-DXB connecting to Emirates DXB-KUL', date: '2026-07-28', time: '22:35', pax: 70, unitPrice: 1100, totalCost: 77000, currency: 'USD', paidAmount: 23100, paidAt: '2026-02-20T00:00:00Z', contactName: 'Reservations Desk', contactPhone: '+00 0 000 0001', contactEmail: 'groups@example.com', notes: 'Group allocation confirmed, 5kg extra luggage approved.', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'bk_2', tripId, type: 'flight', status: 'confirmed', supplier: 'Emirates', reference: 'EK347 / KQ0887', title: 'PEN → NBO via DXB (return)', description: 'Emirates PEN-DXB connecting to Kenya Airways DXB-NBO', date: '2026-08-08', time: '15:20', pax: 70, unitPrice: 0, totalCost: 0, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Reservations Desk', contactPhone: '+00 0 000 0002', contactEmail: 'groups@example.com', notes: 'Included in outbound ticket.', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'bk_3', tripId, type: 'hotel', status: 'confirmed', supplier: 'Corus Hotel KL', reference: 'RES-KL-2026-4412', title: 'Corus Hotel Kuala Lumpur', description: '4 nights, 18 triple rooms + 2 twins. Breakfast included.', date: '2026-07-29', time: '14:00', pax: 70, unitPrice: 85, totalCost: 23800, currency: 'USD', paidAmount: 7140, paidAt: '2026-02-25T00:00:00Z', contactName: 'Reservations Desk', contactPhone: '+00 0 000 0003', contactEmail: 'reservations@hotel-a.example', notes: 'Adjacent rooms for chaperones arranged.', createdAt: '2026-02-05T00:00:00Z' },
      { id: 'bk_4', tripId, type: 'hotel', status: 'confirmed', supplier: 'Berjaya Langkawi Resort', reference: 'RES-LGK-2026-220', title: 'Berjaya Langkawi Resort', description: '3 nights, chalets on beach.', date: '2026-08-02', time: '14:00', pax: 70, unitPrice: 120, totalCost: 25200, currency: 'USD', paidAmount: 7560, paidAt: '2026-02-28T00:00:00Z', contactName: 'Reservations Desk', contactPhone: '+00 0 000 0004', contactEmail: 'reservations@hotel-b.example', notes: '', createdAt: '2026-02-08T00:00:00Z' },
      { id: 'bk_5', tripId, type: 'hotel', status: 'pending', supplier: 'G Hotel Penang', reference: 'QUOTE-PEN-2026', title: 'G Hotel Kelawai, Penang', description: '4 nights, twin share rooms.', date: '2026-08-05', time: '14:00', pax: 70, unitPrice: 95, totalCost: 26600, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Reservations Desk', contactPhone: '+00 0 000 0005', contactEmail: 'reservations@hotel-c.example', notes: 'Awaiting signed contract.', createdAt: '2026-02-12T00:00:00Z' },
      { id: 'bk_6', tripId, type: 'activity', status: 'confirmed', supplier: 'KL Tours', reference: 'KLT-PTT-2026', title: 'Petronas Twin Towers Access', description: 'Group access tickets for Observation Deck.', date: '2026-07-30', time: '09:00', pax: 70, unitPrice: 18, totalCost: 1260, currency: 'USD', paidAmount: 1260, paidAt: '2026-03-01T00:00:00Z', contactName: 'Bookings Desk', contactPhone: '+00 0 000 0006', contactEmail: 'bookings@tour-a.example', notes: '', createdAt: '2026-02-15T00:00:00Z' },
      { id: 'bk_7', tripId, type: 'activity', status: 'quoted', supplier: 'Island Hopper Co.', reference: 'QUOTE-IH-2026', title: 'Island hopping & snorkelling', description: 'Day trip with equipment and lunch included.', date: '2026-08-03', time: '08:30', pax: 58, unitPrice: 55, totalCost: 3190, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Bookings Desk', contactPhone: '+00 0 000 0007', contactEmail: 'bookings@tour-b.example', notes: 'Awaiting confirmation on pupil count.', createdAt: '2026-03-05T00:00:00Z' },
      { id: 'bk_8', tripId, type: 'transfer', status: 'confirmed', supplier: 'Sunrise Travels', reference: 'ST-TRF-2026', title: 'Airport transfers & inter-city coach', description: 'All ground transport throughout the trip.', date: '2026-07-28', time: '—', pax: 70, unitPrice: 0, totalCost: 8400, currency: 'USD', paidAmount: 2520, paidAt: '2026-02-20T00:00:00Z', contactName: 'Operations Desk', contactPhone: '+00 0 000 0008', contactEmail: 'ops@transport.example', notes: '2 coaches, chaperone vehicle included.', createdAt: '2026-02-10T00:00:00Z' },
      { id: 'bk_9', tripId, type: 'insurance', status: 'pending', supplier: 'AIG Kenya', reference: 'QUOTE-AIG-2026', title: 'Group travel insurance', description: 'Comprehensive cover including medical evacuation.', date: '2026-07-28', time: '—', pax: 70, unitPrice: 28, totalCost: 1960, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Groups Desk', contactPhone: '+00 0 000 0009', contactEmail: 'groups@insurer.example', notes: 'Quote valid until 1 May 2026.', createdAt: '2026-03-10T00:00:00Z' }
    ];

    const communications = [
      { id: 'msg_1', tripId, type: 'email', subject: 'Malaysia trip — payment schedule reminder', body: 'Dear parents, a friendly reminder that the first instalment of $1,000 is due on 20th March 2026.', recipientIds: [], recipientCount: 66, sentAt: '2026-03-05T09:30:00Z', sentBy: 'Trips Coordinator' },
      { id: 'msg_2', tripId, type: 'whatsapp', subject: 'Deposit confirmation', body: 'Deposit received, thank you. Documents link sent separately.', recipientIds: [], recipientCount: 14, sentAt: '2026-02-18T14:20:00Z', sentBy: 'Trips Coordinator' },
      { id: 'msg_3', tripId, type: 'email', subject: 'Safety advisory — update on regional situation', body: 'Dear parents, we wish to address concerns raised about the ongoing regional situation. Please find our risk assessment attached.', recipientIds: [], recipientCount: 66, sentAt: '2026-03-01T11:00:00Z', sentBy: 'Trips Coordinator' },
      { id: 'msg_4', tripId, type: 'sms', subject: 'Document reminder', body: 'Please submit passport copies by 15 March. Upload via parent portal.', recipientIds: [], recipientCount: 24, sentAt: '2026-03-08T08:00:00Z', sentBy: 'Trips Coordinator' }
    ];

    // Demo accounts. Dev-only — plain-text passwords, localhost only.
    // The parent is linked to the first two seeded pupils and has an active interest.
    const linkedPupilIds = pupils.slice(0, 2).map(p => p.id);
    const users = [
      {
        id: 'user_admin',
        email: 'admin@mvs.test',
        password: 'admin123',
        role: 'admin',
        name: 'Trips Coordinator',
        linkedPupilIds: [],
        linkedInterestTokens: []
      },
      {
        id: 'user_parent',
        email: 'parent@example.com',
        password: 'parent123',
        role: 'parent',
        name: pupils[0] ? `${pupils[0].guardianName}` : 'Parent',
        linkedPupilIds,
        linkedInterestTokens: []  // populated when they submit via the brochure
      }
    ];

    const interests = [
      {
        id: 'int_seed_1',
        token: 'demo-parent-interest-token',
        tripId: 'trip_coast_2026',
        parentName: users[1].name,
        parentPhone: '0710-000-001',
        parentEmail: users[1].email,
        pupilName: 'Sibling Student',
        pupilGrade: 5,
        note: 'Interested in the Coast trip for our younger child.',
        dob: null,
        medicalNotes: '',
        dietaryNotes: '',
        additionalNotes: '',
        documentsRequested: [],
        documentsSubmitted: [],
        status: 'new',
        submittedAt: new Date(2026, 3, 10).toISOString(),
        updatedAt: new Date(2026, 3, 10).toISOString()
      }
    ];
    users[1].linkedInterestTokens = [interests[0].token];

    return { trips, pupils, documents, payments, activities, bookings, communications, documentTypes, users, interests };
  },

  seedIfNeeded(force = false) {
    if (!force && Storage.get(StorageKeys.SEEDED)) return;
    const data = Seed.build();
    Storage.set(StorageKeys.TRIPS, data.trips);
    Storage.set(StorageKeys.PUPILS, data.pupils);
    Storage.set(StorageKeys.DOCUMENTS, data.documents);
    Storage.set(StorageKeys.PAYMENTS, data.payments);
    Storage.set(StorageKeys.ACTIVITIES, data.activities);
    Storage.set(StorageKeys.BOOKINGS, data.bookings);
    Storage.set(StorageKeys.COMMUNICATIONS, data.communications);
    Storage.set(StorageKeys.DOCUMENT_TYPES, data.documentTypes);
    Storage.set(StorageKeys.USERS, data.users);
    Storage.set(StorageKeys.INTERESTS, data.interests);
    Storage.set(StorageKeys.SETTINGS, {
      activeTripId: 'trip_malaysia_2026',
      currency: 'USD',
      school: { name: 'Mountain View School', code: 'MVS' }
    });
    Storage.set(StorageKeys.SEEDED, true);
  }
};
