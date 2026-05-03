import { useEffect, useState } from 'react';
import {
  Button,
  Confirm,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '../../design-system';
import { useDocuments, useDocumentTypes } from '../../lib/hooks/useDocuments';
import { usePupils } from '../../lib/hooks/usePupils';
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { useTrip } from '../../lib/hooks/useTrips';
import { useGoogleDrive } from '../../lib/hooks/useGoogleDrive';
import { useAuth } from '../../lib/auth';

const STATUSES = ['missing', 'submitted', 'verified', 'expired', 'expiring'];
const DRIVE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

function emptyDoc(tripId) {
  return {
    id: '',
    tripId,
    pupilId: '',
    typeId: '',
    status: 'missing',
    filename: '',
    fileId: null,
    driveUrl: null,
    mimeType: null,
    uploadedAt: '',
    verifiedAt: '',
    verifiedBy: '',
    expiresAt: '',
    notes: '',
  };
}

export function DocumentForm({ open, onClose, doc }) {
  const isEdit = Boolean(doc?.id);
  const toast = useToast();
  const { activeTripId } = useActiveTripId();
  const { create, update, remove } = useDocuments();
  const { data: documentTypes } = useDocumentTypes();
  const { data: pupils } = usePupils(activeTripId);
  const { trip } = useTrip(activeTripId);
  const drive = useGoogleDrive();
  const { user } = useAuth();

  const [form, setForm] = useState(() => emptyDoc(activeTripId));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (doc) {
      setForm({
        ...emptyDoc(activeTripId),
        ...doc,
        uploadedAt: doc.uploadedAt ? doc.uploadedAt.slice(0, 10) : '',
        verifiedAt: doc.verifiedAt ? doc.verifiedAt.slice(0, 10) : '',
        expiresAt: doc.expiresAt ? doc.expiresAt.slice(0, 10) : '',
      });
    } else {
      setForm(emptyDoc(activeTripId));
    }
    setPendingFile(null);
    setConfirmDelete(false);
  }, [open, doc, activeTripId]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const docType = documentTypes.find((t) => t.id === form.typeId);
  const pupil = pupils.find((p) => p.id === form.pupilId);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setField('filename', file.name);
    setField('mimeType', file.type || null);
    if (!form.uploadedAt) setField('uploadedAt', new Date().toISOString().slice(0, 10));
    if (form.status === 'missing') setField('status', 'submitted');
    if (form.fileId) {
      setField('fileId', null);
      setField('driveUrl', null);
    }
  }

  async function uploadToDrive() {
    if (!pendingFile) return null;
    if (!DRIVE_ENABLED) {
      throw new Error('Drive uploads disabled — VITE_GOOGLE_CLIENT_ID not set');
    }
    if (!pupil) throw new Error('Pick a pupil before uploading');
    const tripFolderName = trip?.code || trip?.name || `trip-${activeTripId}`;
    const pupilFolderName = `${pupil.firstName} ${pupil.lastName}`.trim() || `pupil-${pupil.id}`;
    const tripFolderId = await drive.ensureFolder(tripFolderName);
    const pupilFolderId = await drive.ensureFolder(pupilFolderName, tripFolderId);
    const result = await drive.upload(pendingFile, { folderId: pupilFolderId });
    return result;
  }

  async function save() {
    if (!form.pupilId) {
      toast.error('Pick a pupil');
      return;
    }
    if (!form.typeId) {
      toast.error('Pick a document type');
      return;
    }

    let driveResult = null;
    if (pendingFile && DRIVE_ENABLED) {
      try {
        driveResult = await uploadToDrive();
      } catch (err) {
        toast.error(err.message || 'Drive upload failed');
        return;
      }
    }

    const payload = {
      ...form,
      tripId: activeTripId,
      filename: (form.filename || '').trim(),
      notes: (form.notes || '').trim(),
      fileId: driveResult?.fileId ?? form.fileId ?? null,
      driveUrl: driveResult?.webViewLink ?? form.driveUrl ?? null,
      mimeType: driveResult?.mimeType ?? form.mimeType ?? null,
      uploadedAt: form.uploadedAt ? new Date(form.uploadedAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      verifiedAt:
        form.status === 'verified'
          ? form.verifiedAt
            ? new Date(form.verifiedAt).toISOString()
            : new Date().toISOString()
          : form.verifiedAt
          ? new Date(form.verifiedAt).toISOString()
          : null,
      verifiedBy: form.status === 'verified' ? form.verifiedBy || user?.name || user?.email || 'staff' : form.verifiedBy,
    };
    try {
      if (isEdit) {
        await update(form.id, payload);
        toast.success('Document updated');
      } else {
        await create(payload);
        toast.success(driveResult ? 'Document uploaded to Drive' : 'Document recorded');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function performDelete() {
    try {
      await remove(form.id);
      toast.success('Document removed');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }

  const fileHint = DRIVE_ENABLED
    ? drive.signedIn
      ? 'Uploads to Google Drive on save'
      : 'Sign in to Google to upload files'
    : 'Filename only — set VITE_GOOGLE_CLIENT_ID to enable Drive uploads';

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit document' : 'Record document'}
        subtitle={docType?.name || '—'}
        size="md"
        footer={
          <>
            {isEdit ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : null}
            <span style={{ flex: 1 }} />
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={drive.busy}>
              {drive.busy ? 'Uploading…' : isEdit ? 'Save changes' : 'Record'}
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <FormField label="Pupil" required fullWidth>
            <Select value={form.pupilId} onChange={(e) => setField('pupilId', e.target.value)}>
              <option value="">Select pupil…</option>
              {pupils
                .slice()
                .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} · Grade {p.grade}
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label="Document type" required>
            <Select value={form.typeId} onChange={(e) => setField('typeId', e.target.value)}>
              <option value="">Select type…</option>
              {documentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Upload file" hint={fileHint} fullWidth>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                onChange={handleFile}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '8px 10px',
                  border: '1px solid var(--grey-200)',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--white)',
                  fontSize: 13,
                }}
              />
              {DRIVE_ENABLED ? (
                drive.signedIn ? (
                  <Button size="sm" variant="ghost" onClick={drive.signOut}>
                    Sign out
                  </Button>
                ) : (
                  <Button size="sm" variant="light" onClick={drive.signIn} disabled={drive.busy}>
                    {drive.busy ? 'Signing in…' : 'Sign in to Google'}
                  </Button>
                )
              ) : null}
            </div>
            {form.driveUrl ? (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--grey-700)' }}>
                <a href={form.driveUrl} target="_blank" rel="noreferrer">
                  Open in Drive
                </a>
                {form.filename ? ` · ${form.filename}` : null}
              </div>
            ) : form.filename ? (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--grey-700)' }}>
                Recorded: <code style={{ fontFamily: 'var(--mono)' }}>{form.filename}</code>
              </div>
            ) : null}
          </FormField>
          <FormField label="Submitted on">
            <Input type="date" value={form.uploadedAt} onChange={(e) => setField('uploadedAt', e.target.value)} />
          </FormField>
          <FormField label="Expires on" hint={docType?.requiresExpiry ? 'Required for this type' : 'Optional'}>
            <Input type="date" value={form.expiresAt} onChange={(e) => setField('expiresAt', e.target.value)} />
          </FormField>
          <FormField label="Notes" fullWidth>
            <Textarea rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </FormField>
        </FormGrid>
      </Modal>

      <Confirm
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performDelete}
        title="Delete document record?"
        message="This document record will be removed."
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
