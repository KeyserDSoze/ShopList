/**
 * Low-level Google Drive REST API helpers.
 * No external dependencies – uses the browser fetch API.
 *
 * Private data   → appDataFolder (drive.appdata scope, invisible to user)
 * Shared files   → user's Drive root (drive.file scope, shareable)
 */

const DRIVE  = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const APP_DATA_FILE = 'shoplist-data.json'
const APP_PROP_KEY  = 'shoplistType'

// ─── internal helper ─────────────────────────────────────────────────────────
async function req(token, method, url, body) {
  const headers = { Authorization: `Bearer ${token}` }
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204 || res.status === 200 && res.headers.get('content-length') === '0') return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Drive API ${res.status}`)
  }
  return res.json().catch(() => null)
}

// ─── User info ────────────────────────────────────────────────────────────────
export async function getUserInfo(token) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

// ─── Private sync (appDataFolder) ────────────────────────────────────────────

async function findAppDataFileId(token) {
  const res = await req(token, 'GET',
    `${DRIVE}/files?spaces=appDataFolder&q=name%3D'${APP_DATA_FILE}'&fields=files(id)`)
  return res?.files?.[0]?.id || null
}

export async function readAppData(token) {
  const fileId = await findAppDataFileId(token)
  if (!fileId) return null
  const res = await fetch(`${DRIVE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function writeAppData(token, data) {
  const payload = JSON.stringify(data)
  const fileId  = await findAppDataFileId(token)
  if (fileId) {
    // update
    await fetch(`${UPLOAD}/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: payload,
    })
  } else {
    // create
    const form = new FormData()
    form.append('metadata', new Blob([
      JSON.stringify({ name: APP_DATA_FILE, parents: ['appDataFolder'] }),
    ], { type: 'application/json' }))
    form.append('file', new Blob([payload], { type: 'application/json' }))
    await fetch(`${UPLOAD}/files?uploadType=multipart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
  }
}

// ─── Shared files (drive.file) ────────────────────────────────────────────────

/**
 * Create a visible Drive file that can be shared.
 * @param {string} token
 * @param {{ type: string, name: string, data: any }} item
 * @returns {string} fileId
 */
export async function createSharedFile(token, { type, name, data }) {
  const content = JSON.stringify({
    shoplistVersion: '1',
    type,
    name,
    sharedAt: new Date().toISOString(),
    data,
  })
  const meta = {
    name: `shoplist-${type}-${name}.json`,
    appProperties: { [APP_PROP_KEY]: type },
    description: `ShopList · ${type} · ${name}`,
  }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  form.append('file',     new Blob([content],             { type: 'application/json' }))
  const res = await fetch(`${UPLOAD}/files?uploadType=multipart&fields=id,name`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const file = await res.json()
  return file.id
}

/** List Drive files created by this app that have shoplistType property */
export async function listMySharedFiles(token) {
  const q = encodeURIComponent(`appProperties has {key='${APP_PROP_KEY}' and value!=''}`)
  const res = await req(token, 'GET',
    `${DRIVE}/files?q=${q}&fields=files(id,name,description,appProperties,createdTime)`)
  return res?.files || []
}

/** List Drive files shared with me (filtered to ShopList files) */
export async function listReceivedFiles(token) {
  const res = await req(token, 'GET',
    `${DRIVE}/files?q=sharedWithMe%3Dtrue&fields=files(id,name,description,appProperties,owners,createdTime,sharingUser)`)
  return (res?.files || []).filter(f => f.appProperties?.[APP_PROP_KEY])
}

export async function readSharedFile(token, fileId) {
  const res = await fetch(`${DRIVE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

// ─── Permissions ──────────────────────────────────────────────────────────────

/** Returns non-owner permissions for a file */
export async function getFilePermissions(token, fileId) {
  const res = await req(token, 'GET',
    `${DRIVE}/files/${fileId}/permissions?fields=permissions(id,emailAddress,role,displayName,photoLink)`)
  return (res?.permissions || []).filter(p => p.role !== 'owner')
}

/** Share a file with a Gmail address (reader role) */
export async function addPermission(token, fileId, email) {
  await req(token, 'POST', `${DRIVE}/files/${fileId}/permissions`, {
    type: 'user',
    role: 'reader',
    emailAddress: email,
    sendNotificationEmail: true,
    emailMessage: 'Ha condiviso dati con te tramite ShopList! Apri l\'app per importarli.',
  })
}

/** Revoke a specific permission */
export async function removePermission(token, fileId, permissionId) {
  const res = await fetch(`${DRIVE}/files/${fileId}/permissions/${permissionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 204) throw new Error(`Revoca fallita (${res.status})`)
}

/** Permanently delete a shared file (removes it from all recipients too) */
export async function deleteSharedFile(token, fileId) {
  await fetch(`${DRIVE}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
