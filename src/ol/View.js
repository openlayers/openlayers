/**
 * @module ol/View
 */
import {DEFAULT_TILE_SIZE} from './tilegrid/common.js';
import {getUid} from './util.js';
import {VOID} from './functions.js';
import {createExtent, none as centerNone} from './centerconstraint.js';
import BaseObject from './Object.js';
import {createSnapToResolutions, createSnapToPower} from './resolutionconstraint.js';
import {createSnapToZero, createSnapToN, none as rotationNone, disable} from './rotationconstraint.js';
import ViewHint from './ViewHint.js';
import ViewProperty from './ViewProperty.js';
import {linearFindNearest} from './array.js';
import {assert} from './asserts.js';
import {add as addCoordinate, rotate as rotateCoordinate, equals as coordinatesEqual} from './coordinate.js';
import {inAndOut} from './easing.js';
import {getForViewAndSize, getCenter, getHeight, getWidth, isEmpty} from './extent.js';
import GeometryType from './geom/GeometryType.js';
import {fromExtent as polygonFromExtent} from './geom/Polygon.js';
import {clamp, modulo} from './math.js';
import {assign} from './obj.js';
import {createProjection, METERS_PER_UNIT} from './proj.js';
import Units from './proj/Units.js';
import {equals} from './coordinate';
import {easeOut} from './easing';
import {createMinMaxResolution} from './resolutionconstraint';


/**
 * An animation configuration
 *
 * @typedef {Object} Animation
 * @property {import("./coordinate.js").Coordinate} [sourceCenter]
 * @property {import("./coordinate.js").Coordinate} [targetCenter]
 * @property {number} [sourceResolution]
 * @property {number} [targetResolution]
 * @property {number} [sourceRotation]
 * @property {number} [targetRotation]
 * @property {import("./coordinate.js").Coordinate} [anchor]
 * @property {number} start
 * @property {number} duration
 * @property {boolean} complete
 * @property {function(number):number} easing
 * @property {function(boolean)} callback
 */


/**
 * @typedef {Object} Constraints
 * @property {import("./centerconstraint.js").Type} center
 * @property {import("./resolutionconstraint.js").Type} resolution
 * @property {import("./rotationconstraint.js").Type} rotation
 */


/**
 * @typedef {Object} FitOptions
 * @property {import("./size.js").Size} [size] The size in pixels of the box to fit
 * the extent into. Default is the current size of the first map in the DOM that
 * uses this view, or `[100, 100]` if no such map is found.
 * @property {!Array<number>} [padding=[0, 0, 0, 0]] Padding (in pixels) to be
 * cleared inside the view. Values in the array are top, right, bottom and left
 * padding.
 * @property {boolean} [nearest=false] If the view `constrainResolution` option is `true`,
 * get the nearest extent instead of the closest that actually fits the view.
 * @property {number} [minResolution=0] Minimum resolution that we zoom to.
 * @property {number} [maxZoom] Maximum zoom level that we zoom to. If
 * `minResolution` is given, this property is ignored.
 * @property {number} [duration] The duration of the animation in milliseconds.
 * By default, there is no animation to the target extent.
 * @property {function(number):number} [easing] The easing function used during
 * the animation (defaults to {@link module:ol/easing~inAndOut}).
 * The function will be called for each frame with a number representing a
 * fraction of the animation's duration.  The function should return a number
 * between 0 and 1 representing the progress toward the destination state.
 * @property {function(boolean)} [callback] Function called when the view is in
 * its final position. The callback will be called with `true` if the animation
 * series completed on its own or `false` if it was cancelled.
 */


/**
 * @typedef {Object} ViewOptions
 * @property {import("./coordinate.js").Coordinate} [center] The initial center for
 * the view. The coordinate system for the center is specified with the
 * `projection` option. Layer sources will not be fetched if this is not set,
 * but the center can be set later with {@link #setCenter}.
 * @property {boolean|number} [constrainRotation=true] Rotation constraint.
 * `false` means no constraint. `true` means no constraint, but snap to zero
 * near zero. A number constrains the rotation to that number of values. For
 * example, `4` will constrain the rotation to 0, 90, 180, and 270 degrees.
 * @property {boolean} [enableRotation=true] Enable rotation.
 * If `false`, a rotation constraint that always sets the rotation to zero is
 * used. The `constrainRotation` option has no effect if `enableRotation` is
 * `false`.
 * @property {import("./extent.js").Extent} [extent] The extent that constrains the
 * view, in other words, nothing outside of this extent can be visible on the map.
 * @property {boolean} [constrainOnlyCenter=false] If true, the extent
 * constraint will only apply to the view center and not the whole extent.
 * @property {boolean} [smoothExtentConstraint=true] If true, the extent
 * constraint will be applied smoothly, i.e. allow the view to go slightly outside
 * of the given `extent`.
 * @property {number} [maxResolution] The maximum resolution used to determine
 * the resolution constraint. It is used together with `minResolution` (or
 * `maxZoom`) and `zoomFactor`. If unspecified it is calculated in such a way
 * that the projection's validity extent fits in a 256x256 px tile. If the
 * projection is Spherical Mercator (the default) then `maxResolution` defaults
 * to `40075016.68557849 / 256 = 156543.03392804097`.
 * @property {number} [minResolution] The minimum resolution used to determine
 * the resolution constraint.  It is used together with `maxResolution` (or
 * `minZoom`) and `zoomFactor`.  If unspecified it is calculated assuming 29
 * zoom levels (with a factor of 2). If the projection is Spherical Mercator
 * (the default) then `minResolution` defaults to
 * `40075016.68557849 / 256 / Math.pow(2, 28) = 0.0005831682455839253`.
 * @property {number} [maxZoom=28] The maximum zoom level used to determine the
 * resolution constraint. It is used together with `minZoom` (or
 * `maxResolution`) and `zoomFactor`.  Note that if `minResolution` is also
 * provided, it is given precedence over `maxZoom`.
 * @property {number} [minZoom=0] The minimum zoom level used to determine the
 * resolution constraint. It is used together with `maxZoom` (or
 * `minResolution`) and `zoomFactor`.  Note that if `maxResolution` is also
 * provided, it is given precedence over `minZoom`.
 * @property {boolean} [multiWorld=false] No more than one world is visible.
 * @property {boolean} [constrainResolution=false] If true, the view will always
 * animate to the closest zoom level after an interaction; false means
 * intermediary zoom levels are allowed.
 * @property {boolean} [smoothResolutionConstraint=true] If true, the resolution
 * min/max values will be applied smoothly, i. e. allow the view to exceed slightly
 * the given resolution or zoom bounds.
 * @property {import("./proj.js").ProjectionLike} [projection='EPSG:3857'] The
 * projection. The default is Spherical Mercator.
 * @property {number} [resolution] The initial resolution for the view. The
 * units are `projection` units per pixel (e.g. meters per pixel). An
 * alternative to setting this is to set `zoom`. Layer sources will not be
 * fetched if neither this nor `zoom` are defined, but they can be set later
 * with {@link #setZoom} or {@link #setResolution}.
 * @property {Array<number>} [resolutions] Resolutions to determine the
 * resolution constraint. If set the `maxResolution`, `minResolution`,
 * `minZoom`, `maxZoom`, and `zoomFactor` options are ignored.
 * @property {number} [rotation=0] The initial rotation for the view in radians
 * (positive rotation clockwise, 0 means North).
 * @property {number} [zoom] Only used if `resolution` is not defined. Zoom
 * level used to calculate the initial resolution for the view.
 * @property {number} [zoomFactor=2] The zoom factor used to compute the
 * corresponding resolution.
 */


/**
 * @typedef {Object} AnimationOptions
 * @property {import("./coordinate.js").Coordinate} [center] The center of the view at the end of
 * the animation.
 * @property {number} [zoom] The zoom level of the view at the end of the
 * animation. This takes precedence over `resolution`.
 * @property {number} [resolution] The resolution of the view at the end
 * of the animation.  If `zoom` is also provided, this option will be ignored.
 * @property {number} [rotation] The rotation of the view at the end of
 * the animation.
 * @property {import("./coordinate.js").Coordinate} [anchor] Optional anchor to remain fixed
 * during a rotation or resolution animation.
 * @property {number} [duration=1000] The duration of the animation in milliseconds.
 * @property {function(number):number} [easing] The easing function used
 * during the animation (defaults to {@link module:ol/easing~inAndOut}).
 * The function will be called for each frame with a number representing a
 * fraction of the animation's duration.  The function should return a number
 * between 0 and 1 representing the progress toward the destination state.
 */


/**
 * @typedef {Object} State
 * @property {import("./coordinate.js").Coordinate} center
 * @property {import("./proj/Projection.js").default} projection
 * @property {number} resolution
 * @property {number} rotation
 * @property {number} zoom
 */


/**
 * Default min zoom level for the map view.
 * @type {number}
 */
const DEFAULT_MIN_ZOOM = 0;


/**
 * @classdesc
 * A View object represents a simple 2D view of the map.
 *
 * This is the object to act upon to change the center, resolution,
 * and rotation of the map.
 *
 * ### The view states
 *
 * An View is determined by three states: `center`, `resolution`,
 * and `rotation`. Each state has a corresponding getter and setter, e.g.
 * `getCenter` and `setCenter` for the `center` state.
 *
 * The `zoom` state is actually not saved on the view: all computations
 * internally use the `resolution` state. Still, the `setZoom` and `getZoom`
 * methods are available, as well as `getResolutionForZoom` and
 * `getZoomForResolution` to switch from one system to the other.
 *
 * A View has a `projection`. The projection determines the
 * coordinate system of the center, and its units determine the units of the
 * resolution (projection units per pixel). The default projection is
 * Spherical Mercator (EPSG:3857).
 *
 * ### The constraints
 *
 * `setCenter`, `setResolution` and `setRotation` can be used to change the
 * states of the view, but any constraint defined in the constructor will
 * be applied along the way.
 *
 * A View object can have a *resolution constraint*, a *rotation constraint*
 * and a *center constraint*.
 *
 * The *resolution constraint* typically restricts min/max values and
 * snaps to specific resolutions. It is determined by the following
 * options: `resolutions`, `maxResolution`, `maxZoom`, and `zoomFactor`.
 * If `resolutions` is set, the other three options are ignored. See
 * documentation for each option for more information. By default, the view
 * only has a min/max restriction and allow intermediary zoom levels when
 * pinch-zooming for example.
 *
 * The *rotation constraint* snaps to specific angles. It is determined
 * by the following options: `enableRotation` and `constrainRotation`.
 * By default the rotation value is snapped to zero when approaching the
 * horizontal.
 *
 * The *center constraint* is determined by the `extent` option. By
 * default the view center is not constrained at all.
 *
 * ### Changing the view state
 *
 * It is important to note that `setZoom`, `setResolution`, `setCenter` and
 * `setRotation` are subject to the above mentioned constraints. As such, it
 * may sometimes not be possible to know in advance the resulting state of the
 * View. For example, calling `setResolution(10)` does not guarantee that
 * `getResolution()` will return `10`.
 *
 * A consequence of this is that, when applying a delta on the view state, one
 * should use `adjustCenter`, `adjustRotation`, `adjustZoom` and `adjustResolution`
 * rather than the corresponding setters. This will let view do its internal
 * computations. Besides, the `adjust*` methods also take an `opt_anchor`
 * argument which allows specifying an origin for the transformation.
 *
 * ### Interacting with the view
 *
 * View constraints are usually only applied when the view is *at rest*, meaning that
 * no interaction or animation is ongoing. As such, if the user puts the view in a
 * state that is not equivalent to a constrained one (e.g. rotating the view when
 * the snap angle is 0), an animation will be triggered at the interaction end to
 * put back the view to a stable state;
 *
 * @api
 */
class View extends BaseObject {

  /**
   * @param {ViewOptions=} opt_options View options.
   */
  constructor(opt_options) {
    super();

    const options = assign({}, opt_options);

    /**
     * @private
     * @type {Array<number>}
     */
    this.hints_ = [0, 0];

    /**
     * @private
     * @type {Array<Array<Animation>>}
     */
    this.animations_ = [];

    /**
     * @private
     * @type {number|undefined}
     */
    this.updateAnimationKey_;

    /**
     * @private
     * @const
     * @type {import("./proj/Projection.js").default}
     */
    this.projection_ = createProjection(options.projection, 'EPSG:3857');

    /**
     * @private
     * @type {import("./coordinate.js").Coordinate|undefined}
     */
    this.targetCenter_ = null;

    /**
     * @private
     * @type {number|undefined}
     */
    this.targetResolution_;

    /**
     * @private
     * @type {number|undefined}
     */
    this.targetRotation_;

    this.applyOptions_(options);
  }

  /**
   * Set up the view with the given options.
   * @param {ViewOptions} options View options.
   */
  applyOptions_(options) {

    /**
     * @type {Object<string, *>}
     */
    const properties = {};

    const resolutionConstraintInfo = createResolutionConstraint(options);

    /**
     * @private
     * @type {number}
     */
    this.maxResolution_ = resolutionConstraintInfo.maxResolution;

    /**
     * @private
     * @type {number}
     */
    this.minResolution_ = resolutionConstraintInfo.minResolution;

    /**
     * @private
     * @type {number}
     */
    this.zoomFactor_ = resolutionConstraintInfo.zoomFactor;

    /**
     * @private
     * @type {Array<number>|undefined}
     */
    this.resolutions_ = options.resolutions;

    /**
     * @private
     * @type {number}
     */
    this.minZoom_ = resolutionConstraintInfo.minZoom;

    const centerConstraint = createCenterConstraint(options);
    const resolutionConstraint = resolutionConstraintInfo.constraint;
    const rotationConstraint = createRotationConstraint(options);

    /**
     * @private
     * @type {Constraints}
     */
    this.constraints_ = {
      center: centerConstraint,
      resolution: resolutionConstraint,
      rotation: rotationConstraint
    };

    this.setRotation(options.rotation !== undefined ? options.rotation : 0);
    this.setCenter(options.center !== undefined ? options.center : null);
    if (options.resolution !== undefined) {
      this.setResolution(options.resolution);
    } else if (options.zoom !== undefined) {
      this.setZoom(options.zoom);
    }
    this.resolveConstraints(0);

    this.setProperties(properties);


    /**
     * @private
     * @type {ViewOptions}
     */
    this.options_ = options;

  }

  /**
   * Get an updated version of the view options used to construct the view.  The
   * current resolution (or zoom), center, and rotation are applied to any stored
   * options.  The provided options can be used to apply new min/max zoom or
   * resolution limits.
   * @param {ViewOptions} newOptions New options to be applied.
   * @return {ViewOptions} New options updated with the current view state.
   */
  getUpdatedOptions_(newOptions) {
    const options = assign({}, this.options_);

    // preserve resolution (or zoom)
    if (options.resolution !== undefined) {
      options.resolution = this.getResolution();
    } else {
      options.zoom = this.getZoom();
    }

    // preserve center
    options.center = this.getCenter();

    // preserve rotation
    options.rotation = this.getRotation();

    return assign({}, options, newOptions);
  }

  /**
   * Animate the view.  The view's center, zoom (or resolution), and rotation
   * can be animated for smooth transitions between view states.  For example,
   * to animate the view to a new zoom level:
   *
   *     view.animate({zoom: view.getZoom() + 1});
   *
   * By default, the animation lasts one second and uses in-and-out easing.  You
   * can customize this behavior by including `duration` (in milliseconds) and
   * `easing` options (see {@link module:ol/easing}).
   *
   * To chain together multiple animations, call the method with multiple
   * animation objects.  For example, to first zoom and then pan:
   *
   *     view.animate({zoom: 10}, {center: [0, 0]});
   *
   * If you provide a function as the last argument to the animate method, it
   * will get called at the end of an animation series.  The callback will be
   * called with `true` if the animation series completed on its own or `false`
   * if it was cancelled.
   *
   * Animations are cancelled by user interactions (e.g. dragging the map) or by
   * calling `view.setCenter()`, `view.setResolution()`, or `view.setRotation()`
   * (or another method that calls one of these).
   *
   * @param {...(AnimationOptions|function(boolean): void)} var_args Animation
   *     options.  Multiple animations can be run in series by passing multiple
   *     options objects.  To run multiple animations in parallel, call the method
   *     multiple times.  An optional callback can be provided as a final
   *     argument.  The callback will be called with a boolean indicating whether
   *     the animation completed without being cancelled.
   * @api
   */
  animate(var_args) {
    if (this.isDef() && !this.getAnimating()) {
      this.resolveConstraints(0);
    }
    this.animate_.apply(this, arguments);
  }

  /**
   * @private
   * @param {...(AnimationOptions|function(boolean): void)} var_args Animation options.
   */
  animate_(var_args) {
    let animationCount = arguments.length;
    let callback;
    if (animationCount > 1 && typeof arguments[animationCount - 1] === 'function') {
      callback = arguments[animationCount - 1];
      --animationCount;
    }
    if (!this.isDef()) {
      // if view properties are not yet set, shortcut to the final state
      const state = arguments[animationCount - 1];
      if (state.center) {
        this.setCenter(state.center);
      }
      if (state.zoom !== undefined) {
        this.setZoom(state.zoom);
      }
      if (state.rotation !== undefined) {
        this.setRotation(state.rotation);
      }
      if (callback) {
        animationCallback(callback, true);
      }
      return;
    }
    let start = Date.now();
    let center = this.targetCenter_.slice();
    let resolution = this.targetResolution_;
    let rotation = this.targetRotation_;
    const series = [];
    for (let i = 0; i < animationCount; ++i) {
      const options = /** @type {AnimationOptions} */ (arguments[i]);

      const animation = {
        start: start,
        complete: false,
        anchor: options.anchor,
        duration: options.duration !== undefined ? options.duration : 1000,
        easing: options.easing || inAndOut,
        callback: callback
      };

      if (options.center) {
        animation.sourceCenter = center;
        animation.targetCenter = options.center.slice();
        center = animation.targetCenter;
      }

      if (options.zoom !== undefined) {
        animation.sourceResolution = resolution;
        animation.targetResolution = this.getResolutionForZoom(options.zoom);
        resolution = animation.targetResolution;
      } else if (options.resolution) {
        animation.sourceResolution = resolution;
        animation.targetResolution = options.resolution;
        resolution = animation.targetResolution;
      }

      if (options.rotation !== undefined) {
        animation.sourceRotation = rotation;
        const delta = modulo(options.rotation - rotation + Math.PI, 2 * Math.PI) - Math.PI;
        animation.targetRotation = rotation + delta;
        rotation = animation.targetRotation;
      }

      // check if animation is a no-op
      if (isNoopAnimation(animation)) {
        animation.complete = true;
        // we still push it onto the series for callback handling
      } else {
        start += animation.duration;
      }
      series.push(animation);
    }
    this.animations_.push(series);
    this.setHint(ViewHint.ANIMATING, 1);
    this.updateAnimations_();
  }

  /**
   * Determine if the view is being animated.
   * @return {boolean} The view is being animated.
   * @api
   */
  getAnimating() {
    return this.hints_[ViewHint.ANIMATING] > 0;
  }

  /**
   * Determine if the user is interacting with the view, such as panning or zooming.
   * @return {boolean} The view is being interacted with.
   * @api
   */
  getInteracting() {
    return this.hints_[ViewHint.INTERACTING] > 0;
  }

  /**
   * Cancel any ongoing animations.
   * @api
   */
  cancelAnimations() {
    this.setHint(ViewHint.ANIMATING, -this.hints_[ViewHint.ANIMATING]);
    for (let i = 0, ii = this.animations_.length; i < ii; ++i) {
      const series = this.animations_[i];
      if (series[0].callback) {
        animationCallback(series[0].callback, false);
      }
    }
    this.animations_.length = 0;
  }

  /**
   * Update all animations.
   */
  updateAnimations_() {
    if (this.updateAnimationKey_ !== undefined) {
      cancelAnimationFrame(this.updateAnimationKey_);
      this.updateAnimationKey_ = undefined;
    }
    if (!this.getAnimating()) {
      return;
    }
    const now = Date.now();
    let more = false;
    for (let i = this.animations_.length - 1; i >= 0; --i) {
      const series = this.animations_[i];
      let seriesComplete = true;
      for (let j = 0, jj = series.length; j < jj; ++j) {
        const animation = series[j];
        if (animation.complete) {
          continue;
        }
        const elapsed = now - animation.start;
        let fraction = animation.duration > 0 ? elapsed / animation.duration : 1;
        if (fraction >= 1) {
          animation.complete = true;
          fraction = 1;
        } else {
          seriesComplete = false;
        }
        const progress = animation.easing(fraction);
        if (animation.sourceCenter) {
          const x0 = animation.sourceCenter[0];
          const y0 = animation.sourceCenter[1];
          const x1 = animation.targetCenter[0];
          const y1 = animation.targetCenter[1];
          const x = x0 + progress * (x1 - x0);
          const y = y0 + progress * (y1 - y0);
          this.targetCenter_ = [x, y];
        }
        if (animation.sourceResolution && animation.targetResolution) {
          const resolution = progress === 1 ?
            animation.targetResolution :
            animation.sourceResolution + progress * (animation.targetResolution - animation.sourceResolution);
          if (animation.anchor) {
            const size = this.getSizeFromViewport_(this.getRotation());
            const constrainedResolution = this.constraints_.resolution(resolution, 0, size, true);
            this.targetCenter_ = this.calculateCenterZoom(constrainedResolution, animation.anchor);
          }
          this.targetResolution_ = resolution;
          this.applyTargetState_(true);
        }
        if (animation.sourceRotation !== undefined && animation.targetRotation !== undefined) {
          const rotation = progress === 1 ?
            modulo(animation.targetRotation + Math.PI, 2 * Math.PI) - Math.PI :
            animation.sourceRotation + progress * (animation.targetRotation - animation.sourceRotation);
          if (animation.anchor) {
            const constrainedRotation = this.constraints_.rotation(rotation, true);
            this.targetCenter_ = this.calculateCenterRotate(constrainedRotation, animation.anchor);
          }
          this.targetRotation_ = rotation;
        }
        this.applyTargetState_(true);
        more = true;
        if (!animation.complete) {
          break;
        }
      }
      if (seriesComplete) {
        this.animations_[i] = null;
        this.setHint(ViewHint.ANIMATING, -1);
        const callback = series[0].callback;
        if (callback) {
          animationCallback(callback, true);
        }
      }
    }
    // prune completed series
    this.animations_ = this.animations_.filter(Boolean);
    if (more && this.updateAnimationKey_ === undefined) {
      this.updateAnimationKey_ = requestAnimationFrame(this.updateAnimations_.bind(this));
    }
  }

  /**
   * @param {number} rotation Target rotation.
   * @param {import("./coordinate.js").Coordinate} anchor Rotation anchor.
   * @return {import("./coordinate.js").Coordinate|undefined} Center for rotation and anchor.
   */
  calculateCenterRotate(rotation, anchor) {
    let center;
    const currentCenter = this.getCenter();
    if (currentCenter !== undefined) {
      center = [currentCenter[0] - anchor[0], currentCenter[1] - anchor[1]];
      rotateCoordinate(center, rotation - this.getRotation());
      addCoordinate(center, anchor);
    }
    return center;
  }

  /**
   * @param {number} resolution Target resolution.
   * @param {import("./coordinate.js").Coordinate} anchor Zoom anchor.
   * @return {import("./coordinate.js").Coordinate|undefined} Center for resolution and anchor.
   */
  calculateCenterZoom(resolution, anchor) {
    let center;
    const currentCenter = this.getCenter();
    const currentResolution = this.getResolution();
    if (currentCenter !== undefined && currentResolution !== undefined) {
      const x = anchor[0] - resolution * (anchor[0] - currentCenter[0]) / currentResolution;
      const y = anchor[1] - resolution * (anchor[1] - currentCenter[1]) / currentResolution;
      center = [x, y];
    }
    return center;
  }

  /**
   * @private
   * @param {number=} opt_rotation Take into account the rotation of the viewport when giving the size
   * @return {import("./size.js").Size} Viewport size or `[100, 100]` when no viewport is found.
   */
  getSizeFromViewport_(opt_rotation) {
    const size = [100, 100];
    const selector = '.ol-viewport[data-view="' + getUid(this) + '"]';
    const element = document.querySelector(selector);
    if (element) {
      const metrics = getComputedStyle(element);
      size[0] = parseInt(metrics.width, 10);
      size[1] = parseInt(metrics.height, 10);
    }
    if (opt_rotation) {
      const w = size[0];
      const h = size[1];
      size[0] = Math.abs(w * Math.cos(opt_rotation)) + Math.abs(h * Math.sin(opt_rotation));
      size[1] = Math.abs(w * Math.sin(opt_rotation)) + Math.abs(h * Math.cos(opt_rotation));
    }
    return size;
  }

  /**
   * Get the view center.
   * @return {import("./coordinate.js").Coordinate|undefined} The center of the view.
   * @observable
   * @api
   */
  getCenter() {
    return (
      /** @type {import("./coordinate.js").Coordinate|undefined} */ (this.get(ViewProperty.CENTER))
    );
  }

  /**
   * @return {Constraints} Constraints.
   */
  getConstraints() {
    return this.constraints_;
  }

  /**
   * @param {Array<number>=} opt_hints Destination array.
   * @return {Array<number>} Hint.
   */
  getHints(opt_hints) {
    if (opt_hints !== undefined) {
      opt_hints[0] = this.hints_[0];
      opt_hints[1] = this.hints_[1];
      return opt_hints;
    } else {
      return this.hints_.slice();
    }
  }

  /**
   * Calculate the extent for the current view state and the passed size.
   * The size is the pixel dimensions of the box into which the calculated extent
   * should fit. In most cases you want to get the extent of the entire map,
   * that is `map.getSize()`.
   * @param {import("./size.js").Size=} opt_size Box pixel size. If not provided, the size of the
   * first map that uses this view will be used.
   * @return {import("./extent.js").Extent} Extent.
   * @api
   */
  calculateExtent(opt_size) {
    const size = opt_size || this.getSizeFromViewport_();
    const center = /** @type {!import("./coordinate.js").Coordinate} */ (this.getCenter());
    assert(center, 1); // The view center is not defined
    const resolution = /** @type {!number} */ (this.getResolution());
    assert(resolution !== undefined, 2); // The view resolution is not defined
    const rotation = /** @type {!number} */ (this.getRotation());
    assert(rotation !== undefined, 3); // The view rotation is not defined

    return getForViewAndSize(center, resolution, rotation, size);
  }

  /**
   * Get the maximum resolution of the view.
   * @return {number} The maximum resolution of the view.
   * @api
   */
  getMaxResolution() {
    return this.maxResolution_;
  }

  /**
   * Get the minimum resolution of the view.
   * @return {number} The minimum resolution of the view.
   * @api
   */
  getMinResolution() {
    return this.minResolution_;
  }

  /**
   * Get the maximum zoom level for the view.
   * @return {number} The maximum zoom level.
   * @api
   */
  getMaxZoom() {
    return /** @type {number} */ (this.getZoomForResolution(this.minResolution_));
  }

  /**
   * Set a new maximum zoom level for the view.
   * @param {number} zoom The maximum zoom level.
   * @api
   */
  setMaxZoom(zoom) {
    this.applyOptions_(this.getUpdatedOptions_({maxZoom: zoom}));
  }

  /**
   * Get the minimum zoom level for the view.
   * @return {number} The minimum zoom level.
   * @api
   */
  getMinZoom() {
    return /** @type {number} */ (this.getZoomForResolution(this.maxResolution_));
  }

  /**
   * Set a new minimum zoom level for the view.
   * @param {number} zoom The minimum zoom level.
   * @api
   */
  setMinZoom(zoom) {
    this.applyOptions_(this.getUpdatedOptions_({minZoom: zoom}));
  }

  /**
   * Set whether the view shoud allow intermediary zoom levels.
   * @param {boolean} enabled Whether the resolution is constrained.
   * @api
   */
  setConstrainResolution(enabled) {
    this.applyOptions_(this.getUpdatedOptions_({constrainResolution: enabled}));
  }

  /**
   * Get the view projection.
   * @return {import("./proj/Projection.js").default} The projection of the view.
   * @api
   */
  getProjection() {
    return this.projection_;
  }

  /**
   * Get the view resolution.
   * @return {number|undefined} The resolution of the view.
   * @observable
   * @api
   */
  getResolution() {
    return /** @type {number|undefined} */ (this.get(ViewProperty.RESOLUTION));
  }

  /**
   * Get the resolutions for the view. This returns the array of resolutions
   * passed to the constructor of the View, or undefined if none were given.
   * @return {Array<number>|undefined} The resolutions of the view.
   * @api
   */
  getResolutions() {
    return this.resolutions_;
  }

  /**
   * Get the resolution for a provided extent (in map units) and size (in pixels).
   * @param {import("./extent.js").Extent} extent Extent.
   * @param {import("./size.js").Size=} opt_size Box pixel size.
   * @return {number} The resolution at which the provided extent will render at
   *     the given size.
   * @api
   */
  getResolutionForExtent(extent, opt_size) {
    const size = opt_size || this.getSizeFromViewport_();
    const xResolution = getWidth(extent) / size[0];
    const yResolution = getHeight(extent) / size[1];
    return Math.max(xResolution, yResolution);
  }

  /**
   * Return a function that returns a value between 0 and 1 for a
   * resolution. Exponential scaling is assumed.
   * @param {number=} opt_power Power.
   * @return {function(number): number} Resolution for value function.
   */
  getResolutionForValueFunction(opt_power) {
    const power = opt_power || 2;
    const maxResolution = this.maxResolution_;
    const minResolution = this.minResolution_;
    const max = Math.log(maxResolution / minResolution) / Math.log(power);
    return (
      /**
       * @param {number} value Value.
       * @return {number} Resolution.
       */
      function(value) {
        const resolution = maxResolution / Math.pow(power, value * max);
        return resolution;
      });
  }

  /**
   * Get the view rotation.
   * @return {number} The rotation of the view in radians.
   * @observable
   * @api
   */
  getRotation() {
    return /** @type {number} */ (this.get(ViewProperty.ROTATION));
  }

  /**
   * Return a function that returns a resolution for a value between
   * 0 and 1. Exponential scaling is assumed.
   * @param {number=} opt_power Power.
   * @return {function(number): number} Value for resolution function.
   */
  getValueForResolutionFunction(opt_power) {
    const power = opt_power || 2;
    const maxResolution = this.maxResolution_;
    const minResolution = this.minResolution_;
    const max = Math.log(maxResolution / minResolution) / Math.log(power);
    return (
      /**
       * @param {number} resolution Resolution.
       * @return {number} Value.
       */
      function(resolution) {
        const value = (Math.log(maxResolution / resolution) / Math.log(power)) / max;
        return value;
      });
  }

  /**
   * @param {number} pixelRatio Pixel ratio for center rounding.
   * @return {State} View state.
   */
  getState(pixelRatio) {
    const center = /** @type {import("./coordinate.js").Coordinate} */ (this.getCenter());
    const projection = this.getProjection();
    const resolution = /** @type {number} */ (this.getResolution());
    const rotation = this.getRotation();
    return {
      center: center.slice(0),
      projection: projection !== undefined ? projection : null,
      resolution: resolution,
      rotation: rotation,
      zoom: this.getZoom()
    };
  }

  /**
   * Get the current zoom level. This method may return non-integer zoom levels
   * if the view does not constrain the resolution, or if an interaction or
   * animation is underway.
   * @return {number|undefined} Zoom.
   * @api
   */
  getZoom() {
    let zoom;
    const resolution = this.getResolution();
    if (resolution !== undefined) {
      zoom = this.getZoomForResolution(resolution);
    }
    return zoom;
  }

  /**
   * Get the zoom level for a resolution.
   * @param {number} resolution The resolution.
   * @return {number|undefined} The zoom level for the provided resolution.
   * @api
   */
  getZoomForResolution(resolution) {
    let offset = this.minZoom_ || 0;
    let max, zoomFactor;
    if (this.resolutions_) {
      const nearest = linearFindNearest(this.resolutions_, resolution, 1);
      offset = nearest;
      max = this.resolutions_[nearest];
      if (nearest == this.resolutions_.length - 1) {
        zoomFactor = 2;
      } else {
        zoomFactor = max / this.resolutions_[nearest + 1];
      }
    } else {
      max = this.maxResolution_;
      zoomFactor = this.zoomFactor_;
    }
    return offset + Math.log(max / resolution) / Math.log(zoomFactor);
  }

  /**
   * Get the resolution for a zoom level.
   * @param {number} zoom Zoom level.
   * @return {number} The view resolution for the provided zoom level.
   * @api
   */
  getResolutionForZoom(zoom) {
    if (this.resolutions_) {
      if (this.resolutions_.length <= 1) {
        return 0;
      }
      const baseLevel = clamp(Math.floor(zoom), 0, this.resolutions_.length - 2);
      const zoomFactor = this.resolutions_[baseLevel] / this.resolutions_[baseLevel + 1];
      return this.resolutions_[baseLevel] / Math.pow(zoomFactor, clamp(zoom - baseLevel, 0, 1));
    } else {
      return this.maxResolution_ / Math.pow(this.zoomFactor_, zoom - this.minZoom_);
    }
  }

  /**
   * Fit the given geometry or extent based on the given map size and border.
   * The size is pixel dimensions of the box to fit the extent into.
   * In most cases you will want to use the map size, that is `map.getSize()`.
   * Takes care of the map angle.
   * @param {import("./geom/SimpleGeometry.js").default|import("./extent.js").Extent} geometryOrExtent The geometry or
   *     extent to fit the view to.
   * @param {FitOptions=} opt_options Options.
   * @api
   */
  fit(geometryOrExtent, opt_options) {
    const options = opt_options || {};
    let size = options.size;
    if (!size) {
      size = this.getSizeFromViewport_();
    }
    /** @type {import("./geom/SimpleGeometry.js").default} */
    let geometry;
    assert(Array.isArray(geometryOrExtent) || typeof /** @type {?} */ (geometryOrExtent).getSimplifiedGeometry === 'function',
      24); // Invalid extent or geometry provided as `geometry`
    if (Array.isArray(geometryOrExtent)) {
      assert(!isEmpty(geometryOrExtent),
        25); // Cannot fit empty extent provided as `geometry`
      geometry = polygonFromExtent(geometryOrExtent);
    } else if (geometryOrExtent.getType() === GeometryType.CIRCLE) {
      geometryOrExtent = geometryOrExtent.getExtent();
      geometry = polygonFromExtent(geometryOrExtent);
      geometry.rotate(this.getRotation(), getCenter(geometryOrExtent));
    } else {
      geometry = geometryOrExtent;
    }

    const padding = options.padding !== undefined ? options.padding : [0, 0, 0, 0];
    const nearest = options.nearest !== undefined ? options.nearest : false;
    let minResolution;
    if (options.minResolution !== undefined) {
      minResolution = options.minResolution;
    } else if (options.maxZoom !== undefined) {
      minResolution = this.getResolutionForZoom(options.maxZoom);
    } else {
      minResolution = 0;
    }
    const coords = geometry.getFlatCoordinates();

    // calculate rotated extent
    const rotation = this.getRotation();
    const cosAngle = Math.cos(-rotation);
    let sinAngle = Math.sin(-rotation);
    let minRotX = +Infinity;
    let minRotY = +Infinity;
    let maxRotX = -Infinity;
    let maxRotY = -Infinity;
    const stride = geometry.getStride();
    for (let i = 0, ii = coords.length; i < ii; i += stride) {
      const rotX = coords[i] * cosAngle - coords[i + 1] * sinAngle;
      const rotY = coords[i] * sinAngle + coords[i + 1] * cosAngle;
      minRotX = Math.min(minRotX, rotX);
      minRotY = Math.min(minRotY, rotY);
      maxRotX = Math.max(maxRotX, rotX);
      maxRotY = Math.max(maxRotY, rotY);
    }

    // calculate resolution
    let resolution = this.getResolutionForExtent(
      [minRotX, minRotY, maxRotX, maxRotY],
      [size[0] - padding[1] - padding[3], size[1] - padding[0] - padding[2]]);
    resolution = isNaN(resolution) ? minResolution :
      Math.max(resolution, minResolution);
    resolution = this.getConstrainedResolution(resolution, nearest ? 0 : 1);

    // calculate center
    sinAngle = -sinAngle; // go back to original rotation
    let centerRotX = (minRotX + maxRotX) / 2;
    let centerRotY = (minRotY + maxRotY) / 2;
    centerRotX += (padding[1] - padding[3]) / 2 * resolution;
    centerRotY += (padding[0] - padding[2]) / 2 * resolution;
    const centerX = centerRotX * cosAngle - centerRotY * sinAngle;
    const centerY = centerRotY * cosAngle + centerRotX * sinAngle;
    const center = [centerX, centerY];
    const callback = options.callback ? options.callback : VOID;

    if (options.duration !== undefined) {
      this.animate_({
        resolution: resolution,
        center: this.getConstrainedCenter(center, resolution),
        duration: options.duration,
        easing: options.easing
      }, callback);
    } else {
      this.targetResolution_ = resolution;
      this.targetCenter_ = center;
      this.applyTargetState_(false, true);
      animationCallback(callback, true);
    }
  }

  /**
   * Center on coordinate and view position.
   * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("./size.js").Size} size Box pixel size.
   * @param {import("./pixel.js").Pixel} position Position on the view to center on.
   * @api
   */
  centerOn(coordinate, size, position) {
    // calculate rotated position
    const rotation = this.getRotation();
    const cosAngle = Math.cos(-rotation);
    let sinAngle = Math.sin(-rotation);
    let rotX = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
    let rotY = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
    const resolution = this.getResolution();
    rotX += (size[0] / 2 - position[0]) * resolution;
    rotY += (position[1] - size[1] / 2) * resolution;

    // go back to original angle
    sinAngle = -sinAngle; // go back to original rotation
    const centerX = rotX * cosAngle - rotY * sinAngle;
    const centerY = rotY * cosAngle + rotX * sinAngle;

    this.setCenter([centerX, centerY]);
  }

  /**
   * @return {boolean} Is defined.
   */
  isDef() {
    return !!this.getCenter() && this.getResolution() !== undefined;
  }

  /**
   * Adds relative coordinates to the center of the view. Any extent constraint will apply.
   * @param {import("./coordinate.js").Coordinate} deltaCoordinates Relative value to add.
   * @api
   */
  adjustCenter(deltaCoordinates) {
    const center = this.targetCenter_;
    this.setCenter([center[0] + deltaCoordinates[0], center[1] + deltaCoordinates[1]]);
  }

  /**
   * Multiply the view resolution by a ratio, optionally using an anchor. Any resolution
   * constraint will apply.
   * @param {number} ratio The ratio to apply on the view resolution.
   * @param {import("./coordinate.js").Coordinate=} opt_anchor The origin of the transformation.
   * @observable
   * @api
   */
  adjustResolution(ratio, opt_anchor) {
    const isMoving = this.getAnimating() || this.getInteracting();
    const size = this.getSizeFromViewport_(this.getRotation());
    const newResolution = this.constraints_.resolution(this.targetResolution_ * ratio, 0, size, isMoving);

    if (opt_anchor !== undefined) {
      this.targetCenter_ = this.calculateCenterZoom(newResolution, opt_anchor);
    }

    this.targetResolution_ *= ratio;
    this.applyTargetState_();
  }

  /**
   * Adds a value to the view zoom level, optionally using an anchor. Any resolution
   * constraint will apply.
   * @param {number} delta Relative value to add to the zoom level.
   * @param {import("./coordinate.js").Coordinate=} opt_anchor The origin of the transformation.
   * @api
   */
  adjustZoom(delta, opt_anchor) {
    this.adjustResolution(Math.pow(this.zoomFactor_, -delta), opt_anchor);
  }

  /**
   * Adds a value to the view rotation, optionally using an anchor. Any rotation
   * constraint will apply.
   * @param {number} delta Relative value to add to the zoom rotation, in radians.
   * @param {import("./coordinate.js").Coordinate=} opt_anchor The rotation center.
   * @observable
   * @api
   */
  adjustRotation(delta, opt_anchor) {
    const isMoving = this.getAnimating() || this.getInteracting();
    const newRotation = this.constraints_.rotation(this.targetRotation_ + delta, isMoving);
    if (opt_anchor !== undefined) {
      this.targetCenter_ = this.calculateCenterRotate(newRotation, opt_anchor);
    }
    this.targetRotation_ += delta;
    this.applyTargetState_();
  }

  /**
   * Set the center of the current view. Any extent constraint will apply.
   * @param {import("./coordinate.js").Coordinate|undefined} center The center of the view.
   * @observable
   * @api
   */
  setCenter(center) {
    this.targetCenter_ = center;
    this.applyTargetState_();
  }

  /**
   * @param {ViewHint} hint Hint.
   * @param {number} delta Delta.
   * @return {number} New value.
   */
  setHint(hint, delta) {
    this.hints_[hint] += delta;
    this.changed();
    return this.hints_[hint];
  }

  /**
   * Set the resolution for this view. Any resolution constraint will apply.
   * @param {number|undefined} resolution The resolution of the view.
   * @observable
   * @api
   */
  setResolution(resolution) {
    this.targetResolution_ = resolution;
    this.applyTargetState_();
  }

  /**
   * Set the rotation for this view. Any rotation constraint will apply.
   * @param {number} rotation The rotation of the view in radians.
   * @observable
   * @api
   */
  setRotation(rotation) {
    this.targetRotation_ = rotation;
    this.applyTargetState_();
  }

  /**
   * Zoom to a specific zoom level. Any resolution constrain will apply.
   * @param {number} zoom Zoom level.
   * @api
   */
  setZoom(zoom) {
    this.setResolution(this.getResolutionForZoom(zoom));
  }

  /**
   * Recompute rotation/resolution/center based on target values.
   * Note: we have to compute rotation first, then resolution and center considering that
   * parameters can influence one another in case a view extent constraint is present.
   * @param {boolean=} opt_doNotCancelAnims Do not cancel animations.
   * @param {boolean=} opt_forceMoving Apply constraints as if the view is moving.
   * @private
   */
  applyTargetState_(opt_doNotCancelAnims, opt_forceMoving) {
    const isMoving = this.getAnimating() || this.getInteracting() || opt_forceMoving;

    // compute rotation
    const newRotation = this.constraints_.rotation(this.targetRotation_, isMoving);
    const size = this.getSizeFromViewport_(newRotation);
    const newResolution = this.constraints_.resolution(this.targetResolution_, 0, size, isMoving);
    const newCenter = this.constraints_.center(this.targetCenter_, newResolution, size, isMoving);

    if (this.get(ViewProperty.ROTATION) !== newRotation) {
      this.set(ViewProperty.ROTATION, newRotation);
    }
    if (this.get(ViewProperty.RESOLUTION) !== newResolution) {
      this.set(ViewProperty.RESOLUTION, newResolution);
    }
    if (!this.get(ViewProperty.CENTER) || !equals(this.get(ViewProperty.CENTER), newCenter)) {
      this.set(ViewProperty.CENTER, newCenter);
    }

    if (this.getAnimating() && !opt_doNotCancelAnims) {
      this.cancelAnimations();
    }
  }

  /**
   * If any constraints need to be applied, an animation will be triggered.
   * This is typically done on interaction end.
   * Note: calling this with a duration of 0 will apply the constrained values straight away,
   * without animation.
   * @param {number=} opt_duration The animation duration in ms.
   * @param {number=} opt_resolutionDirection Which direction to zoom.
   * @param {import("./coordinate.js").Coordinate=} opt_anchor The origin of the transformation.
   */
  resolveConstraints(opt_duration, opt_resolutionDirection, opt_anchor) {
    const duration = opt_duration !== undefined ? opt_duration : 200;
    const direction = opt_resolutionDirection || 0;

    const newRotation = this.constraints_.rotation(this.targetRotation_);
    const size = this.getSizeFromViewport_(newRotation);
    const newResolution = this.constraints_.resolution(this.targetResolution_, direction, size);
    const newCenter = this.constraints_.center(this.targetCenter_, newResolution, size);

    if (duration === 0) {
      this.targetResolution_ = newResolution;
      this.targetRotation_ = newRotation;
      this.targetCenter_ = newCenter;
      this.applyTargetState_();
      return;
    }

    if (this.getResolution() !== newResolution ||
      this.getRotation() !== newRotation ||
      !this.getCenter() ||
      !equals(this.getCenter(), newCenter)) {

      if (this.getAnimating()) {
        this.cancelAnimations();
      }

      this.animate_({
        rotation: newRotation,
        center: newCenter,
        resolution: newResolution,
        duration: duration,
        easing: easeOut,
        anchor: opt_anchor
      });
    }
  }

  /**
   * Notify the View that an interaction has started.
   * The view state will be resolved to a stable one if needed
   * (depending on its constraints).
   * @api
   */
  beginInteraction() {
    this.resolveConstraints(0);

    this.setHint(ViewHint.INTERACTING, 1);
  }

  /**
   * Notify the View that an interaction has ended. The view state will be resolved
   * to a stable one if needed (depending on its constraints).
   * @param {number=} opt_duration Animation duration in ms.
   * @param {number=} opt_resolutionDirection Which direction to zoom.
   * @param {import("./coordinate.js").Coordinate=} opt_anchor The origin of the transformation.
   * @api
   */
  endInteraction(opt_duration, opt_resolutionDirection, opt_anchor) {
    this.setHint(ViewHint.INTERACTING, -1);

    this.resolveConstraints(opt_duration, opt_resolutionDirection, opt_anchor);
  }

  /**
   * Get a valid position for the view center according to the current constraints.
   * @param {import("./coordinate.js").Coordinate|undefined} targetCenter Target center position.
   * @param {number=} opt_targetResolution Target resolution. If not supplied, the current one will be used.
   * This is useful to guess a valid center position at a different zoom level.
   * @return {import("./coordinate.js").Coordinate|undefined} Valid center position.
   */
  getConstrainedCenter(targetCenter, opt_targetResolution) {
    const size = this.getSizeFromViewport_(this.getRotation());
    return this.constraints_.center(targetCenter, opt_targetResolution || this.getResolution(), size);
  }

  /**
   * Get a valid zoom level according to the current view constraints.
   * @param {number|undefined} targetZoom Target zoom.
   * @param {number=} opt_direction Direction. Default is `0`. Specify `-1` or `1` to return
   * the available value respectively lower or greater than the target one. Leaving `0` will simply choose
   * the nearest available value.
   * @return {number|undefined} Valid zoom level.
   */
  getConstrainedZoom(targetZoom, opt_direction) {
    const targetRes = this.getResolutionForZoom(targetZoom);
    return this.getZoomForResolution(this.getConstrainedResolution(targetRes));
  }

  /**
   * Get a valid resolution according to the current view constraints.
   * @param {number|undefined} targetResolution Target resolution.
   * @param {number=} opt_direction Direction. Default is `0`. Specify `-1` or `1` to return
   * the available value respectively lower or greater than the target one. Leaving `0` will simply choose
   * the nearest available value.
   * @return {number|undefined} Valid resolution.
   */
  getConstrainedResolution(targetResolution, opt_direction) {
    const direction = opt_direction || 0;
    const size = this.getSizeFromViewport_(this.getRotation());

    return this.constraints_.resolution(targetResolution, direction, size);
  }
}


/**
 * @param {Function} callback Callback.
 * @param {*} returnValue Return value.
 */
function animationCallback(callback, returnValue) {
  setTimeout(function() {
    callback(returnValue);
  }, 0);
}


/**
 * @param {ViewOptions} options View options.
 * @return {import("./centerconstraint.js").Type} The constraint.
 */
export function createCenterConstraint(options) {
  if (options.extent !== undefined) {
    return createExtent(options.extent, options.constrainOnlyCenter,
      options.smoothExtentConstraint !== undefined ? options.smoothExtentConstraint : true);
  } else {
    return centerNone;
  }
}


/**
 * @param {ViewOptions} options View options.
 * @return {{constraint: import("./resolutionconstraint.js").Type, maxResolution: number,
 *     minResolution: number, minZoom: number, zoomFactor: number}} The constraint.
 */
export function createResolutionConstraint(options) {
  let resolutionConstraint;
  let maxResolution;
  let minResolution;

  // TODO: move these to be ol constants
  // see https://github.com/openlayers/openlayers/issues/2076
  const defaultMaxZoom = 28;
  const defaultZoomFactor = 2;

  let minZoom = options.minZoom !== undefined ?
    options.minZoom : DEFAULT_MIN_ZOOM;

  let maxZoom = options.maxZoom !== undefined ?
    options.maxZoom : defaultMaxZoom;

  const zoomFactor = options.zoomFactor !== undefined ?
    options.zoomFactor : defaultZoomFactor;

  const multiWorld = options.multiWorld !== undefined ?
    options.multiWorld : false;

  const smooth =
      options.smoothResolutionConstraint !== undefined ? options.smoothResolutionConstraint : true;

  if (options.resolutions !== undefined) {
    const resolutions = options.resolutions;
    maxResolution = resolutions[minZoom];
    minResolution = resolutions[maxZoom] !== undefined ?
      resolutions[maxZoom] : resolutions[resolutions.length - 1];

    if (options.constrainResolution) {
      resolutionConstraint = createSnapToResolutions(resolutions, smooth,
        !options.constrainOnlyCenter && options.extent);
    } else {
      resolutionConstraint = createMinMaxResolution(maxResolution, minResolution, smooth,
        !options.constrainOnlyCenter && options.extent);
    }
  } else {
    // calculate the default min and max resolution
    const projection = createProjection(options.projection, 'EPSG:3857');
    const extent = projection.getExtent();
    const size = !extent ?
      // use an extent that can fit the whole world if need be
      360 * METERS_PER_UNIT[Units.DEGREES] /
            projection.getMetersPerUnit() :
      Math.max(getWidth(extent), getHeight(extent));

    const defaultMaxResolution = size / DEFAULT_TILE_SIZE / Math.pow(
      defaultZoomFactor, DEFAULT_MIN_ZOOM);

    const defaultMinResolution = defaultMaxResolution / Math.pow(
      defaultZoomFactor, defaultMaxZoom - DEFAULT_MIN_ZOOM);

    // user provided maxResolution takes precedence
    maxResolution = options.maxResolution;
    if (maxResolution !== undefined) {
      minZoom = 0;
    } else {
      maxResolution = defaultMaxResolution / Math.pow(zoomFactor, minZoom);
    }

    // user provided minResolution takes precedence
    minResolution = options.minResolution;
    if (minResolution === undefined) {
      if (options.maxZoom !== undefined) {
        if (options.maxResolution !== undefined) {
          minResolution = maxResolution / Math.pow(zoomFactor, maxZoom);
        } else {
          minResolution = defaultMaxResolution / Math.pow(zoomFactor, maxZoom);
        }
      } else {
        minResolution = defaultMinResolution;
      }
    }

    // given discrete zoom levels, minResolution may be different than provided
    maxZoom = minZoom + Math.floor(
      Math.log(maxResolution / minResolution) / Math.log(zoomFactor));
    minResolution = maxResolution / Math.pow(zoomFactor, maxZoom - minZoom);

    if (options.constrainResolution) {
      resolutionConstraint = createSnapToPower(
        zoomFactor, maxResolution, minResolution, smooth,
        !options.constrainOnlyCenter && options.extent);
    } else {
      let constrainOnlyCenter = options.constrainOnlyCenter;
      let extent = options.extent;
      if (!multiWorld && !extent && projection.isGlobal()) {
        constrainOnlyCenter = false;
        extent = projection.getExtent();
      }
      resolutionConstraint = createMinMaxResolution(maxResolution, minResolution, smooth,
        !constrainOnlyCenter && extent);
    }
  }
  return {constraint: resolutionConstraint, maxResolution: maxResolution,
    minResolution: minResolution, minZoom: minZoom, zoomFactor: zoomFactor};
}


/**
 * @param {ViewOptions} options View options.
 * @return {import("./rotationconstraint.js").Type} Rotation constraint.
 */
export function createRotationConstraint(options) {
  const enableRotation = options.enableRotation !== undefined ?
    options.enableRotation : true;
  if (enableRotation) {
    const constrainRotation = options.constrainRotation;
    if (constrainRotation === undefined || constrainRotation === true) {
      return createSnapToZero();
    } else if (constrainRotation === false) {
      return rotationNone;
    } else if (typeof constrainRotation === 'number') {
      return createSnapToN(constrainRotation);
    } else {
      return rotationNone;
    }
  } else {
    return disable;
  }
}


/**
 * Determine if an animation involves no view change.
 * @param {Animation} animation The animation.
 * @return {boolean} The animation involves no view change.
 */
export function isNoopAnimation(animation) {
  if (animation.sourceCenter && animation.targetCenter) {
    if (!coordinatesEqual(animation.sourceCenter, animation.targetCenter)) {
      return false;
    }
  }
  if (animation.sourceResolution !== animation.targetResolution) {
    return false;
  }
  if (animation.sourceRotation !== animation.targetRotation) {
    return false;
  }
  return true;
}

export default View;
