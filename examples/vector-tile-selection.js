import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import Style from '../src/ol/style/Style.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';

// lookup for selection objects
let selection = {};
// feature property to act as identifier
const idProp = 'iso_a3';

const vtLayer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({
    format: new MVT(),
    url: 'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/' +
      'ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf'
  }),
  style: function(feature) {
    // normal style
    let style = new Style({
      stroke: new Stroke({
        color: 'gray',
        width: 1
      }),
      fill: new Fill({
        color: 'rgba(20,20,20,0.9)'
      })
    });
    if (selection[feature.get(idProp)]) {
      // selection style
      style = new Style({
        stroke: new Stroke({
          color: 'rgba(200,20,20,0.8)',
          width: 2
        }),
        fill: new Fill({
          color: 'rgba(200,20,20,0.2)'
        })
      });
    }
    return style;
  }
});

const map = new Map({
  layers: [
    vtLayer
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const selectElement = document.getElementById('type');

map.on('click', updateSelection);

function updateSelection(event) {
  const features = map.getFeaturesAtPixel(event.pixel);
  if (!features) {
    selection = {};
    // force redraw of layer style
    vtLayer.setStyle(vtLayer.getStyleFunction());
    return;
  }
  const feature = features[0];
  const fid = feature.get(idProp);

  if (selectElement.value === 'singleselect') {
    selection = {};
  }
  // add selected feature to lookup
  selection[fid] = feature;

  // force redraw of layer style
  vtLayer.setStyle(vtLayer.getStyleFunction());
}
