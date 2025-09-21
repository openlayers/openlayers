import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Select from '../src/ol/interaction/Select.js';
import Snap from '../src/ol/interaction/Snap.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromUserCoordinate, useGeographic} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Icon from '../src/ol/style/Icon.js';
import {createEditingStyle} from '../src/ol/style/Style.js';

useGeographic(); //alias for setUserProjection('EPSG:4326')

const optionsForm = document.getElementById('options-form');

const source = new VectorSource();

const map = new Map({
  layers: [
    new TileLayer({source: new OSM()}),
    new VectorLayer({
      source: source,
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
    center: [-89.78, 36.95],
    zoom: 4,
  }),
});

class ExampleModify {
  constructor(map, source, style) {
    this.select = new Select();
    const selectedCollection = this.select.getFeatures();
    this.modify = new Modify({
      features: selectedCollection,
      style,
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
  changed() {
    if (this.modify.getActive()) {
      this.modify.getOverlay().changed();
    }
  }
}

class ExampleDraw {
  constructor(map, source, style) {
    this.interactions = ['Point', 'LineString', 'Polygon', 'Circle'].reduce(
      (all, type) => {
        const draw = new Draw({type, source, style});
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
  changed() {
    if (this.activeDrawType) {
      this.interactions[this.activeDrawType].getOverlay().changed();
    }
  }
}

const bearing = function (p1, p2) {
  // p1 ---> p2
  return Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
};

const styles = createEditingStyle();
const pointStyle = styles['Point'][0];
const icons = {
  intersection: new Icon({src: 'data/intersection.svg'}),
  vertex: new Icon({src: 'data/vertex.svg'}),
  edge: new Icon({src: 'data/edge.svg'}),
  midpoint: new Icon({src: 'data/midpoint.svg'}),
  none: pointStyle.getImage(),
};

const projection = map.getView().getProjection();
let snapEvent;
function styleFunction(feature) {
  const geometryType = feature.getGeometry().getType();
  if (geometryType === 'Point') {
    const snapType = snapEvent?.snapType ?? 'none';
    const icon = icons[snapType];
    if (snapType === 'edge' || snapType === 'midpoint') {
      const geometry = snapEvent.feature.getGeometry();
      const rotation =
        geometry.getType() == 'Circle'
          ? bearing(
              fromUserCoordinate(snapEvent.vertex, projection),
              fromUserCoordinate(geometry.getCenter(), projection),
            ) +
            Math.PI / 2
          : bearing(
              fromUserCoordinate(snapEvent.segment[0], projection),
              fromUserCoordinate(snapEvent.segment[1], projection),
            );
      icon.setRotation(rotation);
    }

    pointStyle.setImage(icon);
  }

  return styles[geometryType];
}

const exampleModify = new ExampleModify(map, source, styleFunction);
const exampleDraw = new ExampleDraw(map, source, styleFunction);
exampleModify.setActive(optionsForm.elements['interaction'] === 'modify');
exampleDraw.setActive(
  optionsForm.elements['interaction'].value === 'draw'
    ? optionsForm.elements['draw-type'].value
    : null,
);

// The Snap interaction must be added after the Modify and Draw interactions
// in order for its map browser event handlers to be fired first.
let snap;
const modifySnapOptions = function () {
  if (snap) {
    map.removeInteraction(snap);
  }
  snap = new Snap({
    source,
    edge: optionsForm.elements['edge'].checked,
    vertex: optionsForm.elements['vertex'].checked,
    intersection: optionsForm.elements['intersection'].checked,
    midpoint: optionsForm.elements['midpoint'].checked,
  });
  snap.on(['snap', 'unsnap'], (e) => {
    snapEvent = e.type === 'snap' ? e : undefined;
  });
  map.addInteraction(snap);

  snapEvent = undefined;
  exampleDraw.changed();
  exampleModify.changed();
};

modifySnapOptions();

/**
 * Let user change the geometry type and different snap types.
 * @param {Event} e Change event.
 */
optionsForm.onchange = function (e) {
  let type = e.target.getAttribute('name');
  if (type == 'draw-type') {
    optionsForm.elements['interaction'].value = 'draw';
    type = 'interaction';
  }
  if (type == 'interaction') {
    const interactionType = e.target.value;
    exampleDraw.setActive(
      interactionType === 'modify'
        ? null
        : optionsForm.elements['draw-type'].value,
    );
    exampleModify.setActive(interactionType === 'modify');
  } else {
    modifySnapOptions();
  }
};
