goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.XYZ');


var attribution = new ol.Attribution({
  html: 'Tiles &copy; <a href="http://maps.nls.uk/townplans/glasgow_1.html">' +
      'National Library of Scotland</a>'
});

var map = new ol.Map({
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM({
        attributions: [
          new ol.Attribution({
            html: 'Tiles &copy; <a href="http://www.opencyclemap.org/">' +
                'OpenCycleMap</a>'
          }),
          ol.source.OSM.ATTRIBUTION
        ],
        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
      })
    }),
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [attribution],
        url: 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png'
      })
    })
  ],
  view: new ol.View({
    center: [-472202, 7530279],
    zoom: 12
  })
});
