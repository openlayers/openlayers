import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultInteractions, PinchZoom} from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';


const map = new Map({
  interactions: defaultInteractions({pinchZoom: false}).extend([
    new PinchZoom({
      constrainResolution: true // force zooming to a integer zoom
    })
  ]),
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
