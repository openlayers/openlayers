/**
 * @module ol/uri
 */

/**
 * Appends query parameters to a URI.
 *
 * @param {string} uri The original URI, which may already have query data.
 * @param {!Object} params An object where keys are URI-encoded parameter keys,
 *     and the values are arbitrary types or arrays.
 * @return {string} The new URI.
 */
export function appendParams(uri, params) {
  const keyParams = [];
  // Skip any null or undefined parameter values
  Object.keys(params).forEach(function (k) {
    if (params[k] !== null && params[k] !== undefined) {
      keyParams.push(k + '=' + encodeURIComponent(params[k]));
    }
  });
  const qs = keyParams.join('&');
  // remove any trailing ? or &
  uri = uri.replace(/[?&]$/, '');
  // append ? or & depending on whether uri has existing parameters
  uri += uri.includes('?') ? '&' : '?';
  return uri + qs;
}
