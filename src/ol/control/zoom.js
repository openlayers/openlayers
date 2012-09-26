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
 * @param {Array.<number>=} opt_resolutions The resolutions to zoom to.
 */
ol.control.Zoom = function(map, opt_resolutions) {

  goog.base(this, map);

  if (!goog.isDef(opt_resolutions)) {
    opt_resolutions = new Array(19);
    for (var z = 0; z <= 18; ++z) {
      opt_resolutions[z] = ol.Projection.EPSG_3857_HALF_SIZE / (128 << z);
    }
  }

  /**
   * @type {Function}
   * @private
   */
  this.constraint_ = ol.ResolutionConstraint.createSnapToResolutions(
      opt_resolutions);

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
  this.zoom_(1);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent The browser event to handle.
 * @private
 */
ol.control.Zoom.prototype.handleOut_ = function(browserEvent) {
  browserEvent.stopPropagation();
  browserEvent.preventDefault();
  this.zoom_(-1);
};


/**
 * @param {number} delta Delta.
 * @private
 */
ol.control.Zoom.prototype.zoom_ = function(delta) {
  var map = this.getMap();
  var resolution = this.constraint_(map.getResolution(), delta);
  map.setResolution(resolution);
};


/**
 * @inheritDoc
 */
ol.control.Zoom.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.inButton_);
  goog.dom.removeNode(this.outButton_);
  goog.dom.removeNode(this.divElement_);
  delete this.inButton_;
  delete this.outButton_;
  delete this.divElement_;
  goog.base(this, 'disposeInternal');
};
