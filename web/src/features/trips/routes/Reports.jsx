import { useMemo } from 'react';
import { Card, CardHeader, EmptyState, KpiTile } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useTrips } from '../../../lib/hooks/useTrips';
import { usePupils } from '../../../lib/hooks/usePupils';
import { usePayments } from '../../../lib/hooks/usePayments';
import { useDocuments } from '../../../lib/hooks/useDocuments';
import { useBookings } from '../../../lib/hooks/useBookings';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { Fmt } from '../../../lib/format';
import styles from './Reports.module.css';

export function TripsReportsPage() {
  const { activeTripId } = useActiveTripId();
  const { data: trips } = useTrips();
  const { data: pupils } = usePupils(activeTripId);
  const { data: payments } = usePayments(activeTripId);
  const { data: documents } = useDocuments(activeTripId);
  const { data: bookings } = useBookings(activeTripId);

  const trip = trips.find((t) => t.id === activeTripId);

  const stats = useMemo(() => {
    const expected = pupils.length * (trip?.costPerPupil || 0);
    const collected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const verifiedDocs = documents.filter((d) => d.status === 'verified').length;
    const bookingsTotal = bookings.reduce((s, b) => s + Number(b.totalCost || 0), 0);
    const bookingsPaid = bookings.reduce((s, b) => s + Number(b.paidAmount || 0), 0);
    const byGrade = {};
    pupils.forEach((p) => {
      byGrade[p.grade] = (byGrade[p.grade] || 0) + 1;
    });
    const byGender = {
      M: pupils.filter((p) => p.gender === 'M').length,
      F: pupils.filter((p) => p.gender === 'F').length,
    };
    const flagged = pupils.filter((p) => p.flagged).length;
    return {
      expected,
      collected,
      verifiedDocs,
      bookingsTotal,
      bookingsPaid,
      byGrade,
      byGender,
      flagged,
    };
  }, [pupils, payments, documents, bookings, trip]);

  if (!trip) {
    return (
      <PageContainer>
        <EmptyState title="No active trip" description="Pick a trip from the dashboard to see its reports." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Reports" subtitle="Operational and financial summary for this trip" />

      <h3 className={styles.section}>Finance</h3>
      <div className={styles.kpis}>
        <KpiTile label="Expected from pupils" value={Fmt.moneyPlain(stats.expected, trip.currency)} accent="var(--navy)" />
        <KpiTile
          label="Collected"
          value={Fmt.moneyPlain(stats.collected, trip.currency)}
          hint={Fmt.percent(stats.expected ? stats.collected / stats.expected : 0)}
          accent="var(--success)"
        />
        <KpiTile label="Bookings total" value={Fmt.moneyPlain(stats.bookingsTotal, trip.currency)} accent="var(--info)" />
        <KpiTile
          label="Bookings paid"
          value={Fmt.moneyPlain(stats.bookingsPaid, trip.currency)}
          hint={`Outstanding ${Fmt.moneyPlain(Math.max(0, stats.bookingsTotal - stats.bookingsPaid), trip.currency)}`}
          accent="var(--warning)"
        />
      </div>

      <h3 className={styles.section}>Compliance</h3>
      <div className={styles.kpis}>
        <KpiTile label="Documents verified" value={`${stats.verifiedDocs} / ${documents.length}`} accent="var(--success)" />
        <KpiTile
          label="Compliance %"
          value={Fmt.percent(documents.length ? stats.verifiedDocs / documents.length : 0)}
          accent="var(--info)"
        />
        <KpiTile label="Flagged pupils" value={stats.flagged} accent="var(--crimson)" />
      </div>

      <div className={styles.split}>
        <Card padded>
          <CardHeader title="By grade" />
          <ul className={styles.barList}>
            {Object.entries(stats.byGrade)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([grade, count]) => {
                const pct = pupils.length ? (count / pupils.length) * 100 : 0;
                return (
                  <li key={grade}>
                    <div className={styles.barLabel}>
                      <span>Grade {grade}</span>
                      <span>{count}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%`, background: 'var(--navy)' }} />
                    </div>
                  </li>
                );
              })}
          </ul>
        </Card>

        <Card padded>
          <CardHeader title="By gender" />
          <ul className={styles.barList}>
            <li>
              <div className={styles.barLabel}>
                <span>Male</span>
                <span>{stats.byGender.M}</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${pupils.length ? (stats.byGender.M / pupils.length) * 100 : 0}%`,
                    background: 'var(--info)',
                  }}
                />
              </div>
            </li>
            <li>
              <div className={styles.barLabel}>
                <span>Female</span>
                <span>{stats.byGender.F}</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${pupils.length ? (stats.byGender.F / pupils.length) * 100 : 0}%`,
                    background: 'var(--crimson)',
                  }}
                />
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
