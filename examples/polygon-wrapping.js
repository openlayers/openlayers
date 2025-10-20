import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {fromExtent} from '../src/ol/geom/Polygon.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {get as getProjection} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const proj = getProjection('EPSG:3857');
const extent = proj.getExtent();
const leftX = extent[0];
const rightX = extent[2];

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new VectorLayer({
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      source: new VectorSource({
        features: [
          new Feature(fromExtent([leftX, -15000000, leftX, 15000000])),
          new Feature(
            fromExtent([leftX - 2000000, 4500000, leftX + 4000000, 6500000]),
          ),
          new Feature(
            fromExtent([rightX - 4000000, 7500000, rightX + 2000000, 9500000]),
          ),
        ],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 6000000],
    zoom: 1,
  }),
});
