'use strict';

function openAccount() {
  if (!authUser) return;
  const profile = signedInProfile(),
    dialog = $('#account-dialog');
  dialog.innerHTML = `<div class="dialog-head"><h2 id="account-title">Moje konto</h2><button class="close-dialog" type="button" data-action="close-account" aria-label="Zamknij panel konta">✕</button></div>
 <div class="dialog-body account-layout">
 <section class="account-section"><h3>Dane konta</h3><dl class="account-data"><dt>Imię i nazwisko</dt><dd>${esc(profile?.name || 'Nie przypisano profilu')}</dd><dt>E-mail</dt><dd>${esc(authUser.email)}</dd><dt>Rola</dt><dd>${esc(profile?.role || 'Oczekuje na nadanie dostępu')}</dd><dt>Przypisane MPK</dt><dd>${esc(profile?.mpks?.join(', ') || 'Brak')}</dd></dl></section>
 <section class="account-section account-device"><h3>Aplikacja na urządzeniu</h3><button class="btn secondary install-button" type="button" data-install-app>Zainstaluj aplikację</button><div class="account-push"><h4>Powiadomienia</h4><p id="push-status" role="status">Sprawdzanie ustawień…</p><button id="push-toggle" type="button" class="btn secondary" disabled>Włącz powiadomienia</button><p class="hint">Włącz osobno na każdym urządzeniu.</p></div></section>
 <section class="account-section account-security"><h3>Logowanie i bezpieczeństwo</h3><p>Konto i weryfikację dwuetapową obsługuje firmowy system Entra ID.</p><p>Zmianę hasła oraz metod MFA przeprowadź zgodnie z instrukcją IT.</p></section>
 <div class="account-footer"><button type="button" class="btn secondary" data-action="close-account">Zamknij</button><button type="button" class="btn danger account-logout" data-action="logout">Wyloguj się</button></div></div>`;
  if (!dialog.open) dialog.showModal();
  window.refreshPushButton?.();
  window.refreshInstallButtons?.();
}
