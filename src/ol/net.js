goog.provide('ol.net.Jsonp');


/**
 * @param {string} url Request url. A 'callback' query parameter will be
 *     appended.
 * @param {Function} callback Callback on success.
 * @param {function()=} opt_errback Callback on error.
 * @param {string=} opt_callbackParam Callback parameter. Default is 'callback'.
 */
ol.net.Jsonp = function(url, callback, opt_errback, opt_callbackParam) {
  var script = goog.global.document.createElement('script');
  script.async = true;
  var key = 'ol_callback_' + goog.getUid(callback);
  script.src = url + (url.indexOf('?') == -1 ? '?' : '&') +
      (opt_callbackParam || 'callback') + '=' + key;
  var timer = goog.global.setTimeout(function() {
    delete goog.global[key];
    if (opt_errback) {
      opt_errback();
    }
  }, 10000);
  goog.global[key] = function(data) {
    goog.global.clearTimeout(timer);
    delete goog.global[key];
    callback(data);
  };
  goog.global.document.getElementsByTagName('head')[0].appendChild(script);
};
