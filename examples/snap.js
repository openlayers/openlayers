import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Select from '../src/ol/interaction/Select.js';
import Snap from '../src/ol/interaction/Snap.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const raster = new TileLayer({
  source: new OSM(),
});

const vector = new VectorLayer({
  source: new VectorSource(),
  style: {
    'fill-color': 'rgba(255, 255, 255, 0.2)',
    'stroke-color': '#ffcc33',
    'stroke-width': 2,
    'circle-radius': 7,
    'circle-fill-color': '#ffcc33',
  },
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});

const ExampleModify = {
  init: function () {
    this.select = new Select();
    map.addInteraction(this.select);

    this.modify = new Modify({
      features: this.select.getFeatures(),
    });
    map.addInteraction(this.modify);

    this.setEvents();
  },
  setEvents: function () {
    const selectedFeatures = this.select.getFeatures();

    this.select.on('change:active', function () {
      selectedFeatures.forEach(function (each) {
        selectedFeatures.remove(each);
      });
    });
  },
  setActive: function (active) {
    this.select.setActive(active);
    this.modify.setActive(active);
  },
};
ExampleModify.init();

const optionsForm = document.getElementById('options-form');

const ExampleDraw = {
  init: function () {
    map.addInteraction(this.Point);
    this.Point.setActive(false);
    map.addInteraction(this.LineString);
    this.LineString.setActive(false);
    map.addInteraction(this.Polygon);
    this.Polygon.setActive(false);
    map.addInteraction(this.Circle);
    this.Circle.setActive(false);
  },
  Point: new Draw({
    source: vector.getSource(),
    type: 'Point',
  }),
  LineString: new Draw({
    source: vector.getSource(),
    type: 'LineString',
  }),
  Polygon: new Draw({
    source: vector.getSource(),
    type: 'Polygon',
  }),
  Circle: new Draw({
    source: vector.getSource(),
    type: 'Circle',
  }),
  activeDraw: null,
  setActive: function (active) {
    if (this.activeDraw) {
      this.activeDraw.setActive(false);
      this.activeDraw = null;
    }
    if (active) {
      const type = optionsForm.elements['draw-type'].value;
      this.activeDraw = this[type];
      this.activeDraw.setActive(true);
    }
  },
};
ExampleDraw.init();

/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */
optionsForm.onchange = function (e) {
  const type = e.target.getAttribute('name');
  if (type == 'draw-type') {
    ExampleModify.setActive(false);
    ExampleDraw.setActive(true);
    optionsForm.elements['interaction'].value = 'draw';
  } else if (type == 'interaction') {
    const interactionType = e.target.value;
    if (interactionType == 'modify') {
      ExampleDraw.setActive(false);
      ExampleModify.setActive(true);
    } else if (interactionType == 'draw') {
      ExampleDraw.setActive(true);
      ExampleModify.setActive(false);
    }
  }
};

ExampleDraw.setActive(true);
ExampleModify.setActive(false);

// The snap interaction must be added after the Modify and Draw interactions
// in order for its map browser event handlers to be fired first. Its handlers
// are responsible of doing the snapping.
const snap = new Snap({
  source: vector.getSource(),
  intersection: true,
});

const snappedElement = document.getElementById('snapped');

snap.on('snap', () => {
  document.getElementById('map').style.cursor = 'grabbing';
  snappedElement.innerHTML = 'Snapped: true';
});

snap.on('unsnap', () => {
  document.getElementById('map').style.cursor = 'default';
  snappedElement.innerHTML = 'Snapped: false';
});

map.addInteraction(snap);
