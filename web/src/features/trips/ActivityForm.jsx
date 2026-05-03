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
import { useActivities } from '../../lib/hooks/useActivities';
import { useTrips } from '../../lib/hooks/useTrips';
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { isTripFrozen } from '../../lib/tripFreeze';
import { Enums } from '../../lib/schema';

function emptyActivity(tripId) {
  return {
    id: '',
    tripId,
    day: 1,
    title: '',
    description: '',
    startTime: '',
    duration: '',
    type: 'included',
    perPupilCost: 0,
    currency: 'USD',
    capacity: '',
    bookedCount: 0,
    supplier: '',
    notes: '',
  };
}

export function ActivityForm({ open, onClose, activityId, defaultDay }) {
  const isEdit = Boolean(activityId);
  const toast = useToast();
  const { activeTripId } = useActiveTripId();
  const { data: trips } = useTrips();
  const { data, create, update, remove } = useActivities();
  const existing = activityId ? data.find((a) => a.id === activityId) : null;
  const trip = trips.find((t) => t.id === activeTripId);
  const { frozen } = isTripFrozen(trip);

  const [form, setForm] = useState(() => emptyActivity(activeTripId));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setForm({ ...emptyActivity(activeTripId), ...existing });
    } else {
      const blank = emptyActivity(activeTripId);
      if (defaultDay) blank.day = defaultDay;
      setForm(blank);
    }
    setConfirmDelete(false);
  }, [open, existing, activeTripId, defaultDay]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (frozen) {
      toast.error('This trip is frozen — activities cannot be changed.');
      return;
    }
    if (!form.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    const payload = {
      ...form,
      tripId: activeTripId,
      title: form.title.trim(),
      description: (form.description || '').trim(),
      day: Number(form.day) || 1,
      perPupilCost: parseFloat(form.perPupilCost) || 0,
      capacity: form.capacity === '' ? null : Number(form.capacity),
    };
    try {
      if (isEdit) {
        await update(activityId, payload);
        toast.success('Activity updated');
      } else {
        await create(payload);
        toast.success('Activity added');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await remove(activityId);
      toast.success('Activity deleted');
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
        title={isEdit ? 'Edit activity' : 'New activity'}
        subtitle={form.title || '—'}
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
              {isEdit ? 'Save changes' : 'Add activity'}
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <FormField label="Title" required fullWidth>
            <Input value={form.title} onChange={(e) => setField('title', e.target.value)} />
          </FormField>
          <FormField label="Day">
            <Input type="number" min="1" value={form.day} onChange={(e) => setField('day', e.target.value)} />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={(e) => setField('type', e.target.value)}>
              {Enums.ActivityType.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Start time">
            <Input type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} />
          </FormField>
          <FormField label="Duration">
            <Input
              value={form.duration}
              placeholder="2h"
              onChange={(e) => setField('duration', e.target.value)}
            />
          </FormField>
          <FormField label="Supplier" fullWidth>
            <Input value={form.supplier} onChange={(e) => setField('supplier', e.target.value)} />
          </FormField>
          <FormField label="Per-pupil cost">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.perPupilCost}
              onChange={(e) => setField('perPupilCost', e.target.value)}
            />
          </FormField>
          <FormField label="Capacity" hint="Leave blank for unlimited">
            <Input
              type="number"
              min="0"
              value={form.capacity ?? ''}
              onChange={(e) => setField('capacity', e.target.value)}
            />
          </FormField>
          <FormField label="Description" fullWidth>
            <Textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </FormField>
          <FormField label="Internal notes" fullWidth>
            <Textarea
              rows={2}
              value={form.notes || ''}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </FormField>
        </FormGrid>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete activity?"
        message={`Remove "${form.title}" from this trip's itinerary?`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
