import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import TileWMS from '../src/ol/source/TileWMS.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {circular as circularPolygon} from '../src/ol/geom/Polygon.js';

const vectorLayer4326 = new VectorLayer({
  source: new VectorSource(),
});

const vectorLayer3857 = new VectorLayer({
  source: new VectorSource(),
});

const map4326 = new Map({
  layers: [
    new TileLayer({
      source: new TileWMS({
        url: 'https://ahocevar.com/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
          'TILED': true,
        },
      }),
    }),
    vectorLayer4326,
  ],
  target: 'map4326',
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2,
  }),
});

const map3857 = new Map({
  layers: [
    new TileLayer({
      source: new TileWMS({
        url: 'https://ahocevar.com/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
          'TILED': true,
        },
      }),
    }),
    vectorLayer3857,
  ],
  target: 'map3857',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const radius = 800000;
let x, y;
for (x = -180; x < 180; x += 30) {
  for (y = -90; y <= 90; y += 30) {
    const circle4326 = circularPolygon([x, y], radius, 64);
    const circle3857 = circle4326.clone().transform('EPSG:4326', 'EPSG:3857');
    vectorLayer4326.getSource().addFeature(new Feature(circle4326));
    vectorLayer3857.getSource().addFeature(new Feature(circle3857));
  }
}
