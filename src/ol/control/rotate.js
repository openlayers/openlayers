goog.provide('ol.control.Rotate');

goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');


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
ol.control.Rotate = function(opt_options) {

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

  ol.events.listen(button, ol.events.EventType.CLICK,
      ol.control.Rotate.prototype.handleClick_, this);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(button);

  var render = options.render ? options.render : ol.control.Rotate.render;

  this.callResetNorth_ = options.resetNorth ? options.resetNorth : undefined;

  ol.control.Control.call(this, {
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
    this.element.classList.add(ol.css.CLASS_HIDDEN);
  }

};
ol.inherits(ol.control.Rotate, ol.control.Control);


/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.Rotate.prototype.handleClick_ = function(event) {
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
ol.control.Rotate.prototype.resetNorth_ = function() {
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
        easing: ol.easing.easeOut
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
ol.control.Rotate.render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (!frameState) {
    return;
  }
  var rotation = frameState.viewState.rotation;
  if (rotation != this.rotation_) {
    var transform = 'rotate(' + rotation + 'rad)';
    if (this.autoHide_) {
      var contains = this.element.classList.contains(ol.css.CLASS_HIDDEN);
      if (!contains && rotation === 0) {
        this.element.classList.add(ol.css.CLASS_HIDDEN);
      } else if (contains && rotation !== 0) {
        this.element.classList.remove(ol.css.CLASS_HIDDEN);
      }
    }
    this.label_.style.msTransform = transform;
    this.label_.style.webkitTransform = transform;
    this.label_.style.transform = transform;
  }
  this.rotation_ = rotation;
};
