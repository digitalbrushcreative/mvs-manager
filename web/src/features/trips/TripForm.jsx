import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Confirm,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '../../design-system';
import { useTrips } from '../../lib/hooks/useTrips';
import { useTripDelete } from '../../lib/hooks/useTripDelete';
import { useStaff } from '../../lib/hooks/useStaff';
import { useClubs } from '../../lib/hooks/useClubs';
import { usePupils } from '../../lib/hooks/usePupils';
import { Enums, newTrip, STAFF_ROLE_META } from '../../lib/schema';
import styles from './TripForm.module.css';

const EMPTY = newTrip();

export function TripForm({ open, onClose, tripId }) {
  const isEdit = Boolean(tripId);
  const toast = useToast();
  const { data: trips, create, update } = useTrips();
  const cascadeDelete = useTripDelete();
  const { data: staff } = useStaff();
  const { data: clubs } = useClubs();
  const { data: pupils } = usePupils();

  const existing = tripId ? trips.find((t) => t.id === tripId) : null;
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? { ...EMPTY, ...existing } : newTrip());
    setConfirmDelete(false);
  }, [open, existing]);

  const enrolled = useMemo(
    () => (isEdit ? pupils.filter((p) => p.tripId === tripId).length : 0),
    [pupils, tripId, isEdit],
  );

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleClub(id) {
    setForm((f) => {
      const ids = new Set(f.clubIds || []);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ...f, clubIds: Array.from(ids) };
    });
  }

  function toggleStaff(id) {
    setForm((f) => {
      const ids = new Set(f.assignedStaffIds || []);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ...f, assignedStaffIds: Array.from(ids) };
    });
  }

  const seatsTotal = parseInt(form.seatsTotal, 10) || 0;
  const chaperones = parseInt(form.chaperones, 10) || 0;
  const parents = parseInt(form.parentsJoining, 10) || 0;
  const used = enrolled + chaperones + parents;
  const left = seatsTotal - used;

  const filledChaperones = (form.assignedStaffIds || []).length;
  let staffMessage = `${filledChaperones} of ${chaperones} chaperone seat${chaperones === 1 ? '' : 's'} confirmed`;
  let staffTone = 'hint';
  if (chaperones === 0 && filledChaperones > 0) {
    staffMessage = `${filledChaperones} staff assigned but no chaperone seats reserved — increase the count above`;
    staffTone = 'warning';
  } else if (filledChaperones > chaperones) {
    staffMessage = `${filledChaperones} staff assigned · ${filledChaperones - chaperones} more than reserved seats`;
    staffTone = 'error';
  } else if (chaperones > 0 && filledChaperones === chaperones) {
    staffMessage = `${filledChaperones} of ${chaperones} chaperone seats confirmed · all filled`;
    staffTone = 'success';
  }

  async function save() {
    if (!form.code?.trim() || !form.name?.trim() || !form.destination?.trim() || !form.startDate || !form.endDate) {
      toast.error('Fill the required fields');
      return;
    }
    if (seatsTotal > 0 && used > seatsTotal) {
      toast.error(`Over capacity: ${used} seats needed but only ${seatsTotal} total.`);
      return;
    }
    const payload = {
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
      destination: form.destination.trim(),
      description: (form.description || '').trim(),
      seatsTotal,
      chaperones,
      parentsJoining: parents,
      costPerPupil: parseFloat(form.costPerPupil) || 0,
    };
    try {
      if (isEdit) {
        await update(tripId, payload);
        toast.success('Trip updated');
      } else {
        await create(payload);
        toast.success('Trip created');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await cascadeDelete(tripId);
      toast.success('Trip deleted');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }

  const activeStaff = staff.filter((s) => s.active !== false || (form.assignedStaffIds || []).includes(s.id));

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit trip' : 'New trip'}
        subtitle={form.code || '—'}
        size="xl"
        footer={
          <>
            {isEdit ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete trip
              </Button>
            ) : null}
            <span style={{ flex: 1 }} />
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              {isEdit ? 'Save changes' : 'Create trip'}
            </Button>
          </>
        }
      >
        <Section number={1} title="Basics">
          <FormGrid columns={2}>
            <FormField label="Trip code" required>
              <Input value={form.code} onChange={(e) => setField('code', e.target.value)} placeholder="MVS-MYS-26" />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                {Enums.TripStatus.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Trip type" fullWidth>
              <Select value={form.tripType || 'international'} onChange={(e) => setField('tripType', e.target.value)}>
                {Enums.TripType.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Trip name" required fullWidth>
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </FormField>
            <FormField label="Destination" required fullWidth>
              <Input
                value={form.destination}
                onChange={(e) => setField('destination', e.target.value)}
                placeholder="Kuala Lumpur · Langkawi · Penang"
              />
            </FormField>
            <FormField label="Description" fullWidth>
              <Textarea
                rows={2}
                value={form.description || ''}
                onChange={(e) => setField('description', e.target.value)}
              />
            </FormField>
            <FormField label="Linked clubs" hint="Tag this trip with one or more school clubs" fullWidth>
              <div className={styles.chipPicker}>
                {!clubs.length ? (
                  <span className={styles.empty}>No clubs defined yet — create some in Club Manager.</span>
                ) : (
                  clubs.map((c) => {
                    const active = (form.clubIds || []).includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        className={active ? styles.chipActive : styles.chip}
                        style={active ? { background: c.colour, borderColor: c.colour, color: '#fff' } : undefined}
                        onClick={() => toggleClub(c.id)}
                      >
                        {c.emoji} {c.name}
                      </button>
                    );
                  })
                )}
              </div>
            </FormField>
          </FormGrid>
        </Section>

        <Section number={2} title="Schedule & capacity">
          <FormGrid columns={2}>
            <FormField label="Start date" required>
              <Input
                type="date"
                value={form.startDate ? form.startDate.slice(0, 10) : ''}
                onChange={(e) => setField('startDate', e.target.value)}
              />
            </FormField>
            <FormField label="End date" required>
              <Input
                type="date"
                value={form.endDate ? form.endDate.slice(0, 10) : ''}
                onChange={(e) => setField('endDate', e.target.value)}
              />
            </FormField>
            <FormField
              label="Total seats"
              required
              fullWidth
              hint={
                seatsTotal > 0
                  ? `${enrolled} pupil${enrolled === 1 ? '' : 's'} + ${chaperones} chap + ${parents} parent${parents === 1 ? '' : 's'} = ${used} of ${seatsTotal} · ${left >= 0 ? `${left} left` : `${Math.abs(left)} over capacity`}`
                  : undefined
              }
            >
              <Input
                type="number"
                min="0"
                value={form.seatsTotal}
                onChange={(e) => setField('seatsTotal', e.target.value)}
              />
            </FormField>
            <FormField label="Chaperones (seats reserved)">
              <Input
                type="number"
                min="0"
                value={form.chaperones}
                onChange={(e) => setField('chaperones', e.target.value)}
              />
            </FormField>
            <FormField label="Parents joining">
              <Input
                type="number"
                min="0"
                value={form.parentsJoining}
                onChange={(e) => setField('parentsJoining', e.target.value)}
              />
            </FormField>
            <FormField
              label="Assign staff to chaperone seats"
              hint={staffMessage}
              fullWidth
              error={staffTone === 'error' ? staffMessage : undefined}
            >
              <div className={styles.chipPicker}>
                {!activeStaff.length ? (
                  <span className={styles.empty}>No staff defined yet — add some in the Staff Directory.</span>
                ) : (
                  activeStaff
                    .slice()
                    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                    .map((s) => {
                      const active = (form.assignedStaffIds || []).includes(s.id);
                      const colour = STAFF_ROLE_META[s.role]?.colour || STAFF_ROLE_META.other.colour;
                      return (
                        <button
                          type="button"
                          key={s.id}
                          className={active ? styles.chipActive : styles.chip}
                          style={active ? { background: colour, borderColor: colour, color: '#fff' } : undefined}
                          onClick={() => toggleStaff(s.id)}
                          title={s.title || s.role}
                        >
                          {s.firstName} {s.lastName}
                          <span className={styles.chipMeta}>{s.role}</span>
                        </button>
                      );
                    })
                )}
              </div>
            </FormField>
          </FormGrid>
        </Section>

        <Section number={3} title="Pricing">
          <FormGrid columns={2}>
            <FormField label="Cost per pupil">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.costPerPupil}
                onChange={(e) => setField('costPerPupil', e.target.value)}
              />
            </FormField>
            <FormField label="Currency">
              <Select value={form.currency} onChange={(e) => setField('currency', e.target.value)}>
                <option value="USD">USD</option>
                <option value="KES">KES</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </Select>
            </FormField>
          </FormGrid>
        </Section>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete entire trip?"
        message={`This will permanently delete "${form.name}" and all of its pupils, payments, documents, bookings, and activities. This cannot be undone.`}
        confirmLabel="Delete trip"
        destructive
      />
    </>
  );
}

function Section({ number, title, children }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionNum}>{number}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}
