goog.require('ol.Map');
goog.require('ol.View');
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
for (var i = 0; i <= 14; i++) {
  matrixIds[i] = i;
  resolutions[i] = tileSizeMtrs / Math.pow(2, i);
}
var tileGrid = new ol.tilegrid.WMTS({
  origin: ol.extent.getTopLeft(projection.getExtent()),
  resolutions: resolutions,
  matrixIds: matrixIds
});

var scalgoToken = 'CC5BF28A7D96B320C7DFBFD1236B5BEB';

var wmtsSource = new ol.source.WMTS({
  url: 'http://ts2.scalgo.com/global/wmts?token=' + scalgoToken,
  layer: 'hydrosheds:sea-levels',
  format: 'image/png',
  matrixSet: 'EPSG:3857',
  attributions: [
    '<a href="http://scalgo.com">SCALGO</a>',
    '<a href="http://www.cgiar-csi.org/data/' +
        'srtm-90m-digital-elevation-database-v4-1">CGIAR-CSI SRTM</a>'
  ],
  tileGrid: tileGrid,
  style: 'default',
  dimensions: {
    'threshold': 100
  }
});

var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    projection: projection,
    center: [-9871995, 3566245],
    zoom: 6
  }),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Tile({
      opacity: 0.5,
      source: wmtsSource
    })
  ]
});

var updateSourceDimension = function(source, sliderVal) {
  source.updateDimensions({'threshold': sliderVal});
  document.getElementById('theinfo').innerHTML = sliderVal + ' meters';
};

updateSourceDimension(wmtsSource, 10);

document.getElementById('slider').addEventListener('input', function() {
  updateSourceDimension(wmtsSource, this.value);
});
