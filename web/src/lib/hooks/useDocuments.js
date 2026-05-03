import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { Fmt } from '../format';

function newDocument() {
  return {
    id: Fmt.uid('doc'),
    tripId: null,
    pupilId: null,
    typeId: null,
    status: 'missing',
    filename: '',
    fileId: null,
    driveUrl: null,
    mimeType: null,
    uploadedAt: null,
    verifiedAt: null,
    verifiedBy: null,
    expiresAt: null,
    notes: '',
  };
}

function newDocumentType() {
  return {
    id: Fmt.uid('dtype'),
    name: '',
    abbr: '',
    required: true,
    requiresExpiry: false,
    description: '',
  };
}

export function useDocuments(tripId = null) {
  const collection = useStoreCollection(StorageKeys.DOCUMENTS, newDocument);
  const filtered = useMemo(
    () => (tripId ? collection.data.filter((d) => d.tripId === tripId) : collection.data),
    [collection.data, tripId],
  );
  return { ...collection, data: filtered };
}

export function useDocumentTypes() {
  return useStoreCollection(StorageKeys.DOCUMENT_TYPES, newDocumentType);
}
