import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultInteractions} from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';


const map = new Map({
  interactions: defaultInteractions({
    constrainResolution: true, onFocusOnly: true
  }),
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
