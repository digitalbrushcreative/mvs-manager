import styles from './Chart.module.css';

/**
 * SVG donut chart with optional centre label.
 * segments: [{ label, value, colour }]
 */
export function Donut({ segments, size = 180, thickness = 28, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value || 0), 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className={styles.donut}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--grey-100)" strokeWidth={thickness} />
        {total > 0
          ? segments.map((s, idx) => {
              const value = Math.max(0, s.value || 0);
              if (!value) return null;
              const length = (value / total) * circumference;
              const dasharray = `${length} ${circumference - length}`;
              const dashoffset = -offset;
              offset += length;
              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={s.colour}
                  strokeWidth={thickness}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  strokeLinecap="butt"
                />
              );
            })
          : null}
        {centerValue !== undefined ? (
          <>
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 24, fill: 'var(--navy-darker)' }}
            >
              {centerValue}
            </text>
            {centerLabel ? (
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fill: 'var(--grey-500)' }}
              >
                {centerLabel}
              </text>
            ) : null}
          </>
        ) : null}
      </svg>
      <ul className={styles.legend}>
        {segments.map((s, idx) => (
          <li key={idx}>
            <span className={styles.swatch} style={{ background: s.colour }} />
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendValue}>{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
