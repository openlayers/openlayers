import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, ScaleLine} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';


const scaleLineControl = new ScaleLine();

const map = new Map({
  controls: defaultControls().extend([
    scaleLineControl
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


const unitsSelect = document.getElementById('units');
function onChange() {
  scaleLineControl.setUnits(unitsSelect.value);
}
unitsSelect.addEventListener('change', onChange);
onChange();
