goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.MousePosition');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Tile');
goog.require('ol.source.GWC');
goog.require('ol.tilegrid.TileGrid');


var layers = [
  new ol.layer.Tile({
    extent: ol.geom.Polygon.fromExtent(
        [-124.731422, 24.955967, -66.969849, 49.371735]).transform(
        'EPSG:4326', 'EPSG:3857').getExtent(),
    source: new ol.source.GWC(({
      url: 'data/gwc',
      layer: 'topp_states',
      gridset: 'EPSG_900913',
      tileGrid: new ol.tilegrid.TileGrid({
        extent: [-20037508.342789244, -20037508.342789244,
          20037508.342789244, 20037508.342789244],
        origin: [-20037508.342789244, -20037508.342789244],
        resolutions: [156543.03392804097,
          78271.51696402048,
          39135.75848201024,
          19567.87924100512,
          9783.93962050256]
      })
    }))
  })
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: [-10900000, 4700000],
    zoom: 4
  })
});

map.addControl(new ol.control.MousePosition());
