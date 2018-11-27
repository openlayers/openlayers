import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, FullScreen} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';


const view = new View({
  center: [-9101767, 2822912],
  zoom: 14
});

const map = new Map({
  controls: defaultControls().extend([
    new FullScreen()
  ]),
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  target: 'map',
  view: view
});
