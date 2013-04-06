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
  POSITION: 'position',
  POSITIONING: 'positioning'
};


/**
 * @enum {string}
 */
ol.OverlayPositioning = {
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.OverlayOptions} options Overlay options.
 */
ol.Overlay = function(options) {

  goog.base(this);

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

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.OverlayProperty.ELEMENT),
      this.handleElementChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.OverlayProperty.MAP),
      this.handleMapChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.OverlayProperty.POSITION),
      this.handlePositionChanged, false, this);

  goog.events.listen(
      this,
      ol.Object.getChangedEventType(ol.OverlayProperty.POSITIONING),
      this.handlePositioningChanged, false, this);

  if (goog.isDef(options.element)) {
    this.setElement(options.element);
  }
  if (goog.isDef(options.position)) {
    this.setPosition(options.position);
  }
  if (goog.isDef(options.positioning)) {
    this.setPositioning(options.positioning);
  }
  if (goog.isDef(options.map)) {
    this.setMap(options.map);
  }

};
goog.inherits(ol.Overlay, ol.Object);


/**
 * @return {Element|undefined} Element.
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
 * @return {ol.Map|undefined} Map.
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
 * @return {ol.Coordinate|undefined} Position.
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
 * @return {ol.OverlayPositioning|undefined} Positioning.
 */
ol.Overlay.prototype.getPositioning = function() {
  return /** @type {ol.OverlayPositioning|undefined} */ (
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
    goog.dom.append(
        /** @type {!Node} */ (map.getOverlayContainer()), this.element_);
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
 * @param {Element|undefined} element Element.
 */
ol.Overlay.prototype.setElement = function(element) {
  this.set(ol.OverlayProperty.ELEMENT, element);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setElement',
    ol.Overlay.prototype.setElement);


/**
 * @param {ol.Map|undefined} map Map.
 */
ol.Overlay.prototype.setMap = function(map) {
  this.set(ol.OverlayProperty.MAP, map);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setMap',
    ol.Overlay.prototype.setMap);


/**
 * @param {ol.Coordinate|undefined} position Position.
 */
ol.Overlay.prototype.setPosition = function(position) {
  this.set(ol.OverlayProperty.POSITION, position);
};
goog.exportProperty(
    ol.Overlay.prototype,
    'setPosition',
    ol.Overlay.prototype.setPosition);


/**
 * @param {ol.OverlayPositioning|undefined} positioning Positioning.
 */
ol.Overlay.prototype.setPositioning = function(positioning) {
  this.set(ol.OverlayProperty.POSITIONING, positioning);
};


/**
 * @private
 */
ol.Overlay.prototype.updatePixelPosition_ = function() {

  var map = this.getMap();
  var position = this.getPosition();
  if (!goog.isDef(map) || !map.isDef() || !goog.isDef(position)) {
    if (this.rendered_.visible) {
      goog.style.showElement(this.element_, false);
      this.rendered_.visible = false;
    }
    return;
  }

  var pixel = map.getPixelFromCoordinate(position);
  var mapSize = map.getSize();
  goog.asserts.assert(goog.isDef(mapSize));
  var style = this.element_.style;
  var positioning = this.getPositioning();
  if (positioning == ol.OverlayPositioning.BOTTOM_RIGHT ||
      positioning == ol.OverlayPositioning.TOP_RIGHT) {
    if (this.rendered_.left_ !== '') {
      this.rendered_.left_ = style.left = '';
    }
    var right = Math.round(mapSize.width - pixel.x) + 'px';
    if (this.rendered_.right_ != right) {
      this.rendered_.right_ = style.right = right;
    }
  } else {
    if (this.rendered_.right_ !== '') {
      this.rendered_.right_ = style.right = '';
    }
    var left = Math.round(pixel.x) + 'px';
    if (this.rendered_.left_ != left) {
      this.rendered_.left_ = style.left = left;
    }
  }
  if (positioning == ol.OverlayPositioning.TOP_LEFT ||
      positioning == ol.OverlayPositioning.TOP_RIGHT) {
    if (this.rendered_.bottom_ !== '') {
      this.rendered_.bottom_ = style.bottom = '';
    }
    var top = Math.round(pixel.y) + 'px';
    if (this.rendered_.top_ != top) {
      this.rendered_.top_ = style.top = top;
    }
  } else {
    if (this.rendered_.top_ !== '') {
      this.rendered_.top_ = style.top = '';
    }
    var bottom = Math.round(mapSize.height - pixel.y) + 'px';
    if (this.rendered_.bottom_ != bottom) {
      this.rendered_.bottom_ = style.bottom = bottom;
    }
  }

  if (!this.rendered_.visible) {
    goog.style.showElement(this.element_, true);
    this.rendered_.visible = true;
  }

};
