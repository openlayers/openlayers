import GeoJSON from '../src/ol/format/GeoJSON.js';
import Graticule from '../src/ol/layer/Graticule.js';
import Map from '../src/ol/Map.js';
import Projection from '../src/ol/proj/Projection.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import proj4 from 'proj4';
import {Fill, Style} from '../src/ol/style.js';
import {register} from '../src/ol/proj/proj4.js';

proj4.defs(
  'ESRI:53009',
  '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +a=6371000 ' +
    '+b=6371000 +units=m +no_defs'
);
register(proj4);

// Configure the Sphere Mollweide projection object with an extent,
// and a world extent. These are required for the Graticule.
const sphereMollweideProjection = new Projection({
  code: 'ESRI:53009',
  extent: [
    -18019909.21177587, -9009954.605703328, 18019909.21177587,
    9009954.605703328,
  ],
  worldExtent: [-179, -89.99, 179, 89.99],
});

const style = new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
});

const map = new Map({
  keyboardEventTarget: document,
  layers: [
    new VectorLayer({
      source: new VectorSource({
        url: 'https://openlayers.org/data/vector/ecoregions.json',
        format: new GeoJSON(),
      }),
      style: function (feature) {
        const color = feature.get('COLOR_BIO') || '#eeeeee';
        style.getFill().setColor(color);
        return style;
      },
    }),
    new Graticule(),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    projection: sphereMollweideProjection,
    zoom: 2,
  }),
});
