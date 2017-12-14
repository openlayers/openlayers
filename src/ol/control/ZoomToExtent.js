/**
 * @module ol/control/ZoomToExtent
 */
import {inherits} from '../index.js';
import _ol_events_ from '../events.js';
import _ol_events_EventType_ from '../events/EventType.js';
import Control from '../control/Control.js';
import _ol_css_ from '../css.js';

/**
 * @classdesc
 * A button control which, when pressed, changes the map view to a specific
 * extent. To style this control use the css selector `.ol-zoom-extent`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomToExtentOptions=} opt_options Options.
 * @api
 */
var ZoomToExtent = function(opt_options) {
  var options = opt_options ? opt_options : {};

  /**
   * @type {ol.Extent}
   * @protected
   */
  this.extent = options.extent ? options.extent : null;

  var className = options.className !== undefined ? options.className :
    'ol-zoom-extent';

  var label = options.label !== undefined ? options.label : 'E';
  var tipLabel = options.tipLabel !== undefined ?
    options.tipLabel : 'Fit to extent';
  var button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(
      typeof label === 'string' ? document.createTextNode(label) : label
  );

  _ol_events_.listen(button, _ol_events_EventType_.CLICK,
      this.handleClick_, this);

  var cssClasses = className + ' ' + _ol_css_.CLASS_UNSELECTABLE + ' ' +
      _ol_css_.CLASS_CONTROL;
  var element = document.createElement('div');
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
  var map = this.getMap();
  var view = map.getView();
  var extent = !this.extent ? view.getProjection().getExtent() : this.extent;
  view.fit(extent);
};
export default ZoomToExtent;
