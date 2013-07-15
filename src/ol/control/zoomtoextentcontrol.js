// FIXME works for View2D only

goog.provide('ol.control.ZoomToExtent');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * Create a new control with one button to to to en extent.
 * To style this control use the CSS selector .ol-zoom-extent
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ZoomToExtentOptions=} opt_options Options.
 */
ol.control.ZoomToExtent = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = goog.isDef(options.extent) ? options.extent : null;

  var className = goog.isDef(options.className) ? options.className :
      'ol-zoom-extent';

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  });
  var button = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#zoomExtent'
  });
  goog.dom.appendChild(element, button);

  goog.events.listen(element, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleZoomToExtent_, false, this);

  goog.base(this, {
    element: element,
    map: options.map,
    target: options.target
  });
};
goog.inherits(ol.control.ZoomToExtent, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.ZoomToExtent.prototype.handleZoomToExtent_ = function(browserEvent) {
  // prevent #zoomExtent anchor from getting appended to the url
  browserEvent.preventDefault();
  var map = this.getMap();
  var view = map.getView().getView2D();
  view.fitExtent(this.extent_, map.getSize());
};


/**
 * Overload setMap to use the view projection's validity extent
 * if no extent was passed to the constructor.
 * @param {ol.Map} map Map.
 */
ol.control.ZoomToExtent.prototype.setMap = function(map) {
  ol.control.Control.prototype.setMap.call(this, map);
  if (map && !this.extent_) {
    this.extent_ = map.getView().getProjection().getExtent();
  }
};
