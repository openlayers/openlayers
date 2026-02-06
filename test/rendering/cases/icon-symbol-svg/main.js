import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Style from '../../../../src/ol/style/Style.js';

const center = fromLonLat([8, 50]);

const vectorSource = new VectorSource();
let feature;

// scales svg correctly
feature = new Feature({
  geometry: new Point(fromLonLat([3, 45])),
});
feature.setStyle(
  new Style({
    image: new Icon({
      src: '/data/me0.svg',
      scale: 2,
    }),
  }),
);
vectorSource.addFeature(feature);

// uses offset correctly
feature = new Feature({
  geometry: new Point(fromLonLat([3, 55])),
});
feature.setStyle(
  new Style({
    image: new Icon({
      src: '/data/me0.svg',
      offset: [16, 0],
      scale: 2,
    }),
  }),
);
vectorSource.addFeature(feature);

// uses offset correctly if it is larger than size
feature = new Feature({
  geometry: new Point(fromLonLat([8, 55])),
});
feature.setStyle(
  new Style({
    image: new Icon({
      src: '/data/me0.svg',
      offsetOrigin: 'bottom-left',
      offset: [16, 0],
      size: [64, 40],
    }),
  }),
);
vectorSource.addFeature(feature);

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      }),
    }),
    new VectorLayer({
      source: vectorSource,
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
  }),
});

render();
