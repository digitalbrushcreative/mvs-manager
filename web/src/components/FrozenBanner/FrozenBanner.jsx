import styles from './FrozenBanner.module.css';

/**
 * Surface a frozen-trip warning above an action area. Used on Roster,
 * Itinerary, Bookings, etc. — pages that mutate trip state.
 */
export function FrozenBanner({ reason, allowance }) {
  return (
    <div className={styles.banner}>
      <span className={styles.icon} aria-hidden>
        🔒
      </span>
      <div>
        <div className={styles.title}>This trip is frozen — {reason}</div>
        <div className={styles.body}>
          {allowance ||
            'Pupils, itinerary, attendance, and bookings are read-only as a historical record. Late payments are still allowed.'}
        </div>
      </div>
    </div>
  );
}
