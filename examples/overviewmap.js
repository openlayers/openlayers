import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, OverviewMap} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const source = new OSM();
const overviewMapControl = new OverviewMap({
  layers: [
    new TileLayer({
      source: source
    })
  ]
});

const map = new Map({
  controls: defaultControls().extend([
    overviewMapControl
  ]),
  layers: [
    new TileLayer({
      source: source
    })
  ],
  target: 'map',
  view: new View({
    center: [500000, 6000000],
    zoom: 7
  })
});
