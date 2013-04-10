// FIXME works for View2D only

goog.provide('ol.control.Zoom');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.animation');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');


/**
 * @define {number} Zoom duration.
 */
ol.control.ZOOM_DURATION = 250;



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ZoomOptions=} opt_options Zoom options.
 */
ol.control.Zoom = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var inElement = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#zoomIn',
    'class': 'ol-zoom-in'
  });
  goog.events.listen(inElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleIn_, false, this);

  var outElement = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#zoomOut',
    'class': 'ol-zoom-out'
  });
  goog.events.listen(outElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleOut_, false, this);

  var cssClasses = 'ol-zoom ' + ol.css.CLASS_UNSELECTABLE;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, inElement,
      outElement);

  goog.base(this, {
    element: element,
    map: options.map,
    target: options.target
  });

  /**
   * @type {number}
   * @private
   */
  this.delta_ = goog.isDef(options.delta) ? options.delta : 1;

};
goog.inherits(ol.control.Zoom, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.handleIn_ = function(browserEvent) {
  // prevent #zoomIn anchor from getting appended to the url
  browserEvent.preventDefault();
  var map = this.getMap();
  map.requestRenderFrame();
  // FIXME works for View2D only
  var view = map.getView().getView2D();
  var currentResolution = view.getResolution();
  if (goog.isDef(currentResolution)) {
    map.addPreRenderFunction(ol.animation.zoom({
      resolution: currentResolution,
      duration: ol.control.ZOOM_DURATION,
      easing: ol.easing.easeOut
    }));
  }
  var resolution = view.constrainResolution(currentResolution, this.delta_);
  view.setResolution(resolution);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.handleOut_ = function(browserEvent) {
  // prevent #zoomOut anchor from getting appended to the url
  browserEvent.preventDefault();
  var map = this.getMap();
  // FIXME works for View2D only
  var view = map.getView().getView2D();
  var currentResolution = view.getResolution();
  if (goog.isDef(currentResolution)) {
    map.addPreRenderFunction(ol.animation.zoom({
      resolution: currentResolution,
      duration: ol.control.ZOOM_DURATION,
      easing: ol.easing.easeOut
    }));
  }
  var resolution = view.constrainResolution(currentResolution, -this.delta_);
  view.setResolution(resolution);
};
