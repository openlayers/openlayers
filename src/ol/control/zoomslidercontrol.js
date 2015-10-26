// FIXME should possibly show tooltip when dragging?

goog.provide('ol.control.ZoomSlider');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.fx.DragEvent');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.Dragger.EventType');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('ol.Size');
goog.require('ol.ViewHint');
goog.require('ol.animation');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');
goog.require('ol.math');



/**
 * @classdesc
 * A slider type of control for zooming.
 *
 * Example:
 *
 *     map.addControl(new ol.control.ZoomSlider());
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomSliderOptions=} opt_options Zoom slider options.
 * @api stable
 */
ol.control.ZoomSlider = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * Will hold the current resolution of the view.
   *
   * @type {number|undefined}
   * @private
   */
  this.currentResolution_ = undefined;

  /**
   * The direction of the slider. Will be determined from actual display of the
   * container and defaults to ol.control.ZoomSlider.direction.VERTICAL.
   *
   * @type {ol.control.ZoomSlider.direction}
   * @private
   */
  this.direction_ = ol.control.ZoomSlider.direction.VERTICAL;

  /**
   * The calculated thumb size (border box plus margins).  Set when initSlider_
   * is called.
   * @type {ol.Size}
   * @private
   */
  this.thumbSize_ = null;

  /**
   * Whether the slider is initialized.
   * @type {boolean}
   * @private
   */
  this.sliderInitialized_ = false;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration ? options.duration : 200;

  var className = options.className ? options.className : 'ol-zoomslider';
  var thumbElement = goog.dom.createDom('BUTTON', {
    'type': 'button',
    'class': className + '-thumb ' + ol.css.CLASS_UNSELECTABLE
  });
  var containerElement = goog.dom.createDom('DIV',
      [className, ol.css.CLASS_UNSELECTABLE, ol.css.CLASS_CONTROL],
      thumbElement);

  /**
   * @type {goog.fx.Dragger}
   * @private
   */
  this.dragger_ = new goog.fx.Dragger(thumbElement);
  this.registerDisposable(this.dragger_);

  goog.events.listen(this.dragger_, goog.fx.Dragger.EventType.START,
      this.handleDraggerStart_, false, this);
  goog.events.listen(this.dragger_, goog.fx.Dragger.EventType.DRAG,
      this.handleDraggerDrag_, false, this);
  goog.events.listen(this.dragger_, goog.fx.Dragger.EventType.END,
      this.handleDraggerEnd_, false, this);

  goog.events.listen(containerElement, goog.events.EventType.CLICK,
      this.handleContainerClick_, false, this);
  goog.events.listen(thumbElement, goog.events.EventType.CLICK,
      goog.events.Event.stopPropagation);

  var render = options.render ? options.render : ol.control.ZoomSlider.render;

  goog.base(this, {
    element: containerElement,
    render: render
  });
};
goog.inherits(ol.control.ZoomSlider, ol.control.Control);


/**
 * The enum for available directions.
 *
 * @enum {number}
 */
ol.control.ZoomSlider.direction = {
  VERTICAL: 0,
  HORIZONTAL: 1
};


/**
 * @inheritDoc
 */
ol.control.ZoomSlider.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  if (map) {
    map.render();
  }
};


/**
 * Initializes the slider element. This will determine and set this controls
 * direction_ and also constrain the dragging of the thumb to always be within
 * the bounds of the container.
 *
 * @private
 */
ol.control.ZoomSlider.prototype.initSlider_ = function() {
  var container = this.element;
  var containerSize = goog.style.getSize(container);

  var thumb = goog.dom.getFirstElementChild(container);
  var thumbMargins = goog.style.getMarginBox(thumb);
  var thumbBorderBoxSize = goog.style.getBorderBoxSize(thumb);
  var thumbWidth = thumbBorderBoxSize.width +
      thumbMargins.right + thumbMargins.left;
  var thumbHeight = thumbBorderBoxSize.height +
      thumbMargins.top + thumbMargins.bottom;
  this.thumbSize_ = [thumbWidth, thumbHeight];

  var width = containerSize.width - thumbWidth;
  var height = containerSize.height - thumbHeight;

  var limits;
  if (containerSize.width > containerSize.height) {
    this.direction_ = ol.control.ZoomSlider.direction.HORIZONTAL;
    limits = new goog.math.Rect(0, 0, width, 0);
  } else {
    this.direction_ = ol.control.ZoomSlider.direction.VERTICAL;
    limits = new goog.math.Rect(0, 0, 0, height);
  }
  this.dragger_.setLimits(limits);
  this.sliderInitialized_ = true;
};


/**
 * Update the zoomslider element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.ZoomSlider}
 * @api
 */
ol.control.ZoomSlider.render = function(mapEvent) {
  if (!mapEvent.frameState) {
    return;
  }
  goog.asserts.assert(mapEvent.frameState.viewState,
      'viewState should be defined');
  if (!this.sliderInitialized_) {
    this.initSlider_();
  }
  var res = mapEvent.frameState.viewState.resolution;
  if (res !== this.currentResolution_) {
    this.currentResolution_ = res;
    this.setThumbPosition_(res);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.ZoomSlider.prototype.handleContainerClick_ = function(browserEvent) {
  var map = this.getMap();
  var view = map.getView();
  var currentResolution = view.getResolution();
  goog.asserts.assert(currentResolution,
      'currentResolution should be defined');
  map.beforeRender(ol.animation.zoom({
    resolution: currentResolution,
    duration: this.duration_,
    easing: ol.easing.easeOut
  }));
  var relativePosition = this.getRelativePosition_(
      browserEvent.offsetX - this.thumbSize_[0] / 2,
      browserEvent.offsetY - this.thumbSize_[1] / 2);
  var resolution = this.getResolutionForPosition_(relativePosition);
  view.setResolution(view.constrainResolution(resolution));
};


/**
 * Handle dragger start events.
 * @param {goog.fx.DragEvent} event The drag event.
 * @private
 */
ol.control.ZoomSlider.prototype.handleDraggerStart_ = function(event) {
  this.getMap().getView().setHint(ol.ViewHint.INTERACTING, 1);
};


/**
 * Handle dragger drag events.
 *
 * @param {goog.fx.DragEvent} event The drag event.
 * @private
 */
ol.control.ZoomSlider.prototype.handleDraggerDrag_ = function(event) {
  var relativePosition = this.getRelativePosition_(event.left, event.top);
  this.currentResolution_ = this.getResolutionForPosition_(relativePosition);
  this.getMap().getView().setResolution(this.currentResolution_);
};


/**
 * Handle dragger end events.
 * @param {goog.fx.DragEvent} event The drag event.
 * @private
 */
ol.control.ZoomSlider.prototype.handleDraggerEnd_ = function(event) {
  var map = this.getMap();
  var view = map.getView();
  view.setHint(ol.ViewHint.INTERACTING, -1);
  goog.asserts.assert(this.currentResolution_,
      'this.currentResolution_ should be defined');
  map.beforeRender(ol.animation.zoom({
    resolution: this.currentResolution_,
    duration: this.duration_,
    easing: ol.easing.easeOut
  }));
  var resolution = view.constrainResolution(this.currentResolution_);
  view.setResolution(resolution);
};


/**
 * Positions the thumb inside its container according to the given resolution.
 *
 * @param {number} res The res.
 * @private
 */
ol.control.ZoomSlider.prototype.setThumbPosition_ = function(res) {
  var position = this.getPositionForResolution_(res);
  var dragger = this.dragger_;
  var thumb = goog.dom.getFirstElementChild(this.element);

  if (this.direction_ == ol.control.ZoomSlider.direction.HORIZONTAL) {
    var left = dragger.limits.left + dragger.limits.width * position;
    goog.style.setPosition(thumb, left);
  } else {
    var top = dragger.limits.top + dragger.limits.height * position;
    goog.style.setPosition(thumb, dragger.limits.left, top);
  }
};


/**
 * Calculates the relative position of the thumb given x and y offsets.  The
 * relative position scales from 0 to 1.  The x and y offsets are assumed to be
 * in pixel units within the dragger limits.
 *
 * @param {number} x Pixel position relative to the left of the slider.
 * @param {number} y Pixel position relative to the top of the slider.
 * @return {number} The relative position of the thumb.
 * @private
 */
ol.control.ZoomSlider.prototype.getRelativePosition_ = function(x, y) {
  var draggerLimits = this.dragger_.limits;
  var amount;
  if (this.direction_ === ol.control.ZoomSlider.direction.HORIZONTAL) {
    amount = (x - draggerLimits.left) / draggerLimits.width;
  } else {
    amount = (y - draggerLimits.top) / draggerLimits.height;
  }
  return ol.math.clamp(amount, 0, 1);
};


/**
 * Calculates the corresponding resolution of the thumb given its relative
 * position (where 0 is the minimum and 1 is the maximum).
 *
 * @param {number} position The relative position of the thumb.
 * @return {number} The corresponding resolution.
 * @private
 */
ol.control.ZoomSlider.prototype.getResolutionForPosition_ = function(position) {
  var fn = this.getMap().getView().getResolutionForValueFunction();
  return fn(1 - position);
};


/**
 * Determines the relative position of the slider for the given resolution.  A
 * relative position of 0 corresponds to the minimum view resolution.  A
 * relative position of 1 corresponds to the maximum view resolution.
 *
 * @param {number} res The resolution.
 * @return {number} The relative position value (between 0 and 1).
 * @private
 */
ol.control.ZoomSlider.prototype.getPositionForResolution_ = function(res) {
  var fn = this.getMap().getView().getValueForResolutionFunction();
  return 1 - fn(res);
};
