import CircleStyle from '../../../../src/ol/style/Circle.js';
import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Map from '../../../../src/ol/Map.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const vectorSource = new VectorSource();

let feature;
feature = new Feature({
  geometry: new MultiPoint([[-20, 18]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 2,
      fill: new Fill({
        color: '#91E339',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[-10, 18]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({
        color: '#5447E6',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[4, 18]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#92A8A6',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[-20, 3]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 2,
      fill: new Fill({
        color: '#91E339',
      }),
      stroke: new Stroke({
        color: '#000000',
        width: 1,
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[-10, 3]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({
        color: '#5447E6',
      }),
      stroke: new Stroke({
        color: '#000000',
        width: 2,
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[4, 3]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#92A8A6',
      }),
      stroke: new Stroke({
        color: '#000000',
        width: 3,
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[-20, -15]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 2,
      stroke: new Stroke({
        color: '#256308',
        width: 1,
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[-10, -15]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.3)',
      }),
      stroke: new Stroke({
        color: '#256308',
        width: 2,
      }),
    }),
  })
);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new MultiPoint([[4, -15]]),
});
feature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: 'rgba(235, 45, 70, 0.6)',
      }),
      stroke: new Stroke({
        color: '#256308',
        width: 3,
      }),
    }),
  })
);
vectorSource.addFeature(feature);

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 1,
  }),
});

render();
