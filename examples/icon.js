goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.OverlayPositioning');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.icon');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.TileJSON');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');


var raster = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp'
  })
});

var vectorSource = new ol.source.Vector();

new ol.format.GeoJSON().readObject({
  'type': 'FeatureCollection',
  'features': [{
    'type': 'Feature',
    'properties': {
      'name': 'Null Island',
      'population': 4000,
      'rainfall': 500
    },
    'geometry': {
      'type': 'Point',
      'coordinates': [0, 0]
    }
  }]
}, vectorSource.addFeature, vectorSource);

var styleArray = [new ol.style.Style({
  image: ol.icon.renderIcon('data/icon.png')
})];

var vector = new ol.layer.Vector({
  source: vectorSource,
  styleFunction: function(feature, resolution) {
    return styleArray;
  }
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 3
  })
});

var element = document.getElementById('popup');

var popup = new ol.Overlay({
  element: element,
  positioning: ol.OverlayPositioning.BOTTOM_CENTER,
  stopEvent: false
});
map.addOverlay(popup);

// display popup on click
map.on('singleclick', function(evt) {
  var feature;
  map.forEachFeatureAtPixel(evt.getPixel(), function(f) {
    feature = f;
  });
  if (feature) {
    var geometry = feature.getGeometry();
    var coord = geometry.getCoordinates();
    popup.setPosition(coord);
    $(element).popover({
      'placement': 'top',
      'html': true,
      'content': feature.get('name')
    });
    $(element).popover('show');
  } else {
    $(element).popover('destroy');
  }
});
