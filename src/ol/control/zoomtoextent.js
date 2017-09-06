import _ol_ from '../index';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_control_Control_ from '../control/control';
import _ol_css_ from '../css';

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
var _ol_control_ZoomToExtent_ = function(opt_options) {
  var options = opt_options ? opt_options : {};

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = options.extent ? options.extent : null;

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

  _ol_control_Control_.call(this, {
    element: element,
    target: options.target
  });
};

_ol_.inherits(_ol_control_ZoomToExtent_, _ol_control_Control_);


/**
 * @param {Event} event The event to handle
 * @private
 */
_ol_control_ZoomToExtent_.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleZoomToExtent_();
};


/**
 * @private
 */
_ol_control_ZoomToExtent_.prototype.handleZoomToExtent_ = function() {
  var map = this.getMap();
  var view = map.getView();
  var extent = !this.extent_ ? view.getProjection().getExtent() : this.extent_;
  view.fit(extent);
};
export default _ol_control_ZoomToExtent_;
