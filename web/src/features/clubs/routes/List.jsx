import { useNavigate, useOutletContext } from 'react-router-dom';
import { Badge, Button, Card, EmptyState } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useClubs } from '../../../lib/hooks/useClubs';
import { useClubMembers } from '../../../lib/hooks/useClubMembers';
import { useTrips } from '../../../lib/hooks/useTrips';
import styles from './List.module.css';

const STATUS_VARIANT = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
};

export function ClubsListPage() {
  const { openNew } = useOutletContext() || {};
  const navigate = useNavigate();
  const { data: clubs } = useClubs();
  const { data: members } = useClubMembers();
  const { data: trips } = useTrips();

  return (
    <PageContainer>
      <PageHeader
        title="Clubs"
        subtitle={`${clubs.length} club${clubs.length === 1 ? '' : 's'} across the school`}
        actions={
          <Button variant="primary" onClick={openNew}>
            New club
          </Button>
        }
      />

      {!clubs.length ? (
        <EmptyState
          title="No clubs yet"
          description="Create your first club to start tracking memberships and linked trips."
        />
      ) : (
        <div className={styles.grid}>
          {clubs.map((c) => {
            const mem = members.filter((m) => m.clubId === c.id);
            const linked = trips.filter((t) => (t.clubIds || []).includes(c.id));
            const captains = mem.filter((m) => m.role === 'captain').length;
            return (
              <Card key={c.id} padded={false} className={styles.card} onClick={() => navigate(`/admin/clubs/${c.id}`)}>
                <div className={styles.banner} style={{ background: c.colour }}>
                  <div className={styles.emoji}>{c.emoji}</div>
                  <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                </div>
                <div className={styles.body}>
                  <h3 className={styles.title}>{c.name}</h3>
                  <div className={styles.lead}>{c.leadStaff || 'No lead assigned'}</div>
                  {c.description ? <p className={styles.desc}>{c.description}</p> : null}
                  <div className={styles.meta}>
                    <div>
                      <span>Meets</span>
                      <strong>
                        {c.meetingDay} · {c.meetingTime}
                      </strong>
                    </div>
                    <div>
                      <span>Venue</span>
                      <strong>{c.venue || '—'}</strong>
                    </div>
                  </div>
                  <div className={styles.counts}>
                    <span>
                      <strong>{mem.length}</strong> member{mem.length === 1 ? '' : 's'}
                    </span>
                    {captains ? (
                      <span>
                        <strong>{captains}</strong> captain{captains === 1 ? '' : 's'}
                      </span>
                    ) : null}
                    <span>
                      <strong>{linked.length}</strong> trip{linked.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
