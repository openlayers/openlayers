import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_Overlay_ from '../src/ol/overlay';
import _ol_View_ from '../src/ol/view';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_TileJSON_ from '../src/ol/source/tilejson';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Icon_ from '../src/ol/style/icon';
import _ol_style_Style_ from '../src/ol/style/style';


var iconFeature = new _ol_Feature_({
  geometry: new _ol_geom_Point_([0, 0]),
  name: 'Null Island',
  population: 4000,
  rainfall: 500
});

var iconStyle = new _ol_style_Style_({
  image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    src: 'data/icon.png'
  }))
});

iconFeature.setStyle(iconStyle);

var vectorSource = new _ol_source_Vector_({
  features: [iconFeature]
});

var vectorLayer = new _ol_layer_Vector_({
  source: vectorSource
});

var rasterLayer = new _ol_layer_Tile_({
  source: new _ol_source_TileJSON_({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
    crossOrigin: ''
  })
});

var map = new _ol_Map_({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: [0, 0],
    zoom: 3
  })
});

var element = document.getElementById('popup');

var popup = new _ol_Overlay_({
  element: element,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [0, -50]
});
map.addOverlay(popup);

// display popup on click
map.on('click', function(evt) {
  var feature = map.forEachFeatureAtPixel(evt.pixel,
      function(feature) {
        return feature;
      });
  if (feature) {
    var coordinates = feature.getGeometry().getCoordinates();
    popup.setPosition(coordinates);
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
