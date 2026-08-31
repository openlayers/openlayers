import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorImageLayer from '../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

const source = new VectorSource();

const gridStyle = new Style({
  stroke: new Stroke({color: '#333333', width: 1}),
});
for (let i = -100; i <= 100; i += 25) {
  const horizontal = new Feature(
    new LineString([
      [-100, i],
      [100, i],
    ]),
  );
  horizontal.setStyle(gridStyle);
  source.addFeature(horizontal);
  const vertical = new Feature(
    new LineString([
      [i, -100],
      [i, 100],
    ]),
  );
  vertical.setStyle(gridStyle);
  source.addFeature(vertical);
}

[
  {coordinate: [-50, 50], text: 'A'},
  {coordinate: [50, 50], text: 'B'},
  {coordinate: [0, -50], text: 'C'},
].forEach(({coordinate, text}) => {
  const feature = new Feature(new Point(coordinate));
  feature.setStyle(
    new Style({
      image: new RegularShape({
        points: 4,
        radius: 12,
        angle: Math.PI / 4,
        fill: new Fill({color: 'rgba(51, 153, 204, 0.5)'}),
        stroke: new Stroke({color: '#3399cc', width: 1}),
      }),
      text: new Text({
        font: 'bold 16px Ubuntu',
        text: text,
        offsetY: -20,
        fill: new Fill({color: '#000000'}),
        stroke: new Stroke({color: '#ffffff', width: 2}),
      }),
    }),
  );
  source.addFeature(feature);
});

new Map({
  pixelRatio: 1,
  layers: [
    new VectorImageLayer({
      source: source,
      rotateContent: true,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    rotation: Math.PI / 7,
  }),
});

render({tolerance: 0.01});
