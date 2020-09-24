(function() {

  function compress(json) {
    return LZString.compressToBase64(JSON.stringify(json))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function fetchResource(resource) {
    return new Promise(function (resolve, reject) {
      const isImage = /\.(png|jpe?g|gif|tiff)$/.test(resource);
      if (isImage) {
        resolve ({
          isBinary: true,
          content: new URL(resource, window.location.href).href
        });
      } else {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', resource);
        xhr.responseType = 'text';
        xhr.addEventListener('load', function () {
          resolve ({
            content: xhr.response
          });
        });
        xhr.addEventListener('error', reject);
        xhr.send();
      }
    })
  }

  const codepenButton = document.getElementById('codepen-button');
  if (codepenButton) {
    const form = document.getElementById('codepen-form');
    codepenButton.href = form.action;
    codepenButton.addEventListener('click', function (event) {
      event.preventDefault();
      const innerText = document.documentMode ? 'textContent' : 'innerText';
      const html = document.getElementById('example-html-source')[innerText];
      const js = document.getElementById('example-js-source')[innerText];
      const workerContainer = document.getElementById('example-worker-source');
      const worker = workerContainer ? workerContainer[innerText] : undefined;
      const pkgJson = document.getElementById('example-pkg-source')[innerText];

      const unique = new Set();
      const localResources = (js.match(/'(\.\/)?data\/[^']*/g) || [])
        .concat(js.match(/'(\.\/)?resources\/[^']*/g) || [])
        .map(
          function (f) {
            return f.replace(/^'(\.\/)?/, '');
          }
        )
        .filter(
          function (f) {
            return unique.has(f) ? false : (unique.add(f) || unique);
          }
        );

      const promises = localResources.map(
        function (resource) {
          return fetchResource(resource);
        }
      );

      Promise.all(promises).then(
        function (results) {
          const files = {
            'index.html': {
              content: html
            },
            'main.js': {
              content: js
            },
            'package.json': {
              content: pkgJson
            },
            'sandbox.config.json': {
              content: '{"template": "parcel"}'
            }
          };
          if (worker) {
            files['worker.js'] = {
              content: worker
            }
          }
          const data = {
            files: files
          };

          for (let i = 0; i < localResources.length; i++) {
            data.files[localResources[i]] = results[i];
          }

          form.parameters.value = compress(data);
          form.submit();
        }
      );
    });
  }
})();
