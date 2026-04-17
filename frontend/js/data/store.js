/* ==========================================
   STORE — central CRUD + pub/sub
   ==========================================
   Single source of truth. Pages subscribe to
   relevant collections and re-render on change.
*/

const Store = (function () {
  const listeners = new Map(); // collectionName -> Set<callback>

  function notify(collection) {
    const set = listeners.get(collection);
    if (set) {
      set.forEach(cb => {
        try { cb(); } catch (e) { console.error('[Store.notify]', collection, e); }
      });
    }
    const all = listeners.get('*');
    if (all) {
      all.forEach(cb => {
        try { cb(collection); } catch (e) { console.error('[Store.notify *]', collection, e); }
      });
    }
  }

  function subscribe(collection, callback) {
    if (!listeners.has(collection)) listeners.set(collection, new Set());
    listeners.get(collection).add(callback);
    return () => listeners.get(collection).delete(callback);
  }

  // ----- SETTINGS -----
  function settings() {
    return Storage.get(StorageKeys.SETTINGS, {});
  }
  function setSettings(patch) {
    const s = { ...settings(), ...patch };
    Storage.set(StorageKeys.SETTINGS, s);
    notify('settings');
    return s;
  }
  function activeTripId() {
    return settings().activeTripId;
  }
  function setActiveTrip(tripId) {
    setSettings({ activeTripId: tripId });
    notify('activeTrip');
  }

  // ----- TRIPS -----
  function getTrips() { return Storage.get(StorageKeys.TRIPS, []); }
  function getTrip(id) { return getTrips().find(t => t.id === id); }
  function activeTrip() { return getTrip(activeTripId()); }

  function createTrip(data) {
    const trips = getTrips();
    const trip = { ...Schema.newTrip(), ...data, id: data.id || Fmt.uid('trip') };
    trips.push(trip);
    Storage.set(StorageKeys.TRIPS, trips);
    notify('trips');
    return trip;
  }
  function updateTrip(id, patch) {
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trips[idx] = { ...trips[idx], ...patch };
    Storage.set(StorageKeys.TRIPS, trips);
    notify('trips');
    return trips[idx];
  }
  function deleteTrip(id) {
    Storage.set(StorageKeys.TRIPS, getTrips().filter(t => t.id !== id));
    // Cascade deletes
    Storage.set(StorageKeys.PUPILS, getPupils().filter(p => p.tripId !== id));
    Storage.set(StorageKeys.PAYMENTS, getPayments().filter(p => p.tripId !== id));
    Storage.set(StorageKeys.DOCUMENTS, getDocuments().filter(d => d.tripId !== id));
    Storage.set(StorageKeys.BOOKINGS, getBookings().filter(b => b.tripId !== id));
    Storage.set(StorageKeys.ACTIVITIES, getActivities().filter(a => a.tripId !== id));
    Storage.set(StorageKeys.COMMUNICATIONS, getCommunications().filter(c => c.tripId !== id));
    notify('trips');
    notify('pupils');
    notify('payments');
    notify('documents');
    notify('bookings');
    notify('activities');
    notify('communications');
  }

  // ----- PUPILS -----
  function getPupils(tripId = null) {
    const all = Storage.get(StorageKeys.PUPILS, []);
    return tripId ? all.filter(p => p.tripId === tripId) : all;
  }
  function getPupil(id) { return Storage.get(StorageKeys.PUPILS, []).find(p => p.id === id); }

  function createPupil(data) {
    const pupils = Storage.get(StorageKeys.PUPILS, []);
    const pupil = {
      ...Schema.newPupil(),
      tripId: activeTripId(),
      ...data,
      id: data.id || Fmt.uid('pup')
    };
    pupils.push(pupil);
    Storage.set(StorageKeys.PUPILS, pupils);
    // Auto-create document placeholders
    getDocumentTypes().filter(dt => dt.required).forEach(dt => {
      createDocument({
        tripId: pupil.tripId,
        pupilId: pupil.id,
        typeId: dt.id,
        status: 'missing'
      });
    });
    notify('pupils');
    notify('documents');
    return pupil;
  }
  function updatePupil(id, patch) {
    const pupils = Storage.get(StorageKeys.PUPILS, []);
    const idx = pupils.findIndex(p => p.id === id);
    if (idx === -1) return null;
    pupils[idx] = { ...pupils[idx], ...patch };
    Storage.set(StorageKeys.PUPILS, pupils);
    notify('pupils');
    return pupils[idx];
  }
  function deletePupil(id) {
    Storage.set(StorageKeys.PUPILS, Storage.get(StorageKeys.PUPILS, []).filter(p => p.id !== id));
    Storage.set(StorageKeys.DOCUMENTS, getDocuments().filter(d => d.pupilId !== id));
    Storage.set(StorageKeys.PAYMENTS, getPayments().filter(p => p.pupilId !== id));
    notify('pupils');
    notify('documents');
    notify('payments');
  }

  function bulkUpdatePupils(ids, patch) {
    const pupils = Storage.get(StorageKeys.PUPILS, []);
    let count = 0;
    ids.forEach(id => {
      const idx = pupils.findIndex(p => p.id === id);
      if (idx !== -1) {
        pupils[idx] = { ...pupils[idx], ...patch };
        count++;
      }
    });
    Storage.set(StorageKeys.PUPILS, pupils);
    notify('pupils');
    return count;
  }

  function bulkDeletePupils(ids) {
    const remaining = Storage.get(StorageKeys.PUPILS, []).filter(p => !ids.includes(p.id));
    Storage.set(StorageKeys.PUPILS, remaining);
    Storage.set(StorageKeys.DOCUMENTS, getDocuments().filter(d => !ids.includes(d.pupilId)));
    Storage.set(StorageKeys.PAYMENTS, getPayments().filter(p => !ids.includes(p.pupilId)));
    notify('pupils');
    notify('documents');
    notify('payments');
  }

  // ----- PAYMENTS -----
  function getPayments(tripId = null) {
    const all = Storage.get(StorageKeys.PAYMENTS, []);
    return tripId ? all.filter(p => p.tripId === tripId) : all;
  }
  function getPayment(id) { return Storage.get(StorageKeys.PAYMENTS, []).find(p => p.id === id); }
  function getPupilPayments(pupilId) {
    return getPayments().filter(p => p.pupilId === pupilId);
  }
  function getPupilBalance(pupilId) {
    const trip = getTrip(getPupil(pupilId)?.tripId);
    if (!trip) return { paid: 0, balance: 0, total: 0 };
    const paid = getPupilPayments(pupilId).reduce((sum, p) => sum + Number(p.amount), 0);
    return { paid, balance: trip.costPerPupil - paid, total: trip.costPerPupil };
  }

  function createPayment(data) {
    const payments = Storage.get(StorageKeys.PAYMENTS, []);
    const payment = {
      ...Schema.newPayment(),
      tripId: activeTripId(),
      ...data,
      id: data.id || Fmt.uid('pay')
    };
    payments.push(payment);
    Storage.set(StorageKeys.PAYMENTS, payments);
    // Auto-update pupil payment status
    if (payment.pupilId) {
      const { paid, total } = getPupilBalance(payment.pupilId);
      const newStatus = paid >= total ? 'paid' : (paid > 0 ? 'deposit' : 'pending');
      updatePupil(payment.pupilId, { paymentStatus: newStatus });
    }
    notify('payments');
    return payment;
  }
  function deletePayment(id) {
    const payment = getPayment(id);
    Storage.set(StorageKeys.PAYMENTS, Storage.get(StorageKeys.PAYMENTS, []).filter(p => p.id !== id));
    if (payment?.pupilId) {
      const { paid, total } = getPupilBalance(payment.pupilId);
      const newStatus = paid >= total ? 'paid' : (paid > 0 ? 'deposit' : 'pending');
      updatePupil(payment.pupilId, { paymentStatus: newStatus });
    }
    notify('payments');
  }

  // ----- DOCUMENTS -----
  function getDocuments(tripId = null) {
    const all = Storage.get(StorageKeys.DOCUMENTS, []);
    return tripId ? all.filter(d => d.tripId === tripId) : all;
  }
  function getDocument(id) { return Storage.get(StorageKeys.DOCUMENTS, []).find(d => d.id === id); }
  function getPupilDocuments(pupilId) {
    return getDocuments().filter(d => d.pupilId === pupilId);
  }

  function createDocument(data) {
    const docs = Storage.get(StorageKeys.DOCUMENTS, []);
    const doc = {
      ...Schema.newDocument(),
      tripId: activeTripId(),
      ...data,
      id: data.id || Fmt.uid('doc')
    };
    docs.push(doc);
    Storage.set(StorageKeys.DOCUMENTS, docs);
    notify('documents');
    return doc;
  }
  function updateDocument(id, patch) {
    const docs = Storage.get(StorageKeys.DOCUMENTS, []);
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...patch };
    Storage.set(StorageKeys.DOCUMENTS, docs);
    notify('documents');
    return docs[idx];
  }

  // ----- DOCUMENT TYPES -----
  function getDocumentTypes() { return Storage.get(StorageKeys.DOCUMENT_TYPES, []); }
  function getDocumentType(id) { return getDocumentTypes().find(d => d.id === id); }
  function createDocumentType(data) {
    const types = getDocumentTypes();
    const dt = { ...Schema.newDocumentType(), ...data, id: data.id || Fmt.uid('dtype') };
    types.push(dt);
    Storage.set(StorageKeys.DOCUMENT_TYPES, types);
    notify('documentTypes');
    return dt;
  }
  function updateDocumentType(id, patch) {
    const types = getDocumentTypes();
    const idx = types.findIndex(d => d.id === id);
    if (idx === -1) return null;
    types[idx] = { ...types[idx], ...patch };
    Storage.set(StorageKeys.DOCUMENT_TYPES, types);
    notify('documentTypes');
    return types[idx];
  }

  // ----- BOOKINGS -----
  function getBookings(tripId = null) {
    const all = Storage.get(StorageKeys.BOOKINGS, []);
    return tripId ? all.filter(b => b.tripId === tripId) : all;
  }
  function getBooking(id) { return Storage.get(StorageKeys.BOOKINGS, []).find(b => b.id === id); }
  function createBooking(data) {
    const bookings = Storage.get(StorageKeys.BOOKINGS, []);
    const booking = {
      ...Schema.newBooking(),
      tripId: activeTripId(),
      ...data,
      id: data.id || Fmt.uid('bk')
    };
    bookings.push(booking);
    Storage.set(StorageKeys.BOOKINGS, bookings);
    notify('bookings');
    return booking;
  }
  function updateBooking(id, patch) {
    const bookings = Storage.get(StorageKeys.BOOKINGS, []);
    const idx = bookings.findIndex(b => b.id === id);
    if (idx === -1) return null;
    bookings[idx] = { ...bookings[idx], ...patch };
    Storage.set(StorageKeys.BOOKINGS, bookings);
    notify('bookings');
    return bookings[idx];
  }
  function deleteBooking(id) {
    Storage.set(StorageKeys.BOOKINGS, Storage.get(StorageKeys.BOOKINGS, []).filter(b => b.id !== id));
    notify('bookings');
  }

  // ----- ACTIVITIES -----
  function getActivities(tripId = null) {
    const all = Storage.get(StorageKeys.ACTIVITIES, []);
    return tripId ? all.filter(a => a.tripId === tripId) : all;
  }
  function getActivity(id) { return Storage.get(StorageKeys.ACTIVITIES, []).find(a => a.id === id); }
  function createActivity(data) {
    const acts = Storage.get(StorageKeys.ACTIVITIES, []);
    const act = {
      ...Schema.newActivity(),
      tripId: activeTripId(),
      ...data,
      id: data.id || Fmt.uid('act')
    };
    acts.push(act);
    Storage.set(StorageKeys.ACTIVITIES, acts);
    notify('activities');
    return act;
  }
  function updateActivity(id, patch) {
    const acts = Storage.get(StorageKeys.ACTIVITIES, []);
    const idx = acts.findIndex(a => a.id === id);
    if (idx === -1) return null;
    acts[idx] = { ...acts[idx], ...patch };
    Storage.set(StorageKeys.ACTIVITIES, acts);
    notify('activities');
    return acts[idx];
  }
  function deleteActivity(id) {
    Storage.set(StorageKeys.ACTIVITIES, Storage.get(StorageKeys.ACTIVITIES, []).filter(a => a.id !== id));
    notify('activities');
  }

  // ----- COMMUNICATIONS -----
  function getCommunications(tripId = null) {
    const all = Storage.get(StorageKeys.COMMUNICATIONS, []);
    return tripId ? all.filter(c => c.tripId === tripId) : all;
  }
  function createCommunication(data) {
    const comms = Storage.get(StorageKeys.COMMUNICATIONS, []);
    const msg = {
      ...Schema.newCommunication(),
      tripId: activeTripId(),
      ...data,
      id: data.id || Fmt.uid('msg')
    };
    comms.push(msg);
    Storage.set(StorageKeys.COMMUNICATIONS, comms);
    notify('communications');
    return msg;
  }

  // ----- INTERESTS (parent-submitted pre-trip interest) -----
  function getInterests(tripId = null) {
    const all = Storage.get(StorageKeys.INTERESTS, []);
    return tripId ? all.filter(i => i.tripId === tripId) : all;
  }
  function getInterest(id) {
    return Storage.get(StorageKeys.INTERESTS, []).find(i => i.id === id);
  }
  function updateInterest(id, patch) {
    const all = Storage.get(StorageKeys.INTERESTS, []);
    const idx = all.findIndex(i => i.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    Storage.set(StorageKeys.INTERESTS, all);
    notify('interests');
    return all[idx];
  }
  function deleteInterest(id) {
    const remaining = Storage.get(StorageKeys.INTERESTS, []).filter(i => i.id !== id);
    Storage.set(StorageKeys.INTERESTS, remaining);
    notify('interests');
  }

  // Convert an interest into a real pupil + mark interest converted.
  function convertInterestToPupil(interestId, extra = {}) {
    const interest = getInterest(interestId);
    if (!interest) return null;
    const nameParts = (interest.pupilName || '').trim().split(/\s+/);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');
    const pupil = createPupil({
      tripId: interest.tripId,
      firstName, lastName,
      grade: interest.pupilGrade || 6,
      guardianName: interest.parentName,
      guardianPhone: interest.parentPhone,
      guardianEmail: interest.parentEmail,
      dob: interest.dob || null,
      medicalNotes: interest.medicalNotes || '',
      dietaryNotes: interest.dietaryNotes || '',
      note: interest.additionalNotes || interest.note || '',
      ...extra
    });
    updateInterest(interestId, { status: 'converted', convertedPupilId: pupil.id });
    return pupil;
  }

  // ----- CLUBS -----
  function getClubs() { return Storage.get(StorageKeys.CLUBS, []); }
  function getClub(id) { return getClubs().find(c => c.id === id); }
  function createClub(data) {
    const clubs = getClubs();
    const club = { ...Schema.newClub(), ...data, id: data.id || Fmt.uid('club') };
    clubs.push(club);
    Storage.set(StorageKeys.CLUBS, clubs);
    notify('clubs');
    return club;
  }
  function updateClub(id, patch) {
    const clubs = getClubs();
    const idx = clubs.findIndex(c => c.id === id);
    if (idx === -1) return null;
    clubs[idx] = { ...clubs[idx], ...patch };
    Storage.set(StorageKeys.CLUBS, clubs);
    notify('clubs');
    return clubs[idx];
  }
  function deleteClub(id) {
    Storage.set(StorageKeys.CLUBS, getClubs().filter(c => c.id !== id));
    // Cascade: drop memberships for this club
    Storage.set(StorageKeys.CLUB_MEMBERS, getClubMembers().filter(m => m.clubId !== id));
    // Remove from any trip.clubIds
    const trips = getTrips();
    let tripsChanged = false;
    trips.forEach(t => {
      if (t.clubIds && t.clubIds.includes(id)) {
        t.clubIds = t.clubIds.filter(x => x !== id);
        tripsChanged = true;
      }
    });
    if (tripsChanged) Storage.set(StorageKeys.TRIPS, trips);
    notify('clubs');
    notify('clubMembers');
    if (tripsChanged) notify('trips');
  }

  // ----- CLUB MEMBERSHIPS -----
  function getClubMembers() { return Storage.get(StorageKeys.CLUB_MEMBERS, []); }
  function getClubMembership(id) { return getClubMembers().find(m => m.id === id); }
  function getMembersOfClub(clubId) { return getClubMembers().filter(m => m.clubId === clubId); }
  function getClubsForPupil(pupilId) {
    const memberships = getClubMembers().filter(m => m.pupilId === pupilId);
    const clubs = getClubs();
    return memberships.map(m => ({ ...m, club: clubs.find(c => c.id === m.clubId) }));
  }
  function addClubMember(data) {
    const existing = getClubMembers();
    // Prevent duplicates
    if (existing.some(m => m.clubId === data.clubId && m.pupilId === data.pupilId)) return null;
    const member = { ...Schema.newClubMember(), ...data, id: data.id || Fmt.uid('cmem') };
    existing.push(member);
    Storage.set(StorageKeys.CLUB_MEMBERS, existing);
    notify('clubMembers');
    return member;
  }
  function removeClubMember(id) {
    Storage.set(StorageKeys.CLUB_MEMBERS, getClubMembers().filter(m => m.id !== id));
    notify('clubMembers');
  }
  function updateClubMember(id, patch) {
    const all = getClubMembers();
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch };
    Storage.set(StorageKeys.CLUB_MEMBERS, all);
    notify('clubMembers');
    return all[idx];
  }
  function getTripsForClub(clubId) {
    return getTrips().filter(t => (t.clubIds || []).includes(clubId));
  }

  // ----- COMPUTED STATS -----
  function tripStats(tripId = null) {
    const id = tripId || activeTripId();
    const trip = getTrip(id);
    if (!trip) return null;
    const pupils = getPupils(id);
    const payments = getPayments(id);
    const docs = getDocuments(id);

    const totalExpected = pupils.length * trip.costPerPupil;
    const collected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const byStatus = {
      paid: pupils.filter(p => p.paymentStatus === 'paid').length,
      deposit: pupils.filter(p => p.paymentStatus === 'deposit').length,
      pending: pupils.filter(p => p.paymentStatus === 'pending').length,
      overdue: pupils.filter(p => p.paymentStatus === 'overdue').length,
    };

    const verifiedDocs = docs.filter(d => d.status === 'verified').length;
    const docCompliance = docs.length ? verifiedDocs / docs.length : 0;

    const byGrade = {};
    pupils.forEach(p => { byGrade[p.grade] = (byGrade[p.grade] || 0) + 1; });

    const byGender = {
      M: pupils.filter(p => p.gender === 'M').length,
      F: pupils.filter(p => p.gender === 'F').length
    };

    const chaperones = trip.chaperones || 0;
    const parentsJoining = trip.parentsJoining || 0;
    const seatsUsed = pupils.length + chaperones + parentsJoining;

    return {
      trip,
      enrolled: pupils.length,
      chaperones,
      parentsJoining,
      seatsUsed,
      seatsLeft: Math.max(0, (trip.seatsTotal || 0) - seatsUsed),
      overCapacity: seatsUsed > (trip.seatsTotal || 0),
      totalExpected,
      collected,
      outstanding: totalExpected - collected,
      percentCollected: totalExpected ? collected / totalExpected : 0,
      byStatus,
      verifiedDocs,
      totalDocs: docs.length,
      docCompliance,
      byGrade,
      byGender,
      daysUntil: Fmt.daysUntil(trip.startDate),
      flaggedCount: pupils.filter(p => p.flagged).length
    };
  }

  return {
    subscribe,
    settings, setSettings, activeTripId, setActiveTrip,
    getTrips, getTrip, activeTrip, createTrip, updateTrip, deleteTrip,
    getPupils, getPupil, createPupil, updatePupil, deletePupil, bulkUpdatePupils, bulkDeletePupils,
    getPayments, getPayment, getPupilPayments, getPupilBalance, createPayment, deletePayment,
    getDocuments, getDocument, getPupilDocuments, createDocument, updateDocument,
    getDocumentTypes, getDocumentType, createDocumentType, updateDocumentType,
    getBookings, getBooking, createBooking, updateBooking, deleteBooking,
    getActivities, getActivity, createActivity, updateActivity, deleteActivity,
    getCommunications, createCommunication,
    getInterests, getInterest, updateInterest, deleteInterest, convertInterestToPupil,
    getClubs, getClub, createClub, updateClub, deleteClub,
    getClubMembers, getClubMembership, getMembersOfClub, getClubsForPupil,
    addClubMember, removeClubMember, updateClubMember, getTripsForClub,
    tripStats
  };
})();
