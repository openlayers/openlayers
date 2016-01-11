goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.TileJSON');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');


var rome = new ol.Feature({
  geometry: new ol.geom.Point(ol.proj.fromLonLat([12.5, 41.9]))
});

var london = new ol.Feature({
  geometry: new ol.geom.Point(ol.proj.fromLonLat([-0.12755, 51.507222]))
});

var madrid = new ol.Feature({
  geometry: new ol.geom.Point(ol.proj.fromLonLat([-3.683333, 40.4]))
});

rome.setStyle(new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    color: '#8959A8',
    src: 'data/dot.png'
  }))
}));

london.setStyle(new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    color: '#4271AE',
    src: 'data/dot.png'
  }))
}));

madrid.setStyle(new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    color: [113, 140, 0],
    src: 'data/dot.png'
  }))
}));


var vectorSource = new ol.source.Vector({
  features: [rome, london, madrid]
});

var vectorLayer = new ol.layer.Vector({
  source: vectorSource
});

var rasterLayer = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.json',
    crossOrigin: ''
  })
});

var map = new ol.Map({
  renderer: common.getRendererFromQueryString(),
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new ol.View({
    center: ol.proj.fromLonLat([2.896372, 44.60240]),
    zoom: 3
  })
});

var element = document.getElementById('popup');

var popup = new ol.Overlay({
  element: element,
  positioning: 'bottom-center',
  stopEvent: false
});
map.addOverlay(popup);

// display popup on click
map.on('click', function(evt) {
  var feature = map.forEachFeatureAtPixel(evt.pixel,
      function(feature, layer) {
        return feature;
      });
  if (feature) {
    popup.setPosition(evt.coordinate);
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

// change mouse cursor when over marker
map.on('pointermove', function(e) {
  if (e.dragging) {
    $(element).popover('destroy');
    return;
  }
  var pixel = map.getEventPixel(e.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);
  map.getTarget().style.cursor = hit ? 'pointer' : '';
});
