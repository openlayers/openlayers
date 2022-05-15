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
 * @param {Function} [opt_errback] Callback on error.
 * @param {string} [opt_callbackParam] Custom query parameter for the JSONP
 *     callback. Default is 'callback'.
 */
export function jsonp(url, callback, opt_errback, opt_callbackParam) {
  const script = document.createElement('script');
  const key = 'olc_' + getUid(callback);
  function cleanup() {
    delete window[key];
    script.parentNode.removeChild(script);
  }
  script.async = true;
  script.src =
    url +
    (url.indexOf('?') == -1 ? '?' : '&') +
    (opt_callbackParam || 'callback') +
    '=' +
    key;
  const timer = setTimeout(function () {
    cleanup();
    if (opt_errback) {
      opt_errback();
    }
  }, 10000);
  window[key] = function (data) {
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
      const client = event.target;
      // status will be 0 for file:// urls
      if (!client.status || (client.status >= 200 && client.status < 300)) {
        let data;
        try {
          data = JSON.parse(client.responseText);
        } catch (err) {
          const message = 'Error parsing response text as JSON: ' + err.message;
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
      reject(new ClientError(event.target));
    }

    const client = new XMLHttpRequest();
    client.addEventListener('load', onLoad);
    client.addEventListener('error', onError);
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
  if (url.indexOf('://') >= 0) {
    return url;
  }
  return new URL(url, base).href;
}

let originalXHR;
export function overrideXHR(xhr) {
  if (typeof XMLHttpRequest !== 'undefined') {
    originalXHR = XMLHttpRequest;
  }
  global.XMLHttpRequest = xhr;
}

export function restoreXHR() {
  global.XMLHttpRequest = originalXHR;
}
