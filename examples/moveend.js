goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

function display(id, value) {
  document.getElementById(id).value = value.toFixed(2);
}

function wrapLon(value) {
  var worlds = Math.floor((value + 180) / 360);
  return value - (worlds * 360);
}

function onMoveEnd(evt) {
  var map = evt.map;
  var extent = map.getView().calculateExtent(map.getSize());
  var leftBottom = ol.proj.transform(
      [extent[0], extent[2]], 'EPSG:3857', 'EPSG:4326');
  var rightTop = ol.proj.transform(
      [extent[1], extent[3]], 'EPSG:3857', 'EPSG:4326');
  display('left', wrapLon(leftBottom[0]));
  display('bottom', leftBottom[1]);
  display('right', wrapLon(rightTop[0]));
  display('top', rightTop[1]);
}

map.on('moveend', onMoveEnd);
