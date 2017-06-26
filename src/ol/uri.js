goog.provide('ol.uri');


/**
 * Appends query parameters to a URI.
 *
 * @param {string} uri The original URI, which may already have query data.
 * @param {!Object} params An object where keys are URI-encoded parameter keys,
 *     and the values are arbitrary types or arrays.
 * @param {?string=} opt_proxy Optional proxy URI which will be appended to the original URI.
 *     If ### is present in the string the original URL will be inserted there.
 * @return {string} The new URI.
 */
ol.uri.appendParams = function(uri, params, opt_proxy) {
  var keyParams = [];
  // Skip any null or undefined parameter values
  Object.keys(params).forEach(function(k) {
    if (params[k] !== null && params[k] !== undefined) {
      keyParams.push(k + '=' + encodeURIComponent(params[k]));
    }
  });
  var qs = keyParams.join('&');
  // remove any trailing ? or &
  uri = uri.replace(/[?&]$/, '');
  // append ? or & depending on whether uri has existing parameters
  uri = uri.indexOf('?') === -1 ? uri + '?' : uri + '&';
  // append/add uri to proxy url placeholder (if available)
  if (opt_proxy) {
    if (opt_proxy.indexOf('###') === -1) {
      uri = opt_proxy + uri + qs;
    } else {
      uri = uri + qs;
      uri = opt_proxy.replace('###', uri);
    }
  } else {
    uri = uri + qs;
  }
  return uri;
};
