/* global ol */

const script = document.createElement('script');
script.async = true;

script.onload = function () {
  new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: '/data/tiles/osm/{z}/{x}/{y}.png',
        }),
      }),
    ],
    view: new ol.View({
      center: [0, 0],
      zoom: 0,
    }),
  });

  render();
};

script.src = '/ol.js';
document.head.appendChild(script);
