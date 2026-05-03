import { useEffect, useState, useCallback } from 'react';
import { GDrive } from '../gdrive';

export function useGoogleDrive() {
  const [state, setState] = useState(() => ({
    signedIn: GDrive.isSignedIn(),
    expiresAt: 0,
  }));
  const [busy, setBusy] = useState(false);

  useEffect(() => GDrive.subscribe(setState), []);

  const signIn = useCallback(async () => {
    setBusy(true);
    try {
      await GDrive.signIn();
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(() => GDrive.signOut(), []);

  const upload = useCallback(async (file, opts) => {
    setBusy(true);
    try {
      return await GDrive.upload(file, opts);
    } finally {
      setBusy(false);
    }
  }, []);

  const ensureFolder = useCallback((name, parentId) => GDrive.ensureFolder(name, parentId), []);

  return { ...state, busy, signIn, signOut, upload, ensureFolder };
}
