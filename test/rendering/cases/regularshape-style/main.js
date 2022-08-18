import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {Icon} from '../../../../src/ol/style.js';

const vectorSource = new VectorSource();
function createFeatures(stroke, fill, offSet = [0, 0], scale = 1) {
  let feature;
  feature = new Feature({
    geometry: new Point([offSet[0], offSet[1]]),
  });
  // square with offset
  feature.setStyle([
    new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 4,
        radius: 10,
        angle: Math.PI / 4,
        displacement: [-15, 15],
        scale: scale,
      }),
    }),
    new Style({
      image: new Icon({
        src: '/data/cross.svg',
        size: [20, 20],
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        displacement: [-15, 15],
        scale: scale,
      }),
    }),
  ]);
  vectorSource.addFeature(feature);

  feature = new Feature({
    geometry: new Point([8 + offSet[0], 15 + offSet[1]]),
  });
  // triangle
  feature.setStyle(
    new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 3,
        radius: 10,
        rotation: Math.PI / 4,
        angle: 0,
      }),
    })
  );
  vectorSource.addFeature(feature);

  feature = new Feature({
    geometry: new Point([-10 + offSet[0], -8 + offSet[1]]),
  });
  // star
  feature.setStyle(
    new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 5,
        radius: 10,
        radius2: 4,
        angle: 0,
      }),
    })
  );
  vectorSource.addFeature(feature);

  feature = new Feature({
    geometry: new Point([12 + offSet[0], -8 + offSet[1]]),
  });
  // cross
  feature.setStyle(
    new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 4,
        radius: 10,
        radius2: 0,
        angle: 0,
      }),
    })
  );
  vectorSource.addFeature(feature);

  feature = new Feature({
    geometry: new Point([8 + offSet[0], 30 + offSet[1]]),
  });
  // rectangle
  feature.setStyle(
    new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        radius: 10 / Math.SQRT2,
        radius2: 10,
        points: 4,
        angle: 0,
        scale: [1, 0.5],
      }),
    })
  );
  vectorSource.addFeature(feature);
}

createFeatures(new Stroke({width: 2}), new Fill({color: 'red'}));
createFeatures(
  new Stroke({
    lineDash: [10, 5],
  }),
  null,
  [50, 50]
);
createFeatures(
  new Stroke({
    lineDash: [10, 5],
    lineDashOffset: 5,
  }),
  null,
  [-50, -50]
);
createFeatures(
  new Stroke({
    lineDash: [10, 5],
  }),
  null,
  [-50, 50],
  1.5
);

createFeatures(new Stroke(), new Fill(), [50, -50]);

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

new Map({
  target: 'map',
  layers: [vectorLayer],
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render();
