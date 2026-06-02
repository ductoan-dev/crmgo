// ══ CRMGO HTTP Client ══════════════════════════════════════════
// Access token  : 15 phút, lưu trong memory (Zustand)
// Refresh token : 7 ngày,  lưu trong localStorage
// Auto-refresh  : khi nhận 401, tự gọi /auth/refresh rồi retry

import { toApiLead, toApiOpp, toApiOrder } from './mappers';

const BASE = '/api';

// ── Token storage ─────────────────────────────────────────────
// Access token: memory (primary) + sessionStorage (backup chống HMR reset)
// Refresh token: localStorage (tồn tại qua session)
let _accessToken = null;

export const tokenStore = {
  setAccess: (t) => {
    _accessToken = t;
    if (t) sessionStorage.setItem('crmgo_at', t);
    else   sessionStorage.removeItem('crmgo_at');
  },
  getAccess:   () => _accessToken || sessionStorage.getItem('crmgo_at') || null,
  clearAccess: () => {
    _accessToken = null;
    sessionStorage.removeItem('crmgo_at');
  },

  setRefresh:  (t) => localStorage.setItem('crmgo_refresh', t),
  getRefresh:  ()  => localStorage.getItem('crmgo_refresh'),
  clearRefresh:()  => localStorage.removeItem('crmgo_refresh'),

  clearAll: () => {
    _accessToken = null;
    sessionStorage.removeItem('crmgo_at');
    localStorage.removeItem('crmgo_refresh');
    localStorage.removeItem('crmgo_token');
  },
};

// ── Đang refresh (tránh gọi nhiều lần cùng lúc) ───────────────
let _refreshing   = false;
let _refreshQueue = [];

const processQueue = (err, token = null) => {
  _refreshQueue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(token)
  );
  _refreshQueue = [];
};

async function doRefresh() {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  const res  = await fetch(`${BASE}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Refresh failed');

  tokenStore.setAccess(json.data.accessToken);
  tokenStore.setRefresh(json.data.refreshToken);
  return json.data.accessToken;
}

// ── HTTP helper với auto-refresh ──────────────────────────────
async function req(method, path, body = null, isRetry = false) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = tokenStore.getAccess();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isAuthPath = path.startsWith('/auth/');
  if (res.status === 401 && !isRetry && !isAuthPath) {
    if (_refreshing) {
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject });
      }).then(newToken => {
        const retryHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` };
        return fetch(BASE + path, { method, headers: retryHeaders, body: body ? JSON.stringify(body) : undefined })
          .then(r => r.json().then(j => { if (!r.ok) throw new Error(j.message); return j.data ?? j; }));
      });
    }

    _refreshing = true;
    try {
      const newToken = await doRefresh();
      processQueue(null, newToken);
      _refreshing = false;
      return req(method, path, body, true);
    } catch (refreshErr) {
      processQueue(refreshErr);
      _refreshing = false;
      tokenStore.clearAll();
      window.dispatchEvent(new CustomEvent('crmgo:session-expired'));
      throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
    }
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data ?? json;
}

// ── API endpoints ─────────────────────────────────────────────
export const api = {
  auth: {
    login:   (username, password) => req('POST', '/auth/login',   { username, password }),
    refresh: (refreshToken)       => req('POST', '/auth/refresh', { refreshToken }),
    logout:  ()                   => req('POST', '/auth/logout'),
    me:      ()                   => req('GET',  '/auth/me'),
  },

  leads: {
    getAll:   ()              => req('GET',    '/leads'),
    create:   (data)          => req('POST',   '/leads',               toApiLead(data)),
    update:   (id, data)      => req('PUT',    `/leads/${id}`,         data),
    remove:   (id)            => req('DELETE', `/leads/${id}`),
    transfer: (id, username)  => req('POST',   `/leads/${id}/transfer`, { username }),
    convert:  (id, body = {}) => req('POST',   `/leads/${id}/convert`,  body),
  },

  opps: {
    getAll:  ()         => req('GET',  '/opportunities'),
    create:  (data)     => req('POST', '/opportunities',       toApiOpp(data)),
    update:  (id, data) => req('PUT',  `/opportunities/${id}`, data),
  },

  orders: {
    getAll:        ()             => req('GET',   '/orders'),
    create:        (data)         => req('POST',  '/orders',                    toApiOrder(data)),
    update:        (id, data)     => req('PUT',   `/orders/${id}`,              data),
    advance:       (id, note='')  => req('POST',  `/orders/${id}/advance`,      { note }),
    smgrAssign:    (id, data)     => req('POST',  `/orders/${id}/smgr-assign`,  data),
    prodFields:    (id, data)     => req('PATCH', `/orders/${id}/prod-fields`,  data),
    recordPayment: (id, amount)   => req('POST',  `/orders/${id}/record-payment`, { amount }),
    reject:        (id, reason='')=> req('POST',  `/orders/${id}/reject`,       { reason }),
  },

  businesses: {
    getAll:  ()         => req('GET',    '/businesses'),
    create:  (data)     => req('POST',   '/businesses',       data),
    update:  (id, data) => req('PUT',    `/businesses/${id}`, data),
    remove:  (id)       => req('DELETE', `/businesses/${id}`),
  },
  suppliers: {
    getAll:  ()         => req('GET',    '/suppliers'),
    create:  (data)     => req('POST',   '/suppliers',       data),
    update:  (id, data) => req('PUT',    `/suppliers/${id}`, data),
    remove:  (id)       => req('DELETE', `/suppliers/${id}`),
  },
};
