goog.provide('ol.control.Zoom');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.animation');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');
goog.require('ol.pointer.PointerEventHandler');



/**
 * @classdesc
 * A control with 2 buttons, one for zoom in and one for zoom out.
 * This control is one of the default controls of a map. To style this control
 * use css selectors `.ol-zoom-in` and `.ol-zoom-out`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomOptions=} opt_options Zoom options.
 * @api stable
 */
ol.control.Zoom = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var className = goog.isDef(options.className) ? options.className : 'ol-zoom';

  var delta = goog.isDef(options.delta) ? options.delta : 1;

  var zoomInLabel = goog.isDef(options.zoomInLabel) ?
      options.zoomInLabel : '+';
  var zoomOutLabel = goog.isDef(options.zoomOutLabel) ?
      options.zoomOutLabel : '\u2212';

  var zoomInTipLabel = goog.isDef(options.zoomInTipLabel) ?
      options.zoomInTipLabel : 'Zoom in';
  var zoomOutTipLabel = goog.isDef(options.zoomOutTipLabel) ?
      options.zoomOutTipLabel : 'Zoom out';

  var tTipZoomIn = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'role' : 'tooltip'
  }, zoomInTipLabel);
  var inElement = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': className + '-in ol-has-tooltip',
    'type' : 'button'
  }, tTipZoomIn, zoomInLabel);

  var inElementHandler = new ol.pointer.PointerEventHandler(inElement);
  this.registerDisposable(inElementHandler);
  goog.events.listen(inElementHandler,
      ol.pointer.EventType.POINTERUP, goog.partial(
          ol.control.Zoom.prototype.handlePointerUp_, delta), false, this);
  goog.events.listen(inElement,
      goog.events.EventType.CLICK, goog.partial(
          ol.control.Zoom.prototype.handleClick_, delta), false, this);

  goog.events.listen(inElement, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var tTipsZoomOut = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'role' : 'tooltip'
  }, zoomOutTipLabel);
  var outElement = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': className + '-out  ol-has-tooltip',
    'type' : 'button'
  }, tTipsZoomOut, zoomOutLabel);

  var outElementHandler = new ol.pointer.PointerEventHandler(outElement);
  this.registerDisposable(outElementHandler);
  goog.events.listen(outElementHandler,
      ol.pointer.EventType.POINTERUP, goog.partial(
          ol.control.Zoom.prototype.handlePointerUp_, -delta), false, this);
  goog.events.listen(outElement,
      goog.events.EventType.CLICK, goog.partial(
          ol.control.Zoom.prototype.handleClick_, -delta), false, this);

  goog.events.listen(outElement, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
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
 * @param {goog.events.BrowserEvent} event The event to handle
 * @private
 */
ol.control.Zoom.prototype.handleClick_ = function(delta, event) {
  if (event.screenX !== 0 && event.screenY !== 0) {
    return;
  }
  this.zoomByDelta_(delta);
};


/**
 * @param {number} delta Zoom delta.
 * @param {ol.pointer.PointerEvent} pointerEvent The event to handle
 * @private
 */
ol.control.Zoom.prototype.handlePointerUp_ = function(delta, pointerEvent) {
  pointerEvent.browserEvent.preventDefault();
  this.zoomByDelta_(delta);
};


/**
 * @param {number} delta Zoom delta.
 * @private
 */
ol.control.Zoom.prototype.zoomByDelta_ = function(delta) {
  var map = this.getMap();
  var view = map.getView();
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
