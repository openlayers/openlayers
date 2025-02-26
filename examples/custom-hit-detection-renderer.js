import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Circle from '../src/ol/geom/Circle.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Style from '../src/ol/style/Style.js';

const columbusCircleCoords = fromLonLat([-73.98189, 40.76805]);
const labelTextStroke = 'rgba(120, 120, 120, 1)';
const labelText = 'Columbus Circle';

let pointerOverFeature = null;

const renderLabelText = (ctx, x, y, stroke) => {
  ctx.fillStyle = 'rgba(255,0,0,1)';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 30px verdana`;
  ctx.filter = 'drop-shadow(7px 7px 2px #e81)';
  ctx.fillText(labelText, x, y);
  ctx.strokeText(labelText, x, y);
};

const circleFeature = new Feature({
  geometry: new Circle(columbusCircleCoords, 50),
});

circleFeature.set('label-color', labelTextStroke);

circleFeature.setStyle(
  new Style({
    renderer(coordinates, state) {
      const [[x, y], [x1, y1]] = /** @type {Array<Array<number>>} */ (
        coordinates
      );
      const ctx = state.context;
      const dx = x1 - x;
      const dy = y1 - y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      const innerRadius = 0;
      const outerRadius = radius * 1.4;

      const gradient = ctx.createRadialGradient(
        x,
        y,
        innerRadius,
        x,
        y,
        outerRadius,
      );
      gradient.addColorStop(0, 'rgba(255,0,0,0)');
      gradient.addColorStop(0.6, 'rgba(255,0,0,0.2)');
      gradient.addColorStop(1, 'rgba(255,0,0,0.8)');
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,0,0,1)';
      ctx.stroke();

      renderLabelText(ctx, x, y, circleFeature.get('label-color'));
    },
    hitDetectionRenderer(coordinates, state) {
      const [x, y] = /** @type {Array<Array<number>>} */ (coordinates)[0];
      const ctx = state.context;
      renderLabelText(ctx, x, y, circleFeature.get('label-color'));
    },
  }),
);

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      visible: true,
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [circleFeature],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: columbusCircleCoords,
    zoom: 19,
  }),
});

map.on('pointermove', (evt) => {
  const newPointerOverFeature = map.forEachFeatureAtPixel(
    evt.pixel,
    /**
     * @param {Feature<Circle>} feature Feature
     * @return {Feature<Circle>} Found feature
     */
    (feature) => feature,
  );

  if (pointerOverFeature === newPointerOverFeature) {
    return;
  }
  if (pointerOverFeature) {
    pointerOverFeature.set('label-color', labelTextStroke);
  }
  if (newPointerOverFeature) {
    newPointerOverFeature.set('label-color', 'rgba(255,255,255,1)');
  }
  pointerOverFeature = newPointerOverFeature;
});
