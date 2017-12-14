import _ol_Feature_ from '../src/ol/Feature.js';
import _ol_Map_ from '../src/ol/Map.js';
import _ol_Observable_ from '../src/ol/Observable.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_control_ from '../src/ol/control.js';
import {easeOut} from '../src/ol/easing.js';
import _ol_geom_Point_ from '../src/ol/geom/Point.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_proj_ from '../src/ol/proj.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_({
        wrapX: false
      })
    })
  ],
  controls: _ol_control_.defaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 1
  })
});

var source = new _ol_source_Vector_({
  wrapX: false
});
var vector = new _ol_layer_Vector_({
  source: source
});
map.addLayer(vector);

function addRandomFeature() {
  var x = Math.random() * 360 - 180;
  var y = Math.random() * 180 - 90;
  var geom = new _ol_geom_Point_(_ol_proj_.transform([x, y],
      'EPSG:4326', 'EPSG:3857'));
  var feature = new _ol_Feature_(geom);
  source.addFeature(feature);
}

var duration = 3000;
function flash(feature) {
  var start = new Date().getTime();
  var listenerKey;

  function animate(event) {
    var vectorContext = event.vectorContext;
    var frameState = event.frameState;
    var flashGeom = feature.getGeometry().clone();
    var elapsed = frameState.time - start;
    var elapsedRatio = elapsed / duration;
    // radius will be 5 at start and 30 at end.
    var radius = easeOut(elapsedRatio) * 25 + 5;
    var opacity = easeOut(1 - elapsedRatio);

    var style = new _ol_style_Style_({
      image: new _ol_style_Circle_({
        radius: radius,
        snapToPixel: false,
        stroke: new _ol_style_Stroke_({
          color: 'rgba(255, 0, 0, ' + opacity + ')',
          width: 0.25 + opacity
        })
      })
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
    if (elapsed > duration) {
      _ol_Observable_.unByKey(listenerKey);
      return;
    }
    // tell OpenLayers to continue postcompose animation
    map.render();
  }
  listenerKey = map.on('postcompose', animate);
}

source.on('addfeature', function(e) {
  flash(e.feature);
});

window.setInterval(addRandomFeature, 1000);
