// FIXME works for View2D only
// FIXME should possibly show tooltip when dragging?
// FIXME should possibly be adjustable by clicking on container

goog.provide('ol.control.ZoomSlider');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.fx.Dragger');
goog.require('goog.style');
goog.require('ol.FrameState');
goog.require('ol.MapEventType');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ZoomSliderOptions} zoomSliderOptions Zoom options.
 */
ol.control.ZoomSlider = function(zoomSliderOptions) {
  // FIXME these should be read out from a map if not given
  // FIXME if not from a map, these at least should be constants
  /**
   * @type {number}
   * @private
   */
  this.maxResolution_ = goog.isDef(zoomSliderOptions.maxResolution) ?
      zoomSliderOptions.maxResolution :
      100000;

  /**
   * @type {number}
   * @private
   */
  this.minResolution_ = goog.isDef(zoomSliderOptions.minResolution) ?
      zoomSliderOptions.minResolution :
      2000;

  goog.asserts.assert(
      this.minResolution_ < this.maxResolution_,
      'minResolution must be smaller than maxResolution.'
  );

  /**
   * @type {number}
   * @private
   */
  this.range_ = this.maxResolution_ - this.minResolution_;

  /**
   * @type {number}
   * @private
   */
  this.currentResolution_;

  /**
   * @type {ol.control.ZoomSlider.direction}
   * @private
   */
  this.direction_ = ol.control.ZoomSlider.direction.HORIZONTAL;

  var elem = this.setupDom_();
  this.dragger_ = this.setupDraggable_(elem);

  // FIXME currently only mockup function
  goog.events.listen(elem, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.onContainerClick_, false, this);

  goog.base(this, {
    element: elem,
    map: zoomSliderOptions.map
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
 * @param {ol.Map} map Map.
 */
ol.control.ZoomSlider.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  this.currentResolution_ = map.getView().getResolution();
  this.initMapEventListeners_();
  this.initSlider_();
  this.positionThumbForResolution_(this.currentResolution_);
};


/**
 * @private
 */
ol.control.ZoomSlider.prototype.initMapEventListeners_ = function() {
  goog.events.listen(this.getMap(), ol.MapEventType.POSTRENDER,
      this.onMapPostRender_, undefined, this);
};


/**
 * @private
 */
ol.control.ZoomSlider.prototype.initSlider_ = function() {
  var container = this.element,
      thumb = goog.dom.getFirstElementChild(container),
      elemBounds = goog.style.getBounds(container),
      elemPaddings = goog.style.getPaddingBox(container),
      elemBorderBox = goog.style.getBorderBox(container),
      thumbBounds = goog.style.getBounds(thumb),
      thumbMargins = goog.style.getMarginBox(thumb),
      thumbBorderBox = goog.style.getBorderBox(thumb),
      w = elemBounds.width -
          elemPaddings.left - elemPaddings.right -
          thumbMargins.left - thumbMargins.right -
          thumbBorderBox.left - thumbBorderBox.right -
          thumbBounds.width,
      h = elemBounds.height -
          elemPaddings.top - elemPaddings.bottom -
          thumbMargins.top - thumbMargins.bottom -
          thumbBorderBox.top - thumbBorderBox.bottom -
          thumbBounds.height,
      limits;
  if (elemBounds.width > elemBounds.height) {
    this.direction_ = ol.control.ZoomSlider.direction.HORIZONTAL;
    limits = new goog.math.Rect(0, 0, w, 0);
  } else {
    this.direction_ = ol.control.ZoomSlider.direction.VERTICAL;
    limits = new goog.math.Rect(0, 0, 0, h);
  }
  this.dragger_.setLimits(limits);
};


/**
 * @param {{frameState:ol.FrameState}} evtObj The evtObj.
 * @private
 */
ol.control.ZoomSlider.prototype.onMapPostRender_ = function(evtObj) {
  var res = evtObj.frameState.view2DState.resolution;
  if (res !== this.currentResolution_) {
    this.currentResolution_ = res;
    this.positionThumbForResolution_(res);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.ZoomSlider.prototype.onContainerClick_ = function(browserEvent) {
  // TODO implement proper resolution calculation according to
  //      browserEvent.clientX / clientY
};


/**
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
 * @param {goog.fx.DragDropEvent} e The dragdropevent.
 * @return {number} The amount the thumb has been dragged.
 * @private
 */
ol.control.ZoomSlider.prototype.amountDragged_ = function(e) {
  var draggerLimits = this.dragger_.limits,
      amount = 0;
  if (this.direction_ === ol.control.ZoomSlider.direction.HORIZONTAL) {
    amount = (e.left - draggerLimits.left) / draggerLimits.width;
  } else {
    amount = (e.top - draggerLimits.top) / draggerLimits.height;
  }
  return amount;
};


/**
 * @param {number} amount The amount the thumb has been dragged.
 * @return {number} a resolution between this.minResolution_ and
 *     this.maxResolution_.
 * @private
 */
ol.control.ZoomSlider.prototype.resolutionForAmount_ = function(amount) {
  var saneAmount = goog.math.clamp(amount, 0, 1);
  return this.minResolution_ + this.range_ * saneAmount;
};


/**
 * @param {number} res The resolution to get the amount for.
 * @return {number} an amount between 0 and 1.
 * @private
 */
ol.control.ZoomSlider.prototype.amountForResolution_ = function(res) {
  var saneRes = goog.math.clamp(res, this.minResolution_, this.maxResolution_);
  return (saneRes - this.minResolution_) / this.range_;
};


/**
 * @param {goog.fx.DragDropEvent} e The dragdropevent.
 * @private
 */
ol.control.ZoomSlider.prototype.onSliderChange_ = function(e) {
  var map = this.getMap(),
      amountDragged = this.amountDragged_(e),
      res = this.resolutionForAmount_(amountDragged);
  if (res !== this.currentResolution_) {
    this.currentResolution_ = res;
    map.getView().setResolution(res);
  }
};


/**
 * @param {Element} elem The element for the slider.
 * @return {goog.fx.Dragger} The actual goog.fx.Dragger instance.
 * @private
 */
ol.control.ZoomSlider.prototype.setupDraggable_ = function(elem) {
  var dragger = new goog.fx.Dragger(elem.childNodes[0]);
  dragger.addEventListener(goog.fx.Dragger.EventType.DRAG, this.onSliderChange_,
      undefined, this);
  dragger.addEventListener(goog.fx.Dragger.EventType.END, this.onSliderChange_,
      undefined, this);
  return dragger;
};


/**
 * @param {Element=} opt_elem The element for the slider.
 * @return {Element} The correctly set up DOMElement.
 * @private
 */
ol.control.ZoomSlider.prototype.setupDom_ = function(opt_elem) {
  var elem,
      sliderCssCls = 'ol-zoomslider ol-unselectable',
      handleCssCls = 'ol-zoomslider-handle ol-unselectable';

  elem = goog.dom.createDom(goog.dom.TagName.DIV, sliderCssCls,
      goog.dom.createDom(goog.dom.TagName.DIV, handleCssCls));

  return elem;
};
