/**
 * Loader to add ol.css, ol.js and the example-specific js file to the
 * documents.
 *
 * This loader is used for the hosted examples. It is used in place of the
 * development loader (examples/loader.js).
 *
 * ol.js, ol-simple.js, ol-whitespace.js, and ol-deps.js are built
 * by OL3's build.py script. They are located in the ../build/ directory,
 * relatively to this script.
 *
 * The script must be named loader.js.
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
    if (mode == 'debug') {
      mode = 'raw';
    }
    if (mode != 'advanced' && mode != 'raw') {
      oljs = 'ol-' + mode + '.js';
    }
  }

  var scriptId = encodeURIComponent(scriptParams.id);
  if (mode != 'raw') {
    document.write('<scr' + 'ipt type="text/javascript" src="../build/' + oljs + '"></scr' + 'ipt>');
  } else {
    window.CLOSURE_NO_DEPS = true; // we've got our own deps file
    document.write('<scr' + 'ipt type="text/javascript" src="../closure-library/closure/goog/base.js"></scr' + 'ipt>');
    document.write('<scr' + 'ipt type="text/javascript" src="../build/ol-deps.js"></scr' + 'ipt>');
    document.write('<scr' + 'ipt type="text/javascript" src="' + scriptId + '-require.js"></scr' + 'ipt>');
  }
  document.write('<scr' + 'ipt type="text/javascript" src="' + scriptId + '.js"></scr' + 'ipt>');
}());
