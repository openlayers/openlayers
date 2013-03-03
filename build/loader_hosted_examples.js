/**
 *
 * Loader to add ol.css, ol.js and the example-specific js file to the
 * documents.
 *
 * This loader is used for the hosted examples. It is used in place of the
 * development loader (examples/loader.js).
 *
 * ol.css, ol.js, ol-simple.js, and ol-whitespace.js are built with
 * Plovr/Closure.  `build.py build` builds them. They are located in the
 * ../build/ directory, relatively to this script.
 *
 * The script should be named loader.js. So it needs to be renamed to
 * loader.js from loader_hosted_examples.js.
 *
 * Usage:
 *
 *     <script src="../loader.js?id=my-demo"></script>
 */

(function() {

  var i, pair;

  var href = window.location.href, start, end, paramsString, pairs,
      pageParams = {};
  if (href.indexOf('?') > 0) {
    start = href.indexOf('?') + 1;
    end = href.indexOf('#') > 0 ? href.indexOf('#') : href.length;
    paramsString = href.substring(start, end);
    pairs = paramsString.split(/[&;]/);
    for (i = 0; i < pairs.length; ++i) {
      pair = pairs[i].split('=');
      if (pair[0]) {
          pageParams[decodeURIComponent(pair[0])] =
              decodeURIComponent(pair[1]);
      }
    }
  }

  var scripts = document.getElementsByTagName('script');
  var src, index, search, chunks, scriptParams = {};
  for (i = scripts.length - 1; i >= 0; --i) {
    src = scripts[i].getAttribute('src');
    if (~(index = src.indexOf('loader.js?'))) {
      search = src.substr(index + 10);
      chunks = search ? search.split('&') : [];
      for (i = chunks.length - 1; i >= 0; --i) {
        pair = chunks[i].split('=');
        if (pair[0]) {
          scriptParams[decodeURIComponent(pair[0])] =
              decodeURIComponent(pair[1]);
        }
      }
      break;
    }
  }

  var oljs = 'ol.js', mode;
  if ('mode' in pageParams) {
    mode = pageParams.mode.toLowerCase();
    if (mode != 'advanced') {
      oljs = 'ol-' + mode + '.js';
    }
  }

  document.write('<link rel="stylesheet" href="../build/ol.css" '+
                 'type="text/css">');
  document.write('<scr' + 'ipt type="text/javascript" ' +
                 'src="../build/' + oljs + '">' +
                 '</scr' + 'ipt>');
  document.write('<scr' + 'ipt type="text/javascript" ' +
                 'src="' + encodeURIComponent(scriptParams.id) + '.js">' +
                 '</scr' + 'ipt>');
}());
