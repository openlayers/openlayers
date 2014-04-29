// FIXME works for View2D only

goog.provide('ol.control.ZoomToExtent');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.pointer.PointerEventHandler');



/**
 * Create a control that adds a button, which, when pressed, changes
 * the map view to a specific extent. To style this control use the
 * css selector `.ol-zoom-extent`.
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomToExtentOptions=} opt_options Options.
 * @todo api
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

  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Fit to extent';
  var tip = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'role' : 'tooltip'
  }, tipLabel);
  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  });
  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': 'ol-has-tooltip'
  });
  goog.dom.appendChild(button, tip);
  goog.dom.appendChild(element, button);

  var buttonHandler = new ol.pointer.PointerEventHandler(button);
  this.registerDisposable(buttonHandler);
  goog.events.listen(buttonHandler, ol.pointer.EventType.POINTERUP,
      this.handleZoomToExtent_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  goog.base(this, {
    element: element,
    target: options.target
  });
};
goog.inherits(ol.control.ZoomToExtent, ol.control.Control);


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.control.ZoomToExtent.prototype.handleZoomToExtent_ = function(pointerEvent) {
  pointerEvent.browserEvent.preventDefault();
  // prevent #zoomExtent anchor from getting appended to the url
  var map = this.getMap();
  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  var extent = goog.isNull(this.extent_) ?
      view2D.getProjection().getExtent() : this.extent_;
  view2D.fitExtent(extent, map.getSize());
};
