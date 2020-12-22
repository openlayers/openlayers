import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import Vector from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import WebGLPointsLayer from '../src/ol/layer/WebGLPoints.js';
import {DragBox} from '../src/ol/interaction.js';
import {platformModifierKeyOnly} from '../src/ol/events/condition.js';

const regularStyle = {
  symbol: {
    symbolType: 'circle',
    size: [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      40000,
      8,
      2000000,
      28,
    ],
    color: '#006688',
    rotateWithView: false,
    offset: [0, 0],
    opacity: [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      40000,
      0.6,
      2000000,
      0.92,
    ],
  },
};
// This highlight style uses a filter to show only the points in the provided
// array. The array will be provided based on user drag box interaction.
const highlightStyle = {
  filter: ['in', ['get', 'population'], [0]],
  symbol: {
    symbolType: 'circle',
    size: [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      40000,
      8,
      2000000,
      28,
    ],
    color: '#886600',
    rotateWithView: false,
    offset: [0, 0],
    opacity: [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      40000,
      0.6,
      2000000,
      0.92,
    ],
  },
};

const dragBox = new DragBox({
  condition: platformModifierKeyOnly,
});

const vectorSource = new Vector({
  url: 'data/geojson/world-cities.geojson',
  format: new GeoJSON(),
});

// Create two layers, one for the regular style, one for the highlighted style.
// Both layers use the same source.
const pointsLayer = new WebGLPointsLayer({
  source: vectorSource,
  style: regularStyle,
  disableHitDetection: true,
});
const pointsHighlightLayer = new WebGLPointsLayer({
  source: vectorSource,
  style: highlightStyle,
  disableHitDetection: true,
});

const map = new Map({
  interactions: [dragBox],
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    pointsLayer,
    pointsHighlightLayer,
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

let selectedFeatures = [];

// Use the list of points that fall within the box geometry to provide the
// reference array for the highlight layer filter.
dragBox.on('boxend', function () {
  const extent = dragBox.getGeometry().getExtent();
  vectorSource.forEachFeatureIntersectingExtent(extent, function (feature) {
    selectedFeatures.push(feature.get('population'));
  });
  highlightStyle.filter = ['in', ['get', 'population'], selectedFeatures];
  pointsHighlightLayer.set('style', highlightStyle);
});
dragBox.on('boxstart', function () {
  selectedFeatures = [];
});

function animate() {
  map.render();
  window.requestAnimationFrame(animate);
}
animate();
