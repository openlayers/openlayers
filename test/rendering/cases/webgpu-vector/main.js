import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const vector = new VectorLayer({
    renderer: 'webgpu',
    source: new VectorSource({
      url: '/data/countries.json',
      format: new GeoJSON(),
    }),
    style: {
      'fill-color': '#ddd',
      'stroke-color': '#eee',
      'stroke-width': 2,
    },
  });

  const raster = new TileLayer({
    source: new XYZ({
      url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      transition: 0,
    }),
  });

  const map = new Map({
    layers: [raster, vector],
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!vector.getRenderer()?.helper) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message: 'Countries rendered as grey polygons using WebGPU',
    });
  });
}
