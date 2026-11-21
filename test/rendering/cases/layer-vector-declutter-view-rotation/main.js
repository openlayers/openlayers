import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Style from '../../../../src/ol/style/Style.js';

// 100 x 16 px boxes that stay upright on screen (rotateWithView: false) on a
// view rotated by 45 degrees. Decluttering has to happen in screen space.
const rotation = Math.PI / 4;

const img = document.createElement('canvas');
img.width = 100;
img.height = 16;
const context = img.getContext('2d');
context.fillStyle = 'rgba(0, 0, 255, 0.5)';
context.fillRect(0, 0, 100, 16);
context.strokeStyle = 'black';
context.strokeRect(0.5, 0.5, 99, 15);

const style = new Style({
  image: new Icon({
    img: img,
    rotateWithView: false,
  }),
});

// Place features at screen offsets (in pixels, y down) from the center.
function atScreenOffset(dx, dy) {
  const x = dx;
  const y = -dy;
  // Positive view rotation is clockwise, so undo it with a clockwise rotation.
  return new Point([
    x * Math.cos(rotation) - y * Math.sin(rotation),
    x * Math.sin(rotation) + y * Math.cos(rotation),
  ]);
}

const source = new VectorSource({
  features: [
    // 90 px apart horizontally: they overlap on screen, so one is hidden.
    new Feature(atScreenOffset(-45, -60)),
    new Feature(atScreenOffset(45, -60)),
    // 20 px apart vertically: they do not overlap on screen, so both are shown.
    new Feature(atScreenOffset(0, 30)),
    new Feature(atScreenOffset(0, 50)),
  ],
});

new Map({
  pixelRatio: 1,
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    rotation: rotation,
  }),
  layers: [
    new VectorLayer({
      declutter: true,
      source: source,
      style: style,
    }),
  ],
});

render();
