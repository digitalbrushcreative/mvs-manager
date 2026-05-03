import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, CardHeader, Donut, EmptyState, KpiTile, StackedBarGrid } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useClubs } from '../../../lib/hooks/useClubs';
import { useClubMembers } from '../../../lib/hooks/useClubMembers';
import { usePupils } from '../../../lib/hooks/usePupils';
import { useTrips } from '../../../lib/hooks/useTrips';
import styles from './Dashboard.module.css';

export function ClubsDashboardPage() {
  useOutletContext();
  const navigate = useNavigate();
  const { data: clubs } = useClubs();
  const { data: members } = useClubMembers();
  const { data: pupils } = usePupils();
  const { data: trips } = useTrips();

  if (!clubs.length) {
    return (
      <PageContainer>
        <EmptyState
          title="No clubs yet"
          description="Create your first club to start tracking memberships and linked trips."
        />
      </PageContainer>
    );
  }

  const activeClubs = clubs.filter((c) => c.status === 'active').length;
  const uniqueMembers = new Set(members.map((m) => m.pupilId)).size;
  const avg = clubs.length ? (members.length / clubs.length).toFixed(1) : 0;
  const linkedTrips = trips.filter((t) => (t.clubIds || []).length > 0).length;

  // Pupil engagement segments
  const countByPupil = new Map();
  members.forEach((m) => {
    countByPupil.set(m.pupilId, (countByPupil.get(m.pupilId) || 0) + 1);
  });
  const noClub = pupils.length - countByPupil.size;
  const oneClub = Array.from(countByPupil.values()).filter((n) => n === 1).length;
  const twoClubs = Array.from(countByPupil.values()).filter((n) => n === 2).length;
  const threePlus = Array.from(countByPupil.values()).filter((n) => n >= 3).length;

  return (
    <PageContainer>
      <PageHeader
        title="Club Manager"
        subtitle={`${clubs.length} club${clubs.length === 1 ? '' : 's'} · ${members.length} active membership${members.length === 1 ? '' : 's'}`}
      />

      <div className={styles.kpis}>
        <KpiTile label="Active clubs" value={activeClubs} hint={`of ${clubs.length} total`} accent="var(--navy)" />
        <KpiTile label="Total memberships" value={members.length} hint={`avg ${avg} per club`} accent="var(--info)" />
        <KpiTile
          label="Pupils in a club"
          value={uniqueMembers}
          hint={`${Math.max(0, pupils.length - uniqueMembers)} not in any club`}
          accent="var(--success)"
        />
        <KpiTile label="Linked trips" value={linkedTrips} hint="Trips tagged with a club" accent="var(--gold)" />
      </div>

      <div className={styles.split}>
        <Card padded>
          <CardHeader title="Membership per club" subtitle={`${members.length} memberships across ${clubs.length} clubs`} />
          <StackedBarGrid
            tiles={clubs.map((c) => {
              const mem = members.filter((m) => m.clubId === c.id).length;
              const captains = members.filter((m) => m.clubId === c.id && m.role === 'captain').length;
              return {
                key: c.id,
                name: `${c.emoji} ${c.name}`,
                accent: c.colour,
                total: pupils.length,
                segments: [{ value: mem, colour: c.colour }],
                footer: `${pupils.length ? Math.round((mem / pupils.length) * 100) : 0}% of pupils${captains ? ` · ${captains} capt.` : ''}`,
              };
            })}
          />
        </Card>

        <Card padded>
          <CardHeader title="Pupil engagement" subtitle={`${pupils.length} pupils school-wide`} />
          <Donut
            size={170}
            thickness={26}
            segments={[
              { label: 'In no club', value: noClub, colour: 'var(--grey-300)' },
              { label: 'In 1 club', value: oneClub, colour: 'var(--info)' },
              { label: 'In 2 clubs', value: twoClubs, colour: 'var(--success)' },
              { label: 'In 3+ clubs', value: threePlus, colour: 'var(--gold)' },
            ]}
            centerLabel="pupils"
            centerValue={pupils.length}
          />
        </Card>
      </div>

      <Card padded style={{ marginTop: 18 }}>
        <CardHeader
          title="All clubs"
          subtitle="Click any card to open"
          actions={
            <button
              type="button"
              onClick={() => navigate('/admin/clubs/list')}
              style={{ background: 'transparent', border: 'none', color: 'var(--navy)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              View all →
            </button>
          }
        />
        <div className={styles.grid}>
          {clubs.map((c) => {
            const mem = members.filter((m) => m.clubId === c.id).length;
            const linked = trips.filter((t) => (t.clubIds || []).includes(c.id)).length;
            return (
              <button key={c.id} type="button" className={styles.miniCard} onClick={() => navigate(`/admin/clubs/${c.id}`)}>
                <div className={styles.miniHead}>
                  <div className={styles.miniEmoji} style={{ background: c.colour }}>
                    {c.emoji}
                  </div>
                  <div>
                    <div className={styles.miniName}>{c.name}</div>
                    <div className={styles.miniMeta}>
                      {c.meetingDay} · {c.meetingTime}
                    </div>
                  </div>
                </div>
                <div className={styles.miniLead}>{c.leadStaff || 'No lead assigned'}</div>
                <div className={styles.miniCounts}>
                  <span>
                    <strong>{mem}</strong> member{mem === 1 ? '' : 's'}
                  </span>
                  <span>
                    <strong>{linked}</strong> trip{linked === 1 ? '' : 's'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </PageContainer>
  );
}
