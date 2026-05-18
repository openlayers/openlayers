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

const optionsForm = document.getElementById('options-form');

const source = new VectorSource();

const map = new Map({
  layers: [
    new TileLayer({source: new OSM()}),
    new VectorLayer({
      source,
      style: {
        'fill-color': 'rgba(255, 255, 255, 0.2)',
        'stroke-color': '#ffcc33',
        'stroke-width': 2,
        'circle-radius': 7,
        'circle-fill-color': '#ffcc33',
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});

class ExampleModify {
  constructor(map, source) {
    this.select = new Select();
    const selectedCollection = this.select.getFeatures();
    this.modify = new Modify({
      features: selectedCollection,
    });

    this.select.on('change:active', function () {
      selectedCollection.clear();
    });
    source.on('removefeature', (evt) => {
      selectedCollection.remove(evt.feature);
    });

    map.addInteraction(this.select);
    map.addInteraction(this.modify);
  }
  setActive(active) {
    this.select.setActive(active);
    this.modify.setActive(active);
  }
}

class ExampleDraw {
  constructor(map, source) {
    this.interactions = ['Point', 'LineString', 'Polygon', 'Circle'].reduce(
      (all, type) => {
        const draw = new Draw({type, source});
        draw.setActive(false);
        map.addInteraction(draw);
        all[type] = draw;
        return all;
      },
      /** @type {Object<string, Draw>} */ ({}),
    );
  }
  setActive(type) {
    if (this.activeDrawType === type) {
      return;
    }
    if (this.activeDrawType) {
      this.interactions[this.activeDrawType].setActive(false);
    }
    if (type) {
      this.interactions[type].setActive(true);
    }
    this.activeDrawType = type;
  }
}

const exampleModify = new ExampleModify(map, source);
const exampleDraw = new ExampleDraw(map, source);
exampleModify.setActive(optionsForm.elements['interaction'] === 'modify');
exampleDraw.setActive(
  optionsForm.elements['interaction'].value === 'draw'
    ? optionsForm.elements['draw-type'].value
    : null,
);
/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */
optionsForm.onchange = function (e) {
  const type = e.target.getAttribute('name');
  if (type == 'draw-type') {
    optionsForm.elements['interaction'].value = 'draw';
  }
  const interactionType = e.target.value;
  exampleDraw.setActive(
    interactionType === 'modify'
      ? null
      : optionsForm.elements['draw-type'].value,
  );
  exampleModify.setActive(interactionType === 'modify');
};

// The Snap interaction must be added after the Modify and Draw interactions
// in order for its map browser event handlers to be fired first.
const snap = new Snap({
  source,
  intersection: true,
  midpoint: true,
});

const snappedElement = document.getElementById('snapped');
snap.on('snap', (e) => {
  document.getElementById('map').style.cursor = 'grabbing';
  snappedElement.innerHTML = 'Snapped: ' + e.snapType;
});
snap.on('unsnap', () => {
  document.getElementById('map').style.cursor = 'default';
  snappedElement.innerHTML = 'Snapped: false';
});

map.addInteraction(snap);
