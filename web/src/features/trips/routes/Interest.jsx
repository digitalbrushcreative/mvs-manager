import { useMemo, useState } from 'react';
import { Badge, Button, Card, Chip, EmptyState, Table } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { MessageInterestModal } from '../MessageInterestModal';
import { useInterests } from '../../../lib/hooks/useInterests';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { Fmt } from '../../../lib/format';
import styles from './Interest.module.css';

const STATUS_VARIANT = {
  new: 'warning',
  contacted: 'info',
  converted: 'success',
  declined: 'neutral',
};

export function TripsInterestPage() {
  const { activeTripId } = useActiveTripId();
  const { data: interests } = useInterests(activeTripId);

  const [filter, setFilter] = useState('all');
  const [messageId, setMessageId] = useState(null);

  const counts = useMemo(() => {
    const out = { all: interests.length };
    ['new', 'contacted', 'converted', 'declined'].forEach((s) => {
      out[s] = interests.filter((i) => i.status === s).length;
    });
    return out;
  }, [interests]);

  const filtered = filter === 'all' ? interests : interests.filter((i) => i.status === filter);
  const selected = interests.find((i) => i.id === messageId) || null;

  const columns = [
    {
      key: 'pupil',
      header: 'Pupil',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.pupilName}</div>
          <div style={{ fontSize: 11, color: 'var(--grey-500)' }}>Grade {r.pupilGrade ?? '—'}</div>
        </div>
      ),
    },
    { key: 'parent', header: 'Parent', render: (r) => r.parentName },
    {
      key: 'contact',
      header: 'Contact',
      render: (r) => (
        <div style={{ fontSize: 12 }}>
          <div>{r.parentEmail || '—'}</div>
          <div style={{ color: 'var(--grey-500)' }}>{r.parentPhone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      width: 130,
      render: (r) => Fmt.date(r.createdAt || r.submittedAt),
    },
    {
      key: 'status',
      header: 'Status',
      width: 110,
      render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      width: 110,
      align: 'right',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setMessageId(r.id);
          }}
          disabled={!r.parentEmail && !r.parentPhone}
          title={
            !r.parentEmail && !r.parentPhone
              ? 'No contact details on file'
              : 'Send a message to this parent'
          }
        >
          Message
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Interest"
        subtitle={`${interests.length} parent${interests.length === 1 ? '' : 's'} expressed interest in this trip`}
      />

      <Card padded style={{ marginBottom: 14 }}>
        <div className={styles.filters}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>
            All
          </Chip>
          {['new', 'contacted', 'converted', 'declined'].map((s) =>
            counts[s] ? (
              <Chip key={s} active={filter === s} onClick={() => setFilter(s)} count={counts[s]}>
                {s}
              </Chip>
            ) : null,
          )}
        </div>
      </Card>

      <Table
        columns={columns}
        rows={filtered}
        onRowClick={(row) => (row.parentEmail || row.parentPhone) && setMessageId(row.id)}
        empty={
          <EmptyState
            title={interests.length ? 'No matches' : 'No interest forms yet'}
            description={
              interests.length
                ? 'Try a different status filter.'
                : 'Parents who submit the public interest form on the parent portal will show up here.'
            }
          />
        }
      />

      <MessageInterestModal
        open={Boolean(selected)}
        onClose={() => setMessageId(null)}
        interest={selected}
      />
    </PageContainer>
  );
}
