import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {click, pointerMove, altKeyOnly} from '../src/ol/events/condition.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Select from '../src/ol/interaction/Select.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const raster = new TileLayer({
  source: new OSM()
});

const selection = new VectorLayer({
  style: new Style({
    fill: new Fill({
      color: [255, 255, 255, 0.5]
    }),
    stroke: new Stroke({
      color: [255, 153, 0, 1],
      width: 3
    })
  }),
  source: new VectorSource({
    useSpatialIndex: false,
    features: null
  }),
  updateWhileAnimating: true,
  updateWhileInteracting: true
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  })
});

const map = new Map({
  layers: [raster, selection, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

let select = null; // ref to currently selected interaction

// select interaction working on "singleclick"
const selectSingleClick = new Select();

// select interaction working on "click"
const selectClick = new Select({
  condition: click
});

// select interaction working on "pointermove"
const selectPointerMove = new Select({
  condition: pointerMove
});

const selectAltClick = new Select({
  condition: function(mapBrowserEvent) {
    return click(mapBrowserEvent) && altKeyOnly(mapBrowserEvent);
  }
});

const selectFeatureOverlay = new Select({
  featureOverlay: selection
});

const selectElement = document.getElementById('type');

const changeInteraction = function() {
  if (select !== null) {
    map.removeInteraction(select);
  }
  const value = selectElement.value;
  if (value == 'singleclick') {
    select = selectSingleClick;
  } else if (value == 'click') {
    select = selectClick;
  } else if (value == 'pointermove') {
    select = selectPointerMove;
  } else if (value == 'altclick') {
    select = selectAltClick;
  } else if (value == 'featureoverlay') {
    select = selectFeatureOverlay;
  } else {
    select = null;
  }
  if (select !== null) {
    map.addInteraction(select);
    select.on('select', function(e) {
      document.getElementById('status').innerHTML = '&nbsp;' +
          e.target.getFeatures().getLength() +
          ' selected features (last operation selected ' + e.selected.length +
          ' and deselected ' + e.deselected.length + ' features)';
    });
  }
};


/**
 * onchange callback on the select element.
 */
selectElement.onchange = changeInteraction;
changeInteraction();
