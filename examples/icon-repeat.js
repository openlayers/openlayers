import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import LineString from '../src/ol/geom/LineString.js';
import MultiLineString from '../src/ol/geom/MultiLineString.js';
import MultiPoint from '../src/ol/geom/MultiPoint.js';
import Point from '../src/ol/geom/Point.js';
import Polygon from '../src/ol/geom/Polygon.js';
import Draw from '../src/ol/interaction/Draw.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import CircleStyle from '../src/ol/style/Circle.js';
import Fill from '../src/ol/style/Fill.js';
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
      anchor: [0.5, 1],
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
      rotateWithView: false,
      anchor: [0.5, 1],
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
            [center[0] - 1800000, center[1]],
            [center[0] - 300000, center[1] - 300000],
          ],
          [
            [center[0] + 300000, center[1] - 300000],
            [center[0] + 1800000, center[1] - 50000],
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
          [center[0] - 1800000, center[1] - 300000],
          [center[0] - 300000, center[1] - 800000],
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
          [center[0] + 300000, center[1] - 800000],
          [center[0] + 1300000, center[1] - 300000],
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
      src: 'data/icon.png',
      rotateWithView: true,
      anchor: [0.5, 1],
      placement: 'point',
    }),
  }),
});

// a static linestring with `placement: 'line'` and `rotateWithLine: false`: icons are
// still repeated along the line, but each one keeps the icon's own fixed rotation
// instead of following the line's direction
const lineRotateWithLineFalseLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new LineString([
          [center[0] + 2000000, center[1] - 300000],
          [center[0] + 3500000, center[1] - 800000],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#339999',
      width: 2,
    }),
    image: new Icon({
      src: 'data/icon.png',
      rotateWithView: true,
      placement: 'line',
      repeat: 50,
      anchor: [0.5, 1],
      rotateWithLine: false,
    }),
  }),
});

// a static linestring styled with a `CircleStyle` instead of an `Icon`: `placement` and
// `repeat` work the same way here too, since they live on the shared `ImageStyle` base
// class that `Icon`, `CircleStyle`, and `RegularShape` all extend
const lineCircleLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new LineString([
          [center[0] - 1800000, center[1] - 900000],
          [center[0] - 300000, center[1] - 1100000],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#996633',
      width: 2,
    }),
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({color: '#ff3333'}),
      placement: 'line',
      repeat: 40,
    }),
  }),
});

// a static polygon with `placement: 'line'` and `repeat`: icons repeated around the
// exterior ring only, each rotated to follow that edge's direction
const polygonLineLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new Polygon([
          [
            [center[0] - 1800000, center[1] - 1400000],
            [center[0] - 300000, center[1] - 1400000],
            [center[0] - 300000, center[1] - 1700000],
            [center[0] - 1800000, center[1] - 1700000],
            [center[0] - 1800000, center[1] - 1400000],
          ],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#9966cc',
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

// a static polygon with `placement: 'point'` (the default): a single icon at the
// polygon's own interior point
const polygonPointLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new Polygon([
          [
            [center[0] + 300000, center[1] - 1400000],
            [center[0] + 1800000, center[1] - 1400000],
            [center[0] + 1800000, center[1] - 1700000],
            [center[0] + 300000, center[1] - 1700000],
            [center[0] + 300000, center[1] - 1400000],
          ],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#ff9933',
      width: 2,
    }),
    image: new Icon({
      src: 'data/icon.png',
      rotateWithView: true,
      anchor: [0.5, 1],
      placement: 'point',
    }),
  }),
});

// a static polygon with `placement: 'line'` and `rotateWithLine: false`: icons are
// still repeated around the exterior ring, but each one keeps the icon's own fixed
// rotation instead of following that edge's direction
const polygonRotateWithLineFalseLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature(
        new Polygon([
          [
            [center[0] + 2300000, center[1] - 1400000],
            [center[0] + 3800000, center[1] - 1400000],
            [center[0] + 3800000, center[1] - 1700000],
            [center[0] + 2300000, center[1] - 1700000],
            [center[0] + 2300000, center[1] - 1400000],
          ],
        ]),
      ),
    ],
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#669933',
      width: 2,
    }),
    image: new Icon({
      src: 'data/icon.png',
      rotateWithView: true,
      placement: 'line',
      repeat: 50,
      anchor: [0.5, 1],
      rotateWithLine: false,
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
    lineRotateWithLineFalseLayer,
    lineCircleLayer,
    polygonLineLayer,
    polygonPointLayer,
    polygonRotateWithLineFalseLayer,
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
