import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_ from '../index';
import _ol_control_Control_ from '../control/control';
import _ol_css_ from '../css';
import _ol_easing_ from '../easing';

/**
 * @classdesc
 * A button control to reset rotation to 0.
 * To style this control use css selector `.ol-rotate`. A `.ol-hidden` css
 * selector is added to the button when the rotation is 0.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.RotateOptions=} opt_options Rotate options.
 * @api
 */
var _ol_control_Rotate_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var className = options.className !== undefined ? options.className : 'ol-rotate';

  var label = options.label !== undefined ? options.label : '\u21E7';

  /**
   * @type {Element}
   * @private
   */
  this.label_ = null;

  if (typeof label === 'string') {
    this.label_ = document.createElement('span');
    this.label_.className = 'ol-compass';
    this.label_.textContent = label;
  } else {
    this.label_ = label;
    this.label_.classList.add('ol-compass');
  }

  var tipLabel = options.tipLabel ? options.tipLabel : 'Reset rotation';

  var button = document.createElement('button');
  button.className = className + '-reset';
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(this.label_);

  _ol_events_.listen(button, _ol_events_EventType_.CLICK,
      _ol_control_Rotate_.prototype.handleClick_, this);

  var cssClasses = className + ' ' + _ol_css_.CLASS_UNSELECTABLE + ' ' +
      _ol_css_.CLASS_CONTROL;
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(button);

  var render = options.render ? options.render : _ol_control_Rotate_.render;

  this.callResetNorth_ = options.resetNorth ? options.resetNorth : undefined;

  _ol_control_Control_.call(this, {
    element: element,
    render: render,
    target: options.target
  });

  /**
   * @type {number}
   * @private
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

  /**
   * @type {boolean}
   * @private
   */
  this.autoHide_ = options.autoHide !== undefined ? options.autoHide : true;

  /**
   * @private
   * @type {number|undefined}
   */
  this.rotation_ = undefined;

  if (this.autoHide_) {
    this.element.classList.add(_ol_css_.CLASS_HIDDEN);
  }

};

_ol_.inherits(_ol_control_Rotate_, _ol_control_Control_);


/**
 * @param {Event} event The event to handle
 * @private
 */
_ol_control_Rotate_.prototype.handleClick_ = function(event) {
  event.preventDefault();
  if (this.callResetNorth_ !== undefined) {
    this.callResetNorth_();
  } else {
    this.resetNorth_();
  }
};


/**
 * @private
 */
_ol_control_Rotate_.prototype.resetNorth_ = function() {
  var map = this.getMap();
  var view = map.getView();
  if (!view) {
    // the map does not have a view, so we can't act
    // upon it
    return;
  }
  if (view.getRotation() !== undefined) {
    if (this.duration_ > 0) {
      view.animate({
        rotation: 0,
        duration: this.duration_,
        easing: _ol_easing_.easeOut
      });
    } else {
      view.setRotation(0);
    }
  }
};


/**
 * Update the rotate control element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.Rotate}
 * @api
 */
_ol_control_Rotate_.render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (!frameState) {
    return;
  }
  var rotation = frameState.viewState.rotation;
  if (rotation != this.rotation_) {
    var transform = 'rotate(' + rotation + 'rad)';
    if (this.autoHide_) {
      var contains = this.element.classList.contains(_ol_css_.CLASS_HIDDEN);
      if (!contains && rotation === 0) {
        this.element.classList.add(_ol_css_.CLASS_HIDDEN);
      } else if (contains && rotation !== 0) {
        this.element.classList.remove(_ol_css_.CLASS_HIDDEN);
      }
    }
    this.label_.style.msTransform = transform;
    this.label_.style.webkitTransform = transform;
    this.label_.style.transform = transform;
  }
  this.rotation_ = rotation;
};
export default _ol_control_Rotate_;
