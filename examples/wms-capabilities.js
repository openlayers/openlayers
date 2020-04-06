import WMSCapabilities from '../src/ol/format/WMSCapabilities.js';

const parser = new WMSCapabilities();

fetch('data/ogcsample.xml')
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    const result = parser.read(text);
    document.getElementById('log').innerText = JSON.stringify(result, null, 2);
  });
