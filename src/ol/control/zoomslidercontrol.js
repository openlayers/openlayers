// FIXME works for View2D only
// FIXME should possibly show tooltip when dragging?
// FIXME should possibly be adjustable by clicking on container

goog.provide('ol.control.ZoomSlider');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.Dragger.EventType');
goog.require('goog.math');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('ol.animation');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');


/**
 * @define {number} Animation duration.
 */
ol.control.ZOOMSLIDER_ANIMATION_DURATION = 200;



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ZoomSliderOptions=} opt_options Zoom slider options.
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
   * @private
   * @type {Array.<?number>}
   */
  this.draggerListenerKeys_ = null;

  var className = goog.isDef(options.className) ?
      options.className : 'ol-zoomslider';
  var sliderCssCls = className + ' ' + ol.css.CLASS_UNSELECTABLE;
  var thumbCssCls = className + '-thumb' + ' ' + ol.css.CLASS_UNSELECTABLE;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, sliderCssCls,
      goog.dom.createDom(goog.dom.TagName.DIV, thumbCssCls));

  this.dragger_ = this.createDraggable_(element);

  // FIXME currently only a do nothing function is bound.
  goog.events.listen(element, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleContainerClick_, false, this);

  goog.base(this, {
    element: element,
    map: options.map
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
  this.initSlider_();
  var resolution = map.getView().getView2D().getResolution();
  if (goog.isDef(resolution)) {
    this.currentResolution_ = resolution;
    this.positionThumbForResolution_(resolution);
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
};


/**
 * @inheritDoc
 */
ol.control.ZoomSlider.prototype.handleMapPostrender = function(mapEvent) {
  var res = mapEvent.frameState.view2DState.resolution;
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
  // TODO implement proper resolution calculation according to browserEvent
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
 * Calculates the corresponding resolution of the thumb by the amount it has
 * been dragged from its minimum.
 *
 * @param {number} amount The amount the thumb has been dragged.
 * @return {number} The corresponding resolution.
 * @private
 */
ol.control.ZoomSlider.prototype.resolutionForAmount_ = function(amount) {
  // FIXME do we really need this affine transform?
  amount = (goog.math.clamp(amount, 0, 1) - 1) * -1;
  var fn = this.getMap().getView().getView2D().getResolutionForValueFunction();
  return fn(amount);
};


/**
 * Determines an amount of dragging relative to this minimum position by the
 * given resolution.
 *
 * @param {number} res The resolution to get the amount for.
 * @return {number} The corresponding value (between 0 and 1).
 * @private
 */
ol.control.ZoomSlider.prototype.amountForResolution_ = function(res) {
  var fn = this.getMap().getView().getView2D().getValueForResolutionFunction();
  var value = fn(res);
  // FIXME do we really need this affine transform?
  return (value - 1) * -1;
};


/**
 * Handles the user caused changes of the slider thumb and adjusts the
 * resolution of our map accordingly. Will be called both while dragging and
 * when dragging ends.
 *
 * @param {goog.fx.DragDropEvent} e The dragdropevent.
 * @private
 */
ol.control.ZoomSlider.prototype.handleSliderChange_ = function(e) {
  var map = this.getMap();
  var view = map.getView().getView2D();
  var resolution;
  if (e.type === goog.fx.Dragger.EventType.DRAG) {
    var amountDragged = this.amountDragged_(e);
    resolution = this.resolutionForAmount_(amountDragged);
    if (resolution !== this.currentResolution_) {
      this.currentResolution_ = resolution;
      view.setResolution(resolution);
    }
  } else {
    goog.asserts.assert(goog.isDef(this.currentResolution_));
    map.addPreRenderFunction(ol.animation.zoom({
      resolution: this.currentResolution_,
      duration: ol.control.ZOOMSLIDER_ANIMATION_DURATION,
      easing: ol.easing.easeOut
    }));
    resolution = view.constrainResolution(this.currentResolution_);
    view.setResolution(resolution);
  }
};


/**
 * Actually enable draggable behaviour for the thumb of the zoomslider and bind
 * relvant event listeners.
 *
 * @param {Element} elem The element for the slider.
 * @return {goog.fx.Dragger} The actual goog.fx.Dragger instance.
 * @private
 */
ol.control.ZoomSlider.prototype.createDraggable_ = function(elem) {
  if (!goog.isNull(this.draggerListenerKeys_)) {
    goog.array.forEach(this.draggerListenerKeys_, goog.events.unlistenByKey);
    this.draggerListenerKeys_ = null;
  }
  var dragger = new goog.fx.Dragger(elem.childNodes[0]);
  this.draggerListenerKeys_ = [
    goog.events.listen(dragger, [
      goog.fx.Dragger.EventType.DRAG,
      goog.fx.Dragger.EventType.END
    ], this.handleSliderChange_, undefined, this)
  ];
  return dragger;
};
