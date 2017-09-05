import _ol_ from '../index';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_control_Control_ from '../control/control';
import _ol_css_ from '../css';
import _ol_easing_ from '../easing';

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
var _ol_control_Zoom_ = function(opt_options) {

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

  _ol_events_.listen(inElement, _ol_events_EventType_.CLICK,
      _ol_control_Zoom_.prototype.handleClick_.bind(this, delta));

  var outElement = document.createElement('button');
  outElement.className = className + '-out';
  outElement.setAttribute('type', 'button');
  outElement.title = zoomOutTipLabel;
  outElement.appendChild(
      typeof zoomOutLabel === 'string' ? document.createTextNode(zoomOutLabel) : zoomOutLabel
  );

  _ol_events_.listen(outElement, _ol_events_EventType_.CLICK,
      _ol_control_Zoom_.prototype.handleClick_.bind(this, -delta));

  var cssClasses = className + ' ' + _ol_css_.CLASS_UNSELECTABLE + ' ' +
      _ol_css_.CLASS_CONTROL;
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(inElement);
  element.appendChild(outElement);

  _ol_control_Control_.call(this, {
    element: element,
    target: options.target
  });

  /**
   * @type {number}
   * @private
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

};

_ol_.inherits(_ol_control_Zoom_, _ol_control_Control_);


/**
 * @param {number} delta Zoom delta.
 * @param {Event} event The event to handle
 * @private
 */
_ol_control_Zoom_.prototype.handleClick_ = function(delta, event) {
  event.preventDefault();
  this.zoomByDelta_(delta);
};


/**
 * @param {number} delta Zoom delta.
 * @private
 */
_ol_control_Zoom_.prototype.zoomByDelta_ = function(delta) {
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
        easing: _ol_easing_.easeOut
      });
    } else {
      view.setResolution(newResolution);
    }
  }
};
export default _ol_control_Zoom_;
