/**
 * @module ol/Overlay
 */
import {inherits} from './util.js';
import MapEventType from './MapEventType.js';
import BaseObject, {getChangeEventType} from './Object.js';
import OverlayPositioning from './OverlayPositioning.js';
import {CLASS_SELECTABLE} from './css.js';
import {removeNode, removeChildren, outerWidth, outerHeight} from './dom.js';
import {listen, unlistenByKey} from './events.js';
import {containsExtent} from './extent.js';


/**
 * @typedef {Object} Options
 * @property {number|string} [id] Set the overlay id. The overlay id can be used
 * with the {@link module:ol/Map~Map#getOverlayById} method.
 * @property {Element} [element] The overlay element.
 * @property {Array.<number>} [offset=[0, 0]] Offsets in pixels used when positioning
 * the overlay. The first element in the
 * array is the horizontal offset. A positive value shifts the overlay right.
 * The second element in the array is the vertical offset. A positive value
 * shifts the overlay down.
 * @property {module:ol/coordinate~Coordinate} [position] The overlay position
 * in map projection.
 * @property {module:ol/OverlayPositioning} [positioning='top-left'] Defines how
 * the overlay is actually positioned with respect to its `position` property.
 * Possible values are `'bottom-left'`, `'bottom-center'`, `'bottom-right'`,
 * `'center-left'`, `'center-center'`, `'center-right'`, `'top-left'`,
 * `'top-center'`, and `'top-right'`.
 * @property {boolean} [stopEvent=true] Whether event propagation to the map
 * viewport should be stopped. If `true` the overlay is placed in the same
 * container as that of the controls (CSS class name
 * `ol-overlaycontainer-stopevent`); if `false` it is placed in the container
 * with CSS class name specified by the `className` property.
 * @property {boolean} [insertFirst=true] Whether the overlay is inserted first
 * in the overlay container, or appended. If the overlay is placed in the same
 * container as that of the controls (see the `stopEvent` option) you will
 * probably set `insertFirst` to `true` so the overlay is displayed below the
 * controls.
 * @property {boolean} [autoPan=false] If set to `true` the map is panned when
 * calling `setPosition`, so that the overlay is entirely visible in the current
 * viewport.
 * @property {module:ol/Overlay~PanOptions} [autoPanAnimation] The
 * animation options used to pan the overlay into view. This animation is only
 * used when `autoPan` is enabled. A `duration` and `easing` may be provided to
 * customize the animation.
 * @property {number} [autoPanMargin=20] The margin (in pixels) between the
 * overlay and the borders of the map when autopanning.
 * @property {string} [className='ol-overlay-container ol-selectable'] CSS class
 * name.
 */


/**
 * @typedef {Object} PanOptions
 * @property {number} [duration=1000] The duration of the animation in
 * milliseconds.
 * @property {function(number):number} [easing] The easing function to use. Can
 * be one from {@link module:ol/easing} or a custom function.
 * Default is {@link module:ol/easing~inAndOut}.
 */


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
 * location.  Like {@link module:ol/control/Control~Control}, Overlays are
 * visible widgets. Unlike Controls, they are not in a fixed position on the
 * screen, but are tied to a geographical coordinate, so panning the map will
 * move an Overlay but not a Control.
 *
 * Example:
 *
 *     import Overlay from 'ol/Overlay';
 *
 *     var popup = new Overlay({
 *       element: document.getElementById('popup')
 *     });
 *     popup.setPosition(coordinate);
 *     map.addOverlay(popup);
 *
 * @constructor
 * @extends {module:ol/Object}
 * @param {module:ol/Overlay~Options} options Overlay options.
 * @api
 */
const Overlay = function(options) {

  BaseObject.call(this);

  /**
   * @protected
   * @type {module:ol/Overlay~Options}
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
   * @type {module:ol/Overlay~PanOptions}
   */
  this.autoPanAnimation = options.autoPanAnimation || /** @type {module:ol/Overlay~PanOptions} */ ({});

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
   * @type {?module:ol/events~EventsKey}
   */
  this.mapPostrenderListenerKey = null;

  listen(
    this, getChangeEventType(Property.ELEMENT),
    this.handleElementChanged, this);

  listen(
    this, getChangeEventType(Property.MAP),
    this.handleMapChanged, this);

  listen(
    this, getChangeEventType(Property.OFFSET),
    this.handleOffsetChanged, this);

  listen(
    this, getChangeEventType(Property.POSITION),
    this.handlePositionChanged, this);

  listen(
    this, getChangeEventType(Property.POSITIONING),
    this.handlePositioningChanged, this);

  if (options.element !== undefined) {
    this.setElement(options.element);
  }

  this.setOffset(options.offset !== undefined ? options.offset : [0, 0]);

  this.setPositioning(options.positioning !== undefined ?
    /** @type {module:ol/OverlayPositioning} */ (options.positioning) :
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
  return /** @type {Element|undefined} */ (this.get(Property.ELEMENT));
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
 * @return {module:ol/PluggableMap|undefined} The map that the
 * overlay is part of.
 * @observable
 * @api
 */
Overlay.prototype.getMap = function() {
  return (
    /** @type {module:ol/PluggableMap|undefined} */ (this.get(Property.MAP))
  );
};


/**
 * Get the offset of this overlay.
 * @return {Array.<number>} The offset.
 * @observable
 * @api
 */
Overlay.prototype.getOffset = function() {
  return /** @type {Array.<number>} */ (this.get(Property.OFFSET));
};


/**
 * Get the current position of this overlay.
 * @return {module:ol/coordinate~Coordinate|undefined} The spatial point that the overlay is
 *     anchored at.
 * @observable
 * @api
 */
Overlay.prototype.getPosition = function() {
  return (
    /** @type {module:ol/coordinate~Coordinate|undefined} */ (this.get(Property.POSITION))
  );
};


/**
 * Get the current positioning of this overlay.
 * @return {module:ol/OverlayPositioning} How the overlay is positioned
 *     relative to its point on the map.
 * @observable
 * @api
 */
Overlay.prototype.getPositioning = function() {
  return (
    /** @type {module:ol/OverlayPositioning} */ (this.get(Property.POSITIONING))
  );
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
 * @param {module:ol/PluggableMap|undefined} map The map that the
 * overlay is part of.
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
 * @param {module:ol/coordinate~Coordinate|undefined} position The spatial point that the overlay
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
      const center = /** @type {module:ol/coordinate~Coordinate} */ (map.getView().getCenter());
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
 * @param {module:ol/size~Size|undefined} size The size of the element.
 * @return {module:ol/extent~Extent} The extent.
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
 * @param {module:ol/OverlayPositioning} positioning how the overlay is
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
 * @param {module:ol~Pixel} pixel The pixel location.
 * @param {module:ol/size~Size|undefined} mapSize The map size.
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
 * @return {module:ol/Overlay~Options} overlay options
 */
Overlay.prototype.getOptions = function() {
  return this.options;
};

export default Overlay;
