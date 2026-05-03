import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  useToast,
} from '../../design-system';
import { useClubMembers } from '../../lib/hooks/useClubMembers';
import { usePupils } from '../../lib/hooks/usePupils';
import styles from './MemberPicker.module.css';

/**
 * Multi-select picker for adding pupils to a club. Filters out
 * pupils already in the club.
 */
export function MemberPicker({ open, onClose, club }) {
  const toast = useToast();
  const { data: allMembers, create } = useClubMembers();
  const { data: pupils } = usePupils();

  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState(new Set());

  useEffect(() => {
    if (open) {
      setQuery('');
      setChosen(new Set());
    }
  }, [open]);

  const memberSet = useMemo(
    () => new Set(allMembers.filter((m) => m.clubId === club?.id).map((m) => m.pupilId)),
    [allMembers, club],
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pupils
      .filter((p) => !memberSet.has(p.id))
      .filter((p) => {
        if (!q) return true;
        return `${p.firstName} ${p.lastName} ${p.grade} ${p.guardianName || ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [pupils, memberSet, query]);

  function toggle(id) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function add() {
    if (!chosen.size) {
      toast.info('Pick at least one pupil');
      return;
    }
    try {
      for (const pupilId of chosen) {
        await create({ clubId: club.id, pupilId, role: 'member' });
      }
      toast.success(`${chosen.size} member${chosen.size === 1 ? '' : 's'} added`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Add failed');
    }
  }

  if (!club) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add members — ${club.name}`}
      size="md"
      footer={
        <>
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={add} disabled={!chosen.size}>
            Add {chosen.size || ''}
          </Button>
        </>
      }
    >
      <Input
        type="search"
        placeholder="Search by name, grade, guardian…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <div className={styles.list}>
        {!candidates.length ? (
          <div className={styles.empty}>
            {memberSet.size === pupils.length ? 'All pupils are already in this club.' : 'No matches.'}
          </div>
        ) : (
          candidates.map((p) => (
            <label key={p.id} className={styles.row}>
              <input type="checkbox" checked={chosen.has(p.id)} onChange={() => toggle(p.id)} />
              <div>
                <div className={styles.name}>
                  {p.firstName} {p.lastName}
                </div>
                <div className={styles.meta}>
                  Grade {p.grade} · {p.guardianName || '—'}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
      <div className={styles.footer}>
        {chosen.size} selected · {memberSet.size} already in club
      </div>
    </Modal>
  );
}
