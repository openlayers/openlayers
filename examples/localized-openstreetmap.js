goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM({
        attributions: [
          new ol.Attribution(
              'All maps &copy; ' +
              '<a href="http://www.opencyclemap.org/">OpenCycleMap</a>'),
          ol.source.OSM.DATA_ATTRIBUTION
        ],
        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    maxZoom: 18,
    center: [-172857, 5977746],
    zoom: 12
  })
});
