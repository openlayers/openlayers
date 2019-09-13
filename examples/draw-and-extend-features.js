import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Draw from '../src/ol/interaction/Draw.js';
import Snap from '../src/ol/interaction/Snap.js';
import LineString from '../src/ol/geom/LineString';
import Style from '../src/ol/style/Style';
import Stroke from '../src/ol/style/Stroke';
import Collection from '../src/ol/Collection.js';
import GeoJSON from '../src/ol/format/GeoJSON.js'
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';

const raster = new TileLayer({
  source: new OSM()
});

const sampleFeatures = new Collection();
sampleFeatures.push(
  new GeoJSON().readFeature({
    type: 'LineString',
    coordinates: [
      [-12000000, 4600000],
      [-12000000, 4000000],
      [-10000000, 5600000],
      [ -9000000, 3000000],
      [-10000000, 4000000],
      [-11000000, 3000000],
      [-13000000, 4000000],
      [-12000000, 5600000]
    ]
  })
);

const sampleVector = new VectorLayer({
  source: new VectorSource({
    features: sampleFeatures,
    wrapX: false
  }),
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 256, 0, 1)',
      width: 3
    })
  })
});

const source = new VectorSource({wrapX: false});

const vector = new VectorLayer({
  source: source
});

const map = new Map({
  layers: [raster, sampleVector, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

map.on('click', (event) => {
  let clickedFeature = null;
  map.forEachFeatureAtPixel(
    event.pixel,
    (feature, layer) => {
      clickedFeature = feature;
    }, {
      hitTolerance: 10,
      layerFilter: (layer) => {
        return layer === sampleVector
      }
    }
  );
  if (clickedFeature !== null) {
    // In this demo we remove the new point that was clicked,
    // and add the whole feature instead:
    draw.removeLastPoint();
    draw.extend(clickedFeature);
  }
});

const snapInteraction = new Snap({
  source: sampleVector.getSource()
});

const typeSelect = document.getElementById('type');

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    draw = new Draw({
      source: source,
      type: typeSelect.value
    });
    map.addInteraction(draw);
    map.addInteraction(snapInteraction);
  }
}


/**
 * Handle change event.
 */
typeSelect.onchange = function() {
  map.removeInteraction(draw);
  map.removeInteraction(snapInteraction);
  addInteraction();
};

addInteraction();
