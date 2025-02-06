import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

const map = new Map({
  layers: [
    new VectorLayer({
      zIndex: 1,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(255,255,255,0.5)',
          width: 0.75,
        }),
      }),
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
    }),
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        maxZoom: 3,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const unmanaged = new VectorLayer({
  source: new VectorSource({
    features: [new Feature(new Point([0, 0]))],
  }),
});
unmanaged.setMap(map);

render({tolerance: 0.01});
