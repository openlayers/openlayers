import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Control from '../src/ol/control/Control.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

//
// Define rotate to north control.
//

const northArrow =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
  '<path d="M12 2 5 21l7-4z"/>' +
  '<path d="M12 2l7 19-7-4z" opacity=".5"/>' +
  '</svg>';

class RotateNorthControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Rotate to north';
    button.innerHTML = northArrow;

    const element = document.createElement('div');
    element.className = 'rotate-north ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    /**
     * The north arrow, rotated together with the map.
     * @type {SVGElement}
     * @private
     */
    this.arrow_ = button.querySelector('svg');

    /**
     * The rotation the arrow was last rendered with.
     * @type {number|undefined}
     * @private
     */
    this.rotation_ = undefined;

    button.addEventListener('click', this.handleRotateNorth.bind(this), false);
  }

  handleRotateNorth() {
    this.getMap().getView().animate({rotation: 0, duration: 250});
  }

  /**
   * Keep the arrow pointing north, and hide the control when the map is
   * already rotated to north.
   * @param {import("../src/ol/MapEvent.js").default} mapEvent Map event.
   * @override
   */
  render(mapEvent) {
    const frameState = mapEvent.frameState;
    if (!frameState) {
      return;
    }
    const rotation = frameState.viewState.rotation;
    if (rotation !== this.rotation_) {
      this.arrow_.style.transform = 'rotate(' + rotation + 'rad)';
      this.element.classList.toggle('ol-hidden', rotation === 0);
      this.rotation_ = rotation;
    }
  }
}

//
// Create map, giving it a rotate to north control instead of the default
// rotate control.
//

const map = new Map({
  controls: defaultControls({rotate: false}).extend([new RotateNorthControl()]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 3,
    rotation: 1,
  }),
});
