import Map from '../src/ol/Map';
import VectorLayer from '../src/ol/layer/Vector';
import VectorSource from '../src/ol/source/Vector';
import GeoJSON from '../src/ol/format/GeoJSON';
import Style from '../src/ol/style/Style';
import Fill from '../src/ol/style/Fill';
import {fromLonLat} from '../src/ol/proj';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {OSM} from '../src/ol/source.js';

/* Places are:
 * London, United Kingdom
 * Porto, Portugal
 * New York, USA
 * Moscow, Russia
 */

/* [longitude, latitude] */
const visitedPlaces = [
  [-0.118092, 51.509865],
  [-8.61099, 41.14961],
  [-73.935242, 40.730610],
  [37.618423, 55.751244]
];

const countriesSource = new VectorSource({
  url: '/data/geojson/countries.geojson',
  format: new GeoJSON()
});

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  }),
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: countriesSource,
      style: new Style({
        fill: new Fill({
          color: '#D4AF37'
        })
      })
    })
  ]
});

countriesSource.once('addfeature', () => {
  visitedPlaces.forEach(place => {
    // Obtain map coordinates from longitude and latitude
    const coordinate = fromLonLat(place);

    // For each feature at coordinate, set its style to an empty object
    // Which will make it invisible
    countriesSource.getFeaturesAtCoordinate(coordinate).forEach(f => {
      f.setStyle(new Style({}));
    });
  });
});

