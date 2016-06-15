goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileJSON');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.DragRotateAndZoom');

function transform(extent) {
  return ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

var extents = {
  northwest: transform([-180, 0, 0, 85]),
  northeast: transform([0, 0, 180, 85]),
  southeast: transform([0, -85, 180, 0]),
  southwest: transform([-180, -85, 0, 0]),
  world: transform([-180, -85, 180, 85])
};

var base = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/' +
        'mapbox.world-black.json',
    crossOrigin: 'anonymous'
  })
});

var overlay = new ol.layer.Tile({
  extent: extents.northwest,
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/' +
        'mapbox.world-glass.json',
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

function box(coordinates, geometry) {
  if (!geometry) {
    geometry = new ol.geom.Polygon(null);
  }
  var start = coordinates[0];
  var end = coordinates[1];

  geometry.setCoordinates([
    [start, [start[0], end[1]], end, [end[0], start[1]], start]
  ]);
  return geometry;
}


var draw = new ol.interaction.Draw({
  type: /** @type {ol.geom.GeometryType} */ ('LineString'),
  geometryFunction: box,
  maxPoints: 2
});

draw.on('drawend', function(ev) {
  var extent = ev.feature.getGeometry().getExtent();
  overlay.setExtent(extent);
});

map.addInteraction(new ol.interaction.DragRotateAndZoom());

document.getElementById('draw').onclick = function() {
  map.addInteraction(draw);
};

for (var key in extents) {
  document.getElementById(key).onclick = function(event) {
    overlay.setExtent(extents[event.target.id]);
  };
}
