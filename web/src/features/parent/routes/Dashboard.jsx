import { Card, EmptyState } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useAuth } from '../../../lib/auth';
import { useTrips } from '../../../lib/hooks/useTrips';
import { usePupils } from '../../../lib/hooks/usePupils';
import { Fmt } from '../../../lib/format';

/**
 * Parent dashboard — currently a skeleton showing the signed-in parent's
 * children (pupils linked by guardian email). Full payment, document, and
 * comms detail to be ported from frontend/parent/dashboard.html.
 */
export function ParentDashboardPage() {
  const { user } = useAuth();
  const { data: trips } = useTrips();
  const { data: allPupils } = usePupils();

  const myChildren = allPupils.filter(
    (p) => p.guardianEmail && user?.email && p.guardianEmail.toLowerCase() === user.email.toLowerCase(),
  );

  return (
    <PageContainer narrow>
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle="Your children, their trips, and any outstanding actions."
      />

      {!myChildren.length ? (
        <EmptyState
          title="No children linked yet"
          description="Once the school links a pupil record to your email, you'll see their trip and payment information here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myChildren.map((child) => {
            const trip = trips.find((t) => t.id === child.tripId);
            return (
              <Card key={child.id} padded>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--navy-darker)', margin: 0 }}>
                  {child.firstName} {child.lastName}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--grey-500)', marginTop: 4 }}>
                  Grade {child.grade} · {trip ? `${trip.code} — ${trip.name}` : 'No trip assigned'}
                </div>
                {trip ? (
                  <div style={{ marginTop: 14, fontSize: 13, color: 'var(--grey-700)' }}>
                    Departs <strong>{Fmt.date(trip.startDate)}</strong> ·{' '}
                    {Fmt.moneyPlain(trip.costPerPupil, trip.currency)} per pupil
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
