/**
 * @module ol/net
 */
import {getUid} from './util.js';

/**
 * Simple JSONP helper. Supports error callbacks and a custom callback param.
 * The error callback will be called when no JSONP is executed after 10 seconds.
 *
 * @param {string} url Request url. A 'callback' query parameter will be
 *     appended.
 * @param {Function} callback Callback on success.
 * @param {Function} [errback] Callback on error.
 * @param {string} [callbackParam] Custom query parameter for the JSONP
 *     callback. Default is 'callback'.
 */
export function jsonp(url, callback, errback, callbackParam) {
  const script = document.createElement('script');
  const key = 'olc_' + getUid(callback);
  function cleanup() {
    delete (
      /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (window))[
        key
      ]
    );
    const parent = script.parentNode;
    if (parent) {
      parent.removeChild(script);
    }
  }
  script.async = true;
  script.src =
    url +
    (url.includes('?') ? '&' : '?') +
    (callbackParam || 'callback') +
    '=' +
    key;
  const timer = setTimeout(function () {
    cleanup();
    if (errback) {
      errback();
    }
  }, 10000);
  /** @type {Record<string, function(*): void>} */ (
    /** @type {unknown} */ (window)
  )[key] = function (data) {
    clearTimeout(timer);
    cleanup();
    callback(data);
  };
  document.head.appendChild(script);
}

export class ResponseError extends Error {
  /**
   * @param {XMLHttpRequest} response The XHR object.
   */
  constructor(response) {
    const message = 'Unexpected response status: ' + response.status;
    super(message);

    /**
     * @type {string}
     */
    this.name = 'ResponseError';

    /**
     * @type {XMLHttpRequest}
     */
    this.response = response;
  }
}

export class ClientError extends Error {
  /**
   * @param {XMLHttpRequest} client The XHR object.
   */
  constructor(client) {
    super('Failed to issue request');

    /**
     * @type {string}
     */
    this.name = 'ClientError';

    /**
     * @type {XMLHttpRequest}
     */
    this.client = client;
  }
}

/**
 * @param {string} url The URL.
 * @return {Promise<Object>} A promise that resolves to the JSON response.
 */
export function getJSON(url) {
  return new Promise(function (resolve, reject) {
    /**
     * @param {ProgressEvent<XMLHttpRequest>} event The load event.
     */
    function onLoad(event) {
      const client = /** @type {XMLHttpRequest} */ (event.target);
      // status will be 0 for file:// urls
      if (!client.status || (client.status >= 200 && client.status < 300)) {
        let data;
        try {
          data = JSON.parse(client.responseText);
        } catch (err) {
          const message =
            'Error parsing response text as JSON: ' +
            (err instanceof Error ? err.message : String(err));
          reject(new Error(message));
          return;
        }
        resolve(data);
        return;
      }

      reject(new ResponseError(client));
    }

    /**
     * @param {ProgressEvent<XMLHttpRequest>} event The error event.
     */
    function onError(event) {
      reject(new ClientError(/** @type {XMLHttpRequest} */ (event.target)));
    }

    const client = new XMLHttpRequest();
    client.addEventListener('load', /** @type {EventListener} */ (onLoad));
    client.addEventListener('error', /** @type {EventListener} */ (onError));
    client.open('GET', url);
    client.setRequestHeader('Accept', 'application/json');
    client.send();
  });
}

/**
 * @param {string} base The base URL.
 * @param {string} url The potentially relative URL.
 * @return {string} The full URL.
 */
export function resolveUrl(base, url) {
  if (url.includes('://')) {
    return url;
  }
  return new URL(url, base).href;
}

/** @type {typeof XMLHttpRequest|undefined} */
let originalXHR;
/**
 * @param {typeof XMLHttpRequest} xhr XMLHttpRequest constructor to use instead of the native one.
 */
export function overrideXHR(xhr) {
  if (typeof XMLHttpRequest !== 'undefined') {
    originalXHR = XMLHttpRequest;
  }
  globalThis.XMLHttpRequest = xhr;
}

export function restoreXHR() {
  if (originalXHR) {
    globalThis.XMLHttpRequest = originalXHR;
  }
}
