import ImageSource from '../src/ol/source/Image.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import View from '../src/ol/View.js';
import proj4 from 'proj4';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {createLoader} from '../src/ol/source/static.js';
import {getCenter} from '../src/ol/extent.js';
import {register} from '../src/ol/proj/proj4.js';
import {svgLoad} from '../src/ol/Image.js';
import {transform} from '../src/ol/proj.js';

proj4.defs(
  'EPSG:27700',
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs'
);
register(proj4);

const imageExtent = [0, 0, 700000, 1300000];
const imageLayer = new ImageLayer();

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    imageLayer,
  ],
  target: 'map',
  view: new View({
    center: transform(getCenter(imageExtent), 'EPSG:27700', 'EPSG:3857'),
    zoom: 4,
  }),
});

const interpolate = document.getElementById('interpolate');

function setSource() {
  const source = new ImageSource({
    loader: createLoader({
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/British_National_Grid.svg',
      crossOrigin: '',
      imageExtent: imageExtent,
      load: svgLoad,
    }),
    projection: 'EPSG:27700',
    interpolate: interpolate.checked,
  });
  imageLayer.setSource(source);
}
setSource();

interpolate.addEventListener('change', setSource);
