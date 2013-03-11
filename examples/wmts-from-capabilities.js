goog.require('ol.Attribution');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.ImageLayer');
goog.require('ol.layer.TileLayer');
goog.require('ol.parser.ogc.WMTSCapabilities');
goog.require('ol.projection');
goog.require('ol.source.SingleImageWMS');
goog.require('ol.source.WMTS');


var projection = ol.projection.configureProj4jsProjection({
  code: 'EPSG:21781',
  extent: new ol.Extent(485869.5728, 76443.1884, 837076.5648, 299941.7864)
});

var map, capabilities;
var parser = new ol.parser.ogc.WMTSCapabilities();

var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml', true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    capabilities = parser.read(xhr.responseXML);
    map = new ol.Map({
      layers: [
        new ol.layer.TileLayer({
          source: ol.source.WMTS.createFromCapabilities(
              capabilities, 'ch.swisstopo.pixelkarte-farbe', null)
        }),
        new ol.layer.ImageLayer({
          source: new ol.source.SingleImageWMS({
            url: 'http://wms.geo.admin.ch/',
            attributions: [new ol.Attribution(
                '&copy; <a href="' +
                'http://www.geo.admin.ch/internet/geoportal/en/home.html">' +
                'National parks / geo.admin.ch</a>')],
            params: {
              'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'
            }
          })
        })
      ],
      renderer: ol.RendererHint.CANVAS,
      target: 'map',
      view: new ol.View2D({
        center: projection.getExtent().getCenter(),
        projection: projection,
        zoom: 1
      })
    });
  }
};
xhr.send();
