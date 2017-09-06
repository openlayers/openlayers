import _ol_Feature_ from '../src/ol/feature';
import _ol_Geolocation_ from '../src/ol/geolocation';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';

var view = new _ol_View_({
  center: [0, 0],
  zoom: 2
});

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: view
});

var geolocation = new _ol_Geolocation_({
  projection: view.getProjection()
});

function el(id) {
  return document.getElementById(id);
}

el('track').addEventListener('change', function() {
  geolocation.setTracking(this.checked);
});

// update the HTML page when the position changes.
geolocation.on('change', function() {
  el('accuracy').innerText = geolocation.getAccuracy() + ' [m]';
  el('altitude').innerText = geolocation.getAltitude() + ' [m]';
  el('altitudeAccuracy').innerText = geolocation.getAltitudeAccuracy() + ' [m]';
  el('heading').innerText = geolocation.getHeading() + ' [rad]';
  el('speed').innerText = geolocation.getSpeed() + ' [m/s]';
});

// handle geolocation error.
geolocation.on('error', function(error) {
  var info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});

var accuracyFeature = new _ol_Feature_();
geolocation.on('change:accuracyGeometry', function() {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

var positionFeature = new _ol_Feature_();
positionFeature.setStyle(new _ol_style_Style_({
  image: new _ol_style_Circle_({
    radius: 6,
    fill: new _ol_style_Fill_({
      color: '#3399CC'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ?
    new _ol_geom_Point_(coordinates) : null);
});

new _ol_layer_Vector_({
  map: map,
  source: new _ol_source_Vector_({
    features: [accuracyFeature, positionFeature]
  })
});
