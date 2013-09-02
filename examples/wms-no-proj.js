goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.ImageLayer');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.SingleImageWMS');
goog.require('ol.source.TiledWMS');


var layers = [
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'Pixelmap 1:1000000 / geo.admin.ch</a>'
      })],
      crossOrigin: 'anonymous',
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      url: 'http://wms.geo.admin.ch/'
    })
  }),
  new ol.layer.ImageLayer({
    source: new ol.source.SingleImageWMS({
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'National parks / geo.admin.ch</a>'
      })],
      crossOrigin: 'anonymous',
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      url: 'http://wms.geo.admin.ch/'
    })
  })
];

// A minimal projection object is configured with only the SRS code and the map
// units. No client side coordinate transforms are possible with such a
// projection object.
var projection = new ol.Projection({
  code: 'EPSG:21781',
  units: ol.ProjectionUnits.METERS
});

var map = new ol.Map({
  layers: layers,
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [660000, 190000],
    projection: projection,
    zoom: 9
  })
});
