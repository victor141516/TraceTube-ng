import { KEYS, chromeStore, getBackendUrl } from './common.js';

const showConfirm = () => {
  const confirmEl = document.getElementById('confirm');
  confirmEl.style.display = 'unset';
  setTimeout(() => {
    confirmEl.style.display = 'none';
  }, 1500);
};

const onAuthChange = () => {
  const authFormEl = document.getElementById('authentication');
  const allDoneEl = document.getElementById('all-done');
  const logoutEl = document.getElementById('logout');

  chromeStore.get(KEYS.authToken).then((authToken) => {
    allDoneEl.classList.toggle('hidden', !authToken);
    logoutEl.classList.toggle('hidden', !authToken);
    authFormEl.classList.toggle('hidden', !!authToken);
  });
};

window.addEventListener('load', () => {
  const urlEl = document.getElementById('url');
  const saveEl = document.getElementById('save');
  const backendUrlEl = document.getElementById('backend-url');
  const logoutEl = document.getElementById('logout');

  getBackendUrl().then((backendUrl) => {
    urlEl.value = backendUrl ?? 'https://trace.tube';
  });

  onAuthChange();

  logoutEl.addEventListener('click', async () => {
    await chromeStore.set(KEYS.authToken, null);
    onAuthChange();
  });

  saveEl.addEventListener('click', async () => {
    await chromeStore.set(KEYS.backendUrl, urlEl.value);
    showConfirm();
  });

  document.addEventListener('keydown', ({ key, ctrlKey }) => {
    if (key === 'b' && ctrlKey) {
      backendUrlEl.classList.toggle('hidden');
    }
  });

  const authForm = document.getElementById('authentication');
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const { result, error, data } = await fetch(
      `${await getBackendUrl()}/api/auth/login`,
      {
        mode: 'cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    ).then((r) => r.json());

    if (result === 'success') {
      await chromeStore.set(KEYS.authToken, data.token);
      showConfirm();
      onAuthChange();
    } else {
      alert(error?.toString());
    }
  });
});
