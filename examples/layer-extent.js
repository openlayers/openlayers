goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileJSON');

function transform(extent) {
  return ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

var extents = {
  India: transform([68.17665, 7.96553, 97.40256, 35.49401]),
  Argentina: transform([-73.41544, -55.25, -53.62835, -21.83231]),
  Nigeria: transform([2.6917, 4.24059, 14.57718, 13.86592]),
  Sweden: transform([11.02737, 55.36174, 23.90338, 69.10625])
};

var base = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-light.json?secure',
    crossOrigin: 'anonymous'
  })
});

var overlay = new ol.layer.Tile({
  extent: extents.India,
  source: new ol.source.TileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-black.json?secure',
    crossOrigin: 'anonymous'
  })
});

var map = new ol.Map({
  layers: [base, overlay],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  })
});

for (var key in extents) {
  document.getElementById(key).onclick = function(event) {
    overlay.setExtent(extents[event.target.id]);
  };
}
