import styles from './Chart.module.css';

/**
 * Tile of stacked-bar rows. Use for capacity/utilisation grids.
 * tiles: [{ key, name, total, segments: [{ value, colour }], hint?, accent?, footer? }]
 */
export function StackedBarGrid({ tiles }) {
  return (
    <div className={styles.tileGrid}>
      {tiles.map((t) => {
        const segTotal = t.segments.reduce((s, x) => s + (x.value || 0), 0);
        const denom = t.total || segTotal || 1;
        const Wrapper = t.onClick ? 'button' : 'div';
        const wrapperProps = t.onClick
          ? { type: 'button', onClick: t.onClick, className: `${styles.tile} ${styles.tileButton}` }
          : { className: styles.tile };
        return (
          <Wrapper key={t.key} {...wrapperProps}>
            <div className={styles.tileHead}>
              {t.accent ? <span className={styles.tileDot} style={{ background: t.accent }} /> : null}
              <span className={styles.tileName}>{t.name}</span>
              <span className={styles.tileCount}>
                {segTotal}
                {t.total != null ? `/${t.total}` : ''}
              </span>
            </div>
            <div className={styles.tileBar}>
              {t.segments.map((s, idx) => (
                <span
                  key={idx}
                  style={{ width: `${Math.min(100, ((s.value || 0) / denom) * 100)}%`, background: s.colour }}
                />
              ))}
            </div>
            {t.footer ? <div className={styles.tileFooter}>{t.footer}</div> : null}
          </Wrapper>
        );
      })}
    </div>
  );
}
