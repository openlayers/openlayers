(function() {

  function compress(json) {
    return LZString.compressToBase64(JSON.stringify(json))
      .replace(/\+/g, `-`)
      .replace(/\//g, `_`)
      .replace(/=+$/, ``);
  }

  var htmlClipboard = new Clipboard('#copy-html-button');
  htmlClipboard.on('success', function(e) {
    e.clearSelection();
  });
  var jsClipboard = new Clipboard('#copy-js-button');
  jsClipboard.on('success', function(e) {
    e.clearSelection();
  });
  var pkgClipboard = new Clipboard('#copy-pkg-button');
  pkgClipboard.on('success', function(e) {
    e.clearSelection();
  });

  var codepenButton = document.getElementsByClassName('codepen-button')[0];
  if (codepenButton) {
    codepenButton.onclick = function(event) {
      event.preventDefault();
      var form = document.getElementById('codepen-form');
      const html = document.getElementById('example-html-source').innerText;
      const js = document.getElementById('example-js-source').innerText;
      const pkgJson = document.getElementById('example-pkg-source').innerText;
      form.parameters.value = compress({
        files: {
          'index.html': {
            content: html
          },
          'index.js': {
            content: js
          },
          "package.json": {
            content: pkgJson
          },
          'sandbox.config.json': {
            content: '{"template": "parcel"}'
          }
        }
      });
      form.submit();
    };
  }
})();
