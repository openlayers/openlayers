/**
 * @module ol/Overlay
 */
import BaseObject from './Object.js';
import MapEventType from './MapEventType.js';
import {CLASS_SELECTABLE} from './css.js';
import {containsExtent} from './extent.js';
import {listen, unlistenByKey} from './events.js';
import {outerHeight, outerWidth, removeChildren, removeNode} from './dom.js';

/**
 * @typedef {'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-center' | 'center-right' | 'top-left' | 'top-center' | 'top-right'} Positioning
 * The overlay position: `'bottom-left'`, `'bottom-center'`,  `'bottom-right'`,
 * `'center-left'`, `'center-center'`, `'center-right'`, `'top-left'`,
 * `'top-center'`, or `'top-right'`.
 */

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
 * @property {Positioning} [positioning='top-left'] Defines how
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
 * @property {PanIntoViewOptions|boolean} [autoPan=false] Pan the map when calling
 * `setPosition`, so that the overlay is entirely visible in the current viewport?
 * If `true` (deprecated), then `autoPanAnimation` and `autoPanMargin` will be
 * used to determine the panning parameters; if an object is supplied then other
 * parameters are ignored.
 * @property {PanOptions} [autoPanAnimation] The animation options used to pan
 * the overlay into view. This animation is only used when `autoPan` is enabled.
 * A `duration` and `easing` may be provided to customize the animation.
 * Deprecated and ignored if `autoPan` is supplied as an object.
 * @property {number} [autoPanMargin=20] The margin (in pixels) between the
 * overlay and the borders of the map when autopanning. Deprecated and ignored
 * if `autoPan` is supplied as an object.
 * @property {PanIntoViewOptions} [autoPanOptions] The options to use for the
 * autoPan. This is only used when `autoPan` is enabled and has preference over
 * the individual `autoPanMargin` and `autoPanOptions`.
 * @property {string} [className='ol-overlay-container ol-selectable'] CSS class
 * name.
 */

/**
 * @typedef {Object} PanOptions
 * @property {number} [duration=1000] The duration of the animation in
 * milliseconds.
 * @property {function(number):number} [easing] The easing function to use. Can
 * be one from {@link module:ol/easing} or a custom function.
 * Default is {@link module:ol/easing.inAndOut}.
 */

/**
 * @typedef {Object} PanIntoViewOptions
 * @property {PanOptions} [animation={}] The animation parameters for the pan
 * @property {number} [margin=20] The margin (in pixels) between the
 * overlay and the borders of the map when panning into view.
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
  POSITIONING: 'positioning',
};

/**
 * @typedef {import("./ObjectEventType").Types|'change:element'|'change:map'|'change:offset'|'change:position'|
 *   'change:positioning'} OverlayObjectEventTypes
 */

/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *   import("./Observable").OnSignature<OverlayObjectEventTypes, import("./Object").ObjectEvent, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|OverlayObjectEventTypes, Return>} OverlayOnSignature
 */

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

    /***
     * @type {OverlayOnSignature<import("./events").EventsKey>}
     */
    this.on;

    /***
     * @type {OverlayOnSignature<import("./events").EventsKey>}
     */
    this.once;

    /***
     * @type {OverlayOnSignature<void>}
     */
    this.un;

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
    this.insertFirst =
      options.insertFirst !== undefined ? options.insertFirst : true;

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
    this.element.className =
      options.className !== undefined
        ? options.className
        : 'ol-overlay-container ' + CLASS_SELECTABLE;
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'auto';

    let autoPan = options.autoPan;
    if (autoPan && 'object' !== typeof autoPan) {
      autoPan = {
        animation: options.autoPanAnimation,
        margin: options.autoPanMargin,
      };
    }
    /**
     * @protected
     * @type {PanIntoViewOptions|false}
     */
    this.autoPan = /** @type {PanIntoViewOptions} */ (autoPan) || false;

    /**
     * @protected
     * @type {{transform_: string,
     *         visible: boolean}}
     */
    this.rendered = {
      transform_: '',
      visible: true,
    };

    /**
     * @protected
     * @type {?import("./events.js").EventsKey}
     */
    this.mapPostrenderListenerKey = null;

    this.addChangeListener(Property.ELEMENT, this.handleElementChanged);
    this.addChangeListener(Property.MAP, this.handleMapChanged);
    this.addChangeListener(Property.OFFSET, this.handleOffsetChanged);
    this.addChangeListener(Property.POSITION, this.handlePositionChanged);
    this.addChangeListener(Property.POSITIONING, this.handlePositioningChanged);

    if (options.element !== undefined) {
      this.setElement(options.element);
    }

    this.setOffset(options.offset !== undefined ? options.offset : [0, 0]);

    this.setPositioning(options.positioning || 'top-left');

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
   * @return {import("./PluggableMap.js").default|null} The map that the
   * overlay is part of.
   * @observable
   * @api
   */
  getMap() {
    return /** @type {import("./PluggableMap.js").default|null} */ (
      this.get(Property.MAP) || null
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
    return /** @type {import("./coordinate.js").Coordinate|undefined} */ (
      this.get(Property.POSITION)
    );
  }

  /**
   * Get the current positioning of this overlay.
   * @return {Positioning} How the overlay is positioned
   *     relative to its point on the map.
   * @observable
   * @api
   */
  getPositioning() {
    return /** @type {Positioning} */ (this.get(Property.POSITIONING));
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
      this.mapPostrenderListenerKey = listen(
        map,
        MapEventType.POSTRENDER,
        this.render,
        this
      );
      this.updatePixelPosition();
      const container = this.stopEvent
        ? map.getOverlayContainerStopEvent()
        : map.getOverlayContainer();
      if (this.insertFirst) {
        container.insertBefore(this.element, container.childNodes[0] || null);
      } else {
        container.appendChild(this.element);
      }
      this.performAutoPan();
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
    this.performAutoPan();
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
   * @param {import("./PluggableMap.js").default|null} map The map that the
   * overlay is part of. Pass `null` to just remove the overlay from the current map.
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
   * (if necessary) using the configured autoPan parameters
   * @protected
   */
  performAutoPan() {
    if (this.autoPan) {
      this.panIntoView(this.autoPan);
    }
  }

  /**
   * Pan the map so that the overlay is entirely visible in the current viewport
   * (if necessary).
   * @param {PanIntoViewOptions} [opt_panIntoViewOptions] Options for the pan action
   * @api
   */
  panIntoView(opt_panIntoViewOptions) {
    const map = this.getMap();

    if (!map || !map.getTargetElement() || !this.get(Property.POSITION)) {
      return;
    }

    const mapRect = this.getRect(map.getTargetElement(), map.getSize());
    const element = this.getElement();
    const overlayRect = this.getRect(element, [
      outerWidth(element),
      outerHeight(element),
    ]);

    const panIntoViewOptions = opt_panIntoViewOptions || {};

    const myMargin =
      panIntoViewOptions.margin === undefined ? 20 : panIntoViewOptions.margin;
    if (!containsExtent(mapRect, overlayRect)) {
      // the overlay is not completely inside the viewport, so pan the map
      const offsetLeft = overlayRect[0] - mapRect[0];
      const offsetRight = mapRect[2] - overlayRect[2];
      const offsetTop = overlayRect[1] - mapRect[1];
      const offsetBottom = mapRect[3] - overlayRect[3];

      const delta = [0, 0];
      if (offsetLeft < 0) {
        // move map to the left
        delta[0] = offsetLeft - myMargin;
      } else if (offsetRight < 0) {
        // move map to the right
        delta[0] = Math.abs(offsetRight) + myMargin;
      }
      if (offsetTop < 0) {
        // move map up
        delta[1] = offsetTop - myMargin;
      } else if (offsetBottom < 0) {
        // move map down
        delta[1] = Math.abs(offsetBottom) + myMargin;
      }

      if (delta[0] !== 0 || delta[1] !== 0) {
        const center = /** @type {import("./coordinate.js").Coordinate} */ (
          map.getView().getCenterInternal()
        );
        const centerPx = map.getPixelFromCoordinateInternal(center);
        if (!centerPx) {
          return;
        }
        const newCenterPx = [centerPx[0] + delta[0], centerPx[1] + delta[1]];

        const panOptions = panIntoViewOptions.animation || {};
        map.getView().animateInternal({
          center: map.getCoordinateFromPixelInternal(newCenterPx),
          duration: panOptions.duration,
          easing: panOptions.easing,
        });
      }
    }
  }

  /**
   * Get the extent of an element relative to the document
   * @param {HTMLElement} element The element.
   * @param {import("./size.js").Size} size The size of the element.
   * @return {import("./extent.js").Extent} The extent.
   * @protected
   */
  getRect(element, size) {
    const box = element.getBoundingClientRect();
    const offsetX = box.left + window.pageXOffset;
    const offsetY = box.top + window.pageYOffset;
    return [offsetX, offsetY, offsetX + size[0], offsetY + size[1]];
  }

  /**
   * Set the positioning for this overlay.
   * @param {Positioning} positioning how the overlay is
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

    const x = Math.round(pixel[0] + offset[0]) + 'px';
    const y = Math.round(pixel[1] + offset[1]) + 'px';
    let posX = '0%';
    let posY = '0%';
    if (
      positioning == 'bottom-right' ||
      positioning == 'center-right' ||
      positioning == 'top-right'
    ) {
      posX = '-100%';
    } else if (
      positioning == 'bottom-center' ||
      positioning == 'center-center' ||
      positioning == 'top-center'
    ) {
      posX = '-50%';
    }
    if (
      positioning == 'bottom-left' ||
      positioning == 'bottom-center' ||
      positioning == 'bottom-right'
    ) {
      posY = '-100%';
    } else if (
      positioning == 'center-left' ||
      positioning == 'center-center' ||
      positioning == 'center-right'
    ) {
      posY = '-50%';
    }
    const transform = `translate(${posX}, ${posY}) translate(${x}, ${y})`;
    if (this.rendered.transform_ != transform) {
      this.rendered.transform_ = transform;
      style.transform = transform;
      // @ts-ignore IE9
      style.msTransform = transform;
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
