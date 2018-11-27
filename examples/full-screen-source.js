import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, FullScreen} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';


const view = new View({
  center: [-9101767, 2822912],
  zoom: 14
});

const map = new Map({
  controls: defaultControls().extend([
    new FullScreen({
      source: 'fullscreen'
    })
  ]),
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: view
});
