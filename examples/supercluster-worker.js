'use strict';

// eslint-disable-next-line
importScripts('//unpkg.com/supercluster@2.2.0/dist/supercluster.min.js');

var index;

getJSON('data/geojson/2012_Earthquakes_Mag5.geojson', function(geojson) {
  // eslint-disable-next-line
  index = supercluster({
    log: true,
    radius: 60,
    extent: 256,
    maxZoom: 17
  }).load(geojson.features);

  postMessage({ready: true});
});

self.onmessage = function(e) {
  if (e.data) {
    postMessage(index.getClusters(e.data.bbox, e.data.zoom));
  }
};

function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onload = function() {
    if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300 && xhr.response) {
      callback(xhr.response);
    }
  };
  xhr.send();
}
