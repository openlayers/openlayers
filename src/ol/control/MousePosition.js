/**
 * @module ol/control/MousePosition
 */

import 'elm-pep';
import {listen} from '../events.js';
import EventType from '../pointer/EventType.js';
import {getChangeEventType} from '../Object.js';
import Control from './Control.js';
import {getTransformFromProjections, identityTransform, get as getProjection, getUserProjection} from '../proj.js';


/**
 * @type {string}
 */
const PROJECTION = 'projection';

/**
 * @type {string}
 */
const COORDINATE_FORMAT = 'coordinateFormat';


/**
 * @typedef {Object} Options
 * @property {string} [className='ol-mouse-position'] CSS class name.
 * @property {import("../coordinate.js").CoordinateFormat} [coordinateFormat] Coordinate format.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {function(import("../MapEvent.js").default)} [render] Function called when the
 * control should be re-rendered. This is called in a `requestAnimationFrame`
 * callback.
 * @property {HTMLElement|string} [target] Specify a target if you want the
 * control to be rendered outside of the map's viewport.
 * @property {string} [undefinedHTML='&#160;'] Markup to show when coordinates are not
 * available (e.g. when the pointer leaves the map viewport).  By default, the last position
 * will be replaced with `'&#160;'` (`&nbsp;`) when the pointer leaves the viewport.  To
 * retain the last rendered position, set this option to something falsey (like an empty
 * string `''`).
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
   * @param {Options=} opt_options Mouse position options.
   */
  constructor(opt_options) {

    const options = opt_options ? opt_options : {};

    const element = document.createElement('div');
    element.className = options.className !== undefined ? options.className : 'ol-mouse-position';

    super({
      element: element,
      render: options.render || render,
      target: options.target
    });

    this.addEventListener(getChangeEventType(PROJECTION), this.handleProjectionChanged_);

    if (options.coordinateFormat) {
      this.setCoordinateFormat(options.coordinateFormat);
    }
    if (options.projection) {
      this.setProjection(options.projection);
    }

    /**
     * @private
     * @type {string}
     */
    this.undefinedHTML_ = options.undefinedHTML !== undefined ? options.undefinedHTML : '&#160;';

    /**
     * @private
     * @type {boolean}
     */
    this.renderOnMouseOut_ = !!this.undefinedHTML_;

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
    return (
      /** @type {import("../coordinate.js").CoordinateFormat|undefined} */ (this.get(COORDINATE_FORMAT))
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
    return (
      /** @type {import("../proj/Projection.js").default|undefined} */ (this.get(PROJECTION))
    );
  }

  /**
   * @param {Event} event Browser event.
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
   * @inheritDoc
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
    let html = this.undefinedHTML_;
    if (pixel && this.mapProjection_) {
      if (!this.transform_) {
        const projection = this.getProjection();
        if (projection) {
          this.transform_ = getTransformFromProjections(
            this.mapProjection_, projection);
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
            this.mapProjection_, userProjection);
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
}


/**
 * Update the projection. Rendering of the coordinates is done in
 * `handleMouseMove` and `handleMouseUp`.
 * @param {import("../MapEvent.js").default} mapEvent Map event.
 * @this {MousePosition}
 * @api
 */
export function render(mapEvent) {
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


export default MousePosition;
