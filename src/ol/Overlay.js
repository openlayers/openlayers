/**
 * @module ol/Overlay
 */
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
 * @property {HTMLElement} [element] The overlay element.
 * @property {Array<number>} [offset=[0, 0]] Offsets in pixels used when positioning
 * the overlay. The first element in the
 * array is the horizontal offset. A positive value shifts the overlay right.
 * The second element in the array is the vertical offset. A positive value
 * shifts the overlay down.
 * @property {import("./coordinate.js").Coordinate} [position] The overlay position
 * in map projection.
 * @property {OverlayPositioning} [positioning='top-left'] Defines how
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
 * @property {PanOptions} [autoPanAnimation] The
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
 * @api
 */
class Overlay extends BaseObject {

  /**
   * @param {Options} options Overlay options.
   */
  constructor(options) {

    super();

    /**
     * @protected
     * @type {Options}
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
     * @type {HTMLElement}
     */
    this.element = document.createElement('div');
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
     * @type {PanOptions}
     */
    this.autoPanAnimation = options.autoPanAnimation || /** @type {PanOptions} */ ({});

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
     * @type {?import("./events.js").EventsKey}
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
      /** @type {OverlayPositioning} */ (options.positioning) :
      OverlayPositioning.TOP_LEFT);

    if (options.position !== undefined) {
      this.setPosition(options.position);
    }

  }

  /**
   * Get the DOM element of this overlay.
   * @return {HTMLElement|undefined} The Element containing the overlay.
   * @observable
   * @api
   */
  getElement() {
    return /** @type {HTMLElement|undefined} */ (this.get(Property.ELEMENT));
  }

  /**
   * Get the overlay identifier which is set on constructor.
   * @return {number|string|undefined} Id.
   * @api
   */
  getId() {
    return this.id;
  }

  /**
   * Get the map associated with this overlay.
   * @return {import("./PluggableMap.js").default|undefined} The map that the
   * overlay is part of.
   * @observable
   * @api
   */
  getMap() {
    return (
      /** @type {import("./PluggableMap.js").default|undefined} */ (this.get(Property.MAP))
    );
  }

  /**
   * Get the offset of this overlay.
   * @return {Array<number>} The offset.
   * @observable
   * @api
   */
  getOffset() {
    return /** @type {Array<number>} */ (this.get(Property.OFFSET));
  }

  /**
   * Get the current position of this overlay.
   * @return {import("./coordinate.js").Coordinate|undefined} The spatial point that the overlay is
   *     anchored at.
   * @observable
   * @api
   */
  getPosition() {
    return (
      /** @type {import("./coordinate.js").Coordinate|undefined} */ (this.get(Property.POSITION))
    );
  }

  /**
   * Get the current positioning of this overlay.
   * @return {OverlayPositioning} How the overlay is positioned
   *     relative to its point on the map.
   * @observable
   * @api
   */
  getPositioning() {
    return (
      /** @type {OverlayPositioning} */ (this.get(Property.POSITIONING))
    );
  }

  /**
   * @protected
   */
  handleElementChanged() {
    removeChildren(this.element);
    const element = this.getElement();
    if (element) {
      this.element.appendChild(element);
    }
  }

  /**
   * @protected
   */
  handleMapChanged() {
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
  }

  /**
   * @protected
   */
  render() {
    this.updatePixelPosition();
  }

  /**
   * @protected
   */
  handleOffsetChanged() {
    this.updatePixelPosition();
  }

  /**
   * @protected
   */
  handlePositionChanged() {
    this.updatePixelPosition();
    if (this.get(Property.POSITION) && this.autoPan) {
      this.panIntoView();
    }
  }

  /**
   * @protected
   */
  handlePositioningChanged() {
    this.updatePixelPosition();
  }

  /**
   * Set the DOM element to be associated with this overlay.
   * @param {HTMLElement|undefined} element The Element containing the overlay.
   * @observable
   * @api
   */
  setElement(element) {
    this.set(Property.ELEMENT, element);
  }

  /**
   * Set the map to be associated with this overlay.
   * @param {import("./PluggableMap.js").default|undefined} map The map that the
   * overlay is part of.
   * @observable
   * @api
   */
  setMap(map) {
    this.set(Property.MAP, map);
  }

  /**
   * Set the offset for this overlay.
   * @param {Array<number>} offset Offset.
   * @observable
   * @api
   */
  setOffset(offset) {
    this.set(Property.OFFSET, offset);
  }

  /**
   * Set the position for this overlay. If the position is `undefined` the
   * overlay is hidden.
   * @param {import("./coordinate.js").Coordinate|undefined} position The spatial point that the overlay
   *     is anchored at.
   * @observable
   * @api
   */
  setPosition(position) {
    this.set(Property.POSITION, position);
  }

  /**
   * Pan the map so that the overlay is entirely visible in the current viewport
   * (if necessary).
   * @protected
   */
  panIntoView() {
    const map = this.getMap();

    if (!map || !map.getTargetElement()) {
      return;
    }

    const mapRect = this.getRect(map.getTargetElement(), map.getSize());
    const element = this.getElement();
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
        const center = /** @type {import("./coordinate.js").Coordinate} */ (map.getView().getCenter());
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
  }

  /**
   * Get the extent of an element relative to the document
   * @param {HTMLElement|undefined} element The element.
   * @param {import("./size.js").Size|undefined} size The size of the element.
   * @return {import("./extent.js").Extent} The extent.
   * @protected
   */
  getRect(element, size) {
    const box = element.getBoundingClientRect();
    const offsetX = box.left + window.pageXOffset;
    const offsetY = box.top + window.pageYOffset;
    return [
      offsetX,
      offsetY,
      offsetX + size[0],
      offsetY + size[1]
    ];
  }

  /**
   * Set the positioning for this overlay.
   * @param {OverlayPositioning} positioning how the overlay is
   *     positioned relative to its point on the map.
   * @observable
   * @api
   */
  setPositioning(positioning) {
    this.set(Property.POSITIONING, positioning);
  }

  /**
   * Modify the visibility of the element.
   * @param {boolean} visible Element visibility.
   * @protected
   */
  setVisible(visible) {
    if (this.rendered.visible !== visible) {
      this.element.style.display = visible ? '' : 'none';
      this.rendered.visible = visible;
    }
  }

  /**
   * Update pixel position.
   * @protected
   */
  updatePixelPosition() {
    const map = this.getMap();
    const position = this.getPosition();
    if (!map || !map.isRendered() || !position) {
      this.setVisible(false);
      return;
    }

    const pixel = map.getPixelFromCoordinate(position);
    const mapSize = map.getSize();
    this.updateRenderedPosition(pixel, mapSize);
  }

  /**
   * @param {import("./pixel.js").Pixel} pixel The pixel location.
   * @param {import("./size.js").Size|undefined} mapSize The map size.
   * @protected
   */
  updateRenderedPosition(pixel, mapSize) {
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
  }

  /**
   * returns the options this Overlay has been created with
   * @return {Options} overlay options
   */
  getOptions() {
    return this.options;
  }
}


export default Overlay;
