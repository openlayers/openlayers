/**
 * @module ol/control/ZoomToExtent
 */
import {inherits} from '../util.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';
import Control from '../control/Control.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from '../css.js';


/**
 * @typedef {Object} Options
 * @property {string} [className='ol-zoom-extent'] Class name.
 * @property {Element|string} [target] Specify a target if you want the control
 * to be rendered outside of the map's viewport.
 * @property {string|Element} [label='E'] Text label to use for the button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string} [tipLabel='Fit to extent'] Text label to use for the button tip.
 * @property {module:ol/extent~Extent} [extent] The extent to zoom to. If undefined the validity
 * extent of the view projection is used.
 */


/**
 * @classdesc
 * A button control which, when pressed, changes the map view to a specific
 * extent. To style this control use the css selector `.ol-zoom-extent`.
 *
 * @constructor
 * @extends {module:ol/control/Control}
 * @param {module:ol/control/ZoomToExtent~Options=} opt_options Options.
 * @api
 */
const ZoomToExtent = function(opt_options) {
  const options = opt_options ? opt_options : {};

  /**
   * @type {module:ol/extent~Extent}
   * @protected
   */
  this.extent = options.extent ? options.extent : null;

  const className = options.className !== undefined ? options.className : 'ol-zoom-extent';

  const label = options.label !== undefined ? options.label : 'E';
  const tipLabel = options.tipLabel !== undefined ? options.tipLabel : 'Fit to extent';
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(
    typeof label === 'string' ? document.createTextNode(label) : label
  );

  listen(button, EventType.CLICK, this.handleClick_, this);

  const cssClasses = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
  const element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(button);

  Control.call(this, {
    element: element,
    target: options.target
  });
};

inherits(ZoomToExtent, Control);


/**
 * @param {Event} event The event to handle
 * @private
 */
ZoomToExtent.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleZoomToExtent();
};


/**
 * @protected
 */
ZoomToExtent.prototype.handleZoomToExtent = function() {
  const map = this.getMap();
  const view = map.getView();
  const extent = !this.extent ? view.getProjection().getExtent() : this.extent;
  view.fit(extent);
};
export default ZoomToExtent;
