(function() {
  var copyButton = document.getElementById('copy-button');
  if (copyButton) {
    var data = document.getElementById('example-source').textContent;
    new ZeroClipboard(copyButton).on('copy', function(event) {
      event.clipboardData.setData({
        'text/plain': data,
        'text/html': data
      });
    });
  }

  var codepenButton = document.getElementById('codepen-button');
  if (codepenButton) {
    codepenButton.onclick = function(event) {
      event.preventDefault();
      var form = document.getElementById('codepen-form');

      // Doc : https://blog.codepen.io/documentation/api/prefill/

      var resources = form.resources.value.split(',');

      var data = {
        title: form.title.value,
        description: form.description.value,
        layout: 'left',
        html: form.html.value,
        css: form.css.value,
        js: form.js.value,
        css_external: resources.filter(function(resource) {
          return resource.lastIndexOf('.css') === resource.length - 4;
        }).join(';'),
        js_external: resources.filter(function(resource) {
          return resource.lastIndexOf('.js') === resource.length - 3;
        }).join(';')
      };

      // binary flags to display html, css, js and/or console tabs
      data.editors = '' + Number(data.html.length > 0) +
          Number(data.css.length > 0) +
          Number(data.js.length > 0) +
          Number(data.js.indexOf('console') > 0);

      form.data.value = JSON.stringify(data);

      form.submit();
    };
  }
})();
