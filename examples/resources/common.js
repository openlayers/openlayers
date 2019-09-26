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

  function fetchResource(resource) {
    return new Promise((resolve, reject) => {
      const isImage = /\.(png|jpe?g|gif|tiff)$/.test(resource);
      const xhr = new XMLHttpRequest();
      xhr.open('GET', resource);
      if (isImage) {
        xhr.responseType = 'blob';
      } else {
        xhr.responseType = 'text';
      }
      xhr.addEventListener('load', () => {
        if (isImage) {
          const a = new FileReader();
          a.addEventListener('load', e => {
            resolve ({
              isBinary: true,
              content: e.target.result
            })
          });
          a.readAsDataURL(xhr.response);
        } else {
          resolve ({
            content: xhr.response
          })
        }
      });
      xhr.addEventListener('error', reject);
      xhr.send();
    })
  }

  var codepenButton = document.getElementsByClassName('codepen-button')[0];
  if (codepenButton) {
    codepenButton.onclick = function(event) {
      event.preventDefault();
      const html = document.getElementById('example-html-source').innerText;
      const js = document.getElementById('example-js-source').innerText;
      const pkgJson = document.getElementById('example-pkg-source').innerText;
      const form = document.getElementById('codepen-form');

      const localResources = (js.match(/'data\/[^']*/g) || [])
        .concat(js.match(/'resources\/[^']*/g) || [])
        .map(f => f.slice(1));

      const promises = localResources.map(resource => fetchResource(resource));

      Promise.all(promises)
        .then(results => {
          const data = {
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
          };

          for (let i = 0; i < localResources.length; i++) {
            data.files[localResources[i]] = results[i];
          }

          form.parameters.value = compress(data);
          form.submit();
        });
    };
  }
})();
