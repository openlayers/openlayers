import Geolocation from 'ol/Geolocation';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';


const view = new View({
  center: [0, 0],
  zoom: 2
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Road'
      })
    })
  ],
  target: 'map',
  view: view
});

const geolocation = new Geolocation({
  projection: view.getProjection(),
  tracking: true
});
geolocation.once('change:position', function() {
  view.setCenter(geolocation.getPosition());
  view.setResolution(2.388657133911758);
});
