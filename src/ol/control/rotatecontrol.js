goog.provide('ol.control.Rotate');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('ol.animation');
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
 * @api stable
 */
ol.control.Rotate = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var className = goog.isDef(options.className) ?
      options.className : 'ol-rotate';

  /**
   * @type {Element}
   * @private
   */
  this.label_ = goog.dom.createDom(goog.dom.TagName.SPAN,
      'ol-compass', goog.isDef(options.label) ? options.label : '\u21E7');

  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Reset rotation';

  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': className + '-reset',
    'type' : 'button',
    'title': tipLabel
  }, this.label_);

  goog.events.listen(button, goog.events.EventType.CLICK,
      ol.control.Rotate.prototype.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, button);

  var render = goog.isDef(options.render) ?
      options.render : ol.control.Rotate.render;

  goog.base(this, {
    element: element,
    render: render,
    target: options.target
  });

  /**
   * @type {number}
   * @private
   */
  this.duration_ = goog.isDef(options.duration) ? options.duration : 250;

  /**
   * @type {boolean}
   * @private
   */
  this.autoHide_ = goog.isDef(options.autoHide) ? options.autoHide : true;

  /**
   * @private
   * @type {number|undefined}
   */
  this.rotation_ = undefined;

  if (this.autoHide_) {
    goog.dom.classlist.add(this.element, ol.css.CLASS_HIDDEN);
  }

};
goog.inherits(ol.control.Rotate, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} event The event to handle
 * @private
 */
ol.control.Rotate.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.resetNorth_();
};


/**
 * @private
 */
ol.control.Rotate.prototype.resetNorth_ = function() {
  var map = this.getMap();
  var view = map.getView();
  if (goog.isNull(view)) {
    // the map does not have a view, so we can't act
    // upon it
    return;
  }
  var currentRotation = view.getRotation();
  while (currentRotation < -Math.PI) {
    currentRotation += 2 * Math.PI;
  }
  while (currentRotation > Math.PI) {
    currentRotation -= 2 * Math.PI;
  }
  if (goog.isDef(currentRotation)) {
    if (this.duration_ > 0) {
      map.beforeRender(ol.animation.rotate({
        rotation: currentRotation,
        duration: this.duration_,
        easing: ol.easing.easeOut
      }));
    }
    view.setRotation(0);
  }
};


/**
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.Rotate}
 * @api
 */
ol.control.Rotate.render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    return;
  }
  var rotation = frameState.viewState.rotation;
  if (rotation != this.rotation_) {
    var transform = 'rotate(' + goog.math.toDegrees(rotation) + 'deg)';
    if (this.autoHide_) {
      goog.dom.classlist.enable(
          this.element, ol.css.CLASS_HIDDEN, rotation === 0);
    }
    this.label_.style.msTransform = transform;
    this.label_.style.webkitTransform = transform;
    this.label_.style.transform = transform;
  }
  this.rotation_ = rotation;
};
