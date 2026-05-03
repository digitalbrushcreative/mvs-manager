import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Chip,
  EmptyState,
  FormField,
  FormGrid,
  Input,
  Select,
  Textarea,
  useToast,
} from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useCommunications } from '../../../lib/hooks/useCommunications';
import { usePupils } from '../../../lib/hooks/usePupils';
import { useInterests } from '../../../lib/hooks/useInterests';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { useAuth } from '../../../lib/auth';
import { Enums } from '../../../lib/schema';
import { Fmt } from '../../../lib/format';
import styles from './Communications.module.css';

const TYPE_VARIANT = {
  email: 'info',
  sms: 'success',
  whatsapp: 'success',
  letter: 'neutral',
};

const PUPIL_FILTERS = [
  { key: 'all', label: 'All pupils', match: () => true },
  { key: 'overdue', label: 'Overdue payments', match: (p) => p.paymentStatus === 'overdue' },
  { key: 'pending', label: 'Pending payments', match: (p) => p.paymentStatus === 'pending' },
  { key: 'flagged', label: 'Flagged', match: (p) => p.flagged },
];

const INTEREST_FILTERS = [
  { key: 'interest:all', label: 'Interested parents (all)', match: () => true },
  { key: 'interest:new', label: 'Interested · new', match: (i) => i.status === 'new' },
  { key: 'interest:contacted', label: 'Interested · contacted', match: (i) => i.status === 'contacted' },
];

const FILTERS = [...PUPIL_FILTERS, ...INTEREST_FILTERS];

export function TripsCommunicationsPage() {
  const { activeTripId } = useActiveTripId();
  const { data: pupils } = usePupils(activeTripId);
  const { data: interests } = useInterests(activeTripId);
  const { data: communications, create } = useCommunications(activeTripId);
  const { user } = useAuth();
  const toast = useToast();

  const audienceIsInterest = (key) => key.startsWith('interest:');

  const [type, setType] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);

  const recipients = useMemo(() => {
    const filter = FILTERS.find((f) => f.key === audience);
    if (audienceIsInterest(audience)) {
      return interests.filter(filter?.match || (() => true));
    }
    return pupils.filter(filter?.match || (() => true));
  }, [pupils, interests, audience]);

  async function send() {
    if (!body.trim()) {
      toast.error('Message body is required');
      return;
    }
    if (type === 'email' && !subject.trim()) {
      toast.error('Subject is required for emails');
      return;
    }
    if (!recipients.length) {
      toast.error('No recipients match this audience');
      return;
    }
    setSending(true);
    try {
      const isInterest = audienceIsInterest(audience);
      await create({
        tripId: activeTripId,
        type,
        subject: subject.trim(),
        body: body.trim(),
        recipientIds: isInterest ? [] : recipients.map((r) => r.id),
        recipients: isInterest
          ? recipients.map((r) => ({
              kind: 'interest',
              interestId: r.id,
              name: r.parentName,
              email: r.parentEmail || null,
              phone: r.parentPhone || null,
              re: r.pupilName,
            }))
          : undefined,
        recipientCount: recipients.length,
        sentAt: new Date().toISOString(),
        sentBy: user?.name || user?.email || 'staff',
      });
      toast.success(`Sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`);
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  const sortedHistory = communications
    .slice()
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  return (
    <PageContainer>
      <PageHeader
        title="Messages"
        subtitle={`Compose to selected audiences · ${communications.length} message${communications.length === 1 ? '' : 's'} sent`}
      />

      <div className={styles.split}>
        <Card padded>
          <CardHeader title="Compose" subtitle={`${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`} />

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
            <FormField label="Audience" required>
              <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <optgroup label="Enrolled pupils">
                  {PUPIL_FILTERS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
                {interests.length ? (
                  <optgroup label="Interested parents">
                    {INTEREST_FILTERS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
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
                placeholder="Type your message…"
              />
            </FormField>
          </FormGrid>

          <div className={styles.preview}>
            <strong>Will reach:</strong> {recipients.length}{' '}
            {recipients.length === 1 ? 'parent' : 'parents'}
            {recipients.length ? (
              <>
                {' '}
                · e.g.{' '}
                {recipients
                  .slice(0, 3)
                  .map((r) =>
                    audienceIsInterest(audience)
                      ? r.parentName
                      : r.guardianName || `${r.firstName} ${r.lastName}'s guardian`,
                  )
                  .join(', ')}
                {recipients.length > 3 ? `, +${recipients.length - 3} more` : ''}
              </>
            ) : null}
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={send} disabled={sending || !recipients.length}>
              {sending ? 'Sending…' : `Send ${type}`}
            </Button>
          </div>
        </Card>

        <Card padded>
          <CardHeader title="Audiences" subtitle="Enrolled pupils + interested parents" />
          <div className={styles.chips}>
            {PUPIL_FILTERS.map((f) => {
              const count = pupils.filter(f.match).length;
              return (
                <Chip
                  key={f.key}
                  active={audience === f.key}
                  onClick={() => setAudience(f.key)}
                  count={count}
                >
                  {f.label}
                </Chip>
              );
            })}
            {INTEREST_FILTERS.map((f) => {
              const count = interests.filter(f.match).length;
              if (!count) return null;
              return (
                <Chip
                  key={f.key}
                  active={audience === f.key}
                  onClick={() => setAudience(f.key)}
                  count={count}
                >
                  {f.label}
                </Chip>
              );
            })}
          </div>
        </Card>
      </div>

      <Card padded style={{ marginTop: 18 }}>
        <CardHeader title="History" subtitle={`${communications.length} message${communications.length === 1 ? '' : 's'}`} />
        {!sortedHistory.length ? (
          <EmptyState title="No messages yet" description="Send your first message to start logging communications." />
        ) : (
          <ul className={styles.history}>
            {sortedHistory.map((m) => (
              <li key={m.id} className={styles.historyItem}>
                <div className={styles.historyHead}>
                  <Badge variant={TYPE_VARIANT[m.type]}>{m.type}</Badge>
                  <span className={styles.historySubject}>{m.subject || '(no subject)'}</span>
                  <span className={styles.historyMeta}>
                    {Fmt.date(m.sentAt)} · {m.recipientCount || (m.recipientIds || []).length} recipient
                    {(m.recipientCount || (m.recipientIds || []).length) === 1 ? '' : 's'} · {m.sentBy}
                  </span>
                </div>
                <p className={styles.historyBody}>{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
