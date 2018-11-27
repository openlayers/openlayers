import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TopoJSON from '../src/ol/format/TopoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';


const raster = new TileLayer({
  source: new TileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-dark.json?secure'
  })
});

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1
  })
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/topojson/world-110m.json',
    format: new TopoJSON({
      // don't want to render the full world polygon (stored as 'land' layer),
      // which repeats all countries
      layers: ['countries']
    }),
    overlaps: false
  }),
  style: style
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});
