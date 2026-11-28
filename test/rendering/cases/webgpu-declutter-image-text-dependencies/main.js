import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {setDefaultRenderer} from '../../../../src/ol/renderer.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

setDefaultRenderer('webgpu');

function createLayer(y, imageOptions, textOptions, x = 12) {
  return new VectorLayer({
    declutter: true,
    source: new VectorSource({
      features: [
        new Feature(new Point([-x, y])),
        new Feature(new Point([x, y])),
      ],
    }),
    style: new Style({
      image: new CircleStyle({
        radius: 15,
        fill: new Fill({color: '#0063a7'}),
        ...imageOptions,
      }),
      text: new Text({
        text: '391',
        // no backgroundFill, which the WebGPU renderer does not support yet
        font: '16px sans-serif',
        fill: new Fill({color: '#111'}),
        padding: [2, 2, 2, 2],
        offsetY: 30,
        ...textOptions,
      }),
    }),
  });
}

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const map = new Map({
    target: 'map',
    pixelRatio: 1,
    layers: [
      // The second feature's image collides with the first one. Its text is
      // hidden too, because the image is not optional.
      createLayer(
        60,
        {declutterMode: 'declutter', optional: false},
        {declutterMode: 'obstacle'},
      ),
      // The second feature's text collides with the first one. Its image is
      // hidden too, because the text is not optional.
      createLayer(
        -60,
        {declutterMode: 'obstacle'},
        {declutterMode: 'declutter', optional: false},
      ),
      // The second feature's text collides with the first one. Its image is
      // shown, because the text is optional.
      createLayer(0, {radius: 18}, {text: 'decluttered', optional: true}, 40),
    ],
    view: new View({center: [0, 0], resolution: 1}),
  });

  map.on('rendercomplete', function onComplete() {
    if (!map.getLayers().item(0).getRenderer()?.helper) {
      return;
    }
    map.un('rendercomplete', onComplete);
    setTimeout(() => {
      map.renderSync();
      render({
        message:
          'Decluttering an image or text that is not optional also hides the other one',
      });
    }, 500);
  });
}
