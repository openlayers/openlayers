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
        'mapbox.world-black.jsonp',
    crossOrigin: 'anonymous'
  })
});

var overlay = new ol.layer.Tile({
  extent: extents.northwest,
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/' +
        'mapbox.world-glass.jsonp',
    crossOrigin: 'anonymous'
  })
});

var map = new ol.Map({
  layers: [base, overlay],
  renderer: exampleNS.getRendererFromQueryString(),
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
