import LineString from '../../../src/ol/geom/LineString.js';
import Point from '../../../src/ol/geom/Point.js';
import Polygon from '../../../src/ol/geom/Polygon.js';
import {toContext} from '../../../src/ol/render.js';
import CircleStyle from '../../../src/ol/style/Circle.js';
import Fill from '../../../src/ol/style/Fill.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import Style from '../../../src/ol/style/Style.js';

const canvas = document.getElementById('canvas');
const vectorContext = toContext(canvas.getContext('2d'), {
  pixelRatio: 1,
  size: [200, 200]
});

vectorContext.setStyle(new Style({
  image: new CircleStyle({
    fill: new Fill({
      color: 'green'
    }),
    radius: 10
  })
}));
vectorContext.drawGeometry(new Point([100, 100]));

vectorContext.setStyle(new Style({
  stroke: new Stroke({
    lineCap: 'butt',
    color: 'red',
    width: 14
  })
}));
vectorContext.drawGeometry(new LineString([
  [10, 60], [30, 40], [50, 60], [70, 40], [90, 60]
]));

vectorContext.setStyle(new Style({
  stroke: new Stroke({
    lineJoin: 'bevel',
    lineCap: 'butt',
    color: '#111',
    width: 14
  })
}));
vectorContext.drawGeometry(new LineString([
  [10, 140], [30, 120], [50, 140], [70, 120], [90, 140]
]));


vectorContext.setStyle(new Style({
  stroke: new Stroke({
    color: 'blue',
    width: 6
  }),
  fill: new Fill({
    color: 'rgba(0,0,255,0.5)'
  })
}));

vectorContext.drawGeometry(new Polygon([
  [[125, 25], [175, 25], [175, 75], [125, 75], [125, 25]],
  [[140, 40], [140, 60], [160, 60], [160, 40], [140, 40]]
]));

vectorContext.setStyle(new Style({
  stroke: new Stroke({
    lineDash: [10, 5],
    lineDashOffset: 5
  })
}));

vectorContext.drawGeometry(new Polygon([
  [[125, 125], [175, 125], [175, 175], [125, 175], [125, 125]],
  [[140, 140], [140, 160], [160, 160], [160, 140], [140, 140]]
]));

render();
