import { Avatar, Badge, Button, Card, Modal } from '../../design-system';
import { useDocuments } from '../../lib/hooks/useDocuments';
import { usePayments } from '../../lib/hooks/usePayments';
import { usePupils } from '../../lib/hooks/usePupils';
import { useTrips } from '../../lib/hooks/useTrips';
import { Fmt } from '../../lib/format';
import styles from './PupilDetail.module.css';

const PAYMENT_VARIANT = {
  paid: 'success',
  deposit: 'info',
  pending: 'warning',
  overdue: 'danger',
  cancelled: 'neutral',
};

const DOC_VARIANT = {
  verified: 'success',
  submitted: 'info',
  expiring: 'warning',
  expired: 'danger',
  missing: 'neutral',
};

/**
 * Read-only summary of a pupil — links to PupilForm for edits.
 */
export function PupilDetail({ open, onClose, pupilId, onEdit, readOnly = false }) {
  const { data: pupils } = usePupils();
  const { data: trips } = useTrips();
  const { data: payments } = usePayments();
  const { data: documents } = useDocuments();

  const pupil = pupilId ? pupils.find((p) => p.id === pupilId) : null;

  if (!pupil) return null;

  const trip = trips.find((t) => t.id === pupil.tripId);
  const pupilPayments = payments.filter((p) => p.pupilId === pupil.id);
  const pupilDocs = documents.filter((d) => d.pupilId === pupil.id);

  const paid = pupilPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const total = trip?.costPerPupil || 0;
  const balance = total - paid;
  const fullName = `${pupil.firstName} ${pupil.lastName}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fullName}
      subtitle={`${pupil.admissionNo || '—'} · Grade ${pupil.grade}`}
      size="lg"
      footer={
        <>
          <Button variant="light" onClick={onClose}>
            Close
          </Button>
          {readOnly ? null : (
            <Button variant="primary" onClick={() => onEdit?.(pupilId)}>
              Edit pupil
            </Button>
          )}
        </>
      }
    >
      <div className={styles.head}>
        <Avatar name={fullName} colour="var(--navy)" size="lg" />
        <div className={styles.headInfo}>
          <div className={styles.title}>{fullName}</div>
          <div className={styles.sub}>
            {pupil.gender === 'F' ? 'Female' : 'Male'} · {pupil.dob ? Fmt.date(pupil.dob) : 'No DOB'}
          </div>
          <div className={styles.badges}>
            <Badge variant={PAYMENT_VARIANT[pupil.paymentStatus] || 'neutral'}>{pupil.paymentStatus}</Badge>
            {pupil.flagged ? <Badge variant="danger">Flagged</Badge> : null}
            {trip ? <Badge variant="neutral">{trip.code}</Badge> : null}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <Card padded>
          <h4 className={styles.sectionTitle}>Guardian</h4>
          <dl className={styles.dl}>
            <div>
              <dt>Name</dt>
              <dd>{pupil.guardianName || '—'}</dd>
            </div>
            <div>
              <dt>Relationship</dt>
              <dd>{pupil.guardianRelationship}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{pupil.guardianPhone || '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{pupil.guardianEmail || '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card padded>
          <h4 className={styles.sectionTitle}>Payments</h4>
          <dl className={styles.dl}>
            <div>
              <dt>Trip cost</dt>
              <dd>{Fmt.moneyPlain(total, trip?.currency)}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>{Fmt.moneyPlain(paid, trip?.currency)}</dd>
            </div>
            <div>
              <dt>Balance</dt>
              <dd style={{ color: balance > 0 ? 'var(--crimson)' : 'var(--success)' }}>
                {Fmt.moneyPlain(balance, trip?.currency)}
              </dd>
            </div>
            <div>
              <dt>Records</dt>
              <dd>{pupilPayments.length}</dd>
            </div>
          </dl>
        </Card>

        {(pupil.medicalNotes || pupil.dietaryNotes) ? (
          <Card padded className={styles.fullSpan}>
            <h4 className={styles.sectionTitle}>Health & dietary</h4>
            {pupil.medicalNotes ? (
              <p>
                <strong>Medical:</strong> {pupil.medicalNotes}
              </p>
            ) : null}
            {pupil.dietaryNotes ? (
              <p>
                <strong>Dietary:</strong> {pupil.dietaryNotes}
              </p>
            ) : null}
          </Card>
        ) : null}

        <Card padded className={styles.fullSpan}>
          <h4 className={styles.sectionTitle}>Documents ({pupilDocs.length})</h4>
          {!pupilDocs.length ? (
            <p style={{ color: 'var(--grey-500)', fontSize: 13 }}>No documents recorded.</p>
          ) : (
            <ul className={styles.docList}>
              {pupilDocs.map((d) => (
                <li key={d.id}>
                  <span>{d.filename || d.notes || 'Document'}</span>
                  <Badge variant={DOC_VARIANT[d.status] || 'neutral'}>{d.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {pupil.note ? (
          <Card padded className={styles.fullSpan}>
            <h4 className={styles.sectionTitle}>Coordinator note</h4>
            <p>{pupil.note}</p>
          </Card>
        ) : null}
      </div>
    </Modal>
  );
}
