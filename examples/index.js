

/**
 * Loader to append the query string to every A element in the document.
 *
 * This is so that (for example) visiting
 *   /examples/index.html?mode=RAW&Debug=true
 * will cause all links to automatically include the ?mode=RAW&Debug=true.
 */
(function() {
  var as = document.getElementsByTagName('a');
  var i, n = as.length;
  for (i = 0; i < n; ++i) {
    as[i].href += window.location.search;
  }
})();
