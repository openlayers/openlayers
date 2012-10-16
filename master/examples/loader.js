/**
 *
 * Loader to add ol.css, ol.js and the example-specific js file to the
 * documents.
 *
 * This loader is used for the hosted examples. It is used in place of the
 * development loader (examples/loader.js).
 *
 * ol.css and ol.js are built with Plovr/Closure, based build/ol.json.
 * (`make build` should build them). They are located in the ../build/
 * directory, relatively to this script.
 *
 * The script should be named loader.js. So it needs to be renamed to
 * loader.js from loader_hosted_examples.js.
 *
 * Usage:
 *
 *     <script src="../loader.js?id=my-demo"></script>
 */

(function() {
  var scripts = document.getElementsByTagName('script');

  var i, src, index, search, chunks, pair, params = {};
  for (i = scripts.length - 1; i >= 0; --i) {
    src = scripts[i].getAttribute('src');
    if (~(index = src.indexOf('loader.js?'))) {
      search = src.substr(index + 10);
      chunks = search ? search.split('&') : [];
      for (i = chunks.length - 1; i >= 0; --i) {
        pair = chunks[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      break;
    }
  }

  document.write('<link rel="stylesheet" href="../build/ol.css" '+
                 'type="text/css">');
  document.write('<scr' + 'ipt type="text/javascript" ' +
                 'src="../build/ol.js">' +
                 '</scr' + 'ipt>');
  document.write('<scr' + 'ipt type="text/javascript" ' +
                 'src="' + encodeURIComponent(params.id) + '.js">' +
                 '</scr' + 'ipt>');
}());
