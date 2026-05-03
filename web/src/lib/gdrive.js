/**
 * Google Drive integration via Google Identity Services (GIS) + Drive REST v3.
 *
 * Why: documents in this app are recorded as filenames only. To attach real
 * files, we authenticate the user against their own Google Drive and upload
 * into a per-trip folder. Token is held in memory for the session — it expires
 * after ~1 hour and the user re-consents on next sign-in.
 *
 * Requires:
 *   - VITE_GOOGLE_CLIENT_ID set in .env.local
 *   - VITE_GDRIVE_ROOT_FOLDER_ID (optional) — parent folder for all trip folders.
 *     Defaults to 'root' (My Drive).
 *   - <script src="https://accounts.google.com/gsi/client"> tag in index.html
 */

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

let tokenClient = null;
let accessToken = null;
let tokenExpiresAt = 0;

const folderCache = new Map();
const listeners = new Set();

function emit() {
  for (const fn of listeners) fn(getState());
}

function getState() {
  return {
    signedIn: Boolean(accessToken) && Date.now() < tokenExpiresAt,
    expiresAt: tokenExpiresAt,
  };
}

function getClientId() {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!id) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
  return id;
}

function getRootFolderId() {
  return import.meta.env.VITE_GDRIVE_ROOT_FOLDER_ID || 'root';
}

function ensureGisLoaded() {
  if (typeof window === 'undefined') throw new Error('gdrive: window unavailable');
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not loaded — check the gsi/client script tag');
  }
}

function ensureTokenClient() {
  if (tokenClient) return tokenClient;
  ensureGisLoaded();
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: getClientId(),
    scope: SCOPE,
    callback: () => {},
  });
  return tokenClient;
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

export function isSignedIn() {
  return getState().signedIn;
}

export function signIn({ prompt = '' } = {}) {
  const client = ensureTokenClient();
  return new Promise((resolve, reject) => {
    client.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error));
        return;
      }
      accessToken = resp.access_token;
      tokenExpiresAt = Date.now() + (Number(resp.expires_in) - 30) * 1000;
      emit();
      resolve(getState());
    };
    client.requestAccessToken({ prompt });
  });
}

export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiresAt = 0;
  folderCache.clear();
  emit();
}

async function ensureToken() {
  if (isSignedIn()) return accessToken;
  await signIn();
  return accessToken;
}

async function driveFetch(url, init = {}) {
  const token = await ensureToken();
  const resp = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  if (resp.status === 401) {
    accessToken = null;
    tokenExpiresAt = 0;
    emit();
    throw new Error('Drive auth expired — sign in again');
  }
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive ${resp.status}: ${text || resp.statusText}`);
  }
  return resp;
}

async function findFolder(name, parentId) {
  const q = [
    `name='${name.replace(/'/g, "\\'")}'`,
    `'${parentId}' in parents`,
    `mimeType='application/vnd.google-apps.folder'`,
    'trashed=false',
  ].join(' and ');
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`;
  const resp = await driveFetch(url);
  const data = await resp.json();
  return data.files?.[0]?.id || null;
}

async function createFolder(name, parentId) {
  const resp = await driveFetch(`${DRIVE_API}/files?fields=id,name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  const data = await resp.json();
  return data.id;
}

export async function ensureFolder(name, parentId = getRootFolderId()) {
  const cacheKey = `${parentId}/${name}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey);
  let id = await findFolder(name, parentId);
  if (!id) id = await createFolder(name, parentId);
  folderCache.set(cacheKey, id);
  return id;
}

/**
 * Upload a File/Blob to Drive using multipart upload. Returns
 * { fileId, name, mimeType, webViewLink, webContentLink }.
 */
export async function upload(file, { folderId, name } = {}) {
  if (!file) throw new Error('upload: file is required');
  const target = folderId || getRootFolderId();
  const metadata = {
    name: name || file.name || 'untitled',
    parents: [target],
  };
  const boundary = `mvs-${Math.random().toString(36).slice(2)}`;
  const delim = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const body = new Blob(
    [
      delim,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delim,
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
      file,
      closeDelim,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );

  const resp = await driveFetch(
    `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink`,
    { method: 'POST', body },
  );
  const data = await resp.json();
  return {
    fileId: data.id,
    name: data.name,
    mimeType: data.mimeType,
    webViewLink: data.webViewLink,
    webContentLink: data.webContentLink,
  };
}

export async function getFile(fileId) {
  const resp = await driveFetch(
    `${DRIVE_API}/files/${fileId}?fields=id,name,mimeType,webViewLink,webContentLink,trashed`,
  );
  return resp.json();
}

export async function deleteFile(fileId) {
  await driveFetch(`${DRIVE_API}/files/${fileId}`, { method: 'DELETE' });
}

export const GDrive = {
  signIn,
  signOut,
  isSignedIn,
  subscribe,
  ensureFolder,
  upload,
  getFile,
  deleteFile,
};
