import { useEffect, useState } from 'react';
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
import { usePupils } from '../../lib/hooks/usePupils';
import { usePupilDelete } from '../../lib/hooks/usePupilDelete';
import { useTrips } from '../../lib/hooks/useTrips';
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { isTripFrozen } from '../../lib/tripFreeze';
import { newPupil } from '../../lib/schema';

const RELATIONSHIPS = ['parent', 'guardian', 'grandparent', 'aunt/uncle', 'sibling', 'other'];

export function PupilForm({ open, onClose, pupilId }) {
  const isEdit = Boolean(pupilId);
  const toast = useToast();
  const { activeTripId } = useActiveTripId();
  const { data: trips } = useTrips();
  const { data: allPupils, create, update } = usePupils();
  const cascadeDelete = usePupilDelete();

  const trip = trips.find((t) => t.id === activeTripId) || null;
  const existing = pupilId ? allPupils.find((p) => p.id === pupilId) : null;
  const [form, setForm] = useState(() => newPupil({ tripId: activeTripId }));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? { ...newPupil(), ...existing } : newPupil({ tripId: activeTripId }));
    setConfirmDelete(false);
  }, [open, existing, activeTripId]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const { frozen } = isTripFrozen(trip);

  async function save() {
    if (frozen) {
      toast.error('This trip is frozen — pupil records cannot be changed.');
      return;
    }
    const required = ['admissionNo', 'firstName', 'lastName', 'guardianName', 'guardianPhone'];
    const missing = required.filter((k) => !String(form[k] || '').trim());
    if (missing.length) {
      toast.error('Please fill all required fields');
      return;
    }
    const payload = {
      ...form,
      admissionNo: form.admissionNo.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      grade: Number(form.grade),
      guardianName: form.guardianName.trim(),
      guardianPhone: form.guardianPhone.trim(),
      guardianEmail: (form.guardianEmail || '').trim(),
      medicalNotes: (form.medicalNotes || '').trim(),
      dietaryNotes: (form.dietaryNotes || '').trim(),
      note: (form.note || '').trim(),
      flagged: Boolean(form.flagged),
    };
    try {
      if (isEdit) {
        await update(pupilId, payload);
        toast.success(`${payload.firstName} ${payload.lastName} updated`);
      } else {
        await create(payload);
        toast.success(`${payload.firstName} ${payload.lastName} added to trip`);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await cascadeDelete(pupilId);
      toast.success('Pupil deleted');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit pupil' : 'Add pupil'}
        subtitle={trip ? `${trip.code} · ${trip.name}` : '—'}
        size="lg"
        footer={
          <>
            {isEdit ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : null}
            <span style={{ flex: 1 }} />
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              {isEdit ? 'Save changes' : 'Add pupil'}
            </Button>
          </>
        }
      >
        <h4 style={{ fontFamily: 'var(--display)', fontSize: 13, color: 'var(--navy-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
          Pupil details
        </h4>
        <FormGrid columns={2}>
          <FormField label="Admission No" required>
            <Input value={form.admissionNo} onChange={(e) => setField('admissionNo', e.target.value)} placeholder="652193" />
          </FormField>
          <FormField label="Grade" required>
            <Select value={form.grade} onChange={(e) => setField('grade', Number(e.target.value))}>
              {[4, 5, 6, 7, 8, 9].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="First name" required>
            <Input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
          </FormField>
          <FormField label="Last name" required>
            <Input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
          </FormField>
          <FormField label="Gender">
            <Select value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </Select>
          </FormField>
          <FormField label="Date of birth">
            <Input
              type="date"
              value={form.dob ? form.dob.slice(0, 10) : ''}
              onChange={(e) => setField('dob', e.target.value || null)}
            />
          </FormField>
        </FormGrid>

        <h4 style={{ fontFamily: 'var(--display)', fontSize: 13, color: 'var(--navy-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '24px 0 12px' }}>
          Guardian contact
        </h4>
        <FormGrid columns={2}>
          <FormField label="Guardian name" required fullWidth>
            <Input value={form.guardianName} onChange={(e) => setField('guardianName', e.target.value)} />
          </FormField>
          <FormField label="Phone" required>
            <Input value={form.guardianPhone} onChange={(e) => setField('guardianPhone', e.target.value)} placeholder="0722 123 456" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.guardianEmail} onChange={(e) => setField('guardianEmail', e.target.value)} />
          </FormField>
          <FormField label="Relationship" fullWidth>
            <Select
              value={form.guardianRelationship}
              onChange={(e) => setField('guardianRelationship', e.target.value)}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
        </FormGrid>

        <h4 style={{ fontFamily: 'var(--display)', fontSize: 13, color: 'var(--navy-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '24px 0 12px' }}>
          Additional information
        </h4>
        <FormGrid columns={1}>
          <FormField label="Medical notes">
            <Textarea
              rows={2}
              value={form.medicalNotes || ''}
              placeholder="Allergies, conditions, medications…"
              onChange={(e) => setField('medicalNotes', e.target.value)}
            />
          </FormField>
          <FormField label="Dietary notes">
            <Textarea
              rows={2}
              value={form.dietaryNotes || ''}
              placeholder="Dietary requirements, restrictions…"
              onChange={(e) => setField('dietaryNotes', e.target.value)}
            />
          </FormField>
          <FormField label="Coordinator note" hint="Internal — not shared with parents">
            <Textarea rows={2} value={form.note || ''} onChange={(e) => setField('note', e.target.value)} />
          </FormField>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--grey-700)' }}>
            <input
              type="checkbox"
              checked={Boolean(form.flagged)}
              onChange={(e) => setField('flagged', e.target.checked)}
            />
            Flag this pupil for follow-up
          </label>
        </FormGrid>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete pupil?"
        message={`Remove ${form.firstName} ${form.lastName} from this trip? All related payments and documents will also be removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
