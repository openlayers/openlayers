import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MultiLineString from '../src/ol/geom/MultiLineString.js';
import Polygon from '../src/ol/geom/Polygon.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Select from '../src/ol/interaction/Select.js';
import Snap from '../src/ol/interaction/Snap.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {
  fromUserCoordinate,
  getUserProjection,
  useGeographic,
} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style, {createEditingStyle} from '../src/ol/style/Style.js';

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
  setStyle(style) {
    this.modify.getOverlay().setStyle(style);
  }
}

class ExampleDraw {
  constructor(map, source) {
    this.interactions = ['Point', 'LineString', 'Polygon', 'Circle'].reduce(
      (all, type) => {
        const draw = new Draw({
          type,
          source,
        });
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
  setStyle(style) {
    if (this.activeDrawType) {
      this.interactions[this.activeDrawType].getOverlay().setStyle(style);
    }
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

const bearing = function (p1, p2) {
  // p1 ---> p2
  return Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
};

const dist = function (p1, p2) {
  return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
};

const polar = function (pt, dir, dist) {
  return [pt[0] + Math.sin(dir) * dist, pt[1] + Math.cos(dir) * dist];
};

const rotateGeometry = function (geom, rotationPoint, angle) {
  const res = geom.clone();
  const coord = res.flatCoordinates;
  for (let i = 0; i < coord.length; i += res.stride) {
    const d = dist(rotationPoint, [coord[i], coord[i + 1]]);
    const dir = bearing(rotationPoint, [coord[i], coord[i + 1]]) + angle;
    const pt = polar(rotationPoint, dir, d);
    coord[i] = pt[0];
    coord[i + 1] = pt[1];
  }
  return res;
};

const updateStyle = function (e) {
  const projection = map.getView().getProjection();
  const userProjection = getUserProjection();
  const newStyle = function (feature, resolution) {
    const styles = createEditingStyle();
    const color = '#3399cc';
    const stroke = new Stroke({
      width: 2,
      color: color,
    });
    const size = 6 * resolution;
    const [x, y] = fromUserCoordinate(e.vertex, projection);

    let geometry;

    switch (e.snapType) {
      case 'intersection':
        geometry = new MultiLineString([
          [
            [x - size, y - size],
            [x + size, y + size],
          ],
          [
            [x - size, y + size],
            [x + size, y - size],
          ],
        ]);
        break;
      case 'vertex':
        geometry = new Polygon([
          [
            [x - size, y - size],
            [x - size, y + size],
            [x + size, y + size],
            [x + size, y - size],
            [x - size, y - size],
          ],
        ]);
        break;
      case 'edge':
        geometry = rotateGeometry(
          new Polygon([
            [
              [x - size, y - size],
              [x + size, y + size],
              [x - size, y + size],
              [x + size, y - size],
              [x - size, y - size],
            ],
          ]),
          [x, y],
          e.feature.getGeometry().getType() == 'Circle'
            ? bearing(
                [x, y],
                fromUserCoordinate(
                  e.feature.getGeometry().getCenter(),
                  projection,
                ),
              )
            : bearing(
                fromUserCoordinate(e.segment[0], projection),
                fromUserCoordinate(e.segment[1], projection),
              ) +
                Math.PI / 2,
        );
        break;
      case 'midpoint':
        geometry = new Polygon([
          [
            [x, y + size],
            [x - size, y - size * 0.71],
            [x + size, y - size * 0.71],
            [x, y + size],
          ],
        ]);
        break;
      default:
    }
    if (e.type != 'unsnap') {
      styles['Point'] = [
        new Style({
          geometry: userProjection
            ? geometry.transform(projection, userProjection)
            : geometry,
          stroke: stroke,
        }),
      ];
    }
    return styles[feature.getGeometry().getType()];
  };
  exampleDraw.setStyle(newStyle);
  exampleModify.setStyle(newStyle);
};

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
    updateStyle(e);
  });
  map.addInteraction(snap);
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
