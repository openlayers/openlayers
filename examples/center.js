import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from '../src/ol/style.js';

const source = new VectorSource({
  url: 'data/geojson/switzerland.geojson',
  format: new GeoJSON()
});
const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1
  }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new Stroke({
      color: '#319FD3',
      width: 1
    })
  })
});
const vectorLayer = new VectorLayer({
  source: source,
  style: style
});
const view = new View({
  center: [0, 0],
  zoom: 1
});
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    vectorLayer
  ],
  target: 'map',
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: view
});

const zoomtoswitzerlandbest = document.getElementById('zoomtoswitzerlandbest');
zoomtoswitzerlandbest.addEventListener('click', function() {
  const feature = source.getFeatures()[0];
  const polygon = /** @type {module:ol/geom/SimpleGeometry~SimpleGeometry} */ (feature.getGeometry());
  view.fit(polygon, {padding: [170, 50, 30, 150], constrainResolution: false});
}, false);

const zoomtoswitzerlandconstrained =
    document.getElementById('zoomtoswitzerlandconstrained');
zoomtoswitzerlandconstrained.addEventListener('click', function() {
  const feature = source.getFeatures()[0];
  const polygon = /** @type {module:ol/geom/SimpleGeometry~SimpleGeometry} */ (feature.getGeometry());
  view.fit(polygon, {padding: [170, 50, 30, 150]});
}, false);

const zoomtoswitzerlandnearest =
    document.getElementById('zoomtoswitzerlandnearest');
zoomtoswitzerlandnearest.addEventListener('click', function() {
  const feature = source.getFeatures()[0];
  const polygon = /** @type {module:ol/geom/SimpleGeometry~SimpleGeometry} */ (feature.getGeometry());
  view.fit(polygon, {padding: [170, 50, 30, 150], nearest: true});
}, false);

const zoomtolausanne = document.getElementById('zoomtolausanne');
zoomtolausanne.addEventListener('click', function() {
  const feature = source.getFeatures()[1];
  const point = /** @type {module:ol/geom/SimpleGeometry~SimpleGeometry} */ (feature.getGeometry());
  view.fit(point, {padding: [170, 50, 30, 150], minResolution: 50});
}, false);

const centerlausanne = document.getElementById('centerlausanne');
centerlausanne.addEventListener('click', function() {
  const feature = source.getFeatures()[1];
  const point = /** @type {module:ol/geom/Point~Point} */ (feature.getGeometry());
  const size = /** @type {module:ol/size~Size} */ (map.getSize());
  view.centerOn(point.getCoordinates(), size, [570, 500]);
}, false);
