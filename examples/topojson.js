import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TopoJSON from '../src/ol/format/TopoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var raster = new TileLayer({
  source: new TileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-dark.json?secure'
  })
});

var style = new _ol_style_Style_({
  fill: new _ol_style_Fill_({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new _ol_style_Stroke_({
    color: '#319FD3',
    width: 1
  })
});

var vector = new VectorLayer({
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

var map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});
