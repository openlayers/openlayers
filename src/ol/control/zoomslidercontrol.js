// FIXME should possibly show tooltip when dragging?

goog.provide('ol.control.ZoomSlider');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.fx.DragDropEvent');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.Dragger.EventType');
goog.require('goog.math');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('ol');
goog.require('ol.ViewHint');
goog.require('ol.animation');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');



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

  var options = goog.isDef(opt_options) ? opt_options : {};

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
   * Whether the slider is initialized.
   * @type {boolean}
   * @private
   */
  this.sliderInitialized_ = false;

  var className = goog.isDef(options.className) ?
      options.className : 'ol-zoomslider';
  var thumbElement = goog.dom.createDom(goog.dom.TagName.DIV,
      [className + '-thumb', ol.css.CLASS_UNSELECTABLE]);
  var sliderElement = goog.dom.createDom(goog.dom.TagName.DIV,
      [className, ol.css.CLASS_UNSELECTABLE], thumbElement);

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

  goog.events.listen(sliderElement, goog.events.EventType.CLICK,
      this.handleContainerClick_, false, this);
  goog.events.listen(thumbElement, goog.events.EventType.CLICK,
      goog.events.Event.stopPropagation);

  goog.base(this, {
    element: sliderElement
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
  if (!goog.isNull(map)) {
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
  var container = this.element,
      thumb = goog.dom.getFirstElementChild(container),
      elemSize = goog.style.getContentBoxSize(container),
      thumbBounds = goog.style.getBounds(thumb),
      thumbMargins = goog.style.getMarginBox(thumb),
      thumbBorderBox = goog.style.getBorderBox(thumb),
      w = elemSize.width -
          thumbMargins.left - thumbMargins.right -
          thumbBorderBox.left - thumbBorderBox.right -
          thumbBounds.width,
      h = elemSize.height -
          thumbMargins.top - thumbMargins.bottom -
          thumbBorderBox.top - thumbBorderBox.bottom -
          thumbBounds.height,
      limits;
  if (elemSize.width > elemSize.height) {
    this.direction_ = ol.control.ZoomSlider.direction.HORIZONTAL;
    limits = new goog.math.Rect(0, 0, w, 0);
  } else {
    this.direction_ = ol.control.ZoomSlider.direction.VERTICAL;
    limits = new goog.math.Rect(0, 0, 0, h);
  }
  this.dragger_.setLimits(limits);
  this.sliderInitialized_ = true;
};


/**
 * @inheritDoc
 */
ol.control.ZoomSlider.prototype.handleMapPostrender = function(mapEvent) {
  if (goog.isNull(mapEvent.frameState)) {
    return;
  }
  goog.asserts.assert(
      goog.isDefAndNotNull(mapEvent.frameState.viewState));
  if (!this.sliderInitialized_) {
    this.initSlider_();
  }
  var res = mapEvent.frameState.viewState.resolution;
  if (res !== this.currentResolution_) {
    this.currentResolution_ = res;
    this.positionThumbForResolution_(res);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.ZoomSlider.prototype.handleContainerClick_ = function(browserEvent) {
  var map = this.getMap();
  var view = map.getView();
  var amountDragged = this.amountDragged_(browserEvent.offsetX,
      browserEvent.offsetY);
  var currentResolution = view.getResolution();
  goog.asserts.assert(goog.isDef(currentResolution));
  map.beforeRender(ol.animation.zoom({
    resolution: currentResolution,
    duration: ol.ZOOMSLIDER_ANIMATION_DURATION,
    easing: ol.easing.easeOut
  }));
  var resolution = this.resolutionForAmount_(amountDragged);
  goog.asserts.assert(goog.isDef(resolution));
  view.setResolution(view.constrainResolution(resolution));
};


/**
 * Handle dragger start events.
 * @param {goog.fx.DragDropEvent} event The dragdropevent.
 * @private
 */
ol.control.ZoomSlider.prototype.handleDraggerStart_ = function(event) {
  this.getMap().getView().setHint(ol.ViewHint.INTERACTING, 1);
};


/**
 * Handle dragger drag events.
 *
 * @param {goog.fx.DragDropEvent} event The dragdropevent.
 * @private
 */
ol.control.ZoomSlider.prototype.handleDraggerDrag_ = function(event) {
  var amountDragged = this.amountDragged_(event.left, event.top);
  this.currentResolution_ = this.resolutionForAmount_(amountDragged);
  this.getMap().getView().setResolution(this.currentResolution_);
};


/**
 * Handle dragger end events.
 * @param {goog.fx.DragDropEvent} event The dragdropevent.
 * @private
 */
ol.control.ZoomSlider.prototype.handleDraggerEnd_ = function(event) {
  var map = this.getMap();
  var view = map.getView();
  view.setHint(ol.ViewHint.INTERACTING, -1);
  goog.asserts.assert(goog.isDef(this.currentResolution_));
  map.beforeRender(ol.animation.zoom({
    resolution: this.currentResolution_,
    duration: ol.ZOOMSLIDER_ANIMATION_DURATION,
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
ol.control.ZoomSlider.prototype.positionThumbForResolution_ = function(res) {
  var amount = this.amountForResolution_(res),
      dragger = this.dragger_,
      thumb = goog.dom.getFirstElementChild(this.element);

  if (this.direction_ == ol.control.ZoomSlider.direction.HORIZONTAL) {
    var left = dragger.limits.left + dragger.limits.width * amount;
    goog.style.setPosition(thumb, left);
  } else {
    var top = dragger.limits.top + dragger.limits.height * amount;
    goog.style.setPosition(thumb, dragger.limits.left, top);
  }
};


/**
 * Calculates the amount the thumb has been dragged to allow for calculation
 * of the corresponding resolution.
 *
 * @param {number} x Pixel position relative to the left of the slider.
 * @param {number} y Pixel position relative to the top of the slider.
 * @return {number} The amount the thumb has been dragged.
 * @private
 */
ol.control.ZoomSlider.prototype.amountDragged_ = function(x, y) {
  var draggerLimits = this.dragger_.limits,
      amount = 0;
  if (this.direction_ === ol.control.ZoomSlider.direction.HORIZONTAL) {
    amount = (x - draggerLimits.left) / draggerLimits.width;
  } else {
    amount = (y - draggerLimits.top) / draggerLimits.height;
  }
  return amount;
};


/**
 * Calculates the corresponding resolution of the thumb given its relative
 * position (where 0 is the minimum and 1 is the maximum).
 *
 * @param {number} amount The amount the thumb has been dragged.
 * @return {number} The corresponding resolution.
 * @private
 */
ol.control.ZoomSlider.prototype.resolutionForAmount_ = function(amount) {
  var fn = this.getMap().getView().getResolutionForValueFunction();
  return fn(1 - goog.math.clamp(amount, 0, 1));
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
ol.control.ZoomSlider.prototype.amountForResolution_ = function(res) {
  var fn = this.getMap().getView().getValueForResolutionFunction();
  return 1 - fn(res);
};
