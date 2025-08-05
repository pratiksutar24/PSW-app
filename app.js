// js/app.js
// PSW app client logic: auth (hashed passwords), per-user salt, AES-GCM encryption for assessments

// ------------------ Crypto helpers (SHA-256 & AES-GCM) ------------------

/** Hash a password using SHA-256 -> hex string */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password || '');
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Convert hex string to Uint8Array */
function hexToBytes(hex = '') {
  if (!hex) return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** Convert Uint8Array (or array-like) to hex string */
function bytesToHex(bytes = []) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive AES-GCM key (256-bit) from passwordHash using PBKDF2.
 * - passwordHash: hex string (SHA-256)
 * - userSaltHex: hex string (per-user random salt). If null, uses a static fallback salt.
 */
async function getAesKeyFromHash(passwordHash, userSaltHex = null) {
  const raw = hexToBytes(passwordHash);
  const keyMaterial = await crypto.subtle.importKey('raw', raw, { name: 'PBKDF2' }, false, ['deriveKey']);
  const salt = userSaltHex ? hexToBytes(userSaltHex) : new TextEncoder().encode('psw-app-static-salt-v1');
  const derived = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return derived;
}

/** Encrypt JSON-serializable data with AES-GCM -> { iv: hex, ct: hex } */
async function encryptData(data, passwordHash, userSaltHex = null) {
  if (!passwordHash) throw new Error('Missing passwordHash for encryption');
  const key = await getAesKeyFromHash(passwordHash, userSaltHex);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv: bytesToHex(iv), ct: bytesToHex(new Uint8Array(cipherBuffer)) };
}

/** Decrypt AES-GCM payload { iv, ct } and parse JSON */
async function decryptData(encrypted, passwordHash, userSaltHex = null) {
  if (!encrypted || !encrypted.iv || !encrypted.ct) throw new Error('Invalid encrypted payload');
  const key = await getAesKeyFromHash(passwordHash, userSaltHex);
  const iv = hexToBytes(encrypted.iv);
  const ct = hexToBytes(encrypted.ct).buffer;
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(plainBuffer));
}

// ------------------ Local user storage & auth ------------------

/** Return users object from localStorage or {} */
function getStoredUsers() {
  try {
    const raw = localStorage.getItem('pswRegisteredUsers');
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('getStoredUsers parse failed', err);
    return {};
  }
}

/**
 * Save user with per-user salt.
 * Stores: { passwordHash, email, fullName, registeredDate, lastLogin, saltHex }
 */
async function saveUser(username, password, email = '', fullName = '') {
  if (!username || !password) return false;
  try {
    const passwordHash = await hashPassword(password);
    const saltBytes = crypto.getRandomValues(new Uint8Array(16)); // 16 bytes salt
    const saltHex = bytesToHex(saltBytes);

    const users = getStoredUsers();
    users[username] = {
      passwordHash,
      email,
      fullName,
      registeredDate: new Date().toISOString(),
      lastLogin: null,
      saltHex
    };
    localStorage.setItem('pswRegisteredUsers', JSON.stringify(users));
    return true;
  } catch (err) {
    console.error('saveUser error', err);
    return false;
  }
}

/**
 * Validate credentials and return { valid, user } where user includes passwordHash and saltHex
 */
async function validateUser(username, password) {
  try {
    const passwordHash = await hashPassword(password);
    const users = getStoredUsers();
    if (users[username] && users[username].passwordHash === passwordHash) {
      users[username].lastLogin = new Date().toISOString();
      localStorage.setItem('pswRegisteredUsers', JSON.stringify(users));
      const u = users[username];
      return {
        valid: true,
        user: {
          username,
          fullName: u.fullName,
          email: u.email,
          passwordHash: u.passwordHash,
          saltHex: u.saltHex || null
        }
      };
    }
  } catch (err) {
    console.error('validateUser error', err);
  }
  return { valid: false, user: null };
}

/** Optional migration: convert plain-text password field to passwordHash (no salt assigned) */
async function migratePlainPasswords() {
  const raw = localStorage.getItem('pswRegisteredUsers');
  if (!raw) return;
  let users;
  try {
    users = JSON.parse(raw);
  } catch (err) {
    console.warn('migratePlainPasswords parse failed', err);
    return;
  }
  let changed = false;
  for (const u of Object.keys(users)) {
    if (users[u].password && !users[u].passwordHash) {
      users[u].passwordHash = await hashPassword(users[u].password);
      delete users[u].password;
      changed = true;
    }
    if (!users[u].saltHex) {
      // generate salt for migrated user to move forward
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      users[u].saltHex = bytesToHex(saltBytes);
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem('pswRegisteredUsers', JSON.stringify(users));
    showNotification('Migration complete: passwords hashed and salts added', 'success');
  }
}

// ------------------ Assessment encryption wrappers ------------------

/**
 * Save encrypted assessments under key 'assessments_<username>'
 * assessmentsData is JSON-serializable (object or array)
 */
async function saveAssessmentForUser(username, passwordHash, assessmentsData, userSaltHex = null) {
  if (!username || !passwordHash) throw new Error('Missing username or passwordHash');
  const encrypted = await encryptData(assessmentsData, passwordHash, userSaltHex);
  localStorage.setItem(`assessments_${username}`, JSON.stringify(encrypted));
}

/** Load & decrypt assessments for a user; returns original data or null */
async function loadAssessmentForUser(username, passwordHash, userSaltHex = null) {
  const raw = localStorage.getItem(`assessments_${username}`);
  if (!raw) return null;
  try {
    const encrypted = JSON.parse(raw);
    return await decryptData(encrypted, passwordHash, userSaltHex);
  } catch (err) {
    console.error('loadAssessmentForUser decrypt failed', err);
    return null;
  }
}

/** Append a single assessment to stored array (creates array if none) */
async function addAssessmentForUser(username, passwordHash, singleAssessment, userSaltHex = null) {
  const existing = (await loadAssessmentForUser(username, passwordHash, userSaltHex)) || [];
  const arr = Array.isArray(existing) ? existing : (existing ? [existing] : []);
  arr.push(singleAssessment);
  await saveAssessmentForUser(username, passwordHash, arr, userSaltHex);
}

// ------------------ UI helpers & quick logins ------------------

function saveToQuickLogin(username, fullName) {
  try {
    const q = JSON.parse(localStorage.getItem('pswQuickLogins') || '[]');
    const filtered = q.filter(x => x.username !== username);
    filtered.unshift({ username, fullName, lastUsed: new Date().toISOString() });
    localStorage.setItem('pswQuickLogins', JSON.stringify(filtered.slice(0, 5)));
  } catch (err) {
    console.warn('saveToQuickLogin failed', err);
  }
}

function showNotification(message, type = 'info', timeout = 3000) {
  const container = document.getElementById('notifications');
  if (!container) { console[type === 'error' ? 'error' : 'log'](message); return; }
  const el = document.createElement('div');
  el.className = 'p-2 rounded mb-2 text-sm';
  el.style.maxWidth = '420px'; el.style.margin = '0 auto';
  if (type === 'success') { el.style.background = '#ecfdf5'; el.style.color = '#065f46'; }
  else if (type === 'error') { el.style.background = '#fef2f2'; el.style.color = '#991b1b'; }
  else { el.style.background = '#eff6ff'; el.style.color = '#1e3a8a'; }
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

function showLogin() {
  const reg = document.getElementById('registration-form');
  const login = document.getElementById('login-form');
  if (reg) reg.classList.add('hidden');
  if (login) login.classList.remove('hidden');
}
function showRegistration() {
  const reg = document.getElementById('registration-form');
  const login = document.getElementById('login-form');
  if (login) login.classList.add('hidden');
  if (reg) reg.classList.remove('hidden');
}
function showMainApp() {
  const main = document.getElementById('main-app');
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.classList.add('hidden');
  if (main) main.classList.remove('hidden');
}
function logout() {
  currentUser = null;
  const main = document.getElementById('main-app');
  const loginScreen = document.getElementById('login-screen');
  if (main) main.classList.add('hidden');
  if (loginScreen) loginScreen.classList.remove('hidden');
  showNotification('Logged out', 'info');
}

// ------------------ Minimal assessment placeholders ------------------
let currentUser = null;
function startAssessment(type) {
  showNotification('Starting assessment: ' + type, 'info');
  const title = document.getElementById('assessment-title'); if (title) title.textContent = type;
  const screen = document.getElementById('assessment-screen'); if (screen) screen.classList.remove('hidden');
}
function generateInterventionPlan() { showNotification('Intervention plan: placeholder', 'info'); }
function createSocialDiagnosis() { showNotification('Social diagnosis: placeholder', 'info'); }
function showCrisisResources() { showNotification('Crisis resources: call emergency', 'error', 6000); }

// ------------------ DOM wiring ------------------
document.addEventListener('DOMContentLoaded', function () {
  // Uncomment to migrate existing plain-password users (one-time)
  // migratePlainPasswords();

  // Registration
  const regForm = document.getElementById('registration-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('reg-username') || {}).value?.trim() || '';
      const password = (document.getElementById('reg-password') || {}).value || '';
      const confirm = (document.getElementById('reg-confirm-password') || {}).value || '';
      const email = (document.getElementById('reg-email') || {}).value?.trim() || '';
      const fullName = (document.getElementById('reg-fullname') || {}).value?.trim() || '';

      if (!username || !password || !confirm) { showNotification('Please fill required fields', 'error'); return; }
      if (password.length < 6) { showNotification('Password must be at least 6 chars', 'error'); return; }
      if (password !== confirm) { showNotification('Passwords do not match', 'error'); return; }

      const users = getStoredUsers();
      if (users[username]) { showNotification('Username already exists', 'error'); return; }

      const ok = await saveUser(username, password, email, fullName);
      if (ok) { showNotification('Account created. Please log in.', 'success'); showLogin(); }
      else showNotification('Failed to create account', 'error');
    });
  }

  // Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('username') || {}).value?.trim() || '';
      const password = (document.getElementById('password') || {}).value || '';
      if (!username || !password) { showNotification('Enter username and password', 'error'); return; }

      const result = await validateUser(username, password);
      if (result.valid) {
        currentUser = result.user; // includes passwordHash & saltHex
        saveToQuickLogin(currentUser.username, currentUser.fullName || currentUser.username);
        showNotification('Login successful', 'success');
        showMainApp();
      } else {
        showNotification('Invalid username or password', 'error');
      }
    });
  }

  // UI wiring for quick links
  const savedBtn = document.querySelector('[onclick="showSavedLogins()"]');
  if (savedBtn) savedBtn.addEventListener('click', showSavedLogins);
  const regToggle = document.querySelector('[onclick="showRegistration()"]');
  if (regToggle) regToggle.addEventListener('click', showRegistration);
  const loginToggle = document.querySelector('[onclick="showLogin()"]');
  if (loginToggle) loginToggle.addEventListener('click', showLogin);

  // PWA install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const container = document.getElementById('pwa-install-container');
    if (container) container.classList.remove('hidden');
    const btn = document.getElementById('pwa-install-btn');
    if (btn) {
      btn.addEventListener('click', async () => {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (choice && choice.outcome === 'accepted') showNotification('App installed', 'success');
      });
    }
  });
});

// ------------------ Saved logins overlay ------------------
function closeSavedLogins() { const ex = document.getElementById('saved-logins-overlay'); if (ex) ex.remove(); }

function useQuickLogin(username) {
  const users = getStoredUsers();
  if (!users[username]) { showNotification('User not found', 'error'); return; }
  const userEl = document.getElementById('username'); if (userEl) userEl.value = username;
  closeSavedLogins(); showNotification('Selected quick login: ' + username, 'info');
}

function showSavedLogins() {
  try {
    const quickLogins = JSON.parse(localStorage.getItem('pswQuickLogins') || '[]');
    if (quickLogins.length === 0) { showNotification('No saved logins found', 'info'); return; }
    closeSavedLogins();
    const overlay = document.createElement('div'); overlay.id = 'saved-logins-overlay';
    overlay.style.position = 'fixed'; overlay.style.left = 0; overlay.style.right = 0; overlay.style.top = 0; overlay.style.bottom = 0;
    overlay.style.background = 'rgba(0,0,0,0.5)'; overlay.style.zIndex = 9999; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    const box = document.createElement('div'); box.style.background = '#fff'; box.style.padding = '16px'; box.style.borderRadius = '12px';
    box.style.minWidth = '280px'; box.style.maxWidth = '90%'; box.style.maxHeight = '80%'; box.style.overflowY = 'auto';
    const title = document.createElement('div'); title.textContent = '📋 Saved Logins'; title.style.fontWeight = '700'; title.style.marginBottom = '8px'; box.appendChild(title);
    quickLogins.forEach(login => {
      const row = document.createElement('button'); row.style.display = 'flex'; row.style.justifyContent = 'space-between';
      row.style.width = '100%'; row.style.padding = '8px'; row.style.border = '1px solid #eee'; row.style.borderRadius = '8px'; row.style.marginBottom = '8px'; row.style.cursor = 'pointer';
      row.textContent = `${login.fullName || login.username} (@${login.username})`; row.addEventListener('click', () => useQuickLogin(login.username));
      box.appendChild(row);
    });
    const closeBtn = document.createElement('div'); closeBtn.textContent = 'Close'; closeBtn.style.textAlign = 'center'; closeBtn.style.marginTop = '8px'; closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', closeSavedLogins); box.appendChild(closeBtn);
    overlay.appendChild(box); document.body.appendChild(overlay);
  } catch (err) { console.warn('showSavedLogins failed', err); }
}

// ------------------ Service Worker registration ------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(e => console.warn('SW registration failed', e));
  });
}
