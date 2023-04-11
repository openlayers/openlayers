/**
 * Demonstrate stacking with z-index.  Layers and controls
 * can be ordered with z-index, but controls always appear
 * above layers.
 */

import Control from '../../../../src/ol/control/Control.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';

class Element extends Layer {
  constructor(options, style) {
    super(options);

    const element = document.createElement('div');
    element.style.position = 'absolute';
    Object.assign(element.style, style);

    this.element = element;
  }

  getSourceState() {
    return 'ready';
  }

  render() {
    return this.element;
  }

  createRenderer() {
    return {};
  }
}

// elements for stacked controls
const element1 = document.createElement('div');
const style1 = element1.style;
style1.position = 'absolute';
style1.background = 'blue';
style1.width = '25%';
style1.height = '50%';
style1.zIndex = '1';

const element2 = document.createElement('div');
const style2 = element2.style;
style2.position = 'absolute';
style2.background = 'orange';
style2.width = '75%';
style2.height = '25%';
style2.zIndex = '-1';

new Map({
  target: 'map',
  layers: [
    new Element(
      {
        zIndex: 200,
      },
      {
        background: 'red',
        width: '50%',
        height: '100%',
      }
    ),
    new Element(
      {
        zIndex: -200,
      },
      {
        background: 'green',
        width: '100%',
        height: '50%',
      }
    ),
  ],
  controls: [
    new Control({
      element: element1,
    }),
    new Control({
      element: element2,
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render();
