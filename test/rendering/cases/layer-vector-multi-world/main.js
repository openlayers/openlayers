import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Map from '../../../../src/ol/Map.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import Style from '../../../../src/ol/style/Style.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {Projection, addCoordinateTransforms} from '../../../../src/ol/proj.js';
import {fromEPSG4326, toEPSG4326} from '../../../../src/ol/proj/epsg3857.js';

const projection = new Projection({
  code: 'custom',
  units: 'm',
  global: true,
  extent: [-40075016.68557849, -20037508.342789244, 0, 20037508.342789244],
});

addCoordinateTransforms(
  'EPSG:4326',
  projection,
  function (coord) {
    const converted = fromEPSG4326(coord);
    converted[0] -= 20037508.342789244;
    return converted;
  },
  function (coord) {
    return toEPSG4326([coord[0] + 20037508.342789244, coord[1]]);
  }
);

const feature = new Feature({
  geometry: new Polygon([
    [
      [-20037508.342789244, 20037508.342789244],
      [-20037508.342789244, -20037508.342789244],
      [-16037508.342789244, -20037508.342789244],
      [-16037508.342789244, 20037508.342789244],
      [-20037508.342789244, 20037508.342789244],
    ],
  ]),
});

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      renderBuffer: 0,
      source: new VectorSource({
        features: [feature],
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
    projection: projection,
    multiWorld: true,
    maxResolution: 485254.1017841229,
    zoom: 0,
    center: [2000000, 0],
  }),
});

render();
