/**
 * @module ol/control/Zoom
 */
import {inherits} from '../index.js';
import _ol_events_ from '../events.js';
import EventType from '../events/EventType.js';
import Control from '../control/Control.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from '../css.js';
import {easeOut} from '../easing.js';

/**
 * @classdesc
 * A control with 2 buttons, one for zoom in and one for zoom out.
 * This control is one of the default controls of a map. To style this control
 * use css selectors `.ol-zoom-in` and `.ol-zoom-out`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomOptions=} opt_options Zoom options.
 * @api
 */
var Zoom = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var className = options.className !== undefined ? options.className : 'ol-zoom';

  var delta = options.delta !== undefined ? options.delta : 1;

  var zoomInLabel = options.zoomInLabel !== undefined ? options.zoomInLabel : '+';
  var zoomOutLabel = options.zoomOutLabel !== undefined ? options.zoomOutLabel : '\u2212';

  var zoomInTipLabel = options.zoomInTipLabel !== undefined ?
    options.zoomInTipLabel : 'Zoom in';
  var zoomOutTipLabel = options.zoomOutTipLabel !== undefined ?
    options.zoomOutTipLabel : 'Zoom out';

  var inElement = document.createElement('button');
  inElement.className = className + '-in';
  inElement.setAttribute('type', 'button');
  inElement.title = zoomInTipLabel;
  inElement.appendChild(
      typeof zoomInLabel === 'string' ? document.createTextNode(zoomInLabel) : zoomInLabel
  );

  _ol_events_.listen(inElement, EventType.CLICK,
      Zoom.prototype.handleClick_.bind(this, delta));

  var outElement = document.createElement('button');
  outElement.className = className + '-out';
  outElement.setAttribute('type', 'button');
  outElement.title = zoomOutTipLabel;
  outElement.appendChild(
      typeof zoomOutLabel === 'string' ? document.createTextNode(zoomOutLabel) : zoomOutLabel
  );

  _ol_events_.listen(outElement, EventType.CLICK,
      Zoom.prototype.handleClick_.bind(this, -delta));

  var cssClasses = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(inElement);
  element.appendChild(outElement);

  Control.call(this, {
    element: element,
    target: options.target
  });

  /**
   * @type {number}
   * @private
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

};

inherits(Zoom, Control);


/**
 * @param {number} delta Zoom delta.
 * @param {Event} event The event to handle
 * @private
 */
Zoom.prototype.handleClick_ = function(delta, event) {
  event.preventDefault();
  this.zoomByDelta_(delta);
};


/**
 * @param {number} delta Zoom delta.
 * @private
 */
Zoom.prototype.zoomByDelta_ = function(delta) {
  var map = this.getMap();
  var view = map.getView();
  if (!view) {
    // the map does not have a view, so we can't act
    // upon it
    return;
  }
  var currentResolution = view.getResolution();
  if (currentResolution) {
    var newResolution = view.constrainResolution(currentResolution, delta);
    if (this.duration_ > 0) {
      if (view.getAnimating()) {
        view.cancelAnimations();
      }
      view.animate({
        resolution: newResolution,
        duration: this.duration_,
        easing: easeOut
      });
    } else {
      view.setResolution(newResolution);
    }
  }
};
export default Zoom;
