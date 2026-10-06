import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import LineString from '../src/ol/geom/LineString.js';
import MultiLineString from '../src/ol/geom/MultiLineString.js';
import MultiPoint from '../src/ol/geom/MultiPoint.js';
import Point from '../src/ol/geom/Point.js';
import Draw from '../src/ol/interaction/Draw.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Icon from '../src/ol/style/Icon.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const center = [-11000000, 4600000];

const raster = new TileLayer({
  source: new OSM(),
});

// a single icon at a point, using the default `placement: 'point'`
const pointLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(new Point([center[0] - 1500000, center[1] + 1200000])),
    ],
  }),
  style: new Style({
    image: new Icon({
      src: 'data/icon.png',
      rotateWithView: true,
    }),
  }),
});

// several icons at once, still using the default `placement: 'point'`
const multiPointLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new MultiPoint([
          [center[0] + 1300000, center[1] + 1200000],
          [center[0] + 1800000, center[1] + 900000],
          [center[0] + 1500000, center[1] + 1600000],
        ]),
      ),
    ],
  }),
  style: new Style({
    image: new Icon({
      src: 'data/icon.png',
      rotateWithView: true,
      rotation: Math.PI / 4,
    }),
  }),
});

// a static multi-line string: each sub-line gets its own repeated, rotated icons
const multiLineStringLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new MultiLineString([
          [
            [center[0] - 1800000, center[1] - 1200000],
            [center[0] - 300000, center[1] - 1500000],
          ],
          [
            [center[0] + 300000, center[1] - 1500000],
            [center[0] + 1800000, center[1] - 800000],
          ],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#3399cc',
      width: 2,
    }),
    image: new Icon({
      src: 'data/arrow.png',
      rotateWithView: true,
      placement: 'line',
      repeat: 50,
    }),
  }),
});

// a static linestring with `placement: 'line'` but no `repeat`: a single centered icon
const lineNoRepeatLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new LineString([
          [center[0] - 1800000, center[1] - 1700000],
          [center[0] - 300000, center[1] - 2000000],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#33cc66',
      width: 2,
    }),
    image: new Icon({
      src: 'data/arrow.png',
      rotateWithView: true,
      placement: 'line',
    }),
  }),
});

// a static linestring with `placement: 'point'` (the default): a single icon at the
// line's own midpoint, with no line-following rotation (just the icon's own `rotation`)
const linePointPlacementLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new LineString([
          [center[0] + 300000, center[1] - 2000000],
          [center[0] + 1300000, center[1] - 1500000],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#cc3366',
      width: 2,
    }),
    image: new Icon({
      src: 'data/arrow.png',
      rotateWithView: true,
      placement: 'point',
    }),
  }),
});

// draw your own line string to see the icon repeated and rotated along it
const lineStringSource = new VectorSource();
const lineStringLayer = new VectorLayer({
  source: lineStringSource,
  style: new Style({
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2,
    }),
    image: new Icon({
      src: 'data/arrow.png',
      rotateWithView: true,
      placement: 'line',
      repeat: 50,
    }),
  }),
});

const map = new Map({
  layers: [
    raster,
    pointLayer,
    multiPointLayer,
    multiLineStringLayer,
    lineNoRepeatLayer,
    linePointPlacementLayer,
    lineStringLayer,
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 4,
  }),
});

map.addInteraction(
  new Draw({
    source: lineStringSource,
    type: 'LineString',
  }),
);
