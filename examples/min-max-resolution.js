import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileJSON from 'ol/source/TileJSON';


/**
 * Create the map.
 */
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      minResolution: 200,
      maxResolution: 2000
    }),
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy.json?secure',
        crossOrigin: 'anonymous'
      }),
      minResolution: 2000,
      maxResolution: 20000
    })
  ],
  target: 'map',
  view: new View({
    center: [653600, 5723680],
    zoom: 5
  })
});
