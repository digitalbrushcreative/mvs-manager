import { useOutletContext } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  Donut,
  KpiTile,
  PageSpinner,
} from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { useTripStats } from '../../../lib/hooks/useTripStats';
import { useTripFinancials } from '../../../lib/hooks/useTripFinancials';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { isTripFrozen } from '../../../lib/tripFreeze';
import { Fmt } from '../../../lib/format';
import styles from './Dashboard.module.css';

/**
 * Per-trip Overview tab — focus view for the trip currently in URL scope.
 * Replaces Section 1 of the old portfolio Dashboard.
 */
export function TripOverviewPage() {
  const { openEditTrip } = useOutletContext() || {};
  const { activeTripId } = useActiveTripId();
  const stats = useTripStats(activeTripId);
  const financials = useTripFinancials(activeTripId);

  if (!stats) return <PageSpinner />;

  const { frozen, reason } = isTripFrozen(stats.trip);

  return (
    <PageContainer>
      {frozen ? (
        <div className={styles.frozenBanner}>
          <span aria-hidden>🔒</span>
          <span>
            <strong>Frozen — {reason}.</strong> Pupils, attendance, itinerary, and bookings are read-only.
            Late payments are still allowed.
          </span>
        </div>
      ) : null}

      <div className={styles.kpis}>
        <KpiTile
          label="Pupils enrolled"
          value={stats.enrolled}
          hint={`of ${stats.seatsTotal} seats`}
          accent="var(--navy)"
        />
        <KpiTile
          label="Chaperone seats"
          value={`${stats.assignedStaffCount} / ${stats.chaperones}`}
          hint={
            stats.assignedStaffCount === stats.chaperones && stats.chaperones > 0
              ? 'All filled'
              : 'Confirmed staff'
          }
          accent="var(--gold)"
        />
        <KpiTile
          label="Days to departure"
          value={stats.daysUntil ?? '—'}
          hint={stats.trip.startDate ? Fmt.date(stats.trip.startDate) : 'No date set'}
          accent="var(--info)"
        />
        <KpiTile
          label="Flagged pupils"
          value={stats.flaggedCount}
          hint="Need attention"
          accent="var(--crimson)"
        />
      </div>

      {financials ? (
        <div className={styles.kpis}>
          <KpiTile
            label="Expected revenue"
            value={Fmt.moneyPlain(financials.expected, financials.currency)}
            hint={`${stats.enrolled} pupils × ${Fmt.moneyPlain(financials.trip.costPerPupil, financials.currency)}`}
            accent="var(--info)"
          />
          <KpiTile
            label="Collected"
            value={Fmt.moneyPlain(financials.collected, financials.currency)}
            hint={`${Fmt.percent(financials.revenuePct)} of expected · ${Fmt.moneyPlain(financials.outstandingRevenue, financials.currency)} outstanding`}
            accent="var(--success)"
          />
          <KpiTile
            label="Total trip cost"
            value={Fmt.moneyPlain(financials.cost, financials.currency)}
            hint="Sum of bookings: flights, hotels, transfers, etc."
            accent="var(--gold)"
          />
          <KpiTile
            label="Expenses paid"
            value={Fmt.moneyPlain(financials.expenses, financials.currency)}
            hint={`${Fmt.percent(financials.expensePct)} paid · ${Fmt.moneyPlain(financials.payableToSuppliers, financials.currency)} owed`}
            accent="var(--crimson)"
          />
        </div>
      ) : null}

      <div className={styles.activeGrid}>
        <Card padded>
          <CardHeader title="Trip mix" subtitle="Pupils · chaperones · parents · empty" />
          <Donut
            segments={[
              { label: 'Pupils', value: stats.enrolled, colour: 'var(--navy)' },
              { label: 'Chaperones', value: stats.chaperones, colour: 'var(--gold)' },
              { label: 'Parents', value: stats.parentsJoining, colour: 'var(--info)' },
              {
                label: 'Empty seats',
                value: Math.max(0, stats.seatsLeft),
                colour: 'var(--grey-200)',
              },
            ]}
            centerLabel="of total"
            centerValue={`${stats.seatsUsed}/${stats.seatsTotal}`}
          />
        </Card>

        <Card padded>
          <CardHeader
            title={stats.trip.name}
            subtitle={`${stats.trip.code} · ${stats.trip.tripType}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => openEditTrip(activeTripId)}>
                Edit trip
              </Button>
            }
          />
          <dl className={styles.tripFacts}>
            <div>
              <dt>Destination</dt>
              <dd>{stats.trip.destination || '—'}</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd>
                {Fmt.date(stats.trip.startDate)} → {Fmt.date(stats.trip.endDate)}
              </dd>
            </div>
            <div>
              <dt>Cost / pupil</dt>
              <dd>{Fmt.moneyPlain(stats.trip.costPerPupil, stats.trip.currency)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{stats.trip.status}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </PageContainer>
  );
}
