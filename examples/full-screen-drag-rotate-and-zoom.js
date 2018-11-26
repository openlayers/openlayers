import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, FullScreen} from 'ol/control';
import {defaults as defaultInteractions, DragRotateAndZoom} from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';


const map = new Map({
  controls: defaultControls().extend([
    new FullScreen()
  ]),
  interactions: defaultInteractions().extend([
    new DragRotateAndZoom()
  ]),
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  // Use the canvas renderer because it's currently the fastest
  target: 'map',
  view: new View({
    center: [-33519607, 5616436],
    rotation: -Math.PI / 8,
    zoom: 8
  })
});
