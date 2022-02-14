/**
 * @module ol/interaction/Draw
 */
import Circle from '../geom/Circle.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import Feature from '../Feature.js';
import GeometryType from '../geom/GeometryType.js';
import InteractionProperty from './Property.js';
import LineString from '../geom/LineString.js';
import MapBrowserEvent from '../MapBrowserEvent.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import PointerInteraction from './Pointer.js';
import Polygon, {fromCircle, makeRegular} from '../geom/Polygon.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import {FALSE, TRUE} from '../functions.js';
import {always, noModifierKeys, shiftKeyOnly} from '../events/condition.js';
import {
  boundingExtent,
  getBottomLeft,
  getBottomRight,
  getTopLeft,
  getTopRight,
} from '../extent.js';
import {createEditingStyle} from '../style/Style.js';
import {fromUserCoordinate, getUserProjection} from '../proj.js';
import {squaredDistance as squaredCoordinateDistance} from '../coordinate.js';

/**
 * @typedef {Object} Options
 * @property {import("../geom/GeometryType.js").default} type Geometry type of
 * the geometries being drawn with this instance.
 * @property {number} [clickTolerance=6] The maximum distance in pixels between
 * "down" and "up" for a "up" event to be considered a "click" event and
 * actually add a point/vertex to the geometry being drawn.  The default of `6`
 * was chosen for the draw interaction to behave correctly on mouse as well as
 * on touch devices.
 * @property {import("../Collection.js").default<Feature>} [features]
 * Destination collection for the drawn features.
 * @property {VectorSource} [source] Destination source for
 * the drawn features.
 * @property {number} [dragVertexDelay=500] Delay in milliseconds after pointerdown
 * before the current vertex can be dragged to its exact position.
 * @property {number} [snapTolerance=12] Pixel distance for snapping to the
 * drawing finish. Must be greater than `0`.
 * @property {boolean} [stopClick=false] Stop click, singleclick, and
 * doubleclick events from firing during drawing.
 * @property {number} [maxPoints] The number of points that can be drawn before
 * a polygon ring or line string is finished. By default there is no
 * restriction.
 * @property {number} [minPoints] The number of points that must be drawn
 * before a polygon ring or line string can be finished. Default is `3` for
 * polygon rings and `2` for line strings.
 * @property {import("../events/condition.js").Condition} [finishCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether the drawing can be finished. Not used when drawing
 * POINT or MULTI_POINT geometries.
 * @property {import("../style/Style.js").StyleLike} [style]
 * Style for sketch features.
 * @property {GeometryFunction} [geometryFunction]
 * Function that is called when a geometry's coordinates are updated.
 * @property {string} [geometryName] Geometry name to use for features created
 * by the draw interaction.
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * By default {@link module:ol/events/condition.noModifierKeys}, i.e. a click,
 * adds a vertex or deactivates freehand drawing.
 * @property {boolean} [freehand=false] Operate in freehand mode for lines,
 * polygons, and circles.  This makes the interaction always operate in freehand
 * mode and takes precedence over any `freehandCondition` option.
 * @property {import("../events/condition.js").Condition} [freehandCondition]
 * Condition that activates freehand drawing for lines and polygons. This
 * function takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and
 * returns a boolean to indicate whether that event should be handled. The
 * default is {@link module:ol/events/condition.shiftKeyOnly}, meaning that the
 * Shift key activates freehand drawing.
 * @property {boolean} [wrapX=false] Wrap the world horizontally on the sketch
 * overlay.
 */

/**
 * Coordinate type when drawing points.
 * @typedef {import("../coordinate.js").Coordinate} PointCoordType
 */

/**
 * Coordinate type when drawing lines.
 * @typedef {Array<import("../coordinate.js").Coordinate>} LineCoordType
 */

/**
 * Coordinate type when drawing polygons.
 * @typedef {Array<Array<import("../coordinate.js").Coordinate>>} PolyCoordType
 */

/**
 * Types used for drawing coordinates.
 * @typedef {PointCoordType|LineCoordType|PolyCoordType} SketchCoordType
 */

/**
 * Function that takes an array of coordinates and an optional existing geometry
 * and a projection as arguments, and returns a geometry. The optional existing
 * geometry is the geometry that is returned when the function is called without
 * a second argument.
 * @typedef {function(!SketchCoordType, import("../geom/SimpleGeometry.js").default,
 *     import("../proj/Projection.js").default):
 *     import("../geom/SimpleGeometry.js").default} GeometryFunction
 */

/**
 * Draw mode.  This collapses multi-part geometry types with their single-part
 * cousins.
 * @enum {string}
 */
const Mode = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon',
  CIRCLE: 'Circle',
};

/**
 * @enum {string}
 */
const DrawEventType = {
  /**
   * Triggered upon feature draw start
   * @event DrawEvent#drawstart
   * @api
   */
  DRAWSTART: 'drawstart',
  /**
   * Triggered upon feature draw end
   * @event DrawEvent#drawend
   * @api
   */
  DRAWEND: 'drawend',
  /**
   * Triggered upon feature draw abortion
   * @event DrawEvent#drawabort
   * @api
   */
  DRAWABORT: 'drawabort',
};

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Draw~Draw} instances are
 * instances of this type.
 */
export class DrawEvent extends Event {
  /**
   * @param {DrawEventType} type Type.
   * @param {Feature} feature The feature drawn.
   */
  constructor(type, feature) {
    super(type);

    /**
     * The feature being drawn.
     * @type {Feature}
     * @api
     */
    this.feature = feature;
  }
}

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<'drawabort'|'drawend'|'drawstart', DrawEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active'|'drawabort'|'drawend'|'drawstart', Return>} DrawOnSignature
 */

/**
 * @classdesc
 * Interaction for drawing feature geometries.
 *
 * @fires DrawEvent
 * @api
 */
class Draw extends PointerInteraction {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {
    const pointerOptions = /** @type {import("./Pointer.js").Options} */ (
      options
    );
    if (!pointerOptions.stopDown) {
      pointerOptions.stopDown = FALSE;
    }

    super(pointerOptions);

    /***
     * @type {DrawOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {DrawOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {DrawOnSignature<void>}
     */
    this.un;

    /**
     * @type {boolean}
     * @private
     */
    this.shouldHandle_ = false;

    /**
     * @type {import("../pixel.js").Pixel}
     * @private
     */
    this.downPx_ = null;

    /**
     * @type {?}
     * @private
     */
    this.downTimeout_;

    /**
     * @type {number|undefined}
     * @private
     */
    this.lastDragTime_;

    /**
     * Pointer type of the last pointermove event
     * @type {string}
     * @private
     */
    this.pointerType_;

    /**
     * @type {boolean}
     * @private
     */
    this.freehand_ = false;

    /**
     * Target source for drawn features.
     * @type {VectorSource|null}
     * @private
     */
    this.source_ = options.source ? options.source : null;

    /**
     * Target collection for drawn features.
     * @type {import("../Collection.js").default<Feature>|null}
     * @private
     */
    this.features_ = options.features ? options.features : null;

    /**
     * Pixel distance for snapping.
     * @type {number}
     * @private
     */
    this.snapTolerance_ = options.snapTolerance ? options.snapTolerance : 12;

    /**
     * Geometry type.
     * @type {import("../geom/GeometryType.js").default}
     * @private
     */
    this.type_ = /** @type {import("../geom/GeometryType.js").default} */ (
      options.type
    );

    /**
     * Drawing mode (derived from geometry type.
     * @type {Mode}
     * @private
     */
    this.mode_ = getMode(this.type_);

    /**
     * Stop click, singleclick, and doubleclick events from firing during drawing.
     * Default is `false`.
     * @type {boolean}
     * @private
     */
    this.stopClick_ = !!options.stopClick;

    /**
     * The number of points that must be drawn before a polygon ring or line
     * string can be finished.  The default is 3 for polygon rings and 2 for
     * line strings.
     * @type {number}
     * @private
     */
    this.minPoints_ = options.minPoints
      ? options.minPoints
      : this.mode_ === Mode.POLYGON
      ? 3
      : 2;

    /**
     * The number of points that can be drawn before a polygon ring or line string
     * is finished. The default is no restriction.
     * @type {number}
     * @private
     */
    this.maxPoints_ =
      this.mode_ === Mode.CIRCLE
        ? 2
        : options.maxPoints
        ? options.maxPoints
        : Infinity;

    /**
     * A function to decide if a potential finish coordinate is permissible
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.finishCondition_ = options.finishCondition
      ? options.finishCondition
      : TRUE;

    let geometryFunction = options.geometryFunction;
    if (!geometryFunction) {
      const mode = this.mode_;
      if (mode === Mode.CIRCLE) {
        /**
         * @param {!LineCoordType} coordinates The coordinates.
         * @param {import("../geom/SimpleGeometry.js").default|undefined} geometry Optional geometry.
         * @param {import("../proj/Projection.js").default} projection The view projection.
         * @return {import("../geom/SimpleGeometry.js").default} A geometry.
         */
        geometryFunction = function (coordinates, geometry, projection) {
          const circle = geometry
            ? /** @type {Circle} */ (geometry)
            : new Circle([NaN, NaN]);
          const center = fromUserCoordinate(coordinates[0], projection);
          const squaredLength = squaredCoordinateDistance(
            center,
            fromUserCoordinate(coordinates[coordinates.length - 1], projection)
          );
          circle.setCenterAndRadius(center, Math.sqrt(squaredLength));
          const userProjection = getUserProjection();
          if (userProjection) {
            circle.transform(projection, userProjection);
          }
          return circle;
        };
      } else {
        let Constructor;
        if (mode === Mode.POINT) {
          Constructor = Point;
        } else if (mode === Mode.LINE_STRING) {
          Constructor = LineString;
        } else if (mode === Mode.POLYGON) {
          Constructor = Polygon;
        }
        /**
         * @param {!LineCoordType} coordinates The coordinates.
         * @param {import("../geom/SimpleGeometry.js").default|undefined} geometry Optional geometry.
         * @param {import("../proj/Projection.js").default} projection The view projection.
         * @return {import("../geom/SimpleGeometry.js").default} A geometry.
         */
        geometryFunction = function (coordinates, geometry, projection) {
          if (geometry) {
            if (mode === Mode.POLYGON) {
              if (coordinates[0].length) {
                // Add a closing coordinate to match the first
                geometry.setCoordinates([
                  coordinates[0].concat([coordinates[0][0]]),
                ]);
              } else {
                geometry.setCoordinates([]);
              }
            } else {
              geometry.setCoordinates(coordinates);
            }
          } else {
            geometry = new Constructor(coordinates);
          }
          return geometry;
        };
      }
    }

    /**
     * @type {GeometryFunction}
     * @private
     */
    this.geometryFunction_ = geometryFunction;

    /**
     * @type {number}
     * @private
     */
    this.dragVertexDelay_ =
      options.dragVertexDelay !== undefined ? options.dragVertexDelay : 500;

    /**
     * Finish coordinate for the feature (first point for polygons, last point for
     * linestrings).
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.finishCoordinate_ = null;

    /**
     * Sketch feature.
     * @type {Feature<import('../geom/SimpleGeometry.js').default>}
     * @private
     */
    this.sketchFeature_ = null;

    /**
     * Sketch point.
     * @type {Feature<Point>}
     * @private
     */
    this.sketchPoint_ = null;

    /**
     * Sketch coordinates. Used when drawing a line or polygon.
     * @type {SketchCoordType}
     * @private
     */
    this.sketchCoords_ = null;

    /**
     * Sketch line. Used when drawing polygon.
     * @type {Feature<LineString>}
     * @private
     */
    this.sketchLine_ = null;

    /**
     * Sketch line coordinates. Used when drawing a polygon or circle.
     * @type {LineCoordType}
     * @private
     */
    this.sketchLineCoords_ = null;

    /**
     * Squared tolerance for handling up events.  If the squared distance
     * between a down and up event is greater than this tolerance, up events
     * will not be handled.
     * @type {number}
     * @private
     */
    this.squaredClickTolerance_ = options.clickTolerance
      ? options.clickTolerance * options.clickTolerance
      : 36;

    /**
     * Draw overlay where our sketch features are drawn.
     * @type {VectorLayer}
     * @private
     */
    this.overlay_ = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: options.wrapX ? options.wrapX : false,
      }),
      style: options.style ? options.style : getDefaultStyleFunction(),
      updateWhileInteracting: true,
    });

    /**
     * Name of the geometry attribute for newly created features.
     * @type {string|undefined}
     * @private
     */
    this.geometryName_ = options.geometryName;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : noModifierKeys;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.freehandCondition_;
    if (options.freehand) {
      this.freehandCondition_ = always;
    } else {
      this.freehandCondition_ = options.freehandCondition
        ? options.freehandCondition
        : shiftKeyOnly;
    }

    this.addChangeListener(InteractionProperty.ACTIVE, this.updateState_);
  }

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
   */
  setMap(map) {
    super.setMap(map);
    this.updateState_();
  }

  /**
   * Get the overlay layer that this interaction renders sketch features to.
   * @return {VectorLayer} Overlay layer.
   * @api
   */
  getOverlay() {
    return this.overlay_;
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} and may actually draw or finish the drawing.
   * @param {import("../MapBrowserEvent.js").default} event Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @api
   */
  handleEvent(event) {
    if (event.originalEvent.type === EventType.CONTEXTMENU) {
      // Avoid context menu for long taps when drawing on mobile
      event.originalEvent.preventDefault();
    }
    this.freehand_ =
      this.mode_ !== Mode.POINT && this.freehandCondition_(event);
    let move = event.type === MapBrowserEventType.POINTERMOVE;
    let pass = true;
    if (
      !this.freehand_ &&
      this.lastDragTime_ &&
      event.type === MapBrowserEventType.POINTERDRAG
    ) {
      const now = Date.now();
      if (now - this.lastDragTime_ >= this.dragVertexDelay_) {
        this.downPx_ = event.pixel;
        this.shouldHandle_ = !this.freehand_;
        move = true;
      } else {
        this.lastDragTime_ = undefined;
      }
      if (this.shouldHandle_ && this.downTimeout_ !== undefined) {
        clearTimeout(this.downTimeout_);
        this.downTimeout_ = undefined;
      }
    }
    if (
      this.freehand_ &&
      event.type === MapBrowserEventType.POINTERDRAG &&
      this.sketchFeature_ !== null
    ) {
      this.addToDrawing_(event.coordinate);
      pass = false;
    } else if (
      this.freehand_ &&
      event.type === MapBrowserEventType.POINTERDOWN
    ) {
      pass = false;
    } else if (move && this.getPointerCount() < 2) {
      pass = event.type === MapBrowserEventType.POINTERMOVE;
      if (pass && this.freehand_) {
        this.handlePointerMove_(event);
        if (this.shouldHandle_) {
          // Avoid page scrolling when freehand drawing on mobile
          event.originalEvent.preventDefault();
        }
      } else if (
        event.originalEvent.pointerType === 'mouse' ||
        (event.type === MapBrowserEventType.POINTERDRAG &&
          this.downTimeout_ === undefined)
      ) {
        this.handlePointerMove_(event);
      }
    } else if (event.type === MapBrowserEventType.DBLCLICK) {
      pass = false;
    }

    return super.handleEvent(event) && pass;
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @return {boolean} If the event was consumed.
   */
  handleDownEvent(event) {
    this.shouldHandle_ = !this.freehand_;

    if (this.freehand_) {
      this.downPx_ = event.pixel;
      if (!this.finishCoordinate_) {
        this.startDrawing_(event.coordinate);
      }
      return true;
    } else if (this.condition_(event)) {
      this.lastDragTime_ = Date.now();
      this.downTimeout_ = setTimeout(
        function () {
          this.handlePointerMove_(
            new MapBrowserEvent(
              MapBrowserEventType.POINTERMOVE,
              event.map,
              event.originalEvent,
              false,
              event.frameState
            )
          );
        }.bind(this),
        this.dragVertexDelay_
      );
      this.downPx_ = event.pixel;
      return true;
    } else {
      this.lastDragTime_ = undefined;
      return false;
    }
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @return {boolean} If the event was consumed.
   */
  handleUpEvent(event) {
    let pass = true;

    if (this.getPointerCount() === 0) {
      if (this.downTimeout_) {
        clearTimeout(this.downTimeout_);
        this.downTimeout_ = undefined;
      }

      this.handlePointerMove_(event);

      if (this.shouldHandle_) {
        const startingToDraw = !this.finishCoordinate_;
        if (startingToDraw) {
          this.startDrawing_(event.coordinate);
        }
        if (!startingToDraw && this.freehand_) {
          this.finishDrawing();
        } else if (
          !this.freehand_ &&
          (!startingToDraw || this.mode_ === Mode.POINT)
        ) {
          if (this.atFinish_(event.pixel)) {
            if (this.finishCondition_(event)) {
              this.finishDrawing();
            }
          } else {
            this.addToDrawing_(event.coordinate);
          }
        }
        pass = false;
      } else if (this.freehand_) {
        this.abortDrawing();
      }
    }

    if (!pass && this.stopClick_) {
      event.preventDefault();
    }
    return pass;
  }

  /**
   * Handle move events.
   * @param {import("../MapBrowserEvent.js").default} event A move event.
   * @private
   */
  handlePointerMove_(event) {
    this.pointerType_ = event.originalEvent.pointerType;
    if (
      this.downPx_ &&
      ((!this.freehand_ && this.shouldHandle_) ||
        (this.freehand_ && !this.shouldHandle_))
    ) {
      const downPx = this.downPx_;
      const clickPx = event.pixel;
      const dx = downPx[0] - clickPx[0];
      const dy = downPx[1] - clickPx[1];
      const squaredDistance = dx * dx + dy * dy;
      this.shouldHandle_ = this.freehand_
        ? squaredDistance > this.squaredClickTolerance_
        : squaredDistance <= this.squaredClickTolerance_;
      if (!this.shouldHandle_) {
        return;
      }
    }

    if (this.finishCoordinate_) {
      this.modifyDrawing_(event.coordinate);
    } else {
      this.createOrUpdateSketchPoint_(event.coordinate.slice());
    }
  }

  /**
   * Determine if an event is within the snapping tolerance of the start coord.
   * @param {import("../pixel.js").Pixel} pixel Pixel.
   * @return {boolean} The event is within the snapping tolerance of the start.
   * @private
   */
  atFinish_(pixel) {
    let at = false;
    if (this.sketchFeature_) {
      let potentiallyDone = false;
      let potentiallyFinishCoordinates = [this.finishCoordinate_];
      const mode = this.mode_;
      if (mode === Mode.POINT) {
        at = true;
      } else if (mode === Mode.CIRCLE) {
        at = this.sketchCoords_.length === 2;
      } else if (mode === Mode.LINE_STRING) {
        potentiallyDone = this.sketchCoords_.length > this.minPoints_;
      } else if (mode === Mode.POLYGON) {
        const sketchCoords = /** @type {PolyCoordType} */ (this.sketchCoords_);
        potentiallyDone = sketchCoords[0].length > this.minPoints_;
        potentiallyFinishCoordinates = [
          sketchCoords[0][0],
          sketchCoords[0][sketchCoords[0].length - 2],
        ];
      }
      if (potentiallyDone) {
        const map = this.getMap();
        for (let i = 0, ii = potentiallyFinishCoordinates.length; i < ii; i++) {
          const finishCoordinate = potentiallyFinishCoordinates[i];
          const finishPixel = map.getPixelFromCoordinate(finishCoordinate);
          const dx = pixel[0] - finishPixel[0];
          const dy = pixel[1] - finishPixel[1];
          const snapTolerance = this.freehand_ ? 1 : this.snapTolerance_;
          at = Math.sqrt(dx * dx + dy * dy) <= snapTolerance;
          if (at) {
            this.finishCoordinate_ = finishCoordinate;
            break;
          }
        }
      }
    }
    return at;
  }

  /**
   * @param {import("../coordinate").Coordinate} coordinates Coordinate.
   * @private
   */
  createOrUpdateSketchPoint_(coordinates) {
    if (!this.sketchPoint_) {
      this.sketchPoint_ = new Feature(new Point(coordinates));
      this.updateSketchFeatures_();
    } else {
      const sketchPointGeom = this.sketchPoint_.getGeometry();
      sketchPointGeom.setCoordinates(coordinates);
    }
  }

  /**
   * @param {import("../geom/Polygon.js").default} geometry Polygon geometry.
   * @private
   */
  createOrUpdateCustomSketchLine_(geometry) {
    if (!this.sketchLine_) {
      this.sketchLine_ = new Feature();
    }
    const ring = geometry.getLinearRing(0);
    let sketchLineGeom = this.sketchLine_.getGeometry();
    if (!sketchLineGeom) {
      sketchLineGeom = new LineString(
        ring.getFlatCoordinates(),
        ring.getLayout()
      );
      this.sketchLine_.setGeometry(sketchLineGeom);
    } else {
      sketchLineGeom.setFlatCoordinates(
        ring.getLayout(),
        ring.getFlatCoordinates()
      );
      sketchLineGeom.changed();
    }
  }

  /**
   * Start the drawing.
   * @param {import("../coordinate.js").Coordinate} start Start coordinate.
   * @private
   */
  startDrawing_(start) {
    const projection = this.getMap().getView().getProjection();
    this.finishCoordinate_ = start;
    if (this.mode_ === Mode.POINT) {
      this.sketchCoords_ = start.slice();
    } else if (this.mode_ === Mode.POLYGON) {
      this.sketchCoords_ = [[start.slice(), start.slice()]];
      this.sketchLineCoords_ = this.sketchCoords_[0];
    } else {
      this.sketchCoords_ = [start.slice(), start.slice()];
    }
    if (this.sketchLineCoords_) {
      this.sketchLine_ = new Feature(new LineString(this.sketchLineCoords_));
    }
    const geometry = this.geometryFunction_(
      this.sketchCoords_,
      undefined,
      projection
    );
    this.sketchFeature_ = new Feature();
    if (this.geometryName_) {
      this.sketchFeature_.setGeometryName(this.geometryName_);
    }
    this.sketchFeature_.setGeometry(geometry);
    this.updateSketchFeatures_();
    this.dispatchEvent(
      new DrawEvent(DrawEventType.DRAWSTART, this.sketchFeature_)
    );
  }

  /**
   * Modify the drawing.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @private
   */
  modifyDrawing_(coordinate) {
    const map = this.getMap();
    const geometry = this.sketchFeature_.getGeometry();
    const projection = map.getView().getProjection();
    let coordinates, last;
    if (this.mode_ === Mode.POINT) {
      last = this.sketchCoords_;
    } else if (this.mode_ === Mode.POLYGON) {
      coordinates = /** @type {PolyCoordType} */ (this.sketchCoords_)[0];
      last = coordinates[coordinates.length - 1];
      if (this.atFinish_(map.getPixelFromCoordinate(coordinate))) {
        // snap to finish
        coordinate = this.finishCoordinate_.slice();
      }
    } else {
      coordinates = this.sketchCoords_;
      last = coordinates[coordinates.length - 1];
    }
    last[0] = coordinate[0];
    last[1] = coordinate[1];
    this.geometryFunction_(
      /** @type {!LineCoordType} */ (this.sketchCoords_),
      geometry,
      projection
    );
    if (this.sketchPoint_) {
      const sketchPointGeom = this.sketchPoint_.getGeometry();
      sketchPointGeom.setCoordinates(coordinate);
    }
    if (
      geometry.getType() === GeometryType.POLYGON &&
      this.mode_ !== Mode.POLYGON
    ) {
      this.createOrUpdateCustomSketchLine_(/** @type {Polygon} */ (geometry));
    } else if (this.sketchLineCoords_) {
      const sketchLineGeom = this.sketchLine_.getGeometry();
      sketchLineGeom.setCoordinates(this.sketchLineCoords_);
    }
    this.updateSketchFeatures_();
  }

  /**
   * Add a new coordinate to the drawing.
   * @param {!PointCoordType} coordinate Coordinate
   * @private
   */
  addToDrawing_(coordinate) {
    const geometry = this.sketchFeature_.getGeometry();
    const projection = this.getMap().getView().getProjection();
    let done;
    let coordinates;
    const mode = this.mode_;
    if (mode === Mode.LINE_STRING || mode === Mode.CIRCLE) {
      this.finishCoordinate_ = coordinate.slice();
      coordinates = /** @type {LineCoordType} */ (this.sketchCoords_);
      if (coordinates.length >= this.maxPoints_) {
        if (this.freehand_) {
          coordinates.pop();
        } else {
          done = true;
        }
      }
      coordinates.push(coordinate.slice());
      this.geometryFunction_(coordinates, geometry, projection);
    } else if (mode === Mode.POLYGON) {
      coordinates = /** @type {PolyCoordType} */ (this.sketchCoords_)[0];
      if (coordinates.length >= this.maxPoints_) {
        if (this.freehand_) {
          coordinates.pop();
        } else {
          done = true;
        }
      }
      coordinates.push(coordinate.slice());
      if (done) {
        this.finishCoordinate_ = coordinates[0];
      }
      this.geometryFunction_(this.sketchCoords_, geometry, projection);
    }
    this.createOrUpdateSketchPoint_(coordinate.slice());
    this.updateSketchFeatures_();
    if (done) {
      this.finishDrawing();
    }
  }

  /**
   * Remove last point of the feature currently being drawn. Does not do anything when
   * drawing POINT or MULTI_POINT geometries.
   * @api
   */
  removeLastPoint() {
    if (!this.sketchFeature_) {
      return;
    }
    const geometry = this.sketchFeature_.getGeometry();
    const projection = this.getMap().getView().getProjection();
    let coordinates;
    const mode = this.mode_;
    if (mode === Mode.LINE_STRING || mode === Mode.CIRCLE) {
      coordinates = /** @type {LineCoordType} */ (this.sketchCoords_);
      coordinates.splice(-2, 1);
      if (coordinates.length >= 2) {
        this.finishCoordinate_ = coordinates[coordinates.length - 2].slice();
        const finishCoordinate = this.finishCoordinate_.slice();
        coordinates[coordinates.length - 1] = finishCoordinate;
        this.createOrUpdateSketchPoint_(finishCoordinate);
      }
      this.geometryFunction_(coordinates, geometry, projection);
      if (geometry.getType() === GeometryType.POLYGON && this.sketchLine_) {
        this.createOrUpdateCustomSketchLine_(/** @type {Polygon} */ (geometry));
      }
    } else if (mode === Mode.POLYGON) {
      coordinates = /** @type {PolyCoordType} */ (this.sketchCoords_)[0];
      coordinates.splice(-2, 1);
      const sketchLineGeom = this.sketchLine_.getGeometry();
      if (coordinates.length >= 2) {
        const finishCoordinate = coordinates[coordinates.length - 2].slice();
        coordinates[coordinates.length - 1] = finishCoordinate;
        this.createOrUpdateSketchPoint_(finishCoordinate);
      }
      sketchLineGeom.setCoordinates(coordinates);
      this.geometryFunction_(this.sketchCoords_, geometry, projection);
    }

    if (coordinates.length === 1) {
      this.abortDrawing();
    }

    this.updateSketchFeatures_();
  }

  /**
   * Stop drawing and add the sketch feature to the target layer.
   * The {@link module:ol/interaction/Draw~DrawEventType.DRAWEND} event is
   * dispatched before inserting the feature.
   * @api
   */
  finishDrawing() {
    const sketchFeature = this.abortDrawing_();
    if (!sketchFeature) {
      return;
    }
    let coordinates = this.sketchCoords_;
    const geometry = sketchFeature.getGeometry();
    const projection = this.getMap().getView().getProjection();
    if (this.mode_ === Mode.LINE_STRING) {
      // remove the redundant last point
      coordinates.pop();
      this.geometryFunction_(coordinates, geometry, projection);
    } else if (this.mode_ === Mode.POLYGON) {
      // remove the redundant last point in ring
      /** @type {PolyCoordType} */ (coordinates)[0].pop();
      this.geometryFunction_(coordinates, geometry, projection);
      coordinates = geometry.getCoordinates();
    }

    // cast multi-part geometries
    if (this.type_ === GeometryType.MULTI_POINT) {
      sketchFeature.setGeometry(
        new MultiPoint([/** @type {PointCoordType} */ (coordinates)])
      );
    } else if (this.type_ === GeometryType.MULTI_LINE_STRING) {
      sketchFeature.setGeometry(
        new MultiLineString([/** @type {LineCoordType} */ (coordinates)])
      );
    } else if (this.type_ === GeometryType.MULTI_POLYGON) {
      sketchFeature.setGeometry(
        new MultiPolygon([/** @type {PolyCoordType} */ (coordinates)])
      );
    }

    // First dispatch event to allow full set up of feature
    this.dispatchEvent(new DrawEvent(DrawEventType.DRAWEND, sketchFeature));

    // Then insert feature
    if (this.features_) {
      this.features_.push(sketchFeature);
    }
    if (this.source_) {
      this.source_.addFeature(sketchFeature);
    }
  }

  /**
   * Stop drawing without adding the sketch feature to the target layer.
   * @return {Feature<import("../geom/SimpleGeometry.js").default>|null} The sketch feature (or null if none).
   * @private
   */
  abortDrawing_() {
    this.finishCoordinate_ = null;
    const sketchFeature = this.sketchFeature_;
    this.sketchFeature_ = null;
    this.sketchPoint_ = null;
    this.sketchLine_ = null;
    this.overlay_.getSource().clear(true);
    return sketchFeature;
  }

  /**
   * Stop drawing without adding the sketch feature to the target layer.
   * @api
   */
  abortDrawing() {
    const sketchFeature = this.abortDrawing_();
    if (sketchFeature) {
      this.dispatchEvent(new DrawEvent(DrawEventType.DRAWABORT, sketchFeature));
    }
  }

  /**
   * Append coordinates to the end of the geometry that is currently being drawn.
   * This can be used when drawing LineStrings or Polygons. Coordinates will
   * either be appended to the current LineString or the outer ring of the current
   * Polygon. If no geometry is being drawn, a new one will be created.
   * @param {!LineCoordType} coordinates Linear coordinates to be appended to
   * the coordinate array.
   * @api
   */
  appendCoordinates(coordinates) {
    const mode = this.mode_;
    const newDrawing = !this.sketchFeature_;
    if (newDrawing) {
      this.startDrawing_(coordinates[0]);
    }
    /** @type {LineCoordType} */
    let sketchCoords;
    if (mode === Mode.LINE_STRING || mode === Mode.CIRCLE) {
      sketchCoords = /** @type {LineCoordType} */ (this.sketchCoords_);
    } else if (mode === Mode.POLYGON) {
      sketchCoords =
        this.sketchCoords_ && this.sketchCoords_.length
          ? /** @type {PolyCoordType} */ (this.sketchCoords_)[0]
          : [];
    } else {
      return;
    }

    if (newDrawing) {
      sketchCoords.shift();
    }

    // Remove last coordinate from sketch drawing (this coordinate follows cursor position)
    sketchCoords.pop();

    // Append coordinate list
    for (let i = 0; i < coordinates.length; i++) {
      this.addToDrawing_(coordinates[i]);
    }

    const ending = coordinates[coordinates.length - 1];
    // Duplicate last coordinate for sketch drawing (cursor position)
    this.addToDrawing_(ending);
    this.modifyDrawing_(ending);
  }

  /**
   * Initiate draw mode by starting from an existing geometry which will
   * receive new additional points. This only works on features with
   * `LineString` geometries, where the interaction will extend lines by adding
   * points to the end of the coordinates array.
   * This will change the original feature, instead of drawing a copy.
   *
   * The function will dispatch a `drawstart` event.
   *
   * @param {!Feature<LineString>} feature Feature to be extended.
   * @api
   */
  extend(feature) {
    const geometry = feature.getGeometry();
    const lineString = geometry;
    this.sketchFeature_ = feature;
    this.sketchCoords_ = lineString.getCoordinates();
    const last = this.sketchCoords_[this.sketchCoords_.length - 1];
    this.finishCoordinate_ = last.slice();
    this.sketchCoords_.push(last.slice());
    this.sketchPoint_ = new Feature(new Point(last));
    this.updateSketchFeatures_();
    this.dispatchEvent(
      new DrawEvent(DrawEventType.DRAWSTART, this.sketchFeature_)
    );
  }

  /**
   * Redraw the sketch features.
   * @private
   */
  updateSketchFeatures_() {
    const sketchFeatures = [];
    if (this.sketchFeature_) {
      sketchFeatures.push(this.sketchFeature_);
    }
    if (this.sketchLine_) {
      sketchFeatures.push(this.sketchLine_);
    }
    if (this.sketchPoint_) {
      sketchFeatures.push(this.sketchPoint_);
    }
    const overlaySource = this.overlay_.getSource();
    overlaySource.clear(true);
    overlaySource.addFeatures(sketchFeatures);
  }

  /**
   * @private
   */
  updateState_() {
    const map = this.getMap();
    const active = this.getActive();
    if (!map || !active) {
      this.abortDrawing();
    }
    this.overlay_.setMap(active ? map : null);
  }
}

/**
 * @return {import("../style/Style.js").StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  const styles = createEditingStyle();
  return function (feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
}

/**
 * Create a `geometryFunction` for `type: 'Circle'` that will create a regular
 * polygon with a user specified number of sides and start angle instead of a
 * {@link import("../geom/Circle.js").Circle} geometry.
 * @param {number} [opt_sides] Number of sides of the regular polygon.
 *     Default is 32.
 * @param {number} [opt_angle] Angle of the first point in counter-clockwise
 *     radians. 0 means East.
 *     Default is the angle defined by the heading from the center of the
 *     regular polygon to the current pointer position.
 * @return {GeometryFunction} Function that draws a polygon.
 * @api
 */
export function createRegularPolygon(opt_sides, opt_angle) {
  return function (coordinates, opt_geometry, projection) {
    const center = fromUserCoordinate(
      /** @type {LineCoordType} */ (coordinates)[0],
      projection
    );
    const end = fromUserCoordinate(
      /** @type {LineCoordType} */ (coordinates)[coordinates.length - 1],
      projection
    );
    const radius = Math.sqrt(squaredCoordinateDistance(center, end));
    const geometry = opt_geometry
      ? /** @type {Polygon} */ (opt_geometry)
      : fromCircle(new Circle(center), opt_sides);

    let angle = opt_angle;
    if (!opt_angle && opt_angle !== 0) {
      const x = end[0] - center[0];
      const y = end[1] - center[1];
      angle = Math.atan2(y, x);
    }
    makeRegular(geometry, center, radius, angle);

    const userProjection = getUserProjection();
    if (userProjection) {
      geometry.transform(projection, userProjection);
    }
    return geometry;
  };
}

/**
 * Create a `geometryFunction` that will create a box-shaped polygon (aligned
 * with the coordinate system axes).  Use this with the draw interaction and
 * `type: 'Circle'` to return a box instead of a circle geometry.
 * @return {GeometryFunction} Function that draws a box-shaped polygon.
 * @api
 */
export function createBox() {
  return function (coordinates, opt_geometry, projection) {
    const extent = boundingExtent(
      /** @type {LineCoordType} */ ([
        coordinates[0],
        coordinates[coordinates.length - 1],
      ]).map(function (coordinate) {
        return fromUserCoordinate(coordinate, projection);
      })
    );
    const boxCoordinates = [
      [
        getBottomLeft(extent),
        getBottomRight(extent),
        getTopRight(extent),
        getTopLeft(extent),
        getBottomLeft(extent),
      ],
    ];
    let geometry = opt_geometry;
    if (geometry) {
      geometry.setCoordinates(boxCoordinates);
    } else {
      geometry = new Polygon(boxCoordinates);
    }
    const userProjection = getUserProjection();
    if (userProjection) {
      geometry.transform(projection, userProjection);
    }
    return geometry;
  };
}

/**
 * Get the drawing mode.  The mode for multi-part geometries is the same as for
 * their single-part cousins.
 * @param {import("../geom/GeometryType.js").default} type Geometry type.
 * @return {Mode} Drawing mode.
 */
function getMode(type) {
  switch (type) {
    case GeometryType.POINT:
    case GeometryType.MULTI_POINT:
      return Mode.POINT;
    case GeometryType.LINE_STRING:
    case GeometryType.MULTI_LINE_STRING:
      return Mode.LINE_STRING;
    case GeometryType.POLYGON:
    case GeometryType.MULTI_POLYGON:
      return Mode.POLYGON;
    case GeometryType.CIRCLE:
      return Mode.CIRCLE;
    default:
      throw new Error('Invalid type: ' + type);
  }
}

export default Draw;
