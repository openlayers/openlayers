goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OpenStreetMap');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap({
        attribution: new ol.Attribution(
            'All maps &copy; ' +
            '<a href="http://www.opencyclemap.org/">OpenCycleMap</a>, ' +
            'map data &copy; ' +
            '<a href="http://www.openstreetmap.org/">OpenStreetMap</a> ' +
            '(<a href="http://www.openstreetmap.org/copyright">ODbL</a>)'),
        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [-172857, 5977746],
    zoom: 12
  })
});
