goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');

var attribution = new ol.Attribution({
  html: 'Tiles &copy; <a href="https://labs.koordinates.com/">Koordinates</a>'
});

var wmtsSource = new ol.source.WMTS({
  attributions: [attribution],
  layer: 'layer-7328',
  matrixSet: 'EPSG:3857',
  format: 'image/png',
  projection: 'EPSG:3857',
  style: 'style=39',
  requestEncoding: 'REST',
  getFeatureInfoOptions: {
    url: 'https://labs.koordinates.com/services;' +
        'key=d740ea02e0c44cafb70dce31a774ca10/wmts/1.0.0/layer/7328/' +
        'featureinfo/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}/' +
        '{I}/{J}.json',
    requestEncoding: 'REST',
    infoFormat: 'application/json'
  },
  url: 'https://koordinates-tiles-a.global.ssl.fastly.net/' +
      'services;key=d740ea02e0c44cafb70dce31a774ca10/tiles/v4/layer=7328,' +
      '{style}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png',
  tileGrid: new ol.tilegrid.WMTS({
    origin: [-20037508.3428, 20037508.3428],
    resolutions: [
      559082264.029 * 0.28E-3,
      279541132.015 * 0.28E-3,
      139770566.007 * 0.28E-3,
      69885283.0036 * 0.28E-3,
      34942641.5018 * 0.28E-3,
      17471320.7509 * 0.28E-3,
      8735660.37545 * 0.28E-3,
      4367830.18773 * 0.28E-3,
      2183915.09386 * 0.28E-3,
      1091957.54693 * 0.28E-3,
      545978.773466 * 0.28E-3,
      272989.386733 * 0.28E-3,
      136494.693366 * 0.28E-3,
      68247.3466832 * 0.28E-3,
      34123.6733416 * 0.28E-3,
      17061.8366708 * 0.28E-3,
      8530.91833540 * 0.28E-3,
      4265.45916770 * 0.28E-3,
      2132.72958385 * 0.28E-3,
      1066.36479193 * 0.28E-3
    ],
    matrixIds: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
    ]
  })
});


var wmtsLayer = new ol.layer.Tile({
  source: wmtsSource
});


var view = new ol.View({
  center: [19412406.33, -5050500.21],
  zoom: 5
});

var viewProjection = /** @type {ol.proj.Projection} */
    (view.getProjection());

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      opacity: 0.7
    }),
    wmtsLayer
  ],
  target: 'map',
  view: view
});

map.on('singleclick', function(evt) {
  document.getElementById('info').innerHTML = '';
  var viewResolution = /** @type {number} */ (view.getResolution());
  var url = wmtsSource.getGetFeatureInfoUrl(
      evt.coordinate, viewResolution, viewProjection);
  if (url) {
    document.getElementById('info').innerHTML =
        '<iframe seamless frameBorder="0" src="' + url + '"></iframe>';
  }
});
