import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import VectorTile from '../src/ol/layer/VectorTile.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import WebGLVectorTileLayerRenderer from '../src/ol/renderer/webgl/VectorTileLayer.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';

// lookup for selection objects
let selection = {};

const selectedCountry = new Style({
  stroke: new Stroke({
    color: 'rgba(200,20,20,0.8)',
    width: 2,
  }),
  fill: new Fill({
    color: 'rgba(200,20,20,0.4)',
  }),
});

// Custom WebGL Vector Tile Layer
class WebGLVectorTileLayer extends VectorTile {
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      disableHitDetection: false,
      style: {
        'fill-color': 'rgba(20,20,20,0.9)',
        'stroke-color': 'gray',
        'stroke-width': 1,
      },
    });
  }
}

const vtLayer = new WebGLVectorTileLayer({
  source: new VectorTileSource({
    maxZoom: 15,
    format: new MVT({
      idProperty: 'iso_a3',
    }),
    url:
      'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/' +
      'ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
  }),
});

const map = new Map({
  layers: [vtLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    multiWorld: true,
  }),
});

// Selection layer: a canvas-based VectorTileLayer sharing the same source.
// Each tile re-renders on changed(), and the style function highlights every
// instance of the selected feature across all tiles, giving a complete outline.
const selectionLayer = new VectorTileLayer({
  map: map,
  renderMode: 'vector',
  source: vtLayer.getSource(),
  style: function (feature) {
    if (feature.getId() in selection) {
      return selectedCountry;
    }
  },
});

const selectElement = document.getElementById('type');

map.on(['click', 'pointermove'], function (event) {
  if (
    (selectElement.value === 'singleselect-hover' &&
      event.type !== 'pointermove') ||
    (selectElement.value !== 'singleselect-hover' &&
      event.type === 'pointermove')
  ) {
    return;
  }

  const pixel = map.getEventPixel(event.originalEvent);
  const feature = map.forEachFeatureAtPixel(
    pixel,
    function (feature) {
      return feature;
    },
    {
      layerFilter(layer) {
        return layer instanceof WebGLVectorTileLayer;
      },
    },
  );

  if (!feature) {
    selection = {};
    selectionLayer.changed();
    return;
  }

  const fid = feature.getId();
  if (!fid) {
    return;
  }

  if (selectElement.value.startsWith('singleselect')) {
    selection = {};
  }

  // add selected feature to lookup
  selection[fid] = feature;

  selectionLayer.changed();
});
