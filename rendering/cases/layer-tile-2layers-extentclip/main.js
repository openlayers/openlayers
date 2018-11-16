import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import {fromLonLat} from '../../../src/ol/proj';
import XYZ from '../../../src/ol/source/XYZ';
import {getSize} from '../../../src/ol/extent';

const center = fromLonLat([8.6, 50.1]);

const map = new Map({
  target: 'map',
  view: new View({
    center: center,
    zoom: 3
  })
});

const layerExtent = centerExtent();

map.addLayer(
  new TileLayer({
    source: new XYZ({
      url: '/data/tiles/satellite/{z}/{x}/{y}.jpg'
    }),
    extent: layerExtent
  }),
);

map.addLayer(
  new TileLayer({
    source: new XYZ({
      url: '/data/tiles/stamen-labels/{z}/{x}/{y}.png'
    }),
    extent: layerExtent
  })
);

render();

function centerExtent() {
  const c = map.getView().calculateExtent([256, 256]);
  const qw = getSize(c)[0] / 4;
  const qh = getSize(c)[1] / 4;
  return [c[0] + qw, c[1] + qh, c[2] - qw, c[3] - qh];
}


