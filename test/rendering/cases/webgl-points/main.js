import KML from '../../../../src/ol/format/KML.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import WebGLPointsLayer from '../../../../src/ol/layer/WebGLPoints.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const vector = new WebGLPointsLayer({
  source: new VectorSource({
    url: '/data/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false,
    }),
  }),
  style: {
    symbol: {
      symbolType: 'square',
      size: 4,
      color: 'white',
    },
  },
});

const raster = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
});

new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [15180597.9736, 2700366.3807],
    zoom: 2,
  }),
});

render({
  message: 'Points are rendered using webgl as 4px pixel squares',
});
