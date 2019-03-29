import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import XYZ from '../../../src/ol/source/XYZ';
import {Vector as VectorLayer} from '../../../src/ol/layer';
import VectorSource from '../../../src/ol/source/Vector';
import KML from '../../../src/ol/format/KML';
import WebGLPointsLayerRenderer from '../../../src/ol/renderer/webgl/PointsLayer';

class CustomLayer extends VectorLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, {
      sizeCallback: function() {
        return 4;
      }
    });
  }
}

const vector = new CustomLayer({
  source: new VectorSource({
    url: '/data/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false
    })
  })
});

const raster = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0
  })
});

new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [15180597.9736, 2700366.3807],
    zoom: 2
  })
});

render({
  message: 'Points are rendered using webgl as 4px pixel squares'
});
