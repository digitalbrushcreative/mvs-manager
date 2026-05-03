import { useMemo, useState } from 'react';
import { Badge, Button, Card, Chip, EmptyState, Table, useToast } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { DocumentForm } from '../DocumentForm';
import { useDocuments, useDocumentTypes } from '../../../lib/hooks/useDocuments';
import { usePupils } from '../../../lib/hooks/usePupils';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { Fmt } from '../../../lib/format';
import styles from './Documents.module.css';

const STATUS_VARIANT = {
  verified: 'success',
  submitted: 'info',
  expiring: 'warning',
  expired: 'danger',
  missing: 'neutral',
};

const STATUSES = ['missing', 'submitted', 'verified', 'expired', 'expiring'];

export function TripsDocumentsPage() {
  const { activeTripId } = useActiveTripId();
  const { data: documents, update } = useDocuments(activeTripId);
  const { data: documentTypes } = useDocumentTypes();
  const { data: pupils } = usePupils(activeTripId);
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingDoc, setEditingDoc] = useState(null);
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    const out = { all: documents.length };
    STATUSES.forEach((s) => {
      out[s] = documents.filter((d) => d.status === s).length;
    });
    return out;
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (typeFilter !== 'all' && d.typeId !== typeFilter) return false;
      return true;
    });
  }, [documents, statusFilter, typeFilter]);

  const rows = filtered.map((d) => {
    const pupil = pupils.find((p) => p.id === d.pupilId);
    const type = documentTypes.find((t) => t.id === d.typeId);
    return {
      id: d.id,
      pupil: pupil ? `${pupil.firstName} ${pupil.lastName}` : '(unknown)',
      grade: pupil?.grade ?? '—',
      type: type?.name || '—',
      typeAbbr: type?.abbr || '',
      status: d.status,
      uploadedAt: d.uploadedAt,
      verifiedAt: d.verifiedAt,
      expiresAt: d.expiresAt,
      filename: d.filename,
      driveUrl: d.driveUrl,
      original: d,
    };
  });

  async function cycleStatus(doc) {
    const order = ['missing', 'submitted', 'verified'];
    const idx = order.indexOf(doc.status);
    const next = order[(idx + 1) % order.length];
    try {
      await update(doc.id, {
        status: next,
        verifiedAt: next === 'verified' ? new Date().toISOString() : doc.verifiedAt,
        uploadedAt: next === 'submitted' && !doc.uploadedAt ? new Date().toISOString() : doc.uploadedAt,
      });
      toast.success(`Marked ${next}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  }

  const columns = [
    { key: 'pupil', header: 'Pupil', render: (r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.pupil}</div>
        <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 2 }}>Grade {r.grade}</div>
      </div>
    ) },
    { key: 'type', header: 'Document', render: (r) => (
      <div>
        <div>{r.type}</div>
        {r.typeAbbr ? <div style={{ fontSize: 10, color: 'var(--grey-500)', textTransform: 'uppercase' }}>{r.typeAbbr}</div> : null}
      </div>
    ) },
    { key: 'status', header: 'Status', width: 110, render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge> },
    { key: 'uploaded', header: 'Submitted', width: 130, render: (r) => Fmt.date(r.uploadedAt) },
    { key: 'expiry', header: 'Expires', width: 130, render: (r) => Fmt.date(r.expiresAt) },
    { key: 'actions', header: '', width: 160, align: 'right', render: (r) => (
      <div style={{ display: 'inline-flex', gap: 6 }}>
        {r.driveUrl ? (
          <a
            href={r.driveUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 12, alignSelf: 'center' }}
          >
            Open
          </a>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            cycleStatus(r.original);
          }}
        >
          Advance
        </Button>
      </div>
    ) },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} document record${documents.length === 1 ? '' : 's'} across ${pupils.length} pupil${pupils.length === 1 ? '' : 's'}`}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)} disabled={!pupils.length}>
            Record document
          </Button>
        }
      />

      <Card padded style={{ marginBottom: 16 }}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <Chip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} count={counts.all}>
              All
            </Chip>
            {STATUSES.map((s) =>
              counts[s] ? (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} count={counts[s]}>
                  {s}
                </Chip>
              ) : null,
            )}
          </div>
          {documentTypes.length ? (
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Type</span>
              <Chip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
                All
              </Chip>
              {documentTypes.map((t) => (
                <Chip key={t.id} active={typeFilter === t.id} onClick={() => setTypeFilter(t.id)}>
                  {t.abbr || t.name}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <Table
        columns={columns}
        rows={rows}
        pageSize={20}
        onRowClick={(row) => setEditingDoc(row.original)}
        empty={<EmptyState title="No documents match" description="Adjust the filters above." />}
      />

      <DocumentForm
        open={creating || Boolean(editingDoc)}
        onClose={() => {
          setCreating(false);
          setEditingDoc(null);
        }}
        doc={editingDoc}
      />
    </PageContainer>
  );
}
