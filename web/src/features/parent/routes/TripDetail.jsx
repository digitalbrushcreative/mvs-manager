import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
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
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActivities } from '../../../lib/hooks/useActivities';
import { useInterests } from '../../../lib/hooks/useInterests';
import { Fmt } from '../../../lib/format';
import styles from './TripDetail.module.css';

const ARROW_LEFT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const STATUS_VARIANT = {
  draft: 'neutral',
  open: 'info',
  closed: 'warning',
  'in-progress': 'success',
  complete: 'neutral',
  cancelled: 'danger',
};

const RELATIONSHIPS = ['parent', 'guardian', 'grandparent', 'aunt/uncle', 'sibling', 'other'];

const EMPTY_INTEREST = {
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  parentRelationship: 'parent',
  pupilName: '',
  pupilGrade: 6,
  dob: '',
  medicalNotes: '',
  dietaryNotes: '',
  additionalNotes: '',
};

export function ParentTripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: trips } = useTrips();
  const { data: activities } = useActivities(tripId);
  const { create: createInterest } = useInterests();

  const trip = trips.find((t) => t.id === tripId);
  const [form, setForm] = useState(EMPTY_INTEREST);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!trip) {
    return (
      <PageContainer narrow>
        <EmptyState
          title="Trip not found"
          description="The trip you're looking for is no longer available."
          action={
            <Button variant="secondary" onClick={() => navigate('/parent')}>
              Back to upcoming trips
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const required = ['parentName', 'parentEmail', 'parentPhone', 'pupilName'];
    const missing = required.filter((k) => !String(form[k] || '').trim());
    if (missing.length) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createInterest({
        tripId,
        status: 'new',
        parentName: form.parentName.trim(),
        parentEmail: form.parentEmail.trim(),
        parentPhone: form.parentPhone.trim(),
        parentRelationship: form.parentRelationship,
        pupilName: form.pupilName.trim(),
        pupilGrade: Number(form.pupilGrade) || null,
        dob: form.dob || null,
        medicalNotes: form.medicalNotes.trim(),
        dietaryNotes: form.dietaryNotes.trim(),
        additionalNotes: form.additionalNotes.trim(),
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      toast.success('Interest submitted — the school will be in touch');
    } catch (err) {
      toast.error(err.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  const days = activities.length
    ? Array.from(new Set(activities.map((a) => a.day))).sort((a, b) => a - b)
    : [];

  return (
    <PageContainer narrow>
      <button type="button" className={styles.backLink} onClick={() => navigate('/parent')}>
        {ARROW_LEFT}
        <span>Back to upcoming trips</span>
      </button>

      <Card padded className={styles.hero}>
        <div className={styles.heroEyebrow}>
          <Badge variant={STATUS_VARIANT[trip.status]}>{trip.status}</Badge>
          <span className={styles.heroCode}>{trip.code}</span>
        </div>
        <h1 className={styles.heroTitle}>{trip.name}</h1>
        <div className={styles.heroDest}>{trip.destination}</div>
        <dl className={styles.heroMeta}>
          <div>
            <dt>Dates</dt>
            <dd>
              {Fmt.date(trip.startDate)} → {Fmt.date(trip.endDate)}
            </dd>
          </div>
          <div>
            <dt>Cost per pupil</dt>
            <dd>{Fmt.moneyPlain(trip.costPerPupil, trip.currency)}</dd>
          </div>
          <div>
            <dt>Grades welcome</dt>
            <dd>{trip.gradesAllowed?.join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>{trip.seatsTotal} total</dd>
          </div>
        </dl>
        {trip.description ? <p className={styles.heroDesc}>{trip.description}</p> : null}
      </Card>

      {days.length ? (
        <Card padded style={{ marginTop: 18 }}>
          <details className={styles.itineraryPanel}>
            <summary className={styles.itinerarySummary}>
              <span className={styles.itineraryTitle}>What&rsquo;s on the itinerary</span>
              <span className={styles.itineraryHint}>
                {days.length} day{days.length === 1 ? '' : 's'} · {activities.length} activit
                {activities.length === 1 ? 'y' : 'ies'}
              </span>
              <span className={styles.itineraryChevron} aria-hidden>
                ▾
              </span>
            </summary>
            <ul className={styles.itinerary}>
              {days.map((day) => {
                const items = activities
                  .filter((a) => a.day === day)
                  .sort((x, y) => (x.startTime || '').localeCompare(y.startTime || ''));
                return (
                  <li key={day}>
                    <div className={styles.dayLabel}>Day {day}</div>
                    <ul className={styles.activities}>
                      {items.map((a) => (
                        <li key={a.id}>
                          <span className={styles.activityTime}>{a.startTime || '—'}</span>
                          <span>
                            <strong>{a.title}</strong>
                            {a.description ? <div className={styles.activityDesc}>{a.description}</div> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </details>
        </Card>
      ) : null}

      <Card padded style={{ marginTop: 18 }}>
        {submitted ? (
          <EmptyState
            title="Thank you"
            description="Your interest has been recorded. The school will reach out with next steps within a few days."
            action={
              <Button variant="secondary" onClick={() => navigate('/parent')}>
                Back to upcoming trips
              </Button>
            }
          />
        ) : (
          <>
            <PageHeader
              title="Express interest"
              subtitle="Tell the school about your child. This is not a confirmed booking — the trips coordinator will follow up."
            />

            <h4 className={styles.sectionTitle}>Parent / guardian</h4>
            <FormGrid columns={2}>
              <FormField label="Your name" required>
                <Input value={form.parentName} onChange={(e) => setField('parentName', e.target.value)} />
              </FormField>
              <FormField label="Relationship">
                <Select
                  value={form.parentRelationship}
                  onChange={(e) => setField('parentRelationship', e.target.value)}
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Email" required>
                <Input
                  type="email"
                  value={form.parentEmail}
                  onChange={(e) => setField('parentEmail', e.target.value)}
                />
              </FormField>
              <FormField label="Phone" required>
                <Input value={form.parentPhone} onChange={(e) => setField('parentPhone', e.target.value)} />
              </FormField>
            </FormGrid>

            <h4 className={styles.sectionTitle} style={{ marginTop: 24 }}>
              Pupil
            </h4>
            <FormGrid columns={2}>
              <FormField label="Pupil name" required fullWidth>
                <Input value={form.pupilName} onChange={(e) => setField('pupilName', e.target.value)} />
              </FormField>
              <FormField label="Grade">
                <Select value={form.pupilGrade} onChange={(e) => setField('pupilGrade', Number(e.target.value))}>
                  {[4, 5, 6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Date of birth">
                <Input type="date" value={form.dob} onChange={(e) => setField('dob', e.target.value)} />
              </FormField>
              <FormField label="Medical notes" fullWidth>
                <Textarea
                  rows={2}
                  value={form.medicalNotes}
                  placeholder="Allergies, conditions, medications…"
                  onChange={(e) => setField('medicalNotes', e.target.value)}
                />
              </FormField>
              <FormField label="Dietary notes" fullWidth>
                <Textarea
                  rows={2}
                  value={form.dietaryNotes}
                  placeholder="Dietary requirements, restrictions…"
                  onChange={(e) => setField('dietaryNotes', e.target.value)}
                />
              </FormField>
              <FormField label="Anything else" fullWidth>
                <Textarea
                  rows={2}
                  value={form.additionalNotes}
                  onChange={(e) => setField('additionalNotes', e.target.value)}
                />
              </FormField>
            </FormGrid>

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="lg" onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit interest'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
}
