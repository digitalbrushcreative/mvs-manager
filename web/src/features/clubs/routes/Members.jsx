import { useMemo, useState } from 'react';
import { Avatar, Badge, Card, Chip, EmptyState, Table } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useClubMembers } from '../../../lib/hooks/useClubMembers';
import { useClubs } from '../../../lib/hooks/useClubs';
import { usePupils } from '../../../lib/hooks/usePupils';
import { Fmt } from '../../../lib/format';
import styles from './Members.module.css';

export function ClubsMembersPage() {
  const { data: members } = useClubMembers();
  const { data: clubs } = useClubs();
  const { data: pupils } = usePupils();

  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const filtered = filter === 'all' ? members : members.filter((m) => m.clubId === filter);
    return filtered
      .map((m) => {
        const p = pupils.find((x) => x.id === m.pupilId);
        const c = clubs.find((x) => x.id === m.clubId);
        return {
          id: m.id,
          pupilName: p ? `${p.firstName} ${p.lastName}` : '(deleted pupil)',
          grade: p?.grade ?? '—',
          gender: p?.gender || '',
          clubName: c?.name || '(deleted club)',
          clubEmoji: c?.emoji || '',
          clubColour: c?.colour || '#394050',
          role: m.role,
          joinedAt: m.joinedAt,
        };
      })
      .sort((a, b) => a.pupilName.localeCompare(b.pupilName));
  }, [members, clubs, pupils, filter]);

  const columns = [
    {
      key: 'pupil',
      header: 'Pupil',
      render: (r) => (
        <div className={styles.pupilCell}>
          <Avatar name={r.pupilName} colour={r.gender === 'F' ? 'var(--crimson)' : 'var(--navy)'} size="sm" />
          <div>
            <div className={styles.pupilName}>{r.pupilName}</div>
            <div className={styles.pupilMeta}>Grade {r.grade}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'club',
      header: 'Club',
      render: (r) => (
        <Badge colour={r.clubColour}>
          {r.clubEmoji} {r.clubName}
        </Badge>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: 120,
      render: (r) => Fmt.capitalize(r.role),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      width: 140,
      render: (r) => Fmt.date(r.joinedAt),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Members"
        subtitle={`${members.length} membership${members.length === 1 ? '' : 's'} across ${clubs.length} club${clubs.length === 1 ? '' : 's'}`}
      />

      <Card padded style={{ marginBottom: 16 }}>
        <div className={styles.filters}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={members.length}>
            All
          </Chip>
          {clubs.map((c) => {
            const count = members.filter((m) => m.clubId === c.id).length;
            if (!count) return null;
            return (
              <Chip
                key={c.id}
                active={filter === c.id}
                accent={c.colour}
                onClick={() => setFilter(c.id)}
                count={count}
              >
                {c.emoji} {c.name}
              </Chip>
            );
          })}
        </div>
      </Card>

      <Table
        columns={columns}
        rows={rows}
        pageSize={20}
        empty={
          <EmptyState
            title="No memberships match"
            description={members.length ? 'Adjust the filter above.' : 'Add members from the club detail page.'}
          />
        }
      />
    </PageContainer>
  );
}
