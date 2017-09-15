goog.provide('ol.Overlay');

goog.require('ol');
goog.require('ol.MapEventType');
goog.require('ol.Object');
goog.require('ol.OverlayPositioning');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.extent');


/**
 * @classdesc
 * An element to be displayed over the map and attached to a single map
 * location.  Like {@link ol.control.Control}, Overlays are visible widgets.
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
 * @api
 */
ol.Overlay = function(options) {

  ol.Object.call(this);

  /**
   * @private
   * @type {number|string|undefined}
   */
  this.id_ = options.id;

  /**
   * @private
   * @type {boolean}
   */
  this.insertFirst_ = options.insertFirst !== undefined ?
    options.insertFirst : true;

  /**
   * @private
   * @type {boolean}
   */
  this.stopEvent_ = options.stopEvent !== undefined ? options.stopEvent : true;

  /**
   * @private
   * @type {Element}
   */
  this.element_ = document.createElement('DIV');
  this.element_.className = 'ol-overlay-container ' + ol.css.CLASS_SELECTABLE;
  this.element_.style.position = 'absolute';

  /**
   * @protected
   * @type {boolean}
   */
  this.autoPan = options.autoPan !== undefined ? options.autoPan : false;

  /**
   * @private
   * @type {olx.OverlayPanOptions}
   */
  this.autoPanAnimation_ = options.autoPanAnimation ||
    /** @type {olx.OverlayPanOptions} */ ({});

  /**
   * @private
   * @type {number}
   */
  this.autoPanMargin_ = options.autoPanMargin !== undefined ?
    options.autoPanMargin : 20;

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
   * @type {?ol.EventsKey}
   */
  this.mapPostrenderListenerKey_ = null;

  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.Overlay.Property_.ELEMENT),
      this.handleElementChanged, this);

  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.Overlay.Property_.MAP),
      this.handleMapChanged, this);

  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.Overlay.Property_.OFFSET),
      this.handleOffsetChanged, this);

  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.Overlay.Property_.POSITION),
      this.handlePositionChanged, this);

  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.Overlay.Property_.POSITIONING),
      this.handlePositioningChanged, this);

  if (options.element !== undefined) {
    this.setElement(options.element);
  }

  this.setOffset(options.offset !== undefined ? options.offset : [0, 0]);

  this.setPositioning(options.positioning !== undefined ?
    /** @type {ol.OverlayPositioning} */ (options.positioning) :
    ol.OverlayPositioning.TOP_LEFT);

  if (options.position !== undefined) {
    this.setPosition(options.position);
  }

};
ol.inherits(ol.Overlay, ol.Object);


/**
 * Get the DOM element of this overlay.
 * @return {Element|undefined} The Element containing the overlay.
 * @observable
 * @api
 */
ol.Overlay.prototype.getElement = function() {
  return /** @type {Element|undefined} */ (
    this.get(ol.Overlay.Property_.ELEMENT));
};


/**
 * Get the overlay identifier which is set on constructor.
 * @return {number|string|undefined} Id.
 * @api
 */
ol.Overlay.prototype.getId = function() {
  return this.id_;
};


/**
 * Get the map associated with this overlay.
 * @return {ol.PluggableMap|undefined} The map that the overlay is part of.
 * @observable
 * @api
 */
ol.Overlay.prototype.getMap = function() {
  return /** @type {ol.PluggableMap|undefined} */ (
    this.get(ol.Overlay.Property_.MAP));
};


/**
 * Get the offset of this overlay.
 * @return {Array.<number>} The offset.
 * @observable
 * @api
 */
ol.Overlay.prototype.getOffset = function() {
  return /** @type {Array.<number>} */ (
    this.get(ol.Overlay.Property_.OFFSET));
};


/**
 * Get the current position of this overlay.
 * @return {ol.Coordinate|undefined} The spatial point that the overlay is
 *     anchored at.
 * @observable
 * @api
 */
ol.Overlay.prototype.getPosition = function() {
  return /** @type {ol.Coordinate|undefined} */ (
    this.get(ol.Overlay.Property_.POSITION));
};


/**
 * Get the current positioning of this overlay.
 * @return {ol.OverlayPositioning} How the overlay is positioned
 *     relative to its point on the map.
 * @observable
 * @api
 */
ol.Overlay.prototype.getPositioning = function() {
  return /** @type {ol.OverlayPositioning} */ (
    this.get(ol.Overlay.Property_.POSITIONING));
};


/**
 * @protected
 */
ol.Overlay.prototype.handleElementChanged = function() {
  ol.dom.removeChildren(this.element_);
  var element = this.getElement();
  if (element) {
    this.element_.appendChild(element);
  }
};


/**
 * @protected
 */
ol.Overlay.prototype.handleMapChanged = function() {
  if (this.mapPostrenderListenerKey_) {
    ol.dom.removeNode(this.element_);
    ol.events.unlistenByKey(this.mapPostrenderListenerKey_);
    this.mapPostrenderListenerKey_ = null;
  }
  var map = this.getMap();
  if (map) {
    this.mapPostrenderListenerKey_ = ol.events.listen(map,
        ol.MapEventType.POSTRENDER, this.render, this);
    this.updatePixelPosition();
    var container = this.stopEvent_ ?
      map.getOverlayContainerStopEvent() : map.getOverlayContainer();
    if (this.insertFirst_) {
      container.insertBefore(this.element_, container.childNodes[0] || null);
    } else {
      container.appendChild(this.element_);
    }
  }
};


/**
 * @protected
 */
ol.Overlay.prototype.render = function() {
  this.updatePixelPosition();
};


/**
 * @protected
 */
ol.Overlay.prototype.handleOffsetChanged = function() {
  this.updatePixelPosition();
};


/**
 * @protected
 */
ol.Overlay.prototype.handlePositionChanged = function() {
  this.updatePixelPosition();
  if (this.get(ol.Overlay.Property_.POSITION) && this.autoPan) {
    this.panIntoView_();
  }
};


/**
 * @protected
 */
ol.Overlay.prototype.handlePositioningChanged = function() {
  this.updatePixelPosition();
};


/**
 * Set the DOM element to be associated with this overlay.
 * @param {Element|undefined} element The Element containing the overlay.
 * @observable
 * @api
 */
ol.Overlay.prototype.setElement = function(element) {
  this.set(ol.Overlay.Property_.ELEMENT, element);
};


/**
 * Set the map to be associated with this overlay.
 * @param {ol.PluggableMap|undefined} map The map that the overlay is part of.
 * @observable
 * @api
 */
ol.Overlay.prototype.setMap = function(map) {
  this.set(ol.Overlay.Property_.MAP, map);
};


/**
 * Set the offset for this overlay.
 * @param {Array.<number>} offset Offset.
 * @observable
 * @api
 */
ol.Overlay.prototype.setOffset = function(offset) {
  this.set(ol.Overlay.Property_.OFFSET, offset);
};


/**
 * Set the position for this overlay. If the position is `undefined` the
 * overlay is hidden.
 * @param {ol.Coordinate|undefined} position The spatial point that the overlay
 *     is anchored at.
 * @observable
 * @api
 */
ol.Overlay.prototype.setPosition = function(position) {
  this.set(ol.Overlay.Property_.POSITION, position);
};


/**
 * Pan the map so that the overlay is entirely visible in the current viewport
 * (if necessary).
 * @private
 */
ol.Overlay.prototype.panIntoView_ = function() {
  var map = this.getMap();

  if (!map || !map.getTargetElement()) {
    return;
  }

  var mapRect = this.getRect_(map.getTargetElement(), map.getSize());
  var element = /** @type {!Element} */ (this.getElement());
  var overlayRect = this.getRect_(element,
      [ol.dom.outerWidth(element), ol.dom.outerHeight(element)]);

  var margin = this.autoPanMargin_;
  if (!ol.extent.containsExtent(mapRect, overlayRect)) {
    // the overlay is not completely inside the viewport, so pan the map
    var offsetLeft = overlayRect[0] - mapRect[0];
    var offsetRight = mapRect[2] - overlayRect[2];
    var offsetTop = overlayRect[1] - mapRect[1];
    var offsetBottom = mapRect[3] - overlayRect[3];

    var delta = [0, 0];
    if (offsetLeft < 0) {
      // move map to the left
      delta[0] = offsetLeft - margin;
    } else if (offsetRight < 0) {
      // move map to the right
      delta[0] = Math.abs(offsetRight) + margin;
    }
    if (offsetTop < 0) {
      // move map up
      delta[1] = offsetTop - margin;
    } else if (offsetBottom < 0) {
      // move map down
      delta[1] = Math.abs(offsetBottom) + margin;
    }

    if (delta[0] !== 0 || delta[1] !== 0) {
      var center = /** @type {ol.Coordinate} */ (map.getView().getCenter());
      var centerPx = map.getPixelFromCoordinate(center);
      var newCenterPx = [
        centerPx[0] + delta[0],
        centerPx[1] + delta[1]
      ];

      map.getView().animate({
        center: map.getCoordinateFromPixel(newCenterPx),
        duration: this.autoPanAnimation_.duration,
        easing: this.autoPanAnimation_.easing
      });
    }
  }
};


/**
 * Get the extent of an element relative to the document
 * @param {Element|undefined} element The element.
 * @param {ol.Size|undefined} size The size of the element.
 * @return {ol.Extent} The extent.
 * @private
 */
ol.Overlay.prototype.getRect_ = function(element, size) {
  var box = element.getBoundingClientRect();
  var offsetX = box.left + window.pageXOffset;
  var offsetY = box.top + window.pageYOffset;
  return [
    offsetX,
    offsetY,
    offsetX + size[0],
    offsetY + size[1]
  ];
};


/**
 * Set the positioning for this overlay.
 * @param {ol.OverlayPositioning} positioning how the overlay is
 *     positioned relative to its point on the map.
 * @observable
 * @api
 */
ol.Overlay.prototype.setPositioning = function(positioning) {
  this.set(ol.Overlay.Property_.POSITIONING, positioning);
};


/**
 * Modify the visibility of the element.
 * @param {boolean} visible Element visibility.
 * @protected
 */
ol.Overlay.prototype.setVisible = function(visible) {
  if (this.rendered_.visible !== visible) {
    this.element_.style.display = visible ? '' : 'none';
    this.rendered_.visible = visible;
  }
};


/**
 * Update pixel position.
 * @protected
 */
ol.Overlay.prototype.updatePixelPosition = function() {
  var map = this.getMap();
  var position = this.getPosition();
  if (!map || !map.isRendered() || !position) {
    this.setVisible(false);
    return;
  }

  var pixel = map.getPixelFromCoordinate(position);
  var mapSize = map.getSize();
  this.updateRenderedPosition(pixel, mapSize);
};


/**
 * @param {ol.Pixel} pixel The pixel location.
 * @param {ol.Size|undefined} mapSize The map size.
 * @protected
 */
ol.Overlay.prototype.updateRenderedPosition = function(pixel, mapSize) {
  var style = this.element_.style;
  var offset = this.getOffset();

  var positioning = this.getPositioning();

  this.setVisible(true);

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
      offsetX -= this.element_.offsetWidth / 2;
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
      offsetY -= this.element_.offsetHeight / 2;
    }
    var top = Math.round(pixel[1] + offsetY) + 'px';
    if (this.rendered_.top_ != top) {
      this.rendered_.top_ = style.top = top;
    }
  }
};


/**
 * @enum {string}
 * @private
 */
ol.Overlay.Property_ = {
  ELEMENT: 'element',
  MAP: 'map',
  OFFSET: 'offset',
  POSITION: 'position',
  POSITIONING: 'positioning'
};
