goog.provide('ol.Overlay');
goog.provide('ol.OverlayPositioning');
goog.provide('ol.OverlayProperty');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.MapEventType');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.OverlayProperty = {
  ELEMENT: 'element',
  MAP: 'map',
  OFFSET: 'offset',
  POSITION: 'position',
  POSITIONING: 'positioning'
};


/**
 * Overlay position: `'bottom-left'`, `'bottom-center'`,  `'bottom-right'`,
 * `'center-left'`, `'center-center'`, `'center-right'`, `'top-left'`,
 * `'top-center'`, `'top-right'`
 * @enum {string}
 * @api stable
 */
ol.OverlayPositioning = {
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right',
  CENTER_LEFT: 'center-left',
  CENTER_CENTER: 'center-center',
  CENTER_RIGHT: 'center-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right'
};



/**
 * @classdesc
 * Like {@link ol.control.Control}, Overlays are visible widgets.
 * Unlike Controls, they are not in a fixed position on the screen, but are tied
 * to a geographical coordinate, so panning the map will move an Overlay but not
 * a Control.
 *
 * Example:
 *
 *     var popup = new ol.Overlay({
 *       element: document.getElementById('popup')
 *     });
 *     popup.setPosition(coordinate);
 *     map.addOverlay(popup);
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.OverlayOptions} options Overlay options.
 * @api stable
 */
ol.Overlay = function(options) {

  goog.base(this);

  /**
   * @private
   * @type {boolean}
   */
  this.insertFirst_ = goog.isDef(options.insertFirst) ?
      options.insertFirst : true;

  /**
   * @private
   * @type {boolean}
   */
  this.stopEvent_ = goog.isDef(options.stopEvent) ? options.stopEvent : true;

  /**
   * @private
   * @type {Element}
   */
  this.element_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.element_.style.position = 'absolute';

  /**
   * @private
   * @type {{bottom_: string,
   *         left_: string,
   *         right_: string,
   *         top_: string,
   *         visible: boolean}}
   */
  this.rendered_ = {
    bottom_: '',
    left_: '',
    right_: '',
    top_: '',
    visible: true
  };

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.mapPostrenderListenerKey_ = null;

  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.OverlayProperty.ELEMENT),
      this.handleElementChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.OverlayProperty.MAP),
      this.handleMapChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.OverlayProperty.OFFSET),
      this.handleOffsetChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.OverlayProperty.POSITION),
      this.handlePositionChanged, false, this);

  goog.events.listen(
      this,
      ol.Object.getChangeEventType(ol.OverlayProperty.POSITIONING),
      this.handlePositioningChanged, false, this);

  if (goog.isDef(options.element)) {
    this.setElement(options.element);
  }

  this.setOffset(goog.isDef(options.offset) ? options.offset : [0, 0]);

  this.setPositioning(goog.isDef(options.positioning) ?
      /** @type {ol.OverlayPositioning} */ (options.positioning) :
      ol.OverlayPositioning.TOP_LEFT);

  if (goog.isDef(options.position)) {
    this.setPosition(options.position);
  }

};
goog.inherits(ol.Overlay, ol.Object);


/**
 * Get the DOM element of this overlay.
 * @return {Element|undefined} The Element containing the overlay.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.getElement = function() {
  return /** @type {Element|undefined} */ (
      this.get(ol.OverlayProperty.ELEMENT));
};
goog.exportProperty(
    ol.Overlay.prototype,
    'getElement',
    ol.Overlay.prototype.getElement);


/**
 * Get the map associated with this overlay.
 * @return {ol.Map|undefined} The map that the overlay is part of.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.getMap = function() {
  return /** @type {ol.Map|undefined} */ (
      this.get(ol.OverlayProperty.MAP));
};
goog.exportProperty(
    ol.Overlay.prototype,
    'getMap',
    ol.Overlay.prototype.getMap);


/**
 * Get the offset of this overlay.
 * @return {Array.<number>} The offset.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.getOffset = function() {
  return /** @type {Array.<number>} */ (
      this.get(ol.OverlayProperty.OFFSET));
};
goog.exportProperty(
    ol.Overlay.prototype,
    'getOffset',
    ol.Overlay.prototype.getOffset);


/**
 * Get the current position of this overlay.
 * @return {ol.Coordinate|undefined} The spatial point that the overlay is
 *     anchored at.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.getPosition = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.OverlayProperty.POSITION));
};
goog.exportProperty(
    ol.Overlay.prototype,
    'getPosition',
    ol.Overlay.prototype.getPosition);


/**
 * Get the current positioning of this overlay.
 * @return {ol.OverlayPositioning} How the overlay is positioned
 *     relative to its point on the map.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.getPositioning = function() {
  return /** @type {ol.OverlayPositioning} */ (
      this.get(ol.OverlayProperty.POSITIONING));
};
goog.exportProperty(
    ol.Overlay.prototype,
    'getPositioning',
    ol.Overlay.prototype.getPositioning);


/**
 * @protected
 */
ol.Overlay.prototype.handleElementChanged = function() {
  goog.dom.removeChildren(this.element_);
  var element = this.getElement();
  if (goog.isDefAndNotNull(element)) {
    goog.dom.append(/** @type {!Node} */ (this.element_), element);
  }
};


/**
 * @protected
 */
ol.Overlay.prototype.handleMapChanged = function() {
  if (!goog.isNull(this.mapPostrenderListenerKey_)) {
    goog.dom.removeNode(this.element_);
    goog.events.unlistenByKey(this.mapPostrenderListenerKey_);
    this.mapPostrenderListenerKey_ = null;
  }
  var map = this.getMap();
  if (goog.isDefAndNotNull(map)) {
    this.mapPostrenderListenerKey_ = goog.events.listen(map,
        ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this);
    this.updatePixelPosition_();
    var container = this.stopEvent_ ?
        map.getOverlayContainerStopEvent() : map.getOverlayContainer();
    if (this.insertFirst_) {
      goog.dom.insertChildAt(/** @type {!Element} */ (
          container), this.element_, 0);
    } else {
      goog.dom.append(/** @type {!Node} */ (container), this.element_);
    }
  }
};


/**
 * @protected
 */
ol.Overlay.prototype.handleMapPostrender = function() {
  this.updatePixelPosition_();
};


/**
 * @protected
 */
ol.Overlay.prototype.handleOffsetChanged = function() {
  this.updatePixelPosition_();
};


/**
 * @protected
 */
ol.Overlay.prototype.handlePositionChanged = function() {
  this.updatePixelPosition_();
};


/**
 * @protected
 */
ol.Overlay.prototype.handlePositioningChanged = function() {
  this.updatePixelPosition_();
};


/**
 * Set the DOM element to be associated with this overlay.
 * @param {Element|undefined} element The Element containing the overlay.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.setElement = function(element) {
  this.set(ol.OverlayProperty.ELEMENT, element);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setElement',
    ol.Overlay.prototype.setElement);


/**
 * Set the map to be associated with this overlay.
 * @param {ol.Map|undefined} map The map that the overlay is part of.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.setMap = function(map) {
  this.set(ol.OverlayProperty.MAP, map);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setMap',
    ol.Overlay.prototype.setMap);


/**
 * Set the offset for this overlay.
 * @param {Array.<number>} offset Offset.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.setOffset = function(offset) {
  this.set(ol.OverlayProperty.OFFSET, offset);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setOffset',
    ol.Overlay.prototype.setOffset);


/**
 * Set the position for this overlay.
 * @param {ol.Coordinate|undefined} position The spatial point that the overlay
 *     is anchored at.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.setPosition = function(position) {
  this.set(ol.OverlayProperty.POSITION, position);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setPosition',
    ol.Overlay.prototype.setPosition);


/**
 * Set the positioning for this overlay.
 * @param {ol.OverlayPositioning} positioning how the overlay is
 *     positioned relative to its point on the map.
 * @observable
 * @api stable
 */
ol.Overlay.prototype.setPositioning = function(positioning) {
  this.set(ol.OverlayProperty.POSITIONING, positioning);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setPositioning',
    ol.Overlay.prototype.setPositioning);


/**
 * @private
 */
ol.Overlay.prototype.updatePixelPosition_ = function() {

  var map = this.getMap();
  var position = this.getPosition();
  if (!goog.isDef(map) || !map.isRendered() || !goog.isDef(position)) {
    if (this.rendered_.visible) {
      goog.style.setElementShown(this.element_, false);
      this.rendered_.visible = false;
    }
    return;
  }

  var pixel = map.getPixelFromCoordinate(position);
  goog.asserts.assert(!goog.isNull(pixel));
  var mapSize = map.getSize();
  goog.asserts.assert(goog.isDef(mapSize));
  var style = this.element_.style;
  var offset = this.getOffset();
  goog.asserts.assert(goog.isArray(offset));
  var positioning = this.getPositioning();
  goog.asserts.assert(goog.isDef(positioning));

  var offsetX = offset[0];
  var offsetY = offset[1];
  if (positioning == ol.OverlayPositioning.BOTTOM_RIGHT ||
      positioning == ol.OverlayPositioning.CENTER_RIGHT ||
      positioning == ol.OverlayPositioning.TOP_RIGHT) {
    if (this.rendered_.left_ !== '') {
      this.rendered_.left_ = style.left = '';
    }
    var right = Math.round(mapSize[0] - pixel[0] - offsetX) + 'px';
    if (this.rendered_.right_ != right) {
      this.rendered_.right_ = style.right = right;
    }
  } else {
    if (this.rendered_.right_ !== '') {
      this.rendered_.right_ = style.right = '';
    }
    if (positioning == ol.OverlayPositioning.BOTTOM_CENTER ||
        positioning == ol.OverlayPositioning.CENTER_CENTER ||
        positioning == ol.OverlayPositioning.TOP_CENTER) {
      offsetX -= goog.style.getSize(this.element_).width / 2;
    }
    var left = Math.round(pixel[0] + offsetX) + 'px';
    if (this.rendered_.left_ != left) {
      this.rendered_.left_ = style.left = left;
    }
  }
  if (positioning == ol.OverlayPositioning.BOTTOM_LEFT ||
      positioning == ol.OverlayPositioning.BOTTOM_CENTER ||
      positioning == ol.OverlayPositioning.BOTTOM_RIGHT) {
    if (this.rendered_.top_ !== '') {
      this.rendered_.top_ = style.top = '';
    }
    var bottom = Math.round(mapSize[1] - pixel[1] - offsetY) + 'px';
    if (this.rendered_.bottom_ != bottom) {
      this.rendered_.bottom_ = style.bottom = bottom;
    }
  } else {
    if (this.rendered_.bottom_ !== '') {
      this.rendered_.bottom_ = style.bottom = '';
    }
    if (positioning == ol.OverlayPositioning.CENTER_LEFT ||
        positioning == ol.OverlayPositioning.CENTER_CENTER ||
        positioning == ol.OverlayPositioning.CENTER_RIGHT) {
      offsetY -= goog.style.getSize(this.element_).height / 2;
    }
    var top = Math.round(pixel[1] + offsetY) + 'px';
    if (this.rendered_.top_ != top) {
      this.rendered_.top_ = style.top = top;
    }
  }

  if (!this.rendered_.visible) {
    goog.style.setElementShown(this.element_, true);
    this.rendered_.visible = true;
  }

};
