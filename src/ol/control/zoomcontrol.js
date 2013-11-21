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
 * Create a new control with 2 buttons, one for zoom in and one for zoom out.
 * This control is part of the default controls of a map. To style this control
 * use css selectors `.ol-zoom-in` and `.ol-zoom-out`.
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ZoomOptions=} opt_options Zoom options.
 * @todo stability experimental
 */
ol.control.Zoom = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var className = goog.isDef(options.className) ? options.className : 'ol-zoom';

  var delta = goog.isDef(options.delta) ? options.delta : 1;

  var inElement = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#zoomIn',
    'class': className + '-in'
  });
  goog.events.listen(inElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], goog.partial(ol.control.Zoom.prototype.zoomByDelta_, delta), false, this);

  var outElement = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#zoomOut',
    'class': className + '-out'
  });
  goog.events.listen(outElement, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], goog.partial(ol.control.Zoom.prototype.zoomByDelta_, -delta), false, this);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, inElement,
      outElement);

  goog.base(this, {
    element: element,
    target: options.target
  });

  /**
   * @type {number}
   * @private
   */
  this.duration_ = goog.isDef(options.duration) ? options.duration : 250;

};
goog.inherits(ol.control.Zoom, ol.control.Control);


/**
 * @param {number} delta Zoom delta.
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.zoomByDelta_ = function(delta, browserEvent) {
  // prevent the anchor from getting appended to the url
  browserEvent.preventDefault();
  var map = this.getMap();
  // FIXME works for View2D only
  var view = map.getView().getView2D();
  var currentResolution = view.getResolution();
  if (goog.isDef(currentResolution)) {
    if (this.duration_ > 0) {
      map.beforeRender(ol.animation.zoom({
        resolution: currentResolution,
        duration: this.duration_,
        easing: ol.easing.easeOut
      }));
    }
    var newResolution = view.constrainResolution(currentResolution, delta);
    view.setResolution(newResolution);
  }
};
