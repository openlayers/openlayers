import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Draw from '../src/ol/interaction/Draw.js';
import Snap from '../src/ol/interaction/Snap.js';
import Circle from '../src/ol/style/Circle.js';
import Style from '../src/ol/style/Style.js';
import Stroke from '../src/ol/style/Stroke.js';
import Fill from '../src/ol/style/Fill.js';
import Collection from '../src/ol/Collection.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';

const raster = new TileLayer({
  source: new OSM()
});

const baseFeature = new Collection();
baseFeature.push(
  new GeoJSON().readFeature({
    type: 'Polygon',
    coordinates: [[
      [-11500000, 5000000],
      [-12000000, 4500000],
      [-12000000, 5500000],
      [-13000000, 4000000],
      [-11000000, 3000000],
      [-10500000, 3500000],
      [-10000000, 3500000],
      [-10000000, 4000000],
      [-11000000, 4000000],
      [-10000000, 4500000],
      [-10500000, 5500000],
      [-11000000, 5000000],
      [-11500000, 5000000]
    ]]
  })
);


const baseVector = new VectorLayer({
  source: new VectorSource({
    features: baseFeature,
    wrapX: false
  }),
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(100, 255, 0, 1)',
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(100, 255, 0, 0.3)'
    })
  })
});

const source = new VectorSource({wrapX: false});

const vector = new VectorLayer({
  source: source
});


const appendLine = new Collection();
const LineA = new GeoJSON().readFeature({
  type: 'LineString',
  coordinates: [
    [-10000000, 3500000],
    [-10000000, 4000000],
    [-11000000, 4000000],
    [-10000000, 4500000],
    [-10500000, 5500000],
    [-11000000, 5000000],
    [-11500000, 5000000],
    [-12000000, 4500000],
    [-12000000, 5500000]
  ]
});
appendLine.push(LineA);

const LineB = new GeoJSON().readFeature({
  type: 'LineString',
  coordinates: [
    [-13000000, 4000000],
    [-11000000, 3000000],
    [-10500000, 3500000]
  ]
});
appendLine.push(LineB);

const appendHandleFeature = new Collection();
const appendHandle = new GeoJSON().readFeature({
  type: 'Point',
  coordinates: [-10000000, 3500000]
});
appendHandleFeature.push(appendHandle);

const appendHandleB = new GeoJSON().readFeature({
  type: 'Point',
  coordinates: [-13000000, 4000000]
});
appendHandleFeature.push(appendHandleB);

const handleVector = new VectorLayer({
  source: new VectorSource({
    features: appendHandleFeature,
    wrapX: false
  }),
  style: new Style({
    image: new Circle({
      radius: 5,
      fill: new Fill({
        color: 'rgba(100, 0, 255, 1)'
      }),
      stroke: new Stroke({
        color: 'rgba(100, 0, 255, 1)',
        width: 2
      })
    }),
    radius: 7
  })
});

const appendLineVector = new VectorLayer({
  source: new VectorSource({
    features: appendLine,
    wrapX: false
  }),
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(100, 0, 255, 1)',
      width: 2
    })
  })
});

const map = new Map({
  layers: [raster, baseVector, appendLineVector, handleVector, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

let draw; // global so we can remove it later

map.on('click', (event) => {
  let clickedFeature = null;
  map.forEachFeatureAtPixel(
    event.pixel,
    (feature) => {
      clickedFeature = feature;
    }, {
      hitTolerance: 10,
      layerFilter: (layer) => {
        return layer === handleVector;
      }
    }
  );

  if (clickedFeature == appendHandle) {
    // In this demo we remove the new point that was clicked from the drawing,
    // and add the connected feature coordinates:
    draw.removeLastPoint();
    draw.appendCoordinates(LineA.getGeometry().getCoordinates());
  } else if (clickedFeature == appendHandleB) {
    // In this demo we remove the new point that was clicked from the drawing,
    // and add the connected feature coordinates:
    draw.removeLastPoint();
    draw.appendCoordinates(LineB.getGeometry().getCoordinates());
  }
});

const snapInteraction = new Snap({
  source: handleVector.getSource()
});

const typeSelect = document.getElementById('type');

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
