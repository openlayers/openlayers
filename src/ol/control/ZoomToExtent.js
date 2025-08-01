/**
 * @module ol/control/ZoomToExtent
 */
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from '../css.js';
import EventType from '../events/EventType.js';
import {fromExtent as polygonFromExtent} from '../geom/Polygon.js';
import {fromUserExtent} from '../proj.js';
import Control from './Control.js';

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-zoom-extent'] Class name.
 * @property {HTMLElement|string} [target] Specify a target if you want the control
 * to be rendered outside of the map's viewport.
 * @property {string|HTMLElement} [label='E'] Text label to use for the button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string} [tipLabel='Fit to extent'] Text label to use for the button tip.
 * @property {import("../extent.js").Extent} [extent] The extent to zoom to. If undefined the validity
 * extent of the view projection is used.
 * @property {import("../View.js").FitOptions} [fitOptions] Options to pass to the view when fitting
 * the extent (e.g. `padding`, `duration`, `minResolution`, `maxZoom`, `easing`, `callback`).
 */

/**
 * @classdesc
 * A button control which, when pressed, changes the map view to a specific
 * extent. To style this control use the css selector `.ol-zoom-extent`.
 *
 * @api
 */
class ZoomToExtent extends Control {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super({
      element: document.createElement('div'),
      target: options.target,
    });

    /**
     * @type {?import("../extent.js").Extent|null}
     * @protected
     */
    this.extent = options.extent ? options.extent : null;

    /**
     * @type {import("../View.js").FitOptions}
     * @protected
     */
    this.fitOptions = options.fitOptions || {};

    const className =
      options.className !== undefined ? options.className : 'ol-zoom-extent';

    const label = options.label !== undefined ? options.label : 'E';
    const tipLabel =
      options.tipLabel !== undefined ? options.tipLabel : 'Fit to extent';
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.title = tipLabel;
    button.appendChild(
      typeof label === 'string' ? document.createTextNode(label) : label,
    );

    button.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this),
      false,
    );

    const cssClasses =
      className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(button);
  }

  /**
   * @param {MouseEvent} event The event to handle
   * @private
   */
  handleClick_(event) {
    event.preventDefault();
    this.handleZoomToExtent();
  }

  /**
   * @protected
   */
  handleZoomToExtent() {
    const map = this.getMap();
    const view = map.getView();
    const extent = !this.extent
      ? view.getProjection().getExtent()
      : fromUserExtent(this.extent, view.getProjection());

    view.fitInternal(polygonFromExtent(extent), this.fitOptions);
  }
}

export default ZoomToExtent;
