// FIXME: remove constraints from here

goog.provide('ol.control.Zoom');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Projection');
goog.require('ol.ResolutionConstraint');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.Map} map Map.
 * @param {number=} opt_zoomDelta Optional zoom delta.
 */
ol.control.Zoom = function(map, opt_zoomDelta) {

  goog.base(this, map);
  
  /**
   * @type {number}
   * @private
   */
  this.zoomDelta_ = goog.isDef(opt_zoomDelta) ? opt_zoomDelta : 1;

  /**
   * @type {Element}
   * @private
   */
  this.divElement_ = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-zoom');

  /**
   * @type {Element}
   * @private
   */
  this.inButton_ = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-zoom-in',
      goog.dom.createDom(goog.dom.TagName.A, {'href': '#zoomIn'}));

  /**
   * @type {Element}
   * @private
   */
  this.outButton_ = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-zoom-out',
      goog.dom.createDom(goog.dom.TagName.A, {'href': '#zoomOut'}));

  goog.dom.setTextContent(
      /** @type {Element} */ (this.inButton_.firstChild), '+');
  goog.dom.setTextContent(
      /** @type {Element} */ (this.outButton_.firstChild), '\u2212');
  goog.dom.append(this.divElement_, this.inButton_, this.outButton_);
  goog.dom.append(/** @type {!Node} */ (map.getViewport()), this.divElement_);

  goog.events.listen(this.inButton_, goog.events.EventType.CLICK,
      this.handleIn_, false, this);
  goog.events.listen(this.outButton_, goog.events.EventType.CLICK,
      this.handleOut_, false, this);

};
goog.inherits(ol.control.Zoom, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.Zoom.prototype.getElement = function() {
  return this.divElement_;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.handleIn_ = function(browserEvent) {
  browserEvent.stopPropagation();
  browserEvent.preventDefault();
  this.getMap().zoom(this.zoomDelta_);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.handleOut_ = function(browserEvent) {
  browserEvent.stopPropagation();
  browserEvent.preventDefault();
  this.getMap().zoom(-this.zoomDelta_);
};
/**
 * @inheritDoc
 */
ol.control.Zoom.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.divElement_);
  delete this.inButton_;
  delete this.outButton_;
  delete this.divElement_;
  goog.base(this, 'disposeInternal');
};
