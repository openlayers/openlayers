// FIXME works for View2D only

goog.provide('ol.control.Zoom');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.BrowserFeature');
goog.require('ol.control.Control');


/**
 * @define {number} Zoom duration.
 */
ol.control.ZOOM_DURATION = 250;



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ZoomOptions} zoomOptions Zoom options.
 */
ol.control.Zoom = function(zoomOptions) {

  var eventType = ol.BrowserFeature.HAS_TOUCH ?
      goog.events.EventType.TOUCHEND : goog.events.EventType.CLICK;

  var inElement = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#zoomIn',
    'class': 'ol-zoom-in'
  }, '+');
  goog.events.listen(inElement, eventType, this.handleIn_, false, this);

  var outElement = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#zoomOut',
    'class': 'ol-zoom-out'
  }, '\u2212');
  goog.events.listen(outElement, eventType, this.handleOut_, false, this);

  var element = goog.dom.createDom(
      goog.dom.TagName.DIV, 'ol-zoom ol-unselectable', inElement, outElement);

  goog.base(this, {
    element: element,
    map: zoomOptions.map,
    target: zoomOptions.target
  });

  /**
   * @type {number}
   * @private
   */
  this.delta_ = goog.isDef(zoomOptions.delta) ? zoomOptions.delta : 1;

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
  map.getView().zoom(map, this.delta_, undefined, ol.control.ZOOM_DURATION);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.handleOut_ = function(browserEvent) {
  // prevent #zoomOut anchor from getting appended to the url
  browserEvent.preventDefault();
  var map = this.getMap();
  map.requestRenderFrame();
  // FIXME works for View2D only
  map.getView().zoom(map, -this.delta_, undefined, ol.control.ZOOM_DURATION);
};
