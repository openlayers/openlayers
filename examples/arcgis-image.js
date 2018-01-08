import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import ImageLayer from '../src/ol/layer/Image.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_ImageArcGISRest_ from '../src/ol/source/ImageArcGISRest.js';

var url = 'https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/' +
    'Specialty/ESRI_StateCityHighway_USA/MapServer';

var layers = [
  new TileLayer({
    source: new _ol_source_OSM_()
  }),
  new ImageLayer({
    source: new _ol_source_ImageArcGISRest_({
      ratio: 1,
      params: {},
      url: url
    })
  })
];
var map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
