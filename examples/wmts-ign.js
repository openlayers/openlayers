goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.parser.ogc.WMTSCapabilities');
goog.require('ol.source.WMTS');


// The WMTS Capabilities document includes IGNF:WGS84G as a supported
// CRS. We include the Proj4js definition of that projection to prevent
// Proj4js from requesting that definition from spatialreference.org.

Proj4js.defs['IGNF:WGS84G'] = '+title=World Geodetic System 1984 ' +
    '+proj=longlat +towgs84=0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,' +
    '0.000000 +a=6378137.0000 +rf=298.2572221010000 +units=m +no_defs <>';

// API key valid for "localhost" and "ol3js.org". Expiration date
// is 21/06/2014.
var key = 'crrypaoz7j1ifbalcobnumb0';

var map = new ol.Map({
  renderer: ol.RendererHint.CANVAS,
  target: 'map'
});

var xhr = new XMLHttpRequest();

// data/IGNWMTSCapabilities.xml downloaded from
// http://wxs.ign.fr/cle/geoportail/wmts?SERVICE=WMTS&REQUEST=GetCapabilities
// Stored locally because of the Same Origin Policy.
xhr.open('GET', 'data/IGNWMTSCapabilities.xml', true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    var parser = new ol.parser.ogc.WMTSCapabilities();
    var capabilities = parser.read(xhr.responseXML);

    var wmtsUrl = 'http://wxs.ign.fr/' + key + '/geoportail/wmts';

    var layerIdentifiers = [
      'ORTHOIMAGERY.ORTHOPHOTOS',
      'CADASTRALPARCELS.PARCELS'
    ];
    var layerLogos = [
      'http://gpp3-wxs.ign.fr/static/logos/PLANETOBSERVER/PLANETOBSERVER.gif',
      'http://gpp3-wxs.ign.fr/static/logos/IGN/IGN.gif'
    ];

    var attribution = new ol.Attribution({
      html: '<a href="http://www.geoportail.fr/" target="_blank">' +
          '<img src="http://api.ign.fr/geoportail/api/js/latest/' +
          'theme/geoportal/img/logo_gp.gif"></a>'
    });

    var sourceOptions;
    var source;
    var layer;
    var i;

    for (i = 0; i < layerIdentifiers.length; ++i) {
      sourceOptions = ol.source.WMTS.optionsFromCapabilities(
          capabilities, layerIdentifiers[i]);
      // we need to set the URL because it must include the key.
      sourceOptions.urls = [wmtsUrl];
      sourceOptions.attributions = [attribution];
      sourceOptions.logo = layerLogos[i];
      source = new ol.source.WMTS(sourceOptions);
      layer = new ol.layer.Tile({source: source});
      map.addLayer(layer);
    }

    var view = new ol.View2D();
    view.fitExtent([257596.65942095537, 262082.55751844167,
      6250898.984085131, 6251854.446938695], map.getSize());
    map.setView(view);
  }
};

xhr.send();
