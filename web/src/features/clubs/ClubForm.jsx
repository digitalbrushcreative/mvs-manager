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
import { useClubs } from '../../lib/hooks/useClubs';
import { useClubDelete } from '../../lib/hooks/useClubDelete';
import { Enums, newClub } from '../../lib/schema';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ClubForm({ open, onClose, clubId }) {
  const isEdit = Boolean(clubId);
  const toast = useToast();
  const { data: clubs, create, update } = useClubs();
  const cascadeDelete = useClubDelete();

  const existing = clubId ? clubs.find((c) => c.id === clubId) : null;
  const [form, setForm] = useState(newClub());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? { ...newClub(), ...existing } : newClub());
    setConfirmDelete(false);
  }, [open, existing]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  async function save() {
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      emoji: (form.emoji || '🎯').trim() || '🎯',
      colour: form.colour || '#2c3f6b',
      leadStaff: (form.leadStaff || '').trim(),
      description: (form.description || '').trim(),
      venue: (form.venue || '').trim(),
    };
    try {
      if (isEdit) {
        await update(clubId, payload);
        toast.success('Club updated');
      } else {
        await create(payload);
        toast.success('Club created');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await cascadeDelete(clubId);
      toast.success('Club deleted');
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
        title={isEdit ? 'Edit club' : 'New club'}
        subtitle={form.name || '—'}
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
              {isEdit ? 'Save changes' : 'Create club'}
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <FormField label="Name" required fullWidth>
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Debate Club" />
          </FormField>
          <FormField label="Emoji">
            <Input value={form.emoji || '🎯'} onChange={(e) => setField('emoji', e.target.value)} maxLength={4} />
          </FormField>
          <FormField label="Colour">
            <Input
              type="color"
              value={form.colour || '#2c3f6b'}
              onChange={(e) => setField('colour', e.target.value)}
              style={{ height: 38, padding: 4 }}
            />
          </FormField>
          <FormField label="Lead staff" fullWidth>
            <Input
              value={form.leadStaff || ''}
              placeholder="Ms. J. Smith"
              onChange={(e) => setField('leadStaff', e.target.value)}
            />
          </FormField>
          <FormField label="Description" fullWidth>
            <Textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </FormField>
          <FormField label="Meeting day">
            <Select value={form.meetingDay} onChange={(e) => setField('meetingDay', e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Meeting time">
            <Input type="time" value={form.meetingTime || '16:00'} onChange={(e) => setField('meetingTime', e.target.value)} />
          </FormField>
          <FormField label="Venue" fullWidth>
            <Input
              value={form.venue || ''}
              placeholder="Room 204"
              onChange={(e) => setField('venue', e.target.value)}
            />
          </FormField>
          <FormField label="Status" fullWidth>
            <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {Enums.ClubStatus.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
        </FormGrid>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete this club?"
        message={`"${form.name}" will be removed, along with all its memberships. Linked trips will remain but will lose this tag.`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
