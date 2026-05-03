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
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { useAuth } from '../../lib/auth';
import { Enums } from '../../lib/schema';
import { Fmt } from '../../lib/format';

/**
 * Quick-chase composer for an enrolled pupil's guardian. Pre-fills a balance
 * reminder so staff can chase outstanding payments in one click.
 */
export function ChaseParentModal({ open, onClose, target }) {
  const toast = useToast();
  const { activeTripId } = useActiveTripId();
  const { create } = useCommunications(activeTripId);
  const { user } = useAuth();

  const [type, setType] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !target) return;
    const hasEmail = Boolean(target.guardianEmail);
    setType(hasEmail ? 'email' : 'sms');
    setSubject(`Outstanding balance — ${target.tripName}`);
    setBody(
      `Hi ${target.guardianName || 'there'},\n\n` +
        `This is a friendly reminder that ${target.pupilName} has an outstanding balance of ` +
        `${Fmt.moneyPlain(target.balance, target.currency)} for ${target.tripName}.\n\n` +
        `Please settle at your earliest convenience. Reply to this message if you have any questions.\n\n` +
        `Thank you.`,
    );
  }, [open, target]);

  if (!target) return null;

  const channelOk =
    (type === 'email' && target.guardianEmail) ||
    (type !== 'email' && target.guardianPhone);

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
          ? 'No email on file for this guardian'
          : 'No phone on file for this guardian',
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
        recipientIds: [target.pupilId],
        recipients: [
          {
            kind: 'chase',
            pupilId: target.pupilId,
            name: target.guardianName,
            email: target.guardianEmail || null,
            phone: target.guardianPhone || null,
            re: target.pupilName,
            balance: target.balance,
          },
        ],
        recipientCount: 1,
        sentAt: new Date().toISOString(),
        sentBy: user?.name || user?.email || 'staff',
      });
      toast.success(`Reminder sent to ${target.guardianName || target.pupilName}`);
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
      title={`Chase ${target.guardianName || target.pupilName}`}
      subtitle={`${target.pupilName} · balance ${Fmt.moneyPlain(target.balance, target.currency)}`}
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
                ? target.guardianEmail || '(no email on file)'
                : target.guardianPhone || '(no phone on file)'
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
          <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
        </FormField>
      </FormGrid>
    </Modal>
  );
}
