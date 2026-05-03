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
import { useBookings } from '../../lib/hooks/useBookings';
import { useTrips } from '../../lib/hooks/useTrips';
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { isTripFrozen } from '../../lib/tripFreeze';
import { Enums } from '../../lib/schema';

function emptyBooking(tripId, currency = 'USD') {
  return {
    id: '',
    tripId,
    type: 'activity',
    status: 'quoted',
    supplier: '',
    reference: '',
    title: '',
    description: '',
    date: '',
    time: '',
    pax: '',
    unitPrice: '',
    totalCost: '',
    currency,
    paidAmount: '',
    paidAt: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
  };
}

export function BookingForm({ open, onClose, bookingId }) {
  const isEdit = Boolean(bookingId);
  const toast = useToast();
  const { activeTripId } = useActiveTripId();
  const { data, create, update, remove } = useBookings();
  const { data: trips } = useTrips();
  const trip = trips.find((t) => t.id === activeTripId);
  const existing = bookingId ? data.find((b) => b.id === bookingId) : null;

  const [form, setForm] = useState(() => emptyBooking(activeTripId, trip?.currency));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setForm({
        ...emptyBooking(activeTripId, trip?.currency),
        ...existing,
        date: existing.date ? existing.date.slice(0, 10) : '',
        paidAt: existing.paidAt ? existing.paidAt.slice(0, 10) : '',
      });
    } else {
      setForm(emptyBooking(activeTripId, trip?.currency || 'USD'));
    }
    setConfirmDelete(false);
  }, [open, existing, activeTripId, trip]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const { frozen } = isTripFrozen(trip);

  async function save() {
    if (frozen) {
      toast.error('This trip is frozen — bookings cannot be changed.');
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
      supplier: (form.supplier || '').trim(),
      reference: (form.reference || '').trim(),
      description: (form.description || '').trim(),
      pax: Number(form.pax) || 0,
      unitPrice: parseFloat(form.unitPrice) || 0,
      totalCost: parseFloat(form.totalCost) || 0,
      paidAmount: parseFloat(form.paidAmount) || 0,
      date: form.date || null,
      paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : null,
    };
    try {
      if (isEdit) {
        await update(bookingId, payload);
        toast.success('Booking updated');
      } else {
        await create(payload);
        toast.success('Booking added');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await remove(bookingId);
      toast.success('Booking deleted');
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
        title={isEdit ? 'Edit booking' : 'New booking'}
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
              {isEdit ? 'Save changes' : 'Add booking'}
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <FormField label="Type" required>
            <Select value={form.type} onChange={(e) => setField('type', e.target.value)}>
              {Enums.BookingType.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {Enums.BookingStatus.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Title" required fullWidth>
            <Input value={form.title} onChange={(e) => setField('title', e.target.value)} />
          </FormField>
          <FormField label="Supplier">
            <Input value={form.supplier} onChange={(e) => setField('supplier', e.target.value)} />
          </FormField>
          <FormField label="Reference">
            <Input value={form.reference} onChange={(e) => setField('reference', e.target.value)} />
          </FormField>
          <FormField label="Date">
            <Input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} />
          </FormField>
          <FormField label="Time">
            <Input value={form.time} placeholder="08:30" onChange={(e) => setField('time', e.target.value)} />
          </FormField>
          <FormField label="Pax">
            <Input type="number" min="0" value={form.pax} onChange={(e) => setField('pax', e.target.value)} />
          </FormField>
          <FormField label="Unit price">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setField('unitPrice', e.target.value)}
            />
          </FormField>
          <FormField label="Total cost">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.totalCost}
              onChange={(e) => setField('totalCost', e.target.value)}
            />
          </FormField>
          <FormField label="Paid amount">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.paidAmount}
              onChange={(e) => setField('paidAmount', e.target.value)}
            />
          </FormField>
          <FormField label="Paid on">
            <Input type="date" value={form.paidAt} onChange={(e) => setField('paidAt', e.target.value)} />
          </FormField>
          <FormField label="Currency">
            <Select value={form.currency} onChange={(e) => setField('currency', e.target.value)}>
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </Select>
          </FormField>
          <FormField label="Description" fullWidth>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </FormField>
          <FormField label="Contact name">
            <Input value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} />
          </FormField>
          <FormField label="Contact phone">
            <Input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} />
          </FormField>
          <FormField label="Contact email" fullWidth>
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setField('contactEmail', e.target.value)}
            />
          </FormField>
          <FormField label="Notes" fullWidth>
            <Textarea rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </FormField>
        </FormGrid>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete booking?"
        message={`Remove "${form.title}" from this trip?`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
