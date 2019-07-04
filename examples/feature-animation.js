import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import {unByKey} from '../src/ol/Observable.js';
import View from '../src/ol/View.js';
import {easeOut} from '../src/ol/easing.js';
import Point from '../src/ol/geom/Point.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Circle as CircleStyle, Stroke, Style} from '../src/ol/style.js';
import {getVectorContext} from '../src/ol/render.js';

const tileLayer = new TileLayer({
  source: new OSM({
    wrapX: false
  })
});

const map = new Map({
  layers: [tileLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
    multiWorld: true
  })
});

const source = new VectorSource({
  wrapX: false
});
const vector = new VectorLayer({
  source: source
});
map.addLayer(vector);

function addRandomFeature() {
  const x = Math.random() * 360 - 180;
  const y = Math.random() * 180 - 90;
  const geom = new Point(fromLonLat([x, y]));
  const feature = new Feature(geom);
  source.addFeature(feature);
}

const duration = 3000;
function flash(feature) {
  const start = new Date().getTime();
  const listenerKey = tileLayer.on('postrender', animate);

  function animate(event) {
    const vectorContext = getVectorContext(event);
    const frameState = event.frameState;
    const flashGeom = feature.getGeometry().clone();
    const elapsed = frameState.time - start;
    const elapsedRatio = elapsed / duration;
    // radius will be 5 at start and 30 at end.
    const radius = easeOut(elapsedRatio) * 25 + 5;
    const opacity = easeOut(1 - elapsedRatio);

    const style = new Style({
      image: new CircleStyle({
        radius: radius,
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, ' + opacity + ')',
          width: 0.25 + opacity
        })
      })
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
    if (elapsed > duration) {
      unByKey(listenerKey);
      return;
    }
    // tell OpenLayers to continue postrender animation
    map.render();
  }
}

source.on('addfeature', function(e) {
  flash(e.feature);
});

window.setInterval(addRandomFeature, 1000);
