import { useMemo, useState } from 'react';
import { Button, Card, EmptyState } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { FrozenBanner } from '../../../components/FrozenBanner/FrozenBanner';
import { ActivityForm } from '../ActivityForm';
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActivities } from '../../../lib/hooks/useActivities';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { isTripFrozen } from '../../../lib/tripFreeze';
import { Fmt } from '../../../lib/format';
import styles from './Itinerary.module.css';

export function TripsItineraryPage() {
  const { activeTripId } = useActiveTripId();
  const { data: trips } = useTrips();
  const { data: activities } = useActivities(activeTripId);

  const trip = trips.find((t) => t.id === activeTripId);
  const { frozen, reason } = isTripFrozen(trip);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [defaultDay, setDefaultDay] = useState(1);

  const openCreate = (day = 1) => {
    setEditId(null);
    setDefaultDay(day);
    setFormOpen(true);
  };
  const openEdit = (id) => {
    setEditId(id);
    setFormOpen(true);
  };

  const days = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const out = [];
    let i = 1;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push({ index: i, date: new Date(d) });
      i += 1;
    }
    return out;
  }, [trip]);

  const byDay = useMemo(() => {
    const map = new Map();
    activities.forEach((a) => {
      const list = map.get(a.day) || [];
      list.push(a);
      list.sort((x, y) => (x.startTime || '').localeCompare(y.startTime || ''));
      map.set(a.day, list);
    });
    return map;
  }, [activities]);

  return (
    <PageContainer>
      <PageHeader
        title="Itinerary"
        subtitle={
          trip
            ? `${days.length}-day plan · ${activities.length} scheduled activities`
            : 'Pick a trip to view its itinerary'
        }
        actions={
          trip && !frozen ? (
            <Button variant="primary" onClick={() => openCreate(1)}>
              Add activity
            </Button>
          ) : null
        }
      />

      {frozen ? (
        <FrozenBanner
          reason={reason}
          allowance="Itinerary is read-only as a historical record of what ran."
        />
      ) : null}

      {!trip ? (
        <EmptyState title="No active trip" description="Choose a trip from the dashboard to see its itinerary." />
      ) : !days.length ? (
        <EmptyState
          title="No dates set"
          description="Add start and end dates to the trip to lay out the itinerary."
        />
      ) : (
        <div className={styles.timeline}>
          {days.map((day) => {
            const items = byDay.get(day.index) || [];
            return (
              <Card key={day.index} padded className={styles.day}>
                <div className={styles.dayHeader}>
                  <div>
                    <div className={styles.dayNum}>Day {day.index}</div>
                    <div className={styles.dayDate}>{Fmt.date(day.date)}</div>
                  </div>
                  {!frozen ? (
                    <Button variant="ghost" size="sm" onClick={() => openCreate(day.index)}>
                      + Add
                    </Button>
                  ) : null}
                </div>
                {!items.length ? (
                  <p className={styles.empty}>No activities scheduled for this day.</p>
                ) : (
                  <ul className={styles.items}>
                    {items.map((a) => {
                      const Wrapper = frozen ? 'div' : 'button';
                      const wrapperProps = frozen
                        ? { className: styles.item }
                        : { type: 'button', className: `${styles.item} ${styles.itemButton}`, onClick: () => openEdit(a.id) };
                      return (
                        <li key={a.id}>
                          <Wrapper {...wrapperProps}>
                            <div className={styles.itemTime}>{a.startTime || '—'}</div>
                            <div className={styles.itemBody}>
                              <div className={styles.itemTitle}>{a.title}</div>
                              {a.description ? <div className={styles.itemDesc}>{a.description}</div> : null}
                              <div className={styles.itemMeta}>
                                <span>{Fmt.capitalize(a.type)}</span>
                                {a.duration ? <span>· {a.duration}</span> : null}
                                {a.supplier ? <span>· {a.supplier}</span> : null}
                                {a.perPupilCost > 0 ? (
                                  <span>· {Fmt.moneyPlain(a.perPupilCost, a.currency)} / pupil</span>
                                ) : null}
                              </div>
                            </div>
                          </Wrapper>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ActivityForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        activityId={editId}
        defaultDay={defaultDay}
      />
    </PageContainer>
  );
}
