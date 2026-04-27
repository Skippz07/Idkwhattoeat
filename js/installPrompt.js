(function () {
  const DISMISS_KEY = 'idkEatInstallDismissedAt';
  const DISMISS_DAYS = 7;
  let deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function recentlyDismissed() {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  }

  function setDismissed() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  function elements() {
    return {
      prompt: document.getElementById('installPrompt'),
      text: document.getElementById('installPromptText'),
      install: document.getElementById('installAppBtn'),
      help: document.getElementById('installHelpBtn'),
      close: document.getElementById('installCloseBtn')
    };
  }

  function showInstallPrompt(mode) {
    if (isStandalone() || recentlyDismissed()) return;

    const { prompt, text, install, help } = elements();
    if (!prompt || !text || !install || !help) return;

    if (mode === 'ios') {
      text.textContent = 'Tap Share, then Add to Home Screen to install it on your iPhone.';
      install.style.display = 'none';
      help.style.display = 'inline-flex';
    } else {
      text.textContent = 'Add it to your phone for quick dinner decisions.';
      install.style.display = 'inline-flex';
      help.style.display = 'none';
    }

    prompt.hidden = false;
  }

  function hideInstallPrompt(remember = false) {
    const { prompt } = elements();
    if (prompt) prompt.hidden = true;
    if (remember) setDismissed();
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/service-worker.js');
    } catch (error) {
      console.warn('Service worker registration failed', error);
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallPrompt('native');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallPrompt(true);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const { install, help, close } = elements();

    registerServiceWorker();

    install?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
      hideInstallPrompt(true);
    });

    help?.addEventListener('click', () => {
      const { text } = elements();
      if (text) text.textContent = 'In Safari: tap Share, scroll down, then tap Add to Home Screen.';
    });

    close?.addEventListener('click', () => hideInstallPrompt(true));

    setTimeout(() => {
      if (isIOS() && !isStandalone()) showInstallPrompt('ios');
    }, 1400);
  });
}());
