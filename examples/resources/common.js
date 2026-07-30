(function () {
  'use strict';
  /* global LZString */

  let lzStringPromise;
  function loadLzString() {
    if (!lzStringPromise) {
      lzStringPromise = new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src =
          'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js';
        document.head.append(script);
        script.addEventListener('load', resolve);
        script.addEventListener('error', reject);
      });
    }
    return lzStringPromise;
  }

  function compress(json) {
    return LZString.compressToBase64(JSON.stringify(json))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function fetchResource(resource) {
    return new Promise(function (resolve, reject) {
      const isImage = /\.(png|jpe?g|gif|tiff?|svg|kmz)$/.test(resource);
      if (isImage) {
        resolve({
          isBinary: true,
          content: new URL(resource, window.location.href).href,
        });
      } else {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', resource);
        xhr.responseType = 'text';
        xhr.addEventListener('load', function () {
          resolve({
            content: xhr.response,
          });
        });
        xhr.addEventListener('error', reject);
        xhr.send();
      }
    });
  }

  const codepenButton = document.getElementById('codepen-button');
  if (codepenButton) {
    const form = document.getElementById('codepen-form');
    codepenButton.href = form.action;
    codepenButton.addEventListener('click', function (event) {
      event.preventDefault();
      const html = document.getElementById('example-html-source').innerText;
      const js = document.getElementById('example-js-source').innerText;
      const pkgJson = document.getElementById('example-pkg-source').innerText;

      const unique = new Set();
      const localResources = (
        js.match(/'(?:\.\/)?(?:data|resources)\/[^']*'/g) || []
      )
        .map(function (f) {
          return f.replace(/^'(?:\.\/)?|'$/g, '');
        })
        .filter(function (f) {
          return unique.has(f) ? false : unique.add(f);
        });

      const promises = localResources.map(function (resource) {
        return fetchResource(resource);
      });
      promises.push(loadLzString());

      Promise.all(promises).then(function (results) {
        const files = {
          'index.html': {content: html},
          'main.js': {content: js},
          'package.json': {content: pkgJson},
          // Node container so Vite can run (classic CSB has no dedicated "vite" template).
          'sandbox.config.json': {
            content: JSON.stringify(
              {
                template: 'node',
                startScript: 'start',
              },
              undefined,
              2,
            ),
          },
          '.prettierrc': {
            content: JSON.stringify(
              {
                printWidth: 80,
                tabWidth: 2,
                useTabs: false,
                semi: true,
                singleQuote: true,
                trailingComma: 'all',
                bracketSpacing: false,
                jsxBracketSameLine: false,
                fluid: false,
              },
              undefined,
              2,
            ),
          },
        };

        document
          .querySelectorAll('code.example-extra-source[data-filename]')
          .forEach(function (el) {
            files[el.dataset.filename] = {content: el.innerText};
          });

        for (let i = 0; i < localResources.length; i++) {
          files[localResources[i]] = results[i];
        }

        form.parameters.value = compress({files: files});
        form.submit();
      });
    });
  }
})();
