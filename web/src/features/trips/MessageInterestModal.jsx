import { useEffect, useState } from 'react';
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '../../design-system';
import { useCommunications } from '../../lib/hooks/useCommunications';
import { useInterests } from '../../lib/hooks/useInterests';
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { useAuth } from '../../lib/auth';
import { Enums } from '../../lib/schema';

/**
 * Compose a one-off message to an interested parent (a prospect, not yet
 * enrolled). On send, logs a Communication record and bumps the interest
 * status from `new` → `contacted` so the workflow advances naturally.
 */
export function MessageInterestModal({ open, onClose, interest }) {
  const toast = useToast();
  const { activeTripId } = useActiveTripId();
  const { create } = useCommunications(activeTripId);
  const { update: updateInterest } = useInterests(activeTripId);
  const { user } = useAuth();

  const [type, setType] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !interest) return;
    const hasEmail = Boolean(interest.parentEmail);
    setType(hasEmail ? 'email' : 'sms');
    setSubject('');
    setBody('');
  }, [open, interest]);

  if (!interest) return null;

  const channelOk =
    (type === 'email' && interest.parentEmail) ||
    (type !== 'email' && interest.parentPhone);

  async function send() {
    if (!body.trim()) {
      toast.error('Message body is required');
      return;
    }
    if (type === 'email' && !subject.trim()) {
      toast.error('Subject is required for emails');
      return;
    }
    if (!channelOk) {
      toast.error(
        type === 'email'
          ? 'No email address on file for this parent'
          : 'No phone number on file for this parent',
      );
      return;
    }
    setSending(true);
    try {
      await create({
        tripId: activeTripId,
        type,
        subject: subject.trim(),
        body: body.trim(),
        recipientIds: [],
        recipients: [
          {
            kind: 'interest',
            interestId: interest.id,
            name: interest.parentName,
            email: interest.parentEmail || null,
            phone: interest.parentPhone || null,
            re: interest.pupilName,
          },
        ],
        recipientCount: 1,
        sentAt: new Date().toISOString(),
        sentBy: user?.name || user?.email || 'staff',
      });
      if (interest.status === 'new') {
        try {
          await updateInterest(interest.id, { status: 'contacted' });
        } catch {
          /* non-fatal — message logged regardless */
        }
      }
      toast.success(`Message sent to ${interest.parentName}`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Message ${interest.parentName}`}
      subtitle={`Re: ${interest.pupilName}${interest.pupilGrade ? ` · Grade ${interest.pupilGrade}` : ''}`}
      size="md"
      footer={
        <>
          <span style={{ flex: 1 }} />
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={send} disabled={sending}>
            {sending ? 'Sending…' : `Send ${type}`}
          </Button>
        </>
      }
    >
      <FormGrid columns={2}>
        <FormField label="Channel" required>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {Enums.CommType.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="To">
          <Input
            value={
              type === 'email'
                ? interest.parentEmail || '(no email on file)'
                : interest.parentPhone || '(no phone on file)'
            }
            readOnly
          />
        </FormField>
        {type === 'email' ? (
          <FormField label="Subject" required fullWidth>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </FormField>
        ) : null}
        <FormField label="Message" required fullWidth>
          <Textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Hi ${interest.parentName}, thanks for your interest in this trip…`}
          />
        </FormField>
      </FormGrid>
    </Modal>
  );
}
