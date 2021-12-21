import KML from '../../../../src/ol/format/KML.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {Heatmap as HeatmapLayer} from '../../../../src/ol/layer.js';

const vector = new HeatmapLayer({
  source: new VectorSource({
    url: '/data/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false,
    }),
  }),
  blur: 3,
  radius: 3,
  opacity: 0.5,
});

vector.getSource().on('addfeature', function (event) {
  const name = event.feature.get('name');
  const magnitude = parseFloat(name.substr(2));
  event.feature.set('weight', magnitude - 5);
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
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message: 'Heatmap layer with opacity renders properly using webgl',
});
