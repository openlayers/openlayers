goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.layer.VectorTile');
goog.require('ol.source.VectorTile');

var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  }),
  layers: [new ol.layer.VectorTile({
    source: new ol.source.VectorTile({
      format: new ol.format.MVT(),
      url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf'
    })
  })]
});

map.on('pointermove', showInfo);

var info = document.getElementById('info');
function showInfo(event) {
  var features = map.getFeaturesAtPixel(event.pixel);
  if (!features) {
    info.innerText = '';
    info.style.opacity = 0;
    return;
  }
  var properties = features[0].getProperties();
  info.innerText = JSON.stringify(properties, null, 2);
  info.style.opacity = 1;
}
