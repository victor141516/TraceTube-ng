const commonFileSrc = chrome.runtime.getURL('common.js');
const common = import(commonFileSrc);

const HISTORY_URL = 'https://www.youtube.com/feed/history';
const INTERVAL = 3600_000;
const IFRAME_ID = 'the-tracetube-iframe';
const DEBUG = false;

const log = (...args) => {
  if (DEBUG) console.debug(...args);
};

let chromeStore, KEYS, getBackendUrl;
common.then((c) => {
  chromeStore = c.chromeStore;
  KEYS = c.KEYS;
  getBackendUrl = c.getBackendUrl;
});

function injectHistoryIframe() {
  if (window.location.href === HISTORY_URL) return;
  const iframe = document.createElement('iframe');
  iframe.id = IFRAME_ID;
  iframe.loading = 'lazy';
  iframe.style.height = '50vh';
  iframe.style.width = '500px';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.right = '0';
  if (DEBUG) iframe.style.zIndex = 1000;
  iframe.src = HISTORY_URL;
  document.body.insertBefore(iframe, document.body.childNodes[0]);
}

function removeIframe() {
  document.getElementById(IFRAME_ID)?.remove();
}

function scrapeHistory() {
  return Array.from(document.querySelectorAll('ytd-video-renderer'))
    .map((e) => {
      const videoTitle = e.querySelector(
        '#video-title > yt-formatted-string'
      ).textContent;
      const videoId = e
        .querySelector('#video-title')
        .href.replace('https://www.youtube.com/watch?v=', '')
        .split('&')[0];
      if (videoId.length !== 11) return null;
      const channelId = e
        .querySelector('#channel-name #text a')
        .href.replace('https://www.youtube.com', '');
      return { videoTitle, videoId, channelId };
    })
    .filter(Boolean);
}

/** @param {{videoTitle: string, videoId: string, channelId: string}[]} items */
async function sendItemsToBackend(items) {
  if (DEBUG) log('TraceTube: Sending items to backend');
  return fetch(`${await getBackendUrl()}/api/v1/items`, {
    mode: 'cors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await chromeStore.get(KEYS.authToken)}`,
    },
    body: JSON.stringify(items),
  });
}

function waitForLoadHistory() {
  return new Promise((res) => {
    let prevHeight = 0;
    const loopId = setInterval(() => {
      const newHeight = document.querySelector('ytd-app').clientHeight;
      if (prevHeight !== newHeight) {
        prevHeight = newHeight;
      } else {
        clearInterval(loopId);
        res();
      }
    }, 2000);
  });
}

function waitForLoadEvent() {
  return new Promise((res) => {
    window.addEventListener('load', res, { capture: false });
  });
}

const loadEvent = waitForLoadEvent();

const doInIframe = async () => {
  // This will be executed in the iframe
  log('TraceTube: Scraping started');
  await loadEvent;
  log('TraceTube: iframe loaded');
  log('TraceTube: Waiting for history to load');
  await waitForLoadHistory();
  try {
    log('TraceTube: Scraping history');
    const historyData = scrapeHistory();
    log('TraceTube: Sending history to backend');
    await sendItemsToBackend(historyData);
    log('TraceTube: History sent to backend');
  } finally {
    log('TraceTube: Checking if iframe should be removed');
    if (window.parent.window.location.href !== HISTORY_URL) {
      log('TraceTube: Sending message to remove iframe');
      window.parent.window.postMessage('removetheiframe', '*');
    }
  }
};

const doInMainFrame = async () => {
  // This will be executed in the main frame to create a iframe containing the history
  log('TraceTube: Injecting iframe started');

  const isInsideIframe = window.parent !== window;
  if (isInsideIframe) {
    log('TraceTube: Inside iframe (embedded video), aborting');
    return;
  }

  log('TraceTube: Checking if it is time to scrape');
  const lastCheck = (await chromeStore.get(KEYS.lastCheck)) ?? 0;
  const isTimeToScrape = lastCheck + INTERVAL - 1000 < new Date().getTime();
  log('TraceTube: Last check:', new Date(lastCheck));

  if (isTimeToScrape || DEBUG) {
    log('TraceTube: Injecting iframe');
    await loadEvent;
    injectHistoryIframe();
    log('TraceTube: Waiting for iframe to load (from main frame)');
    window.addEventListener(
      'message',
      async ({ data }) => {
        if (data === 'removetheiframe') {
          log('TraceTube: Removing iframe');
          removeIframe();
          log('TraceTube: iframe removed');
          log('TraceTube: Setting last check');
          chromeStore.set(KEYS.lastCheck, new Date().getTime());
        }
      },
      { capture: false }
    );
  } else log('TraceTube: Too soon to scrape again');
};

(async () => {
  log('TraceTube: Hello');
  log('TraceTube: Waiting for common import');
  await common;
  log('TraceTube: Checking if user is authenticated');
  if (!(await chromeStore.get(KEYS.authToken))) {
    log('TraceTube: User is not authenticated, aborting');
    return;
  }

  log('TraceTube: Checking whether scrape or inject iframe');
  if (window.location.href === HISTORY_URL) {
    await doInIframe();
  } else {
    await doInMainFrame();
  }
})();
