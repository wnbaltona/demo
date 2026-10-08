'use strict';

// Local demo only: no corporate accounts, tokens or remote API.
window.CorporateBackend = (() => {
  const demoUsers = [{
    id: 'demo-profile',
    accountId: 'demo-admin',
    name: 'Administrator testowy',
    email: 'administrator@example.test',
    role: 'Administrator',
    active: true,
    phone: '',
    mpks: []
  }, {
    id: 'demo-coordinator-profile',
    accountId: 'demo-coordinator',
    name: 'Koordynator testowy',
    email: 'koordynator@example.test',
    role: 'Koordynator',
    active: true,
    phone: '',
    mpks: []
  }, {
    id: 'demo-manager-profile',
    accountId: 'demo-manager',
    name: 'Kierownik testowy',
    email: 'kierownik@example.test',
    role: 'Kierownik lokalu',
    active: true,
    phone: '',
    mpks: [window.BALTONA_LOCATIONS.find(l => l.active !== false).mpk]
  }, {
    id: 'demo-user-profile',
    accountId: 'demo-user',
    name: 'Użytkownik testowy',
    email: 'uzytkownik@example.test',
    role: 'Użytkownik',
    active: true,
    phone: '',
    mpks: []
  }];
  const asAccount = profile => ({
    id: profile.accountId,
    email: profile.email,
    name: profile.name
  });
  let account = asAccount(demoUsers[0]);
  try {
    account = asAccount(demoUsers.find(u => u.accountId === sessionStorage.getItem('serwis-demo-account')) || demoUsers[0]);
  } catch {}
  let dbPromise;
  function db() {
    return dbPromise ||= new Promise((resolve, reject) => {
      const req = indexedDB.open('serwis-lokali-demo-users-v1', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('data');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function get(key) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const req = database.transaction('data').objectStore('data').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function initial() {
    const s = Model.initial(window.BALTONA_LOCATIONS);
    s.users = structuredClone(demoUsers);
    return s;
  }
  return {
    getSession: async () => ({
      ...account
    }),
    login: async () => ({
      ...account
    }),
    logout: async () => location.reload(),
    loadState: async () => (await get('state')) || initial(),
    listAccounts: async () => demoUsers.map(asAccount),
    switchUser(profile) {
      account = asAccount(profile);
      try {
        sessionStorage.setItem("serwis-demo-account", account.id);
      } catch {}
      return {
        ...account
      };
    },
    async saveState(next, files, revision) {
      const database = await db();
      return new Promise((resolve, reject) => {
        const tx = database.transaction('data', 'readwrite'),
          store = tx.objectStore('data'),
          req = store.get('state');
        req.onsuccess = () => {
          if ((req.result?.revision || 0) !== revision) {
            tx.abort();
            reject(Error('Dane zmieniły się w innej karcie. Odśwież stronę.'));
            return;
          }
          const saved = structuredClone(next);
          for (const ticket of saved.tickets) {
            ticket.reportedPriority ||= req.result?.tickets.find(t => t.id === ticket.id)?.priority || ticket.priority;
            if (ticket.confirmPriority) {
              ticket.priorityConfirmedAt = new Date().toISOString();
              ticket.priorityConfirmedBy = saved.users.find(u => u.accountId === account.id)?.id;
              ticket.priorityConfirmedName = account.name;
              ticket.reportedPriority ||= ticket.priority;
              delete ticket.confirmPriority;
            }
          }
          store.put(saved, 'state');
          for (const file of files || []) store.put(file.blob, 'file:' + file.id);
          tx.oncomplete = () => resolve(saved);
        };
        tx.onerror = () => reject(tx.error);
      });
    },
    async readFile(id) {
      const blob = await get('file:' + id);
      if (!blob) throw Error('Brak pliku w tej przeglądarce.');
      return blob;
    },
    async deleteFiles(ids) {
      const database = await db();
      return new Promise((resolve, reject) => {
        const tx = database.transaction('data', 'readwrite');
        for (const id of ids) tx.objectStore('data').delete('file:' + id);
        tx.oncomplete = () => resolve({
          error: null
        });
        tx.onerror = () => reject(tx.error);
      });
    },
    getPushStatus: async () => ({
      available: false,
      enabled: false,
      message: 'Push niedostępne w wersji testowej.'
    }),
    subscribePush: async () => {
      throw Error('Push wymaga serwera.');
    },
    unsubscribePush: async () => {}
  };
})();
