goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.WMTSCapabilities');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');

var parser = new ol.format.WMTSCapabilities();
var map;

// API key valid for 'openlayers.org' and 'localhost'.
// Expiration date is 06/29/2018.
var key = '2mqbg0z6cx7ube8gsou10nrt';

fetch('http://wxs.ign.fr/' + key + '/wmts?Service=WMTS&request=GetCapabilities')
  .then(function(response) {
    return response.text();
  }).then(function(text) {

    // Building limited layer from capabilities
    var result = parser.read(text);
    var options_limits = ol.source.WMTS.optionsFromCapabilities(result,
        {layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGN', matrixSet: 'EPSG:3857'});
    options_limits.crossOrigin = 'anonymous';

    var ign_layer_limits = new ol.layer.Tile({
      opacity: 1,
      source: new ol.source.WMTS(options_limits),
      maxResolution: options_limits.tileGrid.getResolution(
          options_limits.tileGrid.getMinZoom()) * 2,
      /* maxResolution set to prevent renderer to do artificial zooming
         (rendering unavailable levels using lower ones could be
         resource consuming)
         x2 because of exclusivity of maxResolution setting
      */
      attributions: [new ol.Attribution({
        html: '<a href="http://www.geoportail.fr/" target="_blank">' +
            '<img src="http://api.ign.fr/geoportail/api/js/latest/' +
            'theme/geoportal/img/logo_gp.gif"></a>'
      })]
    });


    // Building unlimited layer
    var resolutions = [];
    var matrixIds = [];
    var proj3857 = ol.proj.get('EPSG:3857');
    var maxResolution = ol.extent.getWidth(proj3857.getExtent()) / 256;

    for (var i = 0; i < 18; i++) {
      matrixIds[i] = i.toString();
      resolutions[i] = maxResolution / Math.pow(2, i);
    }

    var ign_layer = new ol.layer.Tile({
      source: new ol.source.WMTS({
        url: 'http://wxs.ign.fr/' + key + '/wmts',
        layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGN',
        matrixSet: 'PM',
        format: 'image/jpeg',
        projection: 'EPSG:3857',
        tileGrid: new ol.tilegrid.WMTS({
          origin: [-20037508, 20037508],
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        style: 'normal',
        attributions: [new ol.Attribution({
          html: '<a href="http://www.geoportail.fr/" target="_blank">' +
              '<img src="http://api.ign.fr/geoportail/api/js/latest/' +
              'theme/geoportal/img/logo_gp.gif"></a>'
        })]
      })
    });


    map = new ol.Map({
      layers: [
        ign_layer_limits
      ],
      //renderer: 'webgl',
      target: 'map',
      view: new ol.View({
        center: [261465.47, 6250023.51],
        zoom: 8
      })
    });

    map.on('moveend', function() {
      document.getElementById('zoomValue').textContent = map.getView().getZoom();
    });


    var layerSelector = document.getElementById('layerSelector');
    layerSelector.addEventListener('change', function() {
      if (layerSelector.value === 'planIgnWithTileMatrixSetLimits') {
        map.getLayers().setAt(0, ign_layer_limits);
      } else {
        map.getLayers().setAt(0, ign_layer);
      }
    });

  }
);
