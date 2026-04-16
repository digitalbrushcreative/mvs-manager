/* ==========================================
   SEED DATA — realistic starter dataset
   ==========================================
   Built from the real school roster. Run once to
   populate localStorage on first visit.
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
        gradesAllowed: [6, 7, 8, 9],
        seatsTotal: 80,
        costPerPupil: 3000,
        currency: 'USD',
        chaperones: 4,
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
        gradesAllowed: [7, 8, 9],
        seatsTotal: 40,
        costPerPupil: 4500,
        currency: 'USD',
        chaperones: 3,
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
        gradesAllowed: [5, 6, 7],
        seatsTotal: 50,
        costPerPupil: 450,
        currency: 'USD',
        chaperones: 4,
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
        gradesAllowed: [4, 5, 6],
        seatsTotal: 60,
        costPerPupil: 280,
        currency: 'USD',
        chaperones: 5,
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

    const pupilsRaw = [
      { a: '652193', n: 'Alice Martina Achieng', g: 6, s: 'F', gn: 'Robert Owuor', gp: '0721861143', ge: 'robertowuor82@gmail.com', ps: 'pending', note: 'Awaiting Mdm. Reginah confirmation · Sibling: Leon', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'missing'} },
      { a: '653194', n: 'Chrissy Grace Lumbasi', g: 6, s: 'F', gn: 'George Wanjala Lumbasi', gp: '0722704858', ge: 'lumbasigeorge@gmail.com', ps: 'pending', note: 'Paying full on 15 Mar — one instalment', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '653143', n: 'Comfort Gathoni Murimi', g: 6, s: 'F', gn: 'Muriithi', gp: '0722459112', ge: 'muriithi@yahoo.com', ps: 'pending', note: 'Will confirm by 20.3.26', fl: false, docs: {P:'submitted',C:'submitted',M:'missing',I:'missing'} },
      { a: '654031', n: 'Ellah Akatu', g: 6, s: 'F', gn: 'Seth Akatu', gp: '0723232299', ge: 'sakaatus@yahoo.com', ps: 'pending', note: 'Dad will get back to us. He lost his mom.', fl: true, docs: {P:'missing',C:'missing',M:'missing',I:'missing'} },
      { a: '652218', n: 'Hope Blessings Wanjiru', g: 6, s: 'F', gn: 'Grace Muthuma', gp: '0729165297', ge: 'Muthumagrace@gmail.com', ps: 'deposit', note: 'Deposit received · awaiting instalment 1', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'submitted'} },
      { a: '654657', n: 'Kayla Kendi', g: 6, s: 'F', gn: 'Anne Kimaita', gp: '0711892413', ge: 'kimaitaanne@gmail.com', ps: 'pending', note: 'Payment details sent via WhatsApp', fl: true, docs: {P:'missing',C:'submitted',M:'missing',I:'missing'} },
      { a: '652120', n: 'Trevor Nderitu Warungu', g: 6, s: 'M', gn: 'Reuel Warungu', gp: '0723594884', ge: 'bkmurrey@gmail.com', ps: 'deposit', note: 'Deposit received — full compliance', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '652353', n: 'Zoe Njeri Kimani', g: 6, s: 'F', gn: 'Bella Vista Kenya', gp: '0706361656', ge: 'belavistakenya@gmail.com', ps: 'pending', note: 'Muchai spoke to her · paying this week', fl: false, docs: {P:'submitted',C:'submitted',M:'submitted',I:'missing'} },
      { a: '653505', n: 'Baraka Rita Wamuyu Nganga', g: 7, s: 'F', gn: 'Rahab Wambui Mungai', gp: '0725699697', ge: 'rahimungai@gmail.com', ps: 'pending', note: 'Paying this week. $100 discount agreed', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'submitted'} },
      { a: '651761', n: 'Brianna Stacey Mbithe Maingi', g: 7, s: 'F', gn: 'Brianna Maingi', gp: '0729635224', ge: '', ps: 'pending', note: 'Concern over pricing vs UK trip. Paying end of March.', fl: true, docs: {P:'verified',C:'submitted',M:'missing',I:'missing'} },
      { a: '654613', n: 'Chantel Njoki Njuguna', g: 7, s: 'F', gn: 'Wanjira Njoroge', gp: '0717406104', ge: 'wanjira.njoroge@gmail.com', ps: 'pending', note: 'Will pay full amount in one instalment', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'submitted'} },
      { a: '653746', n: 'Elianna Njoki Kimani', g: 7, s: 'F', gn: 'Daniel Kimani', gp: '0723510887', ge: 'danielkimani@gmail.com', ps: 'pending', note: 'Still undecided. To confirm this week.', fl: true, docs: {P:'submitted',C:'missing',M:'missing',I:'missing'} },
      { a: '654548', n: 'Gabriella Nuna Njoki', g: 7, s: 'F', gn: 'Edith Nyambura Njoki', gp: '0707126569', ge: 'nyamburaedith0@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'verified'} },
      { a: '654343', n: 'Nuu Egry Wafula', g: 7, s: 'M', gn: 'Davis Bundi', gp: '0710453132', ge: 'dntwiga@gmail.com', ps: 'deposit', note: 'Deposit received — all documents filed', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '653204', n: 'Nathan Kimani', g: 7, s: 'M', gn: 'Brian Njoroge', gp: '0721237431', ge: 'brianbjoroge14@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'submitted'} },
      { a: '652473', n: 'Abigail Mugure', g: 8, s: 'F', gn: 'Elizabeth Wanjiru Nganga', gp: '0721820024', ge: 'ewanjiru520@gmail.com', ps: 'paid', note: 'At bank paying instalment 1 · 10 Mar 12:40', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '652809', n: 'Alvin Muchanga Karagu', g: 8, s: 'M', gn: 'Nelly Karagu', gp: '0721690545', ge: 'karagunelly@gmail.com', ps: 'pending', note: 'Has not decided yet. Will call us.', fl: true, docs: {P:'missing',C:'missing',M:'missing',I:'missing'} },
      { a: '652613', n: "Appleliza Wanjiku Ng'ang'a", g: 8, s: 'F', gn: '—', gp: '0721456429', ge: '', ps: 'pending', note: 'Phone number not going through', fl: true, docs: {P:'missing',C:'missing',M:'missing',I:'missing'} },
      { a: '651474', n: 'Ashley Nyanchoka Nyamwenga', g: 8, s: 'F', gn: 'Anne Gathuthi', gp: '0725010909', ge: 'annegathuthi@gmail.com', ps: 'pending', note: 'Dad to pay by end of the week', fl: false, docs: {P:'submitted',C:'submitted',M:'submitted',I:'missing'} },
      { a: '651323', n: 'Ashlyn Nkatha Mwiti', g: 8, s: 'F', gn: 'Anderson Mwiti', gp: '0721688855', ge: 'kathendu1979@gmail.com', ps: 'pending', note: 'Paying 11 Mar · worried about safety, needs briefing', fl: true, docs: {P:'verified',C:'submitted',M:'verified',I:'missing'} },
      { a: '653546', n: 'Ebby Monyangi Mugoya', g: 8, s: 'F', gn: 'Pamela Mugoyo', gp: '0722800328', ge: 'ocharopam@gmail.com', ps: 'pending', note: 'To confirm when fully decided · performance concern', fl: true, docs: {P:'submitted',C:'missing',M:'missing',I:'missing'} },
      { a: '653737', n: 'Galthy Joy Hadassah', g: 8, s: 'F', gn: 'Gladys Wakhisi', gp: '0722455983', ge: 'gladyssinali@gmail.com', ps: 'pending', note: 'Will pay this week. Attending confirmed.', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'submitted'} },
      { a: '654341', n: 'George Blessing Keita', g: 8, s: 'M', gn: 'Fidele Akinyi Omondi', gp: '0722178638', ge: 'fidele.akinyi@gmail.com', ps: 'deposit', note: 'Deposit received · passport verified', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '654313', n: 'Lisarie Moraa Kinanga', g: 8, s: 'F', gn: 'Christine Khatali', gp: '0721382098', ge: 'anyolochristine1979@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'submitted'} },
      { a: '651392', n: 'Maqbul Mureithi Kamwere', g: 8, s: 'M', gn: 'Joshua Kamwere', gp: '0736474755', ge: 'joshua.kamwere@yahoo.com', ps: 'pending', note: 'Paying 10.3.2026', fl: false, docs: {P:'submitted',C:'submitted',M:'missing',I:'missing'} },
      { a: '652277', n: 'Nava Muthoni Maina', g: 8, s: 'F', gn: 'Alex Maina Macharia', gp: '0720312970', ge: 'alex.machariam@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'submitted'} },
      { a: '652699', n: 'Precious Wanjiru Nderitu', g: 8, s: 'F', gn: 'Nderitu', gp: '0721981158', ge: 'nderitu07@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'submitted',M:'submitted',I:'submitted'} },
      { a: '652564', n: 'Samantha Wanjiku Njoroge', g: 8, s: 'F', gn: 'Anthony Njoroge Kariuki', gp: '0734176576', ge: 'shanellewairimu@gmail.com', ps: 'pending', note: 'Will call to confirm attendance', fl: true, docs: {P:'missing',C:'missing',M:'missing',I:'missing'} },
      { a: '652275', n: 'Tatyana Wanjiru Abdon', g: 8, s: 'F', gn: 'Abdon Karoki', gp: '0723861580', ge: 'karoki.abdon@gmail.com', ps: 'pending', note: 'Will pay on 11.3.26', fl: false, docs: {P:'verified',C:'submitted',M:'submitted',I:'missing'} },
      { a: '653206', n: 'Victoria Wambui Mungai', g: 8, s: 'F', gn: 'Priscillah Njeri Njoroge', gp: '0724469394', ge: 'njorogefloh@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '652123', n: 'Aiden Fidel Kiai Gachanja', g: 9, s: 'M', gn: 'Clement Gachanja', gp: '0721992925', ge: 'clement.gachanja1977@gmail.com', ps: 'pending', note: 'Paying 10.3.2026. Guardian 0796274041', fl: false, docs: {P:'verified',C:'submitted',M:'submitted',I:'missing'} },
      { a: '652017', n: 'Anel Mungai Gacheru', g: 9, s: 'M', gn: '—', gp: '0722735131', ge: '', ps: 'pending', note: 'No response', fl: true, docs: {P:'missing',C:'missing',M:'missing',I:'missing'} },
      { a: '653007', n: 'Anthony Mwaki Mwongera', g: 9, s: 'M', gn: 'Silas Mwongera Mwithimbo', gp: '0722844464', ge: 'mwthmb@yahoo.co.uk', ps: 'pending', note: 'Attending. Will pay this week', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'submitted'} },
      { a: '653386', n: 'Arneiz Mwangi Ngugi', g: 9, s: 'M', gn: 'Peter Ngugi', gp: '447462446428', ge: 'pngunto@yahoo.com', ps: 'overdue', note: 'UK trip paid · requesting deadline extension', fl: true, docs: {P:'verified',C:'verified',M:'submitted',I:'verified'} },
      { a: '652143', n: 'Ashyleen Esther Wambui', g: 9, s: 'F', gn: 'Grace Muthuma', gp: '0729165297', ge: 'Muthumagrace@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'submitted'} },
      { a: '653728', n: 'Baraka Emmanuel Kimani', g: 9, s: 'M', gn: 'Rahab Wambui Mungai', gp: '0725699697', ge: 'rahimungai@gmail.com', ps: 'pending', note: 'Paying this week. $100 discount agreed', fl: false, docs: {P:'verified',C:'submitted',M:'submitted',I:'submitted'} },
      { a: '651278', n: 'Belamie Mwendwa Muriuki', g: 9, s: 'F', gn: 'Rosa Kindea', gp: '0722200995', ge: 'Rosakindealtd@gmail.com', ps: 'pending', note: 'Will contact us when free', fl: true, docs: {P:'submitted',C:'missing',M:'missing',I:'missing'} },
      { a: '651058', n: 'Chalmers Damien Tingu', g: 9, s: 'M', gn: 'Peter Tingu', gp: '0735396918', ge: 'petertingu@yahoo.com', ps: 'pending', note: 'Yet to decide', fl: true, docs: {P:'missing',C:'missing',M:'missing',I:'missing'} },
      { a: '653785', n: 'Claire Heri Kazungu', g: 9, s: 'F', gn: 'Rebecca Mumbi Masili', gp: '0722105281', ge: 'rebeccamasili@gmail.com', ps: 'pending', note: 'Misread deadline — paying by Fri 13 Mar', fl: false, docs: {P:'submitted',C:'verified',M:'verified',I:'missing'} },
      { a: '651094', n: 'Cynthia Waithira Ngugi', g: 9, s: 'F', gn: 'Maggie Michael', gp: '0724985079', ge: 'maggiemichael2023@gmail.com', ps: 'pending', note: 'Making payments on 11.3.26. Saw letter late', fl: false, docs: {P:'verified',C:'submitted',M:'submitted',I:'missing'} },
      { a: '653035', n: 'Gabrielle Waguthi Muu', g: 9, s: 'F', gn: 'Violet Waithira', gp: '0727755123', ge: 'violet.waithera@gmail.com', ps: 'deposit', note: 'Paid 10.3.26', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '651263', n: 'Kayla Lucy Wangui', g: 9, s: 'F', gn: 'Regina Njuguna', gp: '0721601242', ge: '', ps: 'pending', note: "Doesn't have a passport yet", fl: true, docs: {P:'missing',C:'submitted',M:'submitted',I:'missing'} },
      { a: '654056', n: 'Kayla Wanjeri Kagigite', g: 9, s: 'F', gn: 'Alice Wanjiru Kiragu', gp: '0721862482', ge: 'kiragualice@gmail.com', ps: 'pending', note: 'Worried about safety. Will confirm by 13.3.26', fl: true, docs: {P:'verified',C:'submitted',M:'submitted',I:'missing'} },
      { a: '651401', n: 'Keru Nyaruai Weru', g: 9, s: 'F', gn: 'Weru', gp: '0721666702', ge: 'werumb@gmail.com', ps: 'pending', note: 'Paying $500 on 13.3.26 & another $500 by 20.3.26', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'submitted'} },
      { a: '651089', n: 'Leon Gaetano Musiko', g: 9, s: 'M', gn: 'Robert Owuor', gp: '0725757459', ge: 'robertowuor82@gmail.com', ps: 'pending', note: 'Awaiting Mdm. Reginah confirmation · Sibling: Alice', fl: false, docs: {P:'verified',C:'verified',M:'submitted',I:'missing'} },
      { a: '654359', n: 'Michael Keiru Waithaka', g: 9, s: 'M', gn: 'David Waithaka Keiru', gp: '0722550463', ge: 'keirud@gmail.com', ps: 'pending', note: 'To pay on 11.3.26', fl: false, docs: {P:'verified',C:'submitted',M:'submitted',I:'missing'} },
      { a: '651272', n: 'Prince Austin Kago', g: 9, s: 'M', gn: 'Lucy Kimani', gp: '0721993070', ge: 'lucykimani749@gmail.com', ps: 'pending', note: 'To pay on 11.3.26', fl: false, docs: {P:'submitted',C:'submitted',M:'submitted',I:'missing'} },
      { a: '652159', n: 'Ray Victor Iregi Maina', g: 9, s: 'M', gn: 'Bonface Iregi', gp: '0714195707', ge: 'boniregi@gmail.com', ps: 'pending', note: 'To pay on 13.3.26', fl: false, docs: {P:'verified',C:'submitted',M:'missing',I:'missing'} },
      { a: '652875', n: 'Rehema Wamucii Mutiga', g: 9, s: 'F', gn: 'Joe Wachira', gp: '0722578029', ge: 'wachirajoe@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} },
      { a: '654019', n: 'Sandra Mukami Karimi', g: 9, s: 'F', gn: 'Miriam Wanjiru', gp: '0722540582', ge: 'miriamwanjiru402@gmail.com', ps: 'pending', note: 'To pay by 13.3.26', fl: false, docs: {P:'submitted',C:'submitted',M:'submitted',I:'missing'} },
      { a: '653169', n: 'Shantel Njeri Mburu', g: 9, s: 'F', gn: 'Jane Murigi', gp: '0725395931', ge: 'janewanjirumburu1992@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'submitted'} },
      { a: '652113', n: 'Shawn Kamoche Migwi', g: 9, s: 'M', gn: 'Peter Migwi', gp: '0720752361', ge: 'petermigwi@gmail.com', ps: 'pending', note: 'Concerned about war. If it ends sooner, will pay.', fl: true, docs: {P:'verified',C:'submitted',M:'missing',I:'missing'} },
      { a: '654431', n: 'Stephanie Nadra Omore Muga', g: 9, s: 'F', gn: 'David Ayekha Omore', gp: '0723360457', ge: 'davidomore88@gmail.com', ps: 'pending', note: 'Not decided yet. Will confirm 12.3.26', fl: true, docs: {P:'submitted',C:'missing',M:'missing',I:'missing'} },
      { a: '651061', n: 'Tatyanna Muthoni Wachira', g: 9, s: 'F', gn: 'Robert Wachira Macharia', gp: '0725823627', ge: 'robertwachira.m@gmail.com', ps: 'deposit', note: 'Deposit received', fl: false, docs: {P:'verified',C:'verified',M:'verified',I:'verified'} }
    ];

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
          verifiedBy: status === 'verified' ? 'Reginah M.' : null,
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
          recordedBy: 'Reginah M.'
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
          recordedBy: 'Reginah M.'
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
      { id: 'bk_1', tripId, type: 'flight', status: 'confirmed', supplier: 'Kenya Airways', reference: 'KQ0886 / EK348', title: 'NBO → KUL via DXB (outbound)', description: 'Kenya Airways NBO-DXB connecting to Emirates DXB-KUL', date: '2026-07-28', time: '22:35', pax: 70, unitPrice: 1100, totalCost: 77000, currency: 'USD', paidAmount: 23100, paidAt: '2026-02-20T00:00:00Z', contactName: 'Joan Odhiambo', contactPhone: '+254 711 023 040', contactEmail: 'groups@kenya-airways.com', notes: 'Group allocation confirmed, 5kg extra luggage approved.', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'bk_2', tripId, type: 'flight', status: 'confirmed', supplier: 'Emirates', reference: 'EK347 / KQ0887', title: 'PEN → NBO via DXB (return)', description: 'Emirates PEN-DXB connecting to Kenya Airways DXB-NBO', date: '2026-08-08', time: '15:20', pax: 70, unitPrice: 0, totalCost: 0, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Joan Odhiambo', contactPhone: '+254 711 023 040', contactEmail: 'groups@kenya-airways.com', notes: 'Included in outbound ticket.', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'bk_3', tripId, type: 'hotel', status: 'confirmed', supplier: 'Corus Hotel KL', reference: 'RES-KL-2026-4412', title: 'Corus Hotel Kuala Lumpur', description: '4 nights, 18 triple rooms + 2 twins. Breakfast included.', date: '2026-07-29', time: '14:00', pax: 70, unitPrice: 85, totalCost: 23800, currency: 'USD', paidAmount: 7140, paidAt: '2026-02-25T00:00:00Z', contactName: 'Mei Ling', contactPhone: '+60 3 2161 8888', contactEmail: 'groups@corushotel.com', notes: 'Adjacent rooms for chaperones arranged.', createdAt: '2026-02-05T00:00:00Z' },
      { id: 'bk_4', tripId, type: 'hotel', status: 'confirmed', supplier: 'Berjaya Langkawi Resort', reference: 'RES-LGK-2026-220', title: 'Berjaya Langkawi Resort', description: '3 nights, chalets on beach.', date: '2026-08-02', time: '14:00', pax: 70, unitPrice: 120, totalCost: 25200, currency: 'USD', paidAmount: 7560, paidAt: '2026-02-28T00:00:00Z', contactName: 'Azmi Rahman', contactPhone: '+60 4 959 1888', contactEmail: 'reservations@berjayahotel.com', notes: '', createdAt: '2026-02-08T00:00:00Z' },
      { id: 'bk_5', tripId, type: 'hotel', status: 'pending', supplier: 'G Hotel Penang', reference: 'QUOTE-PEN-2026', title: 'G Hotel Kelawai, Penang', description: '4 nights, twin share rooms.', date: '2026-08-05', time: '14:00', pax: 70, unitPrice: 95, totalCost: 26600, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Hassan Ali', contactPhone: '+60 4 238 0000', contactEmail: 'group@ghotel.com', notes: 'Awaiting signed contract.', createdAt: '2026-02-12T00:00:00Z' },
      { id: 'bk_6', tripId, type: 'activity', status: 'confirmed', supplier: 'KL Tours', reference: 'KLT-PTT-2026', title: 'Petronas Twin Towers Access', description: 'Group access tickets for Observation Deck.', date: '2026-07-30', time: '09:00', pax: 70, unitPrice: 18, totalCost: 1260, currency: 'USD', paidAmount: 1260, paidAt: '2026-03-01T00:00:00Z', contactName: 'Wei Chen', contactPhone: '+60 3 2380 3388', contactEmail: 'bookings@kltours.com', notes: '', createdAt: '2026-02-15T00:00:00Z' },
      { id: 'bk_7', tripId, type: 'activity', status: 'quoted', supplier: 'Island Hopper Co.', reference: 'QUOTE-IH-2026', title: 'Island hopping & snorkelling', description: 'Day trip with equipment and lunch included.', date: '2026-08-03', time: '08:30', pax: 58, unitPrice: 55, totalCost: 3190, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Raj Kumar', contactPhone: '+60 4 955 2288', contactEmail: 'bookings@islandhopper.com', notes: 'Awaiting confirmation on pupil count.', createdAt: '2026-03-05T00:00:00Z' },
      { id: 'bk_8', tripId, type: 'transfer', status: 'confirmed', supplier: 'Sunrise Travels', reference: 'ST-TRF-2026', title: 'Airport transfers & inter-city coach', description: 'All ground transport throughout the trip.', date: '2026-07-28', time: '—', pax: 70, unitPrice: 0, totalCost: 8400, currency: 'USD', paidAmount: 2520, paidAt: '2026-02-20T00:00:00Z', contactName: 'Rosnah Ismail', contactPhone: '+60 3 2142 5588', contactEmail: 'ops@sunrisetravels.my', notes: '2 coaches, chaperone vehicle included.', createdAt: '2026-02-10T00:00:00Z' },
      { id: 'bk_9', tripId, type: 'insurance', status: 'pending', supplier: 'AIG Kenya', reference: 'QUOTE-AIG-2026', title: 'Group travel insurance', description: 'Comprehensive cover including medical evacuation.', date: '2026-07-28', time: '—', pax: 70, unitPrice: 28, totalCost: 1960, currency: 'USD', paidAmount: 0, paidAt: null, contactName: 'Mercy Wanjiku', contactPhone: '+254 20 361 4000', contactEmail: 'groups@aig.co.ke', notes: 'Quote valid until 1 May 2026.', createdAt: '2026-03-10T00:00:00Z' }
    ];

    const communications = [
      { id: 'msg_1', tripId, type: 'email', subject: 'Malaysia trip — payment schedule reminder', body: 'Dear parents, a friendly reminder that the first instalment of $1,000 is due on 20th March 2026.', recipientIds: [], recipientCount: 66, sentAt: '2026-03-05T09:30:00Z', sentBy: 'Reginah M.' },
      { id: 'msg_2', tripId, type: 'whatsapp', subject: 'Deposit confirmation', body: 'Deposit received, thank you. Documents link sent separately.', recipientIds: [], recipientCount: 14, sentAt: '2026-02-18T14:20:00Z', sentBy: 'Reginah M.' },
      { id: 'msg_3', tripId, type: 'email', subject: 'Safety advisory — update on regional situation', body: 'Dear parents, we wish to address concerns raised about the ongoing regional situation. Please find our risk assessment attached.', recipientIds: [], recipientCount: 66, sentAt: '2026-03-01T11:00:00Z', sentBy: 'Reginah M.' },
      { id: 'msg_4', tripId, type: 'sms', subject: 'Document reminder', body: 'Please submit passport copies by 15 March. Upload via parent portal.', recipientIds: [], recipientCount: 24, sentAt: '2026-03-08T08:00:00Z', sentBy: 'Reginah M.' }
    ];

    return { trips, pupils, documents, payments, activities, bookings, communications, documentTypes };
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
    Storage.set(StorageKeys.SETTINGS, {
      activeTripId: 'trip_malaysia_2026',
      currency: 'USD',
      school: { name: 'Mountain View School', code: 'MVS' }
    });
    Storage.set(StorageKeys.SEEDED, true);
  }
};
