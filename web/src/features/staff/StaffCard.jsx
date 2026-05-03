import clsx from 'clsx';
import { Avatar, Badge, Card } from '../../design-system';
import { STAFF_ROLE_META } from '../../lib/schema';
import styles from './StaffCard.module.css';

export function StaffCard({ staff, tripCount = 0, onClick }) {
  const role = STAFF_ROLE_META[staff.role] || STAFF_ROLE_META.other;
  const fullName = [staff.firstName, staff.lastName].filter(Boolean).join(' ') || '—';

  return (
    <Card
      padded={false}
      className={clsx(styles.card, staff.active === false && styles.inactive)}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className={styles.body}>
        <Avatar name={fullName} colour={role.colour} size="md" />
        <div className={styles.main}>
          <div className={styles.head}>
            <h3 className={styles.name}>{fullName}</h3>
            <Badge colour={role.colour}>{role.label}</Badge>
          </div>
          {staff.title ? <div className={styles.title}>{staff.title}</div> : null}
          {staff.department ? <div className={styles.dept}>{staff.department}</div> : null}
          <div className={styles.contact}>
            {staff.email ? <span>✉ {staff.email}</span> : null}
            {staff.phone ? <span>☎ {staff.phone}</span> : null}
          </div>
          <footer className={styles.footer}>
            <span>
              {tripCount} trip{tripCount === 1 ? '' : 's'} assigned
            </span>
            {staff.active === false ? <span className={styles.inactiveTag}>Inactive</span> : null}
          </footer>
        </div>
      </div>
    </Card>
  );
}
