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
goog.require('ol');
goog.require('ol.MapEventType');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ZoomSliderOptions} zoomSliderOptions Zoom options.
 */
ol.control.ZoomSlider = function(zoomSliderOptions) {
  // FIXME these should be read out from a map if not given, and only then
  //       fallback to the constants if they weren't defined on the map.
  /**
   * The minimum resolution that one can set with this control.
   *
   * @type {number}
   * @private
   */
  this.maxResolution_ = goog.isDef(zoomSliderOptions.maxResolution) ?
      zoomSliderOptions.maxResolution :
      ol.control.ZoomSlider.DEFAULT_MAX_RESOLUTION;

  /**
   * The maximum resolution that one can set with this control.
   *
   * @type {number}
   * @private
   */
  this.minResolution_ = goog.isDef(zoomSliderOptions.minResolution) ?
      zoomSliderOptions.minResolution :
      ol.control.ZoomSlider.DEFAULT_MIN_RESOLUTION;

  goog.asserts.assert(
      this.minResolution_ < this.maxResolution_,
      'minResolution must be smaller than maxResolution.'
  );

  /**
   * The range of resolutions we are handling in this slider.
   *
   * @type {number}
   * @private
   */
  this.range_ = this.maxResolution_ - this.minResolution_;

  /**
   * Will hold the current resolution of the view.
   *
   * @type {number}
   * @private
   */
  this.currentResolution_;

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
  this.mapListenerKeys_ = null;

  /**
   * @private
   * @type {Array.<?number>}
   */
  this.draggerListenerKeys_ = null;

  var elem = this.createDom_();
  this.dragger_ = this.createDraggable_(elem);

  // FIXME currently only a do nothing function is bound.
  goog.events.listen(elem, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleContainerClick_, false, this);

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
 * The CSS class that we'll give the zoomslider container.
 *
 * @const {string}
 */
ol.control.ZoomSlider.CSS_CLASS_CONTAINER = 'ol-zoomslider';


/**
 * The CSS class that we'll give the zoomslider thumb.
 *
 * @const {string}
 */
ol.control.ZoomSlider.CSS_CLASS_THUMB =
    ol.control.ZoomSlider.CSS_CLASS_CONTAINER + '-thumb';


/**
 * The default value for minResolution_ when the control isn't instanciated with
 * an explicit value. The default value is the resolution of the standard OSM
 * tiles at zoomlevel 18.
 *
 * @const {number}
 */
ol.control.ZoomSlider.DEFAULT_MIN_RESOLUTION = 0.5971642833948135;


/**
 * The default value for maxResolution_ when the control isn't instanciated with
 * an explicit value.  The default value is the resolution of the standard OSM
 * tiles at zoomlevel 0.
 *
 * @const {number}
 */
ol.control.ZoomSlider.DEFAULT_MAX_RESOLUTION = 156543.0339;


/**
 * @inheritDoc
 */
ol.control.ZoomSlider.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  this.currentResolution_ = map.getView().getResolution();
  this.initMapEventListeners_();
  this.initSlider_();
  this.positionThumbForResolution_(this.currentResolution_);
};


/**
 * Initializes the event listeners for map events.
 *
 * @private
 */
ol.control.ZoomSlider.prototype.initMapEventListeners_ = function() {
  if (!goog.isNull(this.mapListenerKeys_)) {
    goog.array.forEach(this.mapListenerKeys_, goog.events.unlistenByKey);
    this.mapListenerKeys_ = null;
  }
  if (!goog.isNull(this.getMap())) {
    this.mapListenerKeys_ = [
      goog.events.listen(this.getMap(), ol.MapEventType.POSTRENDER,
          this.handleMapPostRender_, undefined, this)
    ];
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
 * @param {ol.MapEvent} mapEvtObj The ol.MapEvent object.
 * @private
 */
ol.control.ZoomSlider.prototype.handleMapPostRender_ = function(mapEvtObj) {
  var res = mapEvtObj.frameState.view2DState.resolution;
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
 * @return {number} a resolution between this.minResolution_ and
 *     this.maxResolution_.
 * @private
 */
ol.control.ZoomSlider.prototype.resolutionForAmount_ = function(amount) {
  var saneAmount = goog.math.clamp(amount, 0, 1);
  return this.minResolution_ + this.range_ * saneAmount;
};


/**
 * Determines an amount of dragging relative to this minimum position by the
 * given resolution.
 *
 * @param {number} res The resolution to get the amount for.
 * @return {number} an amount between 0 and 1.
 * @private
 */
ol.control.ZoomSlider.prototype.amountForResolution_ = function(res) {
  var saneRes = goog.math.clamp(res, this.minResolution_, this.maxResolution_);
  return (saneRes - this.minResolution_) / this.range_;
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
  var map = this.getMap(),
      amountDragged = this.amountDragged_(e),
      res = this.resolutionForAmount_(amountDragged);
  goog.asserts.assert(res >= this.minResolution_ && res <= this.maxResolution_,
      'calculated new resolution is in allowed bounds.');
  if (res !== this.currentResolution_) {
    this.currentResolution_ = res;
    map.getView().setResolution(res);
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


/**
 * Setup the DOM-structure we need for the zoomslider.
 *
 * @param {Element=} opt_elem The element for the slider.
 * @return {Element} The correctly set up DOMElement.
 * @private
 */
ol.control.ZoomSlider.prototype.createDom_ = function(opt_elem) {
  var elem,
      sliderCssCls = ol.control.ZoomSlider.CSS_CLASS_CONTAINER + ' ' +
          ol.CSS_CLASS_UNSELECTABLE,
      thumbCssCls = ol.control.ZoomSlider.CSS_CLASS_THUMB + ' ' +
          ol.CSS_CLASS_UNSELECTABLE;

  elem = goog.dom.createDom(goog.dom.TagName.DIV, sliderCssCls,
      goog.dom.createDom(goog.dom.TagName.DIV, thumbCssCls));

  return elem;
};
