import { useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './Table.module.css';

/**
 * Column-driven table with optional sorting and pagination.
 *
 * columns: [{ key, header, render?, width?, align?, sortable?, sortAccessor? }]
 *   - sortable: enables clicking the header to sort; uses `sortAccessor(row)` if
 *     given, else `row[key]`.
 * rows
 * getRowKey?: (row, idx) => key
 * onRowClick?: (row) => void
 * empty?: ReactNode
 * pageSize?: number — when set, renders a pager footer
 * defaultSort?: { key, dir: 'asc' | 'desc' }
 */
export function Table({
  columns,
  rows,
  getRowKey = (row, idx) => row.id ?? idx,
  onRowClick,
  empty,
  className,
  pageSize,
  defaultSort,
}) {
  const [sort, setSort] = useState(defaultSort || null);
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const accessor = col.sortAccessor || ((row) => row[col.key]);
    const sorted = rows.slice().sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true });
    });
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [rows, sort, columns]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const visibleRows = pageSize ? sortedRows.slice(safePage * pageSize, (safePage + 1) * pageSize) : sortedRows;

  function toggleSort(col) {
    if (!col.sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: 'asc' };
      if (prev.dir === 'asc') return { key: col.key, dir: 'desc' };
      return null;
    });
  }

  if (!rows.length && empty) return empty;

  return (
    <div className={clsx(styles.wrap, className)}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => {
              const sortable = Boolean(c.sortable);
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align || 'left' }}
                  className={sortable ? styles.sortable : undefined}
                  onClick={() => toggleSort(c)}
                >
                  <span className={styles.headerInner}>
                    {c.header}
                    {sortable ? (
                      <span className={clsx(styles.sortIcon, active && styles.sortIconActive)}>
                        {active && sort.dir === 'desc' ? '▼' : '▲'}
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, idx) => (
            <tr
              key={getRowKey(row, idx)}
              className={onRowClick ? styles.clickable : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pageSize && sortedRows.length > pageSize ? (
        <div className={styles.pager}>
          <span>
            Page {safePage + 1} of {totalPages} · {sortedRows.length} row{sortedRows.length === 1 ? '' : 's'}
          </span>
          <div className={styles.pagerActions}>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Prev
            </button>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
