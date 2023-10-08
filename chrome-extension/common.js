export const chromeStore = {
  /**
   * @param {string} key
   * @returns {Promise<unknown>}
   */
  async get(key) {
    return new Promise((res) => {
      chrome.storage.local.get([key], (items) => {
        res(items?.[key]);
      });
    });
  },
  /**
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    return new Promise((res) => {
      chrome.storage.local.set({ [key]: value }, () => res());
    });
  },
};

export const KEYS = /** @type {const} */ ({
  authToken: 'authToken',
  backendUrl: 'backendUrl',
  lastCheck: 'lastCheck',
});

/**
 * @returns {Promise<string>}
 */
export async function getBackendUrl() {
  return (
    (await chromeStore.get('backendUrl')) ??
    'https://yourarch-ingestor.viti.site'
  );
}
