goog.provide('ol.net');

goog.require('ol');


/**
 * Simple JSONP helper. Supports error callbacks and a custom callback param.
 * The error callback will be called when no JSONP is executed after 10 seconds.
 *
 * @param {string} url Request url. A 'callback' query parameter will be
 *     appended.
 * @param {Function} callback Callback on success.
 * @param {function()=} opt_errback Callback on error.
 * @param {string=} opt_callbackParam Custom query parameter for the JSONP
 *     callback. Default is 'callback'.
 */
ol.net.jsonp = function(url, callback, opt_errback, opt_callbackParam) {
  var script = document.createElement('script');
  var key = 'olc_' + ol.getUid(callback);
  function cleanup() {
    delete window[key];
    script.parentNode.removeChild(script);
  }
  script.async = true;
  script.src = url + (url.indexOf('?') == -1 ? '?' : '&') +
      (opt_callbackParam || 'callback') + '=' + key;
  var timer = setTimeout(function() {
    cleanup();
    if (opt_errback) {
      opt_errback();
    }
  }, 10000);
  window[key] = function(data) {
    clearTimeout(timer);
    cleanup();
    callback(data);
  };
  document.getElementsByTagName('head')[0].appendChild(script);
};
