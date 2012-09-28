goog.provide('ol.control.Zoom');
goog.provide('ol.control.ZoomOptions');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.BrowserFeature');
goog.require('ol.Projection');
goog.require('ol.control.Control');


/**
 * @typedef {{delta: (number|undefined),
 *            map: (ol.Map|undefined),
 *            target: (Element|undefined)}}
 */
ol.control.ZoomOptions;



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
  browserEvent.stopPropagation();
  browserEvent.preventDefault();
  this.getMap().zoom(this.delta_);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.handleOut_ = function(browserEvent) {
  browserEvent.stopPropagation();
  browserEvent.preventDefault();
  this.getMap().zoom(-this.delta_);
};
