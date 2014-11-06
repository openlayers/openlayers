goog.provide('ol.control.ZoomToExtent');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * @classdesc
 * A button control which, when pressed, changes the map view to a specific
 * extent. To style this control use the css selector `.ol-zoom-extent`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomToExtentOptions=} opt_options Options.
 * @api stable
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
  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'type': 'button',
    'title': tipLabel
  });

  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, button);

  goog.base(this, {
    element: element,
    target: options.target
  });
};
goog.inherits(ol.control.ZoomToExtent, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} event The event to handle
 * @private
 */
ol.control.ZoomToExtent.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleZoomToExtent_();
};


/**
 * @private
 */
ol.control.ZoomToExtent.prototype.handleZoomToExtent_ = function() {
  var map = this.getMap();
  var view = map.getView();
  var extent = goog.isNull(this.extent_) ?
      view.getProjection().getExtent() : this.extent_;
  var size = map.getSize();
  goog.asserts.assert(goog.isDef(size));
  view.fitExtent(extent, size);
};
