import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';


const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  view: new View({
    center: [-13553864, 5918250],
    zoom: 11,
    minZoom: 9,
    maxZoom: 13
  })
});
