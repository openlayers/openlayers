

/**
 * Loader to add the plovr generated script and ol.css to the document.
 *
 * The following default values may be overridden with query string
 * parameters:
 *
 *     * hostname - the current hostname (window.location.hostname)
 *     * port - 9810
 *     * mode - ADVANCED
 *     * id - id param in loader.js query string; defaults to 'ol' if not set
 *
 * Usage:
 *
 *     <script src="loader.js?id=myexample"></script>
 */
(function() {
  var scripts = document.getElementsByTagName('script');
  var params = {
    hostname: window.location.hostname,
    port: '9810',
    mode: 'ADVANCED',
    id: 'ol'
  };
  if (window.location.protocol === 'file:' && !params.hostname) {
    params.hostname = 'localhost';
  }
  var chunks, search, pair;

  var src, index, id, i;
  for (i = scripts.length - 1; i >= 0; --i) {
    src = scripts[i].getAttribute('src');
    if (~(index = src.indexOf('loader.js?'))) {
      // script params
      search = src.substr(index + 10);
      chunks = search ? search.split('&') : [];
      for (i = chunks.length - 1; i >= 0; --i) {
        pair = chunks[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      break;
    }
  }
  // url params
  search = window.location.search.substring(1);
  chunks = search ? search.split('&') : [];
  for (i = chunks.length - 1; i >= 0; --i) {
    pair = chunks[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }

  var host = params.hostname + ':' + params.port;
  delete params.hostname;
  delete params.port;

  var pairs = [];
  for (var key in params) {
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
  }

  document.write('<link rel="stylesheet" href="../css/ol.css" ' +
                 'type="text/css">');
  var url = 'http://' + host + '/compile?' + pairs.join('&');
  document.write('<script type="text/javascript" src="' + url + '"></script>');
}());
