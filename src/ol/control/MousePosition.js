/**
 * @module ol/control/MousePosition
 */

import Control from './Control.js';
import EventType from '../pointer/EventType.js';
import {
  get as getProjection,
  getTransformFromProjections,
  getUserProjection,
  identityTransform,
} from '../proj.js';
import {listen} from '../events.js';

/**
 * @type {string}
 */
const PROJECTION = 'projection';

/**
 * @type {string}
 */
const COORDINATE_FORMAT = 'coordinateFormat';

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:coordinateFormat'|'change:projection', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:coordinateFormat'|'change:projection', Return>} MousePositionOnSignature
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-mouse-position'] CSS class name.
 * @property {import("../coordinate.js").CoordinateFormat} [coordinateFormat] Coordinate format.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {function(import("../MapEvent.js").default):void} [render] Function called when the
 * control should be re-rendered. This is called in a `requestAnimationFrame`
 * callback.
 * @property {HTMLElement|string} [target] Specify a target if you want the
 * control to be rendered outside of the map's viewport.
 * @property {string|boolean} [placeholder] Markup to show when the mouse position is not
 * available (e.g. when the pointer leaves the map viewport).  By default, a non-breaking space
 * is rendered when the mouse leaves the viewport.  To render something else, provide a string
 * to be used as the text content (e.g. 'no position' or '' for an empty string).  Set the placeholder
 * to `false` to retain the last position when the mouse leaves the viewport.  In a future release, this
 * will be the default behavior.
 * @property {string} [undefinedHTML='&#160;'] This option is deprecated.  Use the `placeholder` option instead.
 */

/**
 * @classdesc
 * A control to show the 2D coordinates of the mouse cursor. By default, these
 * are in the view projection, but can be in any supported projection.
 * By default the control is shown in the top right corner of the map, but this
 * can be changed by using the css selector `.ol-mouse-position`.
 *
 * On touch devices, which usually do not have a mouse cursor, the coordinates
 * of the currently touched position are shown.
 *
 * @api
 */
class MousePosition extends Control {
  /**
   * @param {Options} [opt_options] Mouse position options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    const element = document.createElement('div');
    element.className =
      options.className !== undefined ? options.className : 'ol-mouse-position';

    super({
      element: element,
      render: options.render,
      target: options.target,
    });

    /***
     * @type {MousePositionOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {MousePositionOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {MousePositionOnSignature<void>}
     */
    this.un;

    this.addChangeListener(PROJECTION, this.handleProjectionChanged_);

    if (options.coordinateFormat) {
      this.setCoordinateFormat(options.coordinateFormat);
    }
    if (options.projection) {
      this.setProjection(options.projection);
    }

    /**
     * Change this to `false` when removing the deprecated `undefinedHTML` option.
     * @type {boolean}
     */
    let renderOnMouseOut = true;

    /**
     * @type {string}
     */
    let placeholder = '&#160;';

    if ('undefinedHTML' in options) {
      // deprecated behavior
      if (options.undefinedHTML !== undefined) {
        placeholder = options.undefinedHTML;
      }
      renderOnMouseOut = !!placeholder;
    } else if ('placeholder' in options) {
      if (options.placeholder === false) {
        renderOnMouseOut = false;
      } else {
        placeholder = String(options.placeholder);
      }
    }

    /**
     * @private
     * @type {string}
     */
    this.placeholder_ = placeholder;

    /**
     * @private
     * @type {boolean}
     */
    this.renderOnMouseOut_ = renderOnMouseOut;

    /**
     * @private
     * @type {string}
     */
    this.renderedHTML_ = element.innerHTML;

    /**
     * @private
     * @type {?import("../proj/Projection.js").default}
     */
    this.mapProjection_ = null;

    /**
     * @private
     * @type {?import("../proj.js").TransformFunction}
     */
    this.transform_ = null;
  }

  /**
   * @private
   */
  handleProjectionChanged_() {
    this.transform_ = null;
  }

  /**
   * Return the coordinate format type used to render the current position or
   * undefined.
   * @return {import("../coordinate.js").CoordinateFormat|undefined} The format to render the current
   *     position in.
   * @observable
   * @api
   */
  getCoordinateFormat() {
    return /** @type {import("../coordinate.js").CoordinateFormat|undefined} */ (
      this.get(COORDINATE_FORMAT)
    );
  }

  /**
   * Return the projection that is used to report the mouse position.
   * @return {import("../proj/Projection.js").default|undefined} The projection to report mouse
   *     position in.
   * @observable
   * @api
   */
  getProjection() {
    return /** @type {import("../proj/Projection.js").default|undefined} */ (
      this.get(PROJECTION)
    );
  }

  /**
   * @param {MouseEvent} event Browser event.
   * @protected
   */
  handleMouseMove(event) {
    const map = this.getMap();
    this.updateHTML_(map.getEventPixel(event));
  }

  /**
   * @param {Event} event Browser event.
   * @protected
   */
  handleMouseOut(event) {
    this.updateHTML_(null);
  }

  /**
   * Remove the control from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
   * @api
   */
  setMap(map) {
    super.setMap(map);
    if (map) {
      const viewport = map.getViewport();
      this.listenerKeys.push(
        listen(viewport, EventType.POINTERMOVE, this.handleMouseMove, this)
      );
      if (this.renderOnMouseOut_) {
        this.listenerKeys.push(
          listen(viewport, EventType.POINTEROUT, this.handleMouseOut, this)
        );
      }
      this.updateHTML_(null);
    }
  }

  /**
   * Set the coordinate format type used to render the current position.
   * @param {import("../coordinate.js").CoordinateFormat} format The format to render the current
   *     position in.
   * @observable
   * @api
   */
  setCoordinateFormat(format) {
    this.set(COORDINATE_FORMAT, format);
  }

  /**
   * Set the projection that is used to report the mouse position.
   * @param {import("../proj.js").ProjectionLike} projection The projection to report mouse
   *     position in.
   * @observable
   * @api
   */
  setProjection(projection) {
    this.set(PROJECTION, getProjection(projection));
  }

  /**
   * @param {?import("../pixel.js").Pixel} pixel Pixel.
   * @private
   */
  updateHTML_(pixel) {
    let html = this.placeholder_;
    if (pixel && this.mapProjection_) {
      if (!this.transform_) {
        const projection = this.getProjection();
        if (projection) {
          this.transform_ = getTransformFromProjections(
            this.mapProjection_,
            projection
          );
        } else {
          this.transform_ = identityTransform;
        }
      }
      const map = this.getMap();
      const coordinate = map.getCoordinateFromPixelInternal(pixel);
      if (coordinate) {
        const userProjection = getUserProjection();
        if (userProjection) {
          this.transform_ = getTransformFromProjections(
            this.mapProjection_,
            userProjection
          );
        }
        this.transform_(coordinate, coordinate);
        const coordinateFormat = this.getCoordinateFormat();
        if (coordinateFormat) {
          html = coordinateFormat(coordinate);
        } else {
          html = coordinate.toString();
        }
      }
    }
    if (!this.renderedHTML_ || html !== this.renderedHTML_) {
      this.element.innerHTML = html;
      this.renderedHTML_ = html;
    }
  }

  /**
   * Update the projection. Rendering of the coordinates is done in
   * `handleMouseMove` and `handleMouseUp`.
   * @param {import("../MapEvent.js").default} mapEvent Map event.
   * @override
   */
  render(mapEvent) {
    const frameState = mapEvent.frameState;
    if (!frameState) {
      this.mapProjection_ = null;
    } else {
      if (this.mapProjection_ != frameState.viewState.projection) {
        this.mapProjection_ = frameState.viewState.projection;
        this.transform_ = null;
      }
    }
  }
}

export default MousePosition;
