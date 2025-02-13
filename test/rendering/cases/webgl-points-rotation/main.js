import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import KML from '../../../../src/ol/format/KML.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    url: '/data/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false,
    }),
  }),
  style: {
    'icon-src': '/data/icon.png',
    'icon-rotation': Math.PI / 8,
    'icon-rotate-with-view': true,
  },
});

const raster = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
});

// Make a canvas non-squared
const obj = document.getElementById('map');
obj.style.paddingTop = '64px';
obj.style.height = '128px';

new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [15180597.9736, 2700366.3807],
    zoom: 2,
    rotation: Math.PI / 8,
  }),
});

render({
  message: 'Points are rendered as rotated icon within narrow view',
});
