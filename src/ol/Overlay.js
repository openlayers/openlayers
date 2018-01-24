/**
 * @module ol/Overlay
 */
import {inherits} from './index.js';
import MapEventType from './MapEventType.js';
import BaseObject from './Object.js';
import OverlayPositioning from './OverlayPositioning.js';
import {CLASS_SELECTABLE} from './css.js';
import {removeNode, removeChildren, outerWidth, outerHeight} from './dom.js';
import {listen, unlistenByKey} from './events.js';
import {containsExtent} from './extent.js';


/**
 * @enum {string}
 * @protected
 */
const Property = {
  ELEMENT: 'element',
  MAP: 'map',
  OFFSET: 'offset',
  POSITION: 'position',
  POSITIONING: 'positioning'
};


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
const Overlay = function(options) {

  BaseObject.call(this);

  /**
   * @protected
   * @type {olx.OverlayOptions}
   */
  this.options = options;

  /**
   * @protected
   * @type {number|string|undefined}
   */
  this.id = options.id;

  /**
   * @protected
   * @type {boolean}
   */
  this.insertFirst = options.insertFirst !== undefined ?
    options.insertFirst : true;

  /**
   * @protected
   * @type {boolean}
   */
  this.stopEvent = options.stopEvent !== undefined ? options.stopEvent : true;

  /**
   * @protected
   * @type {Element}
   */
  this.element = document.createElement('DIV');
  this.element.className = options.className !== undefined ?
    options.className : 'ol-overlay-container ' + CLASS_SELECTABLE;
  this.element.style.position = 'absolute';

  /**
   * @protected
   * @type {boolean}
   */
  this.autoPan = options.autoPan !== undefined ? options.autoPan : false;

  /**
   * @protected
   * @type {olx.OverlayPanOptions}
   */
  this.autoPanAnimation = options.autoPanAnimation ||
    /** @type {olx.OverlayPanOptions} */ ({});

  /**
   * @protected
   * @type {number}
   */
  this.autoPanMargin = options.autoPanMargin !== undefined ?
    options.autoPanMargin : 20;

  /**
   * @protected
   * @type {{bottom_: string,
   *         left_: string,
   *         right_: string,
   *         top_: string,
   *         visible: boolean}}
   */
  this.rendered = {
    bottom_: '',
    left_: '',
    right_: '',
    top_: '',
    visible: true
  };

  /**
   * @protected
   * @type {?ol.EventsKey}
   */
  this.mapPostrenderListenerKey = null;

  listen(
    this, BaseObject.getChangeEventType(Property.ELEMENT),
    this.handleElementChanged, this);

  listen(
    this, BaseObject.getChangeEventType(Property.MAP),
    this.handleMapChanged, this);

  listen(
    this, BaseObject.getChangeEventType(Property.OFFSET),
    this.handleOffsetChanged, this);

  listen(
    this, BaseObject.getChangeEventType(Property.POSITION),
    this.handlePositionChanged, this);

  listen(
    this, BaseObject.getChangeEventType(Property.POSITIONING),
    this.handlePositioningChanged, this);

  if (options.element !== undefined) {
    this.setElement(options.element);
  }

  this.setOffset(options.offset !== undefined ? options.offset : [0, 0]);

  this.setPositioning(options.positioning !== undefined ?
    /** @type {ol.OverlayPositioning} */ (options.positioning) :
    OverlayPositioning.TOP_LEFT);

  if (options.position !== undefined) {
    this.setPosition(options.position);
  }

};

inherits(Overlay, BaseObject);


/**
 * Get the DOM element of this overlay.
 * @return {Element|undefined} The Element containing the overlay.
 * @observable
 * @api
 */
Overlay.prototype.getElement = function() {
  return (/** @type {Element|undefined} */ this.get(Property.ELEMENT));
};


/**
 * Get the overlay identifier which is set on constructor.
 * @return {number|string|undefined} Id.
 * @api
 */
Overlay.prototype.getId = function() {
  return this.id;
};


/**
 * Get the map associated with this overlay.
 * @return {ol.PluggableMap|undefined} The map that the overlay is part of.
 * @observable
 * @api
 */
Overlay.prototype.getMap = function() {
  return (/** @type {ol.PluggableMap|undefined} */ this.get(Property.MAP));
};


/**
 * Get the offset of this overlay.
 * @return {Array.<number>} The offset.
 * @observable
 * @api
 */
Overlay.prototype.getOffset = function() {
  return (/** @type {Array.<number>} */ this.get(Property.OFFSET));
};


/**
 * Get the current position of this overlay.
 * @return {ol.Coordinate|undefined} The spatial point that the overlay is
 *     anchored at.
 * @observable
 * @api
 */
Overlay.prototype.getPosition = function() {
  return (/** @type {ol.Coordinate|undefined} */ this.get(Property.POSITION));
};


/**
 * Get the current positioning of this overlay.
 * @return {ol.OverlayPositioning} How the overlay is positioned
 *     relative to its point on the map.
 * @observable
 * @api
 */
Overlay.prototype.getPositioning = function() {
  return (/** @type {ol.OverlayPositioning} */ this.get(Property.POSITIONING));
};


/**
 * @protected
 */
Overlay.prototype.handleElementChanged = function() {
  removeChildren(this.element);
  const element = this.getElement();
  if (element) {
    this.element.appendChild(element);
  }
};


/**
 * @protected
 */
Overlay.prototype.handleMapChanged = function() {
  if (this.mapPostrenderListenerKey) {
    removeNode(this.element);
    unlistenByKey(this.mapPostrenderListenerKey);
    this.mapPostrenderListenerKey = null;
  }
  const map = this.getMap();
  if (map) {
    this.mapPostrenderListenerKey = listen(map,
      MapEventType.POSTRENDER, this.render, this);
    this.updatePixelPosition();
    const container = this.stopEvent ?
      map.getOverlayContainerStopEvent() : map.getOverlayContainer();
    if (this.insertFirst) {
      container.insertBefore(this.element, container.childNodes[0] || null);
    } else {
      container.appendChild(this.element);
    }
  }
};


/**
 * @protected
 */
Overlay.prototype.render = function() {
  this.updatePixelPosition();
};


/**
 * @protected
 */
Overlay.prototype.handleOffsetChanged = function() {
  this.updatePixelPosition();
};


/**
 * @protected
 */
Overlay.prototype.handlePositionChanged = function() {
  this.updatePixelPosition();
  if (this.get(Property.POSITION) && this.autoPan) {
    this.panIntoView();
  }
};


/**
 * @protected
 */
Overlay.prototype.handlePositioningChanged = function() {
  this.updatePixelPosition();
};


/**
 * Set the DOM element to be associated with this overlay.
 * @param {Element|undefined} element The Element containing the overlay.
 * @observable
 * @api
 */
Overlay.prototype.setElement = function(element) {
  this.set(Property.ELEMENT, element);
};


/**
 * Set the map to be associated with this overlay.
 * @param {ol.PluggableMap|undefined} map The map that the overlay is part of.
 * @observable
 * @api
 */
Overlay.prototype.setMap = function(map) {
  this.set(Property.MAP, map);
};


/**
 * Set the offset for this overlay.
 * @param {Array.<number>} offset Offset.
 * @observable
 * @api
 */
Overlay.prototype.setOffset = function(offset) {
  this.set(Property.OFFSET, offset);
};


/**
 * Set the position for this overlay. If the position is `undefined` the
 * overlay is hidden.
 * @param {ol.Coordinate|undefined} position The spatial point that the overlay
 *     is anchored at.
 * @observable
 * @api
 */
Overlay.prototype.setPosition = function(position) {
  this.set(Property.POSITION, position);
};


/**
 * Pan the map so that the overlay is entirely visible in the current viewport
 * (if necessary).
 * @protected
 */
Overlay.prototype.panIntoView = function() {
  const map = this.getMap();

  if (!map || !map.getTargetElement()) {
    return;
  }

  const mapRect = this.getRect(map.getTargetElement(), map.getSize());
  const element = /** @type {!Element} */ (this.getElement());
  const overlayRect = this.getRect(element, [outerWidth(element), outerHeight(element)]);

  const margin = this.autoPanMargin;
  if (!containsExtent(mapRect, overlayRect)) {
    // the overlay is not completely inside the viewport, so pan the map
    const offsetLeft = overlayRect[0] - mapRect[0];
    const offsetRight = mapRect[2] - overlayRect[2];
    const offsetTop = overlayRect[1] - mapRect[1];
    const offsetBottom = mapRect[3] - overlayRect[3];

    const delta = [0, 0];
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
      const center = /** @type {ol.Coordinate} */ (map.getView().getCenter());
      const centerPx = map.getPixelFromCoordinate(center);
      const newCenterPx = [
        centerPx[0] + delta[0],
        centerPx[1] + delta[1]
      ];

      map.getView().animate({
        center: map.getCoordinateFromPixel(newCenterPx),
        duration: this.autoPanAnimation.duration,
        easing: this.autoPanAnimation.easing
      });
    }
  }
};


/**
 * Get the extent of an element relative to the document
 * @param {Element|undefined} element The element.
 * @param {ol.Size|undefined} size The size of the element.
 * @return {ol.Extent} The extent.
 * @protected
 */
Overlay.prototype.getRect = function(element, size) {
  const box = element.getBoundingClientRect();
  const offsetX = box.left + window.pageXOffset;
  const offsetY = box.top + window.pageYOffset;
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
Overlay.prototype.setPositioning = function(positioning) {
  this.set(Property.POSITIONING, positioning);
};


/**
 * Modify the visibility of the element.
 * @param {boolean} visible Element visibility.
 * @protected
 */
Overlay.prototype.setVisible = function(visible) {
  if (this.rendered.visible !== visible) {
    this.element.style.display = visible ? '' : 'none';
    this.rendered.visible = visible;
  }
};


/**
 * Update pixel position.
 * @protected
 */
Overlay.prototype.updatePixelPosition = function() {
  const map = this.getMap();
  const position = this.getPosition();
  if (!map || !map.isRendered() || !position) {
    this.setVisible(false);
    return;
  }

  const pixel = map.getPixelFromCoordinate(position);
  const mapSize = map.getSize();
  this.updateRenderedPosition(pixel, mapSize);
};


/**
 * @param {ol.Pixel} pixel The pixel location.
 * @param {ol.Size|undefined} mapSize The map size.
 * @protected
 */
Overlay.prototype.updateRenderedPosition = function(pixel, mapSize) {
  const style = this.element.style;
  const offset = this.getOffset();

  const positioning = this.getPositioning();

  this.setVisible(true);

  let offsetX = offset[0];
  let offsetY = offset[1];
  if (positioning == OverlayPositioning.BOTTOM_RIGHT ||
      positioning == OverlayPositioning.CENTER_RIGHT ||
      positioning == OverlayPositioning.TOP_RIGHT) {
    if (this.rendered.left_ !== '') {
      this.rendered.left_ = style.left = '';
    }
    const right = Math.round(mapSize[0] - pixel[0] - offsetX) + 'px';
    if (this.rendered.right_ != right) {
      this.rendered.right_ = style.right = right;
    }
  } else {
    if (this.rendered.right_ !== '') {
      this.rendered.right_ = style.right = '';
    }
    if (positioning == OverlayPositioning.BOTTOM_CENTER ||
        positioning == OverlayPositioning.CENTER_CENTER ||
        positioning == OverlayPositioning.TOP_CENTER) {
      offsetX -= this.element.offsetWidth / 2;
    }
    const left = Math.round(pixel[0] + offsetX) + 'px';
    if (this.rendered.left_ != left) {
      this.rendered.left_ = style.left = left;
    }
  }
  if (positioning == OverlayPositioning.BOTTOM_LEFT ||
      positioning == OverlayPositioning.BOTTOM_CENTER ||
      positioning == OverlayPositioning.BOTTOM_RIGHT) {
    if (this.rendered.top_ !== '') {
      this.rendered.top_ = style.top = '';
    }
    const bottom = Math.round(mapSize[1] - pixel[1] - offsetY) + 'px';
    if (this.rendered.bottom_ != bottom) {
      this.rendered.bottom_ = style.bottom = bottom;
    }
  } else {
    if (this.rendered.bottom_ !== '') {
      this.rendered.bottom_ = style.bottom = '';
    }
    if (positioning == OverlayPositioning.CENTER_LEFT ||
        positioning == OverlayPositioning.CENTER_CENTER ||
        positioning == OverlayPositioning.CENTER_RIGHT) {
      offsetY -= this.element.offsetHeight / 2;
    }
    const top = Math.round(pixel[1] + offsetY) + 'px';
    if (this.rendered.top_ != top) {
      this.rendered.top_ = style.top = top;
    }
  }
};


/**
 * returns the options this Overlay has been created with
 * @public
 * @return {olx.OverlayOptions} overlay options
 */
Overlay.prototype.getOptions = function() {
  return this.options;
};

export default Overlay;
