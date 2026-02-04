import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';

const projection = getProjection('EPSG:3857');
const extent = projection.getExtent();
const leftX = extent[0];
const rightX = extent[2];

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      renderBuffer: 0,
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
      style: new Style({
        fill: new Fill({
          color: 'black',
        }),
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [753574.74311, 178419.58796],
    zoom: 0.13333,
  }),
});

render({tolerance: 0.0001});
