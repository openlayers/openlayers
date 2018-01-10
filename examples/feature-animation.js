import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Observable from '../src/ol/Observable.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import {easeOut} from '../src/ol/easing.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var map = new Map({
  layers: [
    new TileLayer({
      source: new OSM({
        wrapX: false
      })
    })
  ],
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});

var source = new VectorSource({
  wrapX: false
});
var vector = new VectorLayer({
  source: source
});
map.addLayer(vector);

function addRandomFeature() {
  var x = Math.random() * 360 - 180;
  var y = Math.random() * 180 - 90;
  var geom = new Point(fromLonLat([x, y]));
  var feature = new Feature(geom);
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
      Observable.unByKey(listenerKey);
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
