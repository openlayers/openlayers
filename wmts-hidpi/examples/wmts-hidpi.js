var template = '{TileMatrix}/{TileRow}/{TileCol}.jpeg';
var urls = [
  'http://maps1.wien.gv.at/basemap/bmaphidpi/normal/google3857/' + template,
  'http://maps2.wien.gv.at/basemap/bmaphidpi/normal/google3857/' + template,
  'http://maps3.wien.gv.at/basemap/bmaphidpi/normal/google3857/' + template,
  'http://maps4.wien.gv.at/basemap/bmaphidpi/normal/google3857/' + template,
  'http://maps.wien.gv.at/basemap/bmaphidpi/normal/google3857/' + template
];

var source = new ol.source.TileImage({
  extent: [977844.377599999, 5837774.6617, 1915609.8654, 6295560.8122],
  pixelRatios: [2],
  requestEncoding: 'REST',
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
    ],
    tileSize: 256
  }),
  tileUrlFunction: function(tileCoord, pixelRatio, projection) {
    if (tileCoord) {
      var zxy = tileCoord.getZXY();
      var index = ((zxy[1] << zxy[0]) + zxy[2]) % urls.length;
      return urls[index < 0 ? index + urls.length : index]
          .replace('{TileMatrix}', zxy[0])
          .replace('{TileRow}', -zxy[2] - 1)
          .replace('{TileCol}', zxy[1]);
    }
  }
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: source
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(['canvas', 'dom']),
  target: 'map',
  view: new ol.View2D({
    center: [1823849, 6143760],
    zoom: 11
  })
});
