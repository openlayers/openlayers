goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.layer.Vector');
goog.require('ol.View');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.DragBox');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

// Create the GeoAdmin map
var map = new ga.Map({
  target: 'map',
  layers: [
    ga.layer.create('ch.swisstopo.pixelkarte-farbe'),
    ga.layer.create('ch.swisstopo.pixelkarte-farbe-pk25.noscale'),
    ga.layer.create('ch.swisstopo.pixelkarte-farbe-pk50.noscale'),
    ga.layer.create('ch.swisstopo.pixelkarte-farbe-pk100.noscale'),
    ga.layer.create('ch.swisstopo.pixelkarte-farbe-pk200.noscale'),
    ga.layer.create('ch.swisstopo.pixelkarte-farbe-pk500.noscale')
  ],
  view: new ol.View({
    resolution: 500,
    center: [660500, 186000],
    zoom: 2
  })
});

var setOneLayerVisible = function(layerIndex) {
  var layers = map.getLayers().getArray();
  for (var i = 0, ii = 6; i < ii; i++) {
    var layer = layers[i];
    if (i == layerIndex) {
      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }
};

// Makes the multiscale layer visible
setOneLayerVisible(0);

var boxStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 0, 0, 0.3)'
  }),
  stroke: new ol.style.Stroke({
    color: '#FF0000',
    width: 2
  })
});

var dragBox = new ol.interaction.DragBox({
  style: boxStyle
});

var overlay = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: function(feature, resolution) {
    return [boxStyle];
  }
});
map.addLayer(overlay);

// Listeners dragbox interaction event
dragBox.on('boxstart', function(evt) {
  overlay.getSource().clear();
});

dragBox.on('boxend', function(evt) {
  var bbox = dragBox.getGeometry().getExtent();
  $('#north').val(Math.round(bbox[3]));
  $('#south').val(Math.round(bbox[1]));
  $('#east').val(Math.round(bbox[2]));
  $('#west').val(Math.round(bbox[0]));
  overlay.getSource().addFeature(new ol.Feature(dragBox.getGeometry()));
  map.removeInteraction(dragBox);
  $('#map').removeClass('drawing');
});

// Add keyboard events on inputs
$('.coordinates input').keyup(function() {
  var north = $('#north')[0].value;
  var south = $('#south')[0].value;
  var east = $('#east')[0].value;
  var west = $('#west')[0].value;

  if (north && south && west && east) {
    var polygon = new ol.geom.Polygon(
        [[[west, north],
          [west, south],
          [east, south],
          [east, north],
          [west, north]]]
        );

    // Apply the new coordinates to the box
    overlay.getSource().clear();
    overlay.getSource().addFeature(new ol.Feature(polygon));
  }
});

// Add new rectangle link click event
$('.viewer-new-rectangle').click(function(e) {
  $('#map').addClass('drawing');
  e.preventDefault();
  if (dragBox) {
    map.removeInteraction(dragBox);
  }
  map.addInteraction(dragBox);
});

// Add delete rectangle link click event
$('.viewer-delete-rectangle').click(function(e) {
  e.preventDefault();
  overlay.getSource().clear();
  $('#north').val(undefined);
  $('#south').val(undefined);
  $('#east').val(undefined);
  $('#west').val(undefined);
});

// Add inputs radio events
$('[name=maplayer]').click(function() {
  setOneLayerVisible(this.value);
});
