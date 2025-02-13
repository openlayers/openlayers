import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import KML from '../../../../src/ol/format/KML.js';
import LayerGroup from '../../../../src/ol/layer/Group.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import ImageTile from '../../../../src/ol/source/ImageTile.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import {createDefaultStyle} from '../../../../src/ol/style/flat.js';

const lg = new LayerGroup();
const vl = new VectorLayer();

const map = new Map({
  layers: [
    new TileLayer({
      source: new ImageTile({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 100,
      }),
    }),

    lg,

    new WebGLVectorLayer({
      source: new VectorSource({
        url: '/data/2012_Earthquakes_Mag5.kml',
        format: new KML({
          extractStyles: false,
        }),
      }),
      style: createDefaultStyle(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [15180597.9736, 2700366.3807],
    zoom: 2,
  }),
});

map.once('rendercomplete', function () {
  lg.getLayers().push(vl);
  map.renderSync();
  render({
    message:
      "The WebGLVectorLayer shouldn't disappear if the layer group changes",
  });
});
