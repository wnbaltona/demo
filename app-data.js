'use strict';

async function openStore() {
  state = Model.initial(window.BALTONA_LOCATIONS);
  state.users = [];
  currentId = null;
}
function savePreference() {
  try {
    localStorage.setItem('serwis-it-view', currentId);
  } catch {}
}
async function loadApplicationState() {
  state = Model.migrate(await ServiceIntegration.loadState());
  currentId = user()?.id;
  if (user()?.role === 'Administrator') await refreshAuthAccounts();
}
async function initializeAuth() {
  authUser = await ServiceIntegration.getSession();
  if (!authUser) {
    showAuth();
    return;
  }
  await loadApplicationState();
}
async function persist(next, files = [], replaceFiles = false) {
  if (replaceFiles) throw Error('Import kopii wymaga osobnej integracji IT.');
  const previous = state.revision,
    now = new Date().toISOString();
  next.revision = previous + 1;
  Model.migrate(next);
  next.events.push(...Model.ticketEvents(state, next, currentId, now));
  next.notifications.push(...Model.notificationEvents(state, next, currentId, now));
  const saved = await ServiceIntegration.saveState(next, files, previous);
  state = Model.migrate(saved);
  refreshNotificationsUI();
  updatesChannel?.postMessage({
    revision: state.revision
  });
}
async function attachmentBlob(id) {
  const ticket = currentTickets().find(t => t.attachments.some(f => f.id === id));
  if (!ticket) throw Error('Załącznik niedostępny.');
  return {
    record: ticket.attachments.find(f => f.id === id),
    blob: await ServiceIntegration.readFile(id)
  };
}
async function downloadFile(id) {
  const {
    record,
    blob
  } = await attachmentBlob(id);
  download(blob, record.name);
}
async function syncFromDatabase() {
  if (!authUser || !state || busy || syncing) return;
  syncing = true;
  try {
    const latest = Model.migrate(await ServiceIntegration.loadState());
    if (latest.revision > state.revision) ingestRemote(latest);
    syncErrorShown = false;
  } catch {
    if (!syncErrorShown) {
      toast('Nie udało się odświeżyć danych.', true);
      syncErrorShown = true;
    }
  } finally {
    syncing = false;
  }
}
function startLiveSync() {
  if (startLiveSync.started) return;
  startLiveSync.started = true;
  if ('BroadcastChannel' in window) {
    updatesChannel = new BroadcastChannel('serwis-firmowy-updates');
    updatesChannel.onmessage = syncFromDatabase;
  }
  setInterval(syncFromDatabase, 5000);
  window.addEventListener('focus', syncFromDatabase);
}
async function readNotifications(ids = null) {
  const selected = ids ? new Set(ids) : null;
  await mutate(next => {
    const allowed = new Set(Model.notificationsFor(next, next.users.find(u => u.id === currentId)).map(n => n.id));
    for (const n of next.notifications) if (allowed.has(n.id) && !n.readAt && (!selected || selected.has(n.id))) n.readAt = new Date().toISOString();
  });
  refreshNotificationsUI();
}
async function backup() {
  throw Error('Kopie zapasowe obsługuje IT na serwerze firmy.');
}
async function refreshPushButton() {
  const button = $('#push-toggle'),
    status = $('#push-status');
  if (!button) return;
  try {
    const info = await ServiceIntegration.getPushStatus();
    button.disabled = !info.available;
    button.textContent = info.enabled ? 'Wyłącz powiadomienia' : 'Włącz powiadomienia';
    button.dataset.enabled = String(!!info.enabled);
    if (status) status.textContent = info.message || '';
  } catch (error) {
    button.disabled = true;
    if (status) status.textContent = error.message;
  }
}
window.refreshPushButton = refreshPushButton;
// Po wygaśnięciu sesji usuń dane z otwartego interfejsu.
window.onSessionExpired = () => {
  authUser = null;
  currentId = null;
  previewProfileId = null;
  pendingRemote = null;
  draftFiles = [];
  commentDraftFiles = [];
  state = Model.initial([]);
  document.querySelectorAll('dialog[open]').forEach(dialog => {
    dialog.close();
    dialog.innerHTML = '';
  });
  showAuth('Sesja wygasła. Zaloguj się ponownie.');
};
document.addEventListener('click', async event => {
  const button = event.target.closest('#push-toggle');
  if (!button || button.disabled) return;
  button.disabled = true;
  try {
    if (button.dataset.enabled === 'true') await ServiceIntegration.unsubscribePush();else await ServiceIntegration.subscribePush();
  } catch (error) {
    toast(error.message, true);
  } finally {
    refreshPushButton();
  }
});
