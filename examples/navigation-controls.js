import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, ZoomToExtent} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';


const map = new Map({
  controls: defaultControls().extend([
    new ZoomToExtent({
      extent: [
        813079.7791264898, 5929220.284081122,
        848966.9639063801, 5936863.986909639
      ]
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
