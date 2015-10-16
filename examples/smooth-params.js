goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.Attribution');
goog.require('ol.control.Zoom');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');


// create the WMTS tile grid in the google projection
var projection = ol.proj.get('EPSG:3857');
var tileSizePixels = 256;
var tileSizeMtrs = ol.extent.getWidth(projection.getExtent()) / tileSizePixels;
var matrixIds = [];
var resolutions = [];
var attributions = [
  new ol.Attribution({
    html: '<a href="http://scalgo.com">SCALGO</a>'
  }),
  new ol.Attribution({
    html: '<a href="http://www.cgiar-csi.org/data/' +
        'srtm-90m-digital-elevation-database-v4-1">CGIAR-CSI SRTM</a>'
  })
];

for (var i = 0; i <= 14; i++) {
  matrixIds[i] = i;
  resolutions[i] = tileSizeMtrs / Math.pow(2, i);
}
var tileGrid = new ol.tilegrid.WMTS({
  origin: ol.extent.getTopLeft(projection.getExtent()),
  resolutions: resolutions,
  matrixIds: matrixIds
});

var scalgo_token = 'CC5BF28A7D96B320C7DFBFD1236B5BEB';

// make the special WMTS layer
var layerSmooth = new ol.layer.Tile({
  opacity: 0.5,
  source: new ol.source.WMTS({
    url: 'http://ts2.scalgo.com/global/wmts?token=' + scalgo_token,
    layer: 'hydrosheds:sea-levels',
    format: 'image/png',
    matrixSet: 'EPSG:3857',
    attributions: attributions,
    tileGrid: tileGrid,
    style: 'default',
    dimensions: {
      threshold: 100
    },
    keyPrefixIgnoredDimensions: ['threshold']
  })
});

var layer = new ol.layer.Tile({
  opacity: 0.5,
  source: new ol.source.WMTS({
    url: 'http://ts2.scalgo.com/global/wmts?token=' + scalgo_token,
    layer: 'hydrosheds:sea-levels',
    format: 'image/png',
    matrixSet: 'EPSG:3857',
    attributions: attributions,
    tileGrid: tileGrid,
    style: 'default',
    dimensions: {
      threshold: 100
    }
  })
});

var mapSmooth = new ol.Map({
  target: 'map_smooth',
  view: new ol.View({
    projection: projection,
    center: [-3052589, 3541786],
    zoom: 3
  }),
  controls: [
    new ol.control.Zoom(),
    new ol.control.Attribution()
  ],
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    layerSmooth
  ]
});

var map = new ol.Map({
  target: 'map',
  view: mapSmooth.getView(),
  controls: [
    new ol.control.Zoom(),
    new ol.control.Attribution()
  ],
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    layer
  ]
});

var setLayerParam = function(map, layer, sliderVal, isSmooth) {
  // update the layer dimensions
  // normally this would result in e tile reload,
  // but we're ignoring the 'threshold' dimension in this example
  layer.getSource().updateDimensions({
    threshold: sliderVal
  });


  if (isSmooth) {
    // explicitly load the tiles for the new threshold
    layer.getSource().reloadVisibleTilesOutOfBand(map);
  }
  document.getElementById('theinfo').innerHTML = sliderVal + ' meters.';
};

setLayerParam(map, layer, 10, false);
setLayerParam(mapSmooth, layerSmooth, 10, true);

document.getElementById('slider').addEventListener('input', function() {
  setLayerParam(map, layer, this.value, false);
  setLayerParam(mapSmooth, layerSmooth, this.value, true);
});
