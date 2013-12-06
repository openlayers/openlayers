goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ScaleLineUnits');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.TileWMS');
goog.require('ol.source.Vector');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var projection = ol.proj.configureProj4jsProjection({
  code: 'EPSG:21781',
  extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864]
});

var extent = [420000, 30000, 900000, 350000];
var layers = [
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'http://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'Pixelmap 1:1000000 / geo.admin.ch</a>'
      })],
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      extent: extent
    })
  })
];

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.ScaleLine({
      units: ol.control.ScaleLineUnits.METRIC
    })
  ]),
  layers: layers,
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    projection: projection,
    center: [660000, 190000],
    extent: extent,
    zoom: 2
  })
});

var styleArray = [new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(128,0,128,0.8)',
    lineCap: 'round',
    lineJoin: 'round',
    width: 5
  })
})];

$.getJSON('data/mtbland.geojson', function(data) {
  var format = new ol.format.GeoJSON();
  var vectorSource = new ol.source.Vector();
  format.readObject(data, vectorSource.addFeature, vectorSource);
  map.getLayers().push(new ol.layer.Vector({
    source: vectorSource,
    styleFunction: function(feature) {
      return styleArray;
    }
  }));
});
