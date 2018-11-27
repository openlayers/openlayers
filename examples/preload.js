import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';


const view = new View({
  center: [-4808600, -2620936],
  zoom: 8
});

const map1 = new Map({
  layers: [
    new TileLayer({
      preload: Infinity,
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  target: 'map1',
  view: view
});

const map2 = new Map({
  layers: [
    new TileLayer({
      preload: 0, // default value
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'AerialWithLabels'
      })
    })
  ],
  target: 'map2',
  view: view
});
