goog.provide('ol.AnchoredElement');
goog.provide('ol.AnchoredElementPositioning');
goog.provide('ol.AnchoredElementProperty');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.MapEventType');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.AnchoredElementProperty = {
  ELEMENT: 'element',
  MAP: 'map',
  POSITION: 'position',
  POSITIONING: 'positioning'
};


/**
 * @enum {string}
 */
ol.AnchoredElementPositioning = {
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.AnchoredElementOptions} anchoredElementOptions Anchored element
 *     options.
 */
ol.AnchoredElement = function(anchoredElementOptions) {

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
      this, ol.Object.getChangedEventType(ol.AnchoredElementProperty.ELEMENT),
      this.handleElementChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.AnchoredElementProperty.MAP),
      this.handleMapChanged, false, this);

  goog.events.listen(
      this, ol.Object.getChangedEventType(ol.AnchoredElementProperty.POSITION),
      this.handlePositionChanged, false, this);

  goog.events.listen(
      this,
      ol.Object.getChangedEventType(ol.AnchoredElementProperty.POSITIONING),
      this.handlePositioningChanged, false, this);

  if (goog.isDef(anchoredElementOptions.element)) {
    this.setElement(anchoredElementOptions.element);
  }
  if (goog.isDef(anchoredElementOptions.position)) {
    this.setPosition(anchoredElementOptions.position);
  }
  if (goog.isDef(anchoredElementOptions.positioning)) {
    this.setPositioning(anchoredElementOptions.positioning);
  }
  if (goog.isDef(anchoredElementOptions.map)) {
    this.setMap(anchoredElementOptions.map);
  }

};
goog.inherits(ol.AnchoredElement, ol.Object);


/**
 * @return {Element|undefined} Element.
 */
ol.AnchoredElement.prototype.getElement = function() {
  return /** @type {Element|undefined} */ (
      this.get(ol.AnchoredElementProperty.ELEMENT));
};
goog.exportProperty(
    ol.AnchoredElement.prototype,
    'getElement',
    ol.AnchoredElement.prototype.getElement);


/**
 * @return {ol.Map|undefined} Map.
 */
ol.AnchoredElement.prototype.getMap = function() {
  return /** @type {ol.Map|undefined} */ (
      this.get(ol.AnchoredElementProperty.MAP));
};
goog.exportProperty(
    ol.AnchoredElement.prototype,
    'getMap',
    ol.AnchoredElement.prototype.getMap);


/**
 * @return {ol.Coordinate|undefined} Position.
 */
ol.AnchoredElement.prototype.getPosition = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.AnchoredElementProperty.POSITION));
};
goog.exportProperty(
    ol.AnchoredElement.prototype,
    'getPosition',
    ol.AnchoredElement.prototype.getPosition);


/**
 * @return {ol.AnchoredElementPositioning|undefined} Positioning.
 */
ol.AnchoredElement.prototype.getPositioning = function() {
  return /** @type {ol.AnchoredElementPositioning|undefined} */ (
      this.get(ol.AnchoredElementProperty.POSITIONING));
};
goog.exportProperty(
    ol.AnchoredElement.prototype,
    'getPositioning',
    ol.AnchoredElement.prototype.getPositioning);


/**
 * @protected
 */
ol.AnchoredElement.prototype.handleElementChanged = function() {
  goog.dom.removeChildren(this.element_);
  var element = this.getElement();
  if (goog.isDefAndNotNull(element)) {
    goog.dom.append(/** @type {!Node} */ (this.element_), element);
  }
};


/**
 * @protected
 */
ol.AnchoredElement.prototype.handleMapChanged = function() {
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
ol.AnchoredElement.prototype.handleMapPostrender = function() {
  this.updatePixelPosition_();
};


/**
 * @protected
 */
ol.AnchoredElement.prototype.handlePositionChanged = function() {
  this.updatePixelPosition_();
};


/**
 * @protected
 */
ol.AnchoredElement.prototype.handlePositioningChanged = function() {
  this.updatePixelPosition_();
};


/**
 * @param {Element|undefined} element Element.
 */
ol.AnchoredElement.prototype.setElement = function(element) {
  this.set(ol.AnchoredElementProperty.ELEMENT, element);
};
goog.exportProperty(
    ol.AnchoredElement.prototype,
    'setElement',
    ol.AnchoredElement.prototype.setElement);


/**
 * @param {ol.Map|undefined} map Map.
 */
ol.AnchoredElement.prototype.setMap = function(map) {
  this.set(ol.AnchoredElementProperty.MAP, map);
};
goog.exportProperty(
    ol.AnchoredElement.prototype,
    'setMap',
    ol.AnchoredElement.prototype.setMap);


/**
 * @param {ol.Coordinate|undefined} position Position.
 */
ol.AnchoredElement.prototype.setPosition = function(position) {
  this.set(ol.AnchoredElementProperty.POSITION, position);
};
goog.exportProperty(
    ol.AnchoredElement.prototype,
    'setPosition',
    ol.AnchoredElement.prototype.setPosition);


/**
 * @param {ol.AnchoredElementPositioning|undefined} positioning Positioning.
 */
ol.AnchoredElement.prototype.setPositioning = function(positioning) {
  this.set(ol.AnchoredElementProperty.POSITIONING, positioning);
};


/**
 * @private
 */
ol.AnchoredElement.prototype.updatePixelPosition_ = function() {

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
  if (positioning == ol.AnchoredElementPositioning.BOTTOM_RIGHT ||
      positioning == ol.AnchoredElementPositioning.TOP_RIGHT) {
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
  if (positioning == ol.AnchoredElementPositioning.TOP_LEFT ||
      positioning == ol.AnchoredElementPositioning.TOP_RIGHT) {
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
