import CircleStyle from '../../../src/ol/style/Circle.js';
import Feature from '../../../src/ol/Feature.js';
import Fill from '../../../src/ol/style/Fill.js';
import Map from '../../../src/ol/Map.js';
import Point from '../../../src/ol/geom/Point.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import Style from '../../../src/ol/style/Style.js';
import Text from '../../../src/ol/style/Text.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import View from '../../../src/ol/View.js';

const vectorSource = new VectorSource();
let feature;

// Latin - end (right)
feature = new Feature({
  geometry: new Point([-10, 50]),
});
feature.setStyle(
  new Style({
    text: new Text({
      text: 'Latin',
      font: '24px Ubuntu',
      textAlign: 'end',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
      }),
    }),
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'cyan',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

// Hebrew - start (right)
feature = new Feature({
  geometry: new Point([-10, 0]),
});
feature.setStyle(
  new Style({
    text: new Text({
      text: 'עִברִית',
      font: '24px Ubuntu',
      textAlign: 'start',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
      }),
    }),
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'cyan',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

// Arabic - start (right)
feature = new Feature({
  geometry: new Point([-10, -50]),
});
feature.setStyle(
  new Style({
    text: new Text({
      text: 'عربى',
      font: '24px Ubuntu',
      textAlign: 'start',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
      }),
    }),
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'cyan',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

// Latin - start (left)
feature = new Feature({
  geometry: new Point([10, 50]),
});
feature.setStyle(
  new Style({
    text: new Text({
      text: 'Latin',
      font: '24px Ubuntu',
      textAlign: 'start',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
      }),
    }),
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'cyan',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

// Hebrew - end (left)
feature = new Feature({
  geometry: new Point([10, 0]),
});
feature.setStyle(
  new Style({
    text: new Text({
      text: 'עִברִית',
      font: '24px Ubuntu',
      textAlign: 'end',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
      }),
    }),
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'cyan',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

// Arabic - end (left)
feature = new Feature({
  geometry: new Point([10, -50]),
});
feature.setStyle(
  new Style({
    text: new Text({
      text: 'عربى',
      font: '24px Ubuntu',
      textAlign: 'end',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
      }),
    }),
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'cyan',
      }),
    }),
  })
);
vectorSource.addFeature(feature);

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render({tolerance: 0.01});
