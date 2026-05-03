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
import { useStaff } from '../../lib/hooks/useStaff';
import { useTrips } from '../../lib/hooks/useTrips';
import { Enums, STAFF_ROLE_META, newStaff } from '../../lib/schema';

const EMPTY = newStaff();

export function StaffForm({ open, onClose, staffId }) {
  const isEdit = Boolean(staffId);
  const toast = useToast();
  const { data, create, update, remove } = useStaff();
  const { data: trips, replace: replaceTrips } = useTrips();

  const existing = staffId ? data.find((s) => s.id === staffId) : null;
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? { ...EMPTY, ...existing } : newStaff());
    setConfirmDelete(false);
  }, [open, existing]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First and last name required');
      return;
    }
    try {
      if (isEdit) {
        await update(staffId, { ...form });
        toast.success('Staff updated');
      } else {
        await create(form);
        toast.success('Staff added');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await remove(staffId);
      // Cascade: drop staff id from any trip's assignedStaffIds
      const next = trips.map((t) =>
        (t.assignedStaffIds || []).includes(staffId)
          ? { ...t, assignedStaffIds: t.assignedStaffIds.filter((x) => x !== staffId) }
          : t,
      );
      if (next.some((t, i) => t !== trips[i])) {
        await replaceTrips(next);
      }
      toast.success('Staff deleted');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }

  const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ');

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit staff' : 'Add staff'}
        subtitle={isEdit ? fullName || '—' : 'New staff member'}
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
              {isEdit ? 'Save changes' : 'Add staff'}
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <FormField label="First name" required>
            <Input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} required />
          </FormField>
          <FormField label="Last name" required>
            <Input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} required />
          </FormField>
          <FormField label="Role" required>
            <Select value={form.role} onChange={(e) => setField('role', e.target.value)}>
              {Enums.StaffRole.map((r) => (
                <option key={r} value={r}>
                  {STAFF_ROLE_META[r]?.label || r}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Title">
            <Input
              value={form.title}
              placeholder="Head of Geography"
              onChange={(e) => setField('title', e.target.value)}
            />
          </FormField>
          <FormField label="Department" fullWidth>
            <Input value={form.department} onChange={(e) => setField('department', e.target.value)} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
          </FormField>
          <FormField label="Status" fullWidth>
            <Select
              value={form.active ? 'true' : 'false'}
              onChange={(e) => setField('active', e.target.value === 'true')}
            >
              <option value="true">Active</option>
              <option value="false">Inactive (on leave / former)</option>
            </Select>
          </FormField>
          <FormField label="Notes" fullWidth>
            <Textarea
              rows={2}
              value={form.notes}
              placeholder="First-aid certified, lifeguard, etc."
              onChange={(e) => setField('notes', e.target.value)}
            />
          </FormField>
        </FormGrid>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete this staff member?"
        message={`"${fullName}" will be removed from the directory and unassigned from any trip chaperone slots.`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
