import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import Feature from '../../../src/ol/Feature.js';
import Polygon from '../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Style from '../../../src/ol/style/Style.js';
import Fill from '../../../src/ol/style/Fill.js';
import Stroke from '../../../src/ol/style/Stroke.js';

const vectorSource = new VectorSource();
let feature;

// rectangle with 1 hole
feature = new Feature({
  geometry: new Polygon([
    [[-102.5, 75], [-102.5, 115], [-42.5, 115], [-42.5, 75], [-102.5, 75]],
    [[-82.5, 87], [-62.5, 87], [-62.5, 103], [-82.5, 103], [-82.5, 87]]
  ])
});

feature.setStyle(new Style({
  stroke: new Stroke({
    width: 4,
    color: '#000',
    lineJoin: 'round',
    lineCap: 'butt'
  })
}));
vectorSource.addFeature(feature);

// rectangle with 2 holes
feature = new Feature({
  geometry: new Polygon([
    [[-117.5, 47.5], [-117.5, 97.5], [-47.5, 97.5], [-47.5, 47.5], [-117.5, 47.5]],
    [[-113.5, 51.5], [-101.5, 51.5], [-101.5, 63.5], [-113.5, 63.5], [-113.5, 51.5]],
    [[-67.5, 51.5], [-53.5, 51.5], [-53.5, 63.5], [-67.5, 63.5], [-67.5, 51.5]]
  ])
});

feature.setStyle(new Style({
  zIndex: -1,
  fill: new Fill({
    color: '#1A5E42'
  }),
  stroke: new Stroke({
    color: '#9696EB',
    width: 3
  })
}));
vectorSource.addFeature(feature);


// rectangle with 1 hole
feature = new Feature({
  geometry: new Polygon([
    [[-22.5, -5], [-22.5, 35], [37.5, 35], [37.5, -5], [-22.5, -5]],
    [[-2.5, 7], [17.5, 7], [17.5, 23], [-2.5, 23], [-2.5, 7]]
  ])
});
feature.setStyle(new Style({
  stroke: new Stroke({
    width: 3,
    color: '#777',
    lineDash: [2, 4]
  })
}));
vectorSource.addFeature(feature);

// rectangle with 2 holes
feature = new Feature({
  geometry: new Polygon([
    [[-37.5, -32.5], [-37.5, 17.5], [32.5, 17.5], [32.5, -32.5], [-37.5, -32.5]],
    [[-33.5, -28.5], [-21.5, -28.5], [-21.5, -16.5], [-33.5, -16.5], [-33.5, -28.5]],
    [[12.5, -28.5], [26.5, -28.5], [26.5, -16.5], [12.5, -16.5], [12.5, -28.5]]
  ])
});
feature.setStyle(new Style({
  fill: new Fill({
    color: 'rgba(255, 0, 0, 0.85)'
  })
}));
vectorSource.addFeature(feature);


new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1
  })
});

render();
