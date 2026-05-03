import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Confirm,
  EmptyState,
  KpiTile,
  Select,
  Table,
  useToast,
} from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { useClubs } from '../../../lib/hooks/useClubs';
import { useClubMembers } from '../../../lib/hooks/useClubMembers';
import { usePupils } from '../../../lib/hooks/usePupils';
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { Enums } from '../../../lib/schema';
import { Fmt } from '../../../lib/format';
import { MemberPicker } from '../MemberPicker';
import styles from './Detail.module.css';

const STATUS_VARIANT = {
  draft: 'neutral',
  open: 'info',
  closed: 'warning',
  'in-progress': 'success',
  complete: 'neutral',
  cancelled: 'danger',
};

export function ClubDetailPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { openEdit } = useOutletContext() || {};
  const toast = useToast();

  const { data: clubs } = useClubs();
  const { data: members, update: updateMember, remove: removeMember } = useClubMembers();
  const { data: pupils } = usePupils();
  const { data: trips } = useTrips();
  const { setActiveTripId } = useActiveTripId();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const club = clubs.find((c) => c.id === clubId);
  if (!club) {
    return (
      <PageContainer>
        <EmptyState
          title="Club not found"
          description="The club you're looking for has been removed."
          action={
            <Button variant="secondary" onClick={() => navigate('/admin/clubs/list')}>
              All clubs
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const clubMembers = members.filter((m) => m.clubId === clubId);
  const linkedTrips = trips.filter((t) => (t.clubIds || []).includes(clubId));

  const memberRows = clubMembers.map((m) => {
    const p = pupils.find((x) => x.id === m.pupilId);
    return {
      id: m.id,
      pupilId: m.pupilId,
      pupilName: p ? `${p.firstName} ${p.lastName}` : '(deleted pupil)',
      grade: p?.grade ?? '—',
      gender: p?.gender || '',
      role: m.role,
      joinedAt: m.joinedAt,
    };
  });

  async function changeRole(id, role) {
    try {
      await updateMember(id, { role });
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  }

  async function performRemove(id) {
    try {
      await removeMember(id);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.message || 'Remove failed');
    }
  }

  const captains = clubMembers.filter((m) => m.role === 'captain').length;
  const committee = clubMembers.filter((m) => m.role === 'committee').length;

  const memberColumns = [
    {
      key: 'pupil',
      header: 'Member',
      sortable: true,
      sortAccessor: (r) => r.pupilName,
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={r.pupilName} colour={r.gender === 'F' ? 'var(--crimson)' : 'var(--navy)'} size="sm" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy-darker)' }}>{r.pupilName}</div>
            <div style={{ fontSize: 11, color: 'var(--grey-500)' }}>Grade {r.grade}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: 160,
      render: (r) => (
        <Select
          value={r.role}
          onChange={(e) => changeRole(r.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ padding: '4px 8px', fontSize: 12 }}
        >
          {Enums.ClubMemberRole.map((x) => (
            <option key={x} value={x}>
              {x.charAt(0).toUpperCase() + x.slice(1)}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      width: 140,
      sortable: true,
      sortAccessor: (r) => r.joinedAt,
      render: (r) => Fmt.date(r.joinedAt),
    },
    {
      key: 'actions',
      header: '',
      width: 100,
      align: 'right',
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmRemoveId(r.id);
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  function openTrip(tripId) {
    setActiveTripId(tripId);
    navigate('/admin/trips');
  }

  return (
    <PageContainer>
      <div className={styles.banner} style={{ background: `linear-gradient(135deg, ${club.colour}, ${club.colour}dd)` }}>
        <button type="button" className={styles.back} onClick={() => navigate('/admin/clubs/list')}>
          ← All clubs
        </button>
        <div className={styles.bannerInner}>
          <div className={styles.emoji}>{club.emoji}</div>
          <div className={styles.bannerText}>
            <div className={styles.eyebrow}>
              {club.status} · {club.meetingDay} {club.meetingTime} · {club.venue || 'No venue set'}
            </div>
            <h1 className={styles.title}>{club.name}</h1>
            <div className={styles.lead}>Led by {club.leadStaff || 'no lead assigned'}</div>
          </div>
          <div className={styles.bannerActions}>
            <Button variant="ghost" onClick={() => openEdit?.(club.id)}>
              Edit club
            </Button>
            <Button variant="primary" onClick={() => setPickerOpen(true)}>
              + Add member
            </Button>
          </div>
        </div>
        {club.description ? <p className={styles.description}>{club.description}</p> : null}
      </div>

      <div className={styles.kpis}>
        <KpiTile label="Members" value={clubMembers.length} accent="var(--navy)" />
        <KpiTile label="Captains" value={captains} hint="Leadership roles" accent="var(--gold)" />
        <KpiTile label="Committee" value={committee} hint="Committee members" accent="var(--info)" />
        <KpiTile label="Linked trips" value={linkedTrips.length} hint="Current + upcoming" accent="var(--success)" />
      </div>

      <Card padded>
        <CardHeader title="Linked trips" subtitle={`${linkedTrips.length} trip${linkedTrips.length === 1 ? '' : 's'}`} />
        {!linkedTrips.length ? (
          <p style={{ color: 'var(--grey-500)', fontSize: 13, margin: 0 }}>
            No trips tagged with this club yet. In Trip Manager, use the Clubs field on the trip form.
          </p>
        ) : (
          <div className={styles.tripGrid}>
            {linkedTrips.map((t) => {
              const enrolled = pupils.filter((p) => p.tripId === t.id).length;
              return (
                <Card key={t.id} padded onClick={() => openTrip(t.id)} className={styles.tripRow}>
                  <div className={styles.tripHead}>
                    <Badge variant={STATUS_VARIANT[t.status] || 'neutral'}>{t.status}</Badge>
                    <span className={styles.tripCode}>{t.code}</span>
                  </div>
                  <div className={styles.tripName}>{t.name}</div>
                  <div className={styles.tripMeta}>
                    {enrolled}/{t.seatsTotal || 0} pupils · {Fmt.date(t.startDate)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Card padded={false} style={{ marginTop: 18 }}>
        <div style={{ padding: '16px 20px 0' }}>
          <CardHeader
            title="Members"
            subtitle={`${clubMembers.length} active`}
            actions={
              <Button variant="primary" size="sm" onClick={() => setPickerOpen(true)}>
                + Add member
              </Button>
            }
          />
        </div>
        <Table
          columns={memberColumns}
          rows={memberRows}
          pageSize={15}
          defaultSort={{ key: 'pupil', dir: 'asc' }}
          empty={
            <EmptyState
              title="No members yet"
              description="Add the first member to start building this club's roster."
              action={
                <Button variant="primary" onClick={() => setPickerOpen(true)}>
                  Add member
                </Button>
              }
            />
          }
        />
      </Card>

      <MemberPicker open={pickerOpen} onClose={() => setPickerOpen(false)} club={club} />
      <Confirm
        open={Boolean(confirmRemoveId)}
        onCancel={() => setConfirmRemoveId(null)}
        onConfirm={() => {
          performRemove(confirmRemoveId);
          setConfirmRemoveId(null);
        }}
        title="Remove member?"
        message="Remove this pupil from the club? They can be re-added later."
        confirmLabel="Remove"
        destructive
      />
    </PageContainer>
  );
}
