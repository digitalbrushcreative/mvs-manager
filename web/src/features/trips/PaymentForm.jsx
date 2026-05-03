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
import { usePayments } from '../../lib/hooks/usePayments';
import { usePupils } from '../../lib/hooks/usePupils';
import { useTrips } from '../../lib/hooks/useTrips';
import { useActiveTripId } from '../../lib/hooks/useSettings';

const METHODS = ['bank-transfer', 'cash', 'card', 'cheque', 'mobile-money', 'other'];

function emptyPayment(tripId) {
  return {
    id: '',
    tripId,
    pupilId: '',
    amount: '',
    currency: 'USD',
    method: 'bank-transfer',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().slice(0, 10),
  };
}

export function PaymentForm({ open, onClose, paymentId, defaultPupilId = null }) {
  const isEdit = Boolean(paymentId);
  const toast = useToast();
  const { activeTripId } = useActiveTripId();
  const { data, create, update, remove } = usePayments();
  const { data: pupils } = usePupils(activeTripId);
  const { data: trips } = useTrips();

  const trip = trips.find((t) => t.id === activeTripId);
  const existing = paymentId ? data.find((p) => p.id === paymentId) : null;

  const [form, setForm] = useState(() => emptyPayment(activeTripId));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setForm({
        ...emptyPayment(activeTripId),
        ...existing,
        paidAt: existing.paidAt ? existing.paidAt.slice(0, 10) : '',
      });
    } else {
      setForm({
        ...emptyPayment(activeTripId),
        currency: trip?.currency || 'USD',
        pupilId: defaultPupilId || '',
      });
    }
    setConfirmDelete(false);
  }, [open, existing, activeTripId, trip, defaultPupilId]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.pupilId) {
      toast.error('Pick a pupil');
      return;
    }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    const payload = {
      ...form,
      tripId: activeTripId,
      amount,
      reference: (form.reference || '').trim(),
      notes: (form.notes || '').trim(),
      paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : new Date().toISOString(),
    };
    try {
      if (isEdit) {
        await update(paymentId, payload);
        toast.success('Payment updated');
      } else {
        await create(payload);
        toast.success('Payment recorded');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await remove(paymentId);
      toast.success('Payment deleted');
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
        title={isEdit ? 'Edit payment' : 'Record payment'}
        subtitle={trip ? trip.code : '—'}
        size="md"
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
              {isEdit ? 'Save changes' : 'Record payment'}
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <FormField label="Pupil" required fullWidth>
            <Select value={form.pupilId} onChange={(e) => setField('pupilId', e.target.value)}>
              <option value="">Select pupil…</option>
              {pupils
                .slice()
                .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} · Grade {p.grade}
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label="Amount" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setField('amount', e.target.value)}
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
          <FormField label="Method">
            <Select value={form.method} onChange={(e) => setField('method', e.target.value)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('-', ' ')}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Paid on">
            <Input type="date" value={form.paidAt} onChange={(e) => setField('paidAt', e.target.value)} />
          </FormField>
          <FormField label="Reference" fullWidth>
            <Input
              value={form.reference || ''}
              placeholder="Bank ref, M-Pesa code…"
              onChange={(e) => setField('reference', e.target.value)}
            />
          </FormField>
          <FormField label="Notes" fullWidth>
            <Textarea rows={2} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
          </FormField>
        </FormGrid>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete payment?"
        message="This payment record will be removed. The pupil's balance will be recalculated."
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
