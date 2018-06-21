/**
 * @module ol/interaction/Draw
 */
import {inherits} from '../util.js';
import EventType from '../events/EventType.js';
import Feature from '../Feature.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import MapBrowserPointerEvent from '../MapBrowserPointerEvent.js';
import {getChangeEventType} from '../Object.js';
import {squaredDistance as squaredCoordinateDistance} from '../coordinate.js';
import {listen} from '../events.js';
import Event from '../events/Event.js';
import {noModifierKeys, always, shiftKeyOnly} from '../events/condition.js';
import {boundingExtent, getBottomLeft, getBottomRight, getTopLeft, getTopRight} from '../extent.js';
import {TRUE, FALSE} from '../functions.js';
import Circle from '../geom/Circle.js';
import GeometryType from '../geom/GeometryType.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import {POINTER_TYPE} from '../pointer/MouseSource.js';
import Point from '../geom/Point.js';
import Polygon, {fromCircle, makeRegular} from '../geom/Polygon.js';
import PointerInteraction, {handleEvent as handlePointerEvent} from '../interaction/Pointer.js';
import InteractionProperty from '../interaction/Property.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import {createEditingStyle} from '../style/Style.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/geom/GeometryType} type Geometry type of
 * the geometries being drawn with this instance.
 * @property {number} [clickTolerance=6] The maximum distance in pixels between
 * "down" and "up" for a "up" event to be considered a "click" event and
 * actually add a point/vertex to the geometry being drawn.  The default of `6`
 * was chosen for the draw interaction to behave correctly on mouse as well as
 * on touch devices.
 * @property {module:ol/Collection.<module:ol/Feature>} [features]
 * Destination collection for the drawn features.
 * @property {module:ol/source/Vector} [source] Destination source for
 * the drawn features.
 * @property {number} [dragVertexDelay=500] Delay in milliseconds after pointerdown
 * before the current vertex can be dragged to its exact position.
 * @property {number} [snapTolerance=12] Pixel distance for snapping to the
 * drawing finish.
 * @property {boolean} [stopClick=false] Stop click, singleclick, and
 * doubleclick events from firing during drawing.
 * @property {number} [maxPoints] The number of points that can be drawn before
 * a polygon ring or line string is finished. By default there is no
 * restriction.
 * @property {number} [minPoints] The number of points that must be drawn
 * before a polygon ring or line string can be finished. Default is `3` for
 * polygon rings and `2` for line strings.
 * @property {module:ol/events/condition~Condition} [finishCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether the drawing can be finished.
 * @property {module:ol/style/Style|Array.<module:ol/style/Style>|module:ol/style/Style~StyleFunction} [style]
 * Style for sketch features.
 * @property {module:ol/interaction/Draw~GeometryFunction} [geometryFunction]
 * Function that is called when a geometry's coordinates are updated.
 * @property {string} [geometryName] Geometry name to use for features created
 * by the draw interaction.
 * @property {module:ol/events/condition~Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * By default {@link module:ol/events/condition~noModifierKeys}, i.e. a click,
 * adds a vertex or deactivates freehand drawing.
 * @property {boolean} [freehand=false] Operate in freehand mode for lines,
 * polygons, and circles.  This makes the interaction always operate in freehand
 * mode and takes precedence over any `freehandCondition` option.
 * @property {module:ol/events/condition~Condition} [freehandCondition]
 * Condition that activates freehand drawing for lines and polygons. This
 * function takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and
 * returns a boolean to indicate whether that event should be handled. The
 * default is {@link module:ol/events/condition~shiftKeyOnly}, meaning that the
 * Shift key activates freehand drawing.
 * @property {boolean} [wrapX=false] Wrap the world horizontally on the sketch
 * overlay.
 */


/**
 * Function that takes an array of coordinates and an optional existing geometry as
 * arguments, and returns a geometry. The optional existing geometry is the
 * geometry that is returned when the function is called without a second
 * argument.
 * @typedef {function(!Array.<module:ol/coordinate~Coordinate>, module:ol/geom/SimpleGeometry=):
 *     module:ol/geom/SimpleGeometry} GeometryFunction
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
  CIRCLE: 'Circle'
};


/**
 * @enum {string}
 */
const DrawEventType = {
  /**
   * Triggered upon feature draw start
   * @event module:ol/interaction/Draw~DrawEvent#drawstart
   * @api
   */
  DRAWSTART: 'drawstart',
  /**
   * Triggered upon feature draw end
   * @event module:ol/interaction/Draw~DrawEvent#drawend
   * @api
   */
  DRAWEND: 'drawend'
};


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Draw~Draw} instances are
 * instances of this type.
 *
 * @constructor
 * @extends {module:ol/events/Event}
 * @param {module:ol/interaction/Draw~DrawEventType} type Type.
 * @param {module:ol/Feature} feature The feature drawn.
 */
const DrawEvent = function(type, feature) {

  Event.call(this, type);

  /**
   * The feature being drawn.
   * @type {module:ol/Feature}
   * @api
   */
  this.feature = feature;

};

inherits(DrawEvent, Event);


/**
 * @classdesc
 * Interaction for drawing feature geometries.
 *
 * @constructor
 * @extends {module:ol/interaction/Pointer}
 * @fires module:ol/interaction/Draw~DrawEvent
 * @param {module:ol/interaction/Draw~Options} options Options.
 * @api
 */
const Draw = function(options) {

  PointerInteraction.call(this, {
    handleDownEvent: handleDownEvent,
    handleEvent: handleEvent,
    handleUpEvent: handleUpEvent
  });

  /**
   * @type {boolean}
   * @private
   */
  this.shouldHandle_ = false;

  /**
   * @type {module:ol~Pixel}
   * @private
   */
  this.downPx_ = null;

  /**
   * @type {number|undefined}
   * @private
   */
  this.downTimeout_;

  /**
   * @type {number|undefined}
   * @private
   */
  this.lastDragTime_;

  /**
   * @type {boolean}
   * @private
   */
  this.freehand_ = false;

  /**
   * Target source for drawn features.
   * @type {module:ol/source/Vector}
   * @private
   */
  this.source_ = options.source ? options.source : null;

  /**
   * Target collection for drawn features.
   * @type {module:ol/Collection.<module:ol/Feature>}
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
   * @type {module:ol/geom/GeometryType}
   * @private
   */
  this.type_ = /** @type {module:ol/geom/GeometryType} */ (options.type);

  /**
   * Drawing mode (derived from geometry type.
   * @type {module:ol/interaction/Draw~Mode}
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
  this.minPoints_ = options.minPoints ?
    options.minPoints :
    (this.mode_ === Mode.POLYGON ? 3 : 2);

  /**
   * The number of points that can be drawn before a polygon ring or line string
   * is finished. The default is no restriction.
   * @type {number}
   * @private
   */
  this.maxPoints_ = options.maxPoints ? options.maxPoints : Infinity;

  /**
   * A function to decide if a potential finish coordinate is permissible
   * @private
   * @type {module:ol/events/condition~Condition}
   */
  this.finishCondition_ = options.finishCondition ? options.finishCondition : TRUE;

  let geometryFunction = options.geometryFunction;
  if (!geometryFunction) {
    if (this.type_ === GeometryType.CIRCLE) {
      /**
       * @param {!Array.<module:ol/coordinate~Coordinate>} coordinates
       *     The coordinates.
       * @param {module:ol/geom/SimpleGeometry=} opt_geometry Optional geometry.
       * @return {module:ol/geom/SimpleGeometry} A geometry.
       */
      geometryFunction = function(coordinates, opt_geometry) {
        const circle = opt_geometry ? /** @type {module:ol/geom/Circle} */ (opt_geometry) :
          new Circle([NaN, NaN]);
        const squaredLength = squaredCoordinateDistance(
          coordinates[0], coordinates[1]);
        circle.setCenterAndRadius(coordinates[0], Math.sqrt(squaredLength));
        return circle;
      };
    } else {
      let Constructor;
      const mode = this.mode_;
      if (mode === Mode.POINT) {
        Constructor = Point;
      } else if (mode === Mode.LINE_STRING) {
        Constructor = LineString;
      } else if (mode === Mode.POLYGON) {
        Constructor = Polygon;
      }
      /**
       * @param {!Array.<module:ol/coordinate~Coordinate>} coordinates
       *     The coordinates.
       * @param {module:ol/geom/SimpleGeometry=} opt_geometry Optional geometry.
       * @return {module:ol/geom/SimpleGeometry} A geometry.
       */
      geometryFunction = function(coordinates, opt_geometry) {
        let geometry = opt_geometry;
        if (geometry) {
          if (mode === Mode.POLYGON) {
            if (coordinates[0].length) {
              // Add a closing coordinate to match the first
              geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
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
   * @type {module:ol/interaction/Draw~GeometryFunction}
   * @private
   */
  this.geometryFunction_ = geometryFunction;

  /**
   * @type {number}
   * @private
   */
  this.dragVertexDelay_ = options.dragVertexDelay !== undefined ? options.dragVertexDelay : 500;

  /**
   * Finish coordinate for the feature (first point for polygons, last point for
   * linestrings).
   * @type {module:ol/coordinate~Coordinate}
   * @private
   */
  this.finishCoordinate_ = null;

  /**
   * Sketch feature.
   * @type {module:ol/Feature}
   * @private
   */
  this.sketchFeature_ = null;

  /**
   * Sketch point.
   * @type {module:ol/Feature}
   * @private
   */
  this.sketchPoint_ = null;

  /**
   * Sketch coordinates. Used when drawing a line or polygon.
   * @type {module:ol/coordinate~Coordinate|Array.<module:ol/coordinate~Coordinate>|Array.<Array.<module:ol/coordinate~Coordinate>>}
   * @private
   */
  this.sketchCoords_ = null;

  /**
   * Sketch line. Used when drawing polygon.
   * @type {module:ol/Feature}
   * @private
   */
  this.sketchLine_ = null;

  /**
   * Sketch line coordinates. Used when drawing a polygon or circle.
   * @type {Array.<module:ol/coordinate~Coordinate>}
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
  this.squaredClickTolerance_ = options.clickTolerance ?
    options.clickTolerance * options.clickTolerance : 36;

  /**
   * Draw overlay where our sketch features are drawn.
   * @type {module:ol/layer/Vector}
   * @private
   */
  this.overlay_ = new VectorLayer({
    source: new VectorSource({
      useSpatialIndex: false,
      wrapX: options.wrapX ? options.wrapX : false
    }),
    style: options.style ? options.style :
      getDefaultStyleFunction(),
    updateWhileInteracting: true
  });

  /**
   * Name of the geometry attribute for newly created features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

  /**
   * @private
   * @type {module:ol/events/condition~Condition}
   */
  this.condition_ = options.condition ? options.condition : noModifierKeys;

  /**
   * @private
   * @type {module:ol/events/condition~Condition}
   */
  this.freehandCondition_;
  if (options.freehand) {
    this.freehandCondition_ = always;
  } else {
    this.freehandCondition_ = options.freehandCondition ?
      options.freehandCondition : shiftKeyOnly;
  }

  listen(this,
    getChangeEventType(InteractionProperty.ACTIVE),
    this.updateState_, this);

};

inherits(Draw, PointerInteraction);


/**
 * @return {module:ol/style/Style~StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  const styles = createEditingStyle();
  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
}


/**
 * @inheritDoc
 */
Draw.prototype.setMap = function(map) {
  PointerInteraction.prototype.setMap.call(this, map);
  this.updateState_();
};


/**
 * Handles the {@link module:ol/MapBrowserEvent map browser event} and may actually
 * draw or finish the drawing.
 * @param {module:ol/MapBrowserEvent} event Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {module:ol/interaction/Draw}
 * @api
 */
export function handleEvent(event) {
  if (event.originalEvent.type === EventType.CONTEXTMENU) {
    // Avoid context menu for long taps when drawing on mobile
    event.preventDefault();
  }
  this.freehand_ = this.mode_ !== Mode.POINT && this.freehandCondition_(event);
  let move = event.type === MapBrowserEventType.POINTERMOVE;
  let pass = true;
  if (this.lastDragTime_ && event.type === MapBrowserEventType.POINTERDRAG) {
    const now = Date.now();
    if (now - this.lastDragTime_ >= this.dragVertexDelay_) {
      this.downPx_ = event.pixel;
      this.shouldHandle_ = !this.freehand_;
      move = true;
    } else {
      this.lastDragTime_ = undefined;
    }
    if (this.shouldHandle_ && this.downTimeout_) {
      clearTimeout(this.downTimeout_);
      this.downTimeout_ = undefined;
    }
  }
  if (this.freehand_ &&
      event.type === MapBrowserEventType.POINTERDRAG &&
      this.sketchFeature_ !== null) {
    this.addToDrawing_(event);
    pass = false;
  } else if (this.freehand_ &&
      event.type === MapBrowserEventType.POINTERDOWN) {
    pass = false;
  } else if (move) {
    pass = event.type === MapBrowserEventType.POINTERMOVE;
    if (pass && this.freehand_) {
      pass = this.handlePointerMove_(event);
    } else if (event.pointerEvent.pointerType == POINTER_TYPE ||
        (event.type === MapBrowserEventType.POINTERDRAG && !this.downTimeout_)) {
      this.handlePointerMove_(event);
    }
  } else if (event.type === MapBrowserEventType.DBLCLICK) {
    pass = false;
  }

  return handlePointerEvent.call(this, event) && pass;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {module:ol/interaction/Draw}
 */
function handleDownEvent(event) {
  this.shouldHandle_ = !this.freehand_;

  if (this.freehand_) {
    this.downPx_ = event.pixel;
    if (!this.finishCoordinate_) {
      this.startDrawing_(event);
    }
    return true;
  } else if (this.condition_(event)) {
    this.lastDragTime_ = Date.now();
    this.downTimeout_ = setTimeout(function() {
      this.handlePointerMove_(new MapBrowserPointerEvent(
        MapBrowserEventType.POINTERMOVE, event.map, event.pointerEvent, event.frameState));
    }.bind(this), this.dragVertexDelay_);
    this.downPx_ = event.pixel;
    return true;
  } else {
    return false;
  }
}


/**
 * @param {module:ol/MapBrowserPointerEvent} event Event.
 * @return {boolean} Stop drag sequence?
 * @this {module:ol/interaction/Draw}
 */
function handleUpEvent(event) {
  let pass = true;

  if (this.downTimeout_) {
    clearTimeout(this.downTimeout_);
    this.downTimeout_ = undefined;
  }

  this.handlePointerMove_(event);

  const circleMode = this.mode_ === Mode.CIRCLE;

  if (this.shouldHandle_) {
    if (!this.finishCoordinate_) {
      this.startDrawing_(event);
      if (this.mode_ === Mode.POINT) {
        this.finishDrawing();
      }
    } else if (this.freehand_ || circleMode) {
      this.finishDrawing();
    } else if (this.atFinish_(event)) {
      if (this.finishCondition_(event)) {
        this.finishDrawing();
      }
    } else {
      this.addToDrawing_(event);
    }
    pass = false;
  } else if (this.freehand_) {
    this.finishCoordinate_ = null;
    this.abortDrawing_();
  }
  if (!pass && this.stopClick_) {
    event.stopPropagation();
  }
  return pass;
}


/**
 * Handle move events.
 * @param {module:ol/MapBrowserEvent} event A move event.
 * @return {boolean} Pass the event to other interactions.
 * @private
 */
Draw.prototype.handlePointerMove_ = function(event) {
  if (this.downPx_ &&
      ((!this.freehand_ && this.shouldHandle_) ||
      (this.freehand_ && !this.shouldHandle_))) {
    const downPx = this.downPx_;
    const clickPx = event.pixel;
    const dx = downPx[0] - clickPx[0];
    const dy = downPx[1] - clickPx[1];
    const squaredDistance = dx * dx + dy * dy;
    this.shouldHandle_ = this.freehand_ ?
      squaredDistance > this.squaredClickTolerance_ :
      squaredDistance <= this.squaredClickTolerance_;
    if (!this.shouldHandle_) {
      return true;
    }
  }

  if (this.finishCoordinate_) {
    this.modifyDrawing_(event);
  } else {
    this.createOrUpdateSketchPoint_(event);
  }
  return true;
};


/**
 * Determine if an event is within the snapping tolerance of the start coord.
 * @param {module:ol/MapBrowserEvent} event Event.
 * @return {boolean} The event is within the snapping tolerance of the start.
 * @private
 */
Draw.prototype.atFinish_ = function(event) {
  let at = false;
  if (this.sketchFeature_) {
    let potentiallyDone = false;
    let potentiallyFinishCoordinates = [this.finishCoordinate_];
    if (this.mode_ === Mode.LINE_STRING) {
      potentiallyDone = this.sketchCoords_.length > this.minPoints_;
    } else if (this.mode_ === Mode.POLYGON) {
      potentiallyDone = this.sketchCoords_[0].length >
          this.minPoints_;
      potentiallyFinishCoordinates = [this.sketchCoords_[0][0],
        this.sketchCoords_[0][this.sketchCoords_[0].length - 2]];
    }
    if (potentiallyDone) {
      const map = event.map;
      for (let i = 0, ii = potentiallyFinishCoordinates.length; i < ii; i++) {
        const finishCoordinate = potentiallyFinishCoordinates[i];
        const finishPixel = map.getPixelFromCoordinate(finishCoordinate);
        const pixel = event.pixel;
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
};


/**
 * @param {module:ol/MapBrowserEvent} event Event.
 * @private
 */
Draw.prototype.createOrUpdateSketchPoint_ = function(event) {
  const coordinates = event.coordinate.slice();
  if (!this.sketchPoint_) {
    this.sketchPoint_ = new Feature(new Point(coordinates));
    this.updateSketchFeatures_();
  } else {
    const sketchPointGeom = /** @type {module:ol/geom/Point} */ (this.sketchPoint_.getGeometry());
    sketchPointGeom.setCoordinates(coordinates);
  }
};


/**
 * Start the drawing.
 * @param {module:ol/MapBrowserEvent} event Event.
 * @private
 */
Draw.prototype.startDrawing_ = function(event) {
  const start = event.coordinate;
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
    this.sketchLine_ = new Feature(
      new LineString(this.sketchLineCoords_));
  }
  const geometry = this.geometryFunction_(this.sketchCoords_);
  this.sketchFeature_ = new Feature();
  if (this.geometryName_) {
    this.sketchFeature_.setGeometryName(this.geometryName_);
  }
  this.sketchFeature_.setGeometry(geometry);
  this.updateSketchFeatures_();
  this.dispatchEvent(new DrawEvent(DrawEventType.DRAWSTART, this.sketchFeature_));
};


/**
 * Modify the drawing.
 * @param {module:ol/MapBrowserEvent} event Event.
 * @private
 */
Draw.prototype.modifyDrawing_ = function(event) {
  let coordinate = event.coordinate;
  const geometry = /** @type {module:ol/geom/SimpleGeometry} */ (this.sketchFeature_.getGeometry());
  let coordinates, last;
  if (this.mode_ === Mode.POINT) {
    last = this.sketchCoords_;
  } else if (this.mode_ === Mode.POLYGON) {
    coordinates = this.sketchCoords_[0];
    last = coordinates[coordinates.length - 1];
    if (this.atFinish_(event)) {
      // snap to finish
      coordinate = this.finishCoordinate_.slice();
    }
  } else {
    coordinates = this.sketchCoords_;
    last = coordinates[coordinates.length - 1];
  }
  last[0] = coordinate[0];
  last[1] = coordinate[1];
  this.geometryFunction_(/** @type {!Array.<module:ol/coordinate~Coordinate>} */ (this.sketchCoords_), geometry);
  if (this.sketchPoint_) {
    const sketchPointGeom = /** @type {module:ol/geom/Point} */ (this.sketchPoint_.getGeometry());
    sketchPointGeom.setCoordinates(coordinate);
  }
  let sketchLineGeom;
  if (geometry instanceof Polygon &&
      this.mode_ !== Mode.POLYGON) {
    if (!this.sketchLine_) {
      this.sketchLine_ = new Feature(new LineString(null));
    }
    const ring = geometry.getLinearRing(0);
    sketchLineGeom = /** @type {module:ol/geom/LineString} */ (this.sketchLine_.getGeometry());
    sketchLineGeom.setFlatCoordinates(
      ring.getLayout(), ring.getFlatCoordinates());
  } else if (this.sketchLineCoords_) {
    sketchLineGeom = /** @type {module:ol/geom/LineString} */ (this.sketchLine_.getGeometry());
    sketchLineGeom.setCoordinates(this.sketchLineCoords_);
  }
  this.updateSketchFeatures_();
};


/**
 * Add a new coordinate to the drawing.
 * @param {module:ol/MapBrowserEvent} event Event.
 * @private
 */
Draw.prototype.addToDrawing_ = function(event) {
  const coordinate = event.coordinate;
  const geometry = /** @type {module:ol/geom/SimpleGeometry} */ (this.sketchFeature_.getGeometry());
  let done;
  let coordinates;
  if (this.mode_ === Mode.LINE_STRING) {
    this.finishCoordinate_ = coordinate.slice();
    coordinates = this.sketchCoords_;
    if (coordinates.length >= this.maxPoints_) {
      if (this.freehand_) {
        coordinates.pop();
      } else {
        done = true;
      }
    }
    coordinates.push(coordinate.slice());
    this.geometryFunction_(coordinates, geometry);
  } else if (this.mode_ === Mode.POLYGON) {
    coordinates = this.sketchCoords_[0];
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
    this.geometryFunction_(this.sketchCoords_, geometry);
  }
  this.updateSketchFeatures_();
  if (done) {
    this.finishDrawing();
  }
};


/**
 * Remove last point of the feature currently being drawn.
 * @api
 */
Draw.prototype.removeLastPoint = function() {
  if (!this.sketchFeature_) {
    return;
  }
  const geometry = /** @type {module:ol/geom/SimpleGeometry} */ (this.sketchFeature_.getGeometry());
  let coordinates, sketchLineGeom;
  if (this.mode_ === Mode.LINE_STRING) {
    coordinates = this.sketchCoords_;
    coordinates.splice(-2, 1);
    this.geometryFunction_(coordinates, geometry);
    if (coordinates.length >= 2) {
      this.finishCoordinate_ = coordinates[coordinates.length - 2].slice();
    }
  } else if (this.mode_ === Mode.POLYGON) {
    coordinates = this.sketchCoords_[0];
    coordinates.splice(-2, 1);
    sketchLineGeom = /** @type {module:ol/geom/LineString} */ (this.sketchLine_.getGeometry());
    sketchLineGeom.setCoordinates(coordinates);
    this.geometryFunction_(this.sketchCoords_, geometry);
  }

  if (coordinates.length === 0) {
    this.finishCoordinate_ = null;
  }

  this.updateSketchFeatures_();
};


/**
 * Stop drawing and add the sketch feature to the target layer.
 * The {@link module:ol/interaction/Draw~DrawEventType.DRAWEND} event is
 * dispatched before inserting the feature.
 * @api
 */
Draw.prototype.finishDrawing = function() {
  const sketchFeature = this.abortDrawing_();
  if (!sketchFeature) {
    return;
  }
  let coordinates = this.sketchCoords_;
  const geometry = /** @type {module:ol/geom/SimpleGeometry} */ (sketchFeature.getGeometry());
  if (this.mode_ === Mode.LINE_STRING) {
    // remove the redundant last point
    coordinates.pop();
    this.geometryFunction_(coordinates, geometry);
  } else if (this.mode_ === Mode.POLYGON) {
    // remove the redundant last point in ring
    coordinates[0].pop();
    this.geometryFunction_(coordinates, geometry);
    coordinates = geometry.getCoordinates();
  }

  // cast multi-part geometries
  if (this.type_ === GeometryType.MULTI_POINT) {
    sketchFeature.setGeometry(new MultiPoint([coordinates]));
  } else if (this.type_ === GeometryType.MULTI_LINE_STRING) {
    sketchFeature.setGeometry(new MultiLineString([coordinates]));
  } else if (this.type_ === GeometryType.MULTI_POLYGON) {
    sketchFeature.setGeometry(new MultiPolygon([coordinates]));
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
};


/**
 * Stop drawing without adding the sketch feature to the target layer.
 * @return {module:ol/Feature} The sketch feature (or null if none).
 * @private
 */
Draw.prototype.abortDrawing_ = function() {
  this.finishCoordinate_ = null;
  const sketchFeature = this.sketchFeature_;
  if (sketchFeature) {
    this.sketchFeature_ = null;
    this.sketchPoint_ = null;
    this.sketchLine_ = null;
    this.overlay_.getSource().clear(true);
  }
  return sketchFeature;
};


/**
 * Extend an existing geometry by adding additional points. This only works
 * on features with `LineString` geometries, where the interaction will
 * extend lines by adding points to the end of the coordinates array.
 * @param {!module:ol/Feature} feature Feature to be extended.
 * @api
 */
Draw.prototype.extend = function(feature) {
  const geometry = feature.getGeometry();
  const lineString = /** @type {module:ol/geom/LineString} */ (geometry);
  this.sketchFeature_ = feature;
  this.sketchCoords_ = lineString.getCoordinates();
  const last = this.sketchCoords_[this.sketchCoords_.length - 1];
  this.finishCoordinate_ = last.slice();
  this.sketchCoords_.push(last.slice());
  this.updateSketchFeatures_();
  this.dispatchEvent(new DrawEvent(DrawEventType.DRAWSTART, this.sketchFeature_));
};


/**
 * @inheritDoc
 */
Draw.prototype.shouldStopEvent = FALSE;


/**
 * Redraw the sketch features.
 * @private
 */
Draw.prototype.updateSketchFeatures_ = function() {
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
};


/**
 * @private
 */
Draw.prototype.updateState_ = function() {
  const map = this.getMap();
  const active = this.getActive();
  if (!map || !active) {
    this.abortDrawing_();
  }
  this.overlay_.setMap(active ? map : null);
};


/**
 * Create a `geometryFunction` for `type: 'Circle'` that will create a regular
 * polygon with a user specified number of sides and start angle instead of an
 * `module:ol/geom/Circle~Circle` geometry.
 * @param {number=} opt_sides Number of sides of the regular polygon. Default is
 *     32.
 * @param {number=} opt_angle Angle of the first point in radians. 0 means East.
 *     Default is the angle defined by the heading from the center of the
 *     regular polygon to the current pointer position.
 * @return {module:ol/interaction/Draw~GeometryFunction} Function that draws a
 *     polygon.
 * @api
 */
export function createRegularPolygon(opt_sides, opt_angle) {
  return function(coordinates, opt_geometry) {
    const center = coordinates[0];
    const end = coordinates[1];
    const radius = Math.sqrt(
      squaredCoordinateDistance(center, end));
    const geometry = opt_geometry ? /** @type {module:ol/geom/Polygon} */ (opt_geometry) :
      fromCircle(new Circle(center), opt_sides);
    const angle = opt_angle ? opt_angle :
      Math.atan((end[1] - center[1]) / (end[0] - center[0]));
    makeRegular(geometry, center, radius, angle);
    return geometry;
  };
}


/**
 * Create a `geometryFunction` that will create a box-shaped polygon (aligned
 * with the coordinate system axes).  Use this with the draw interaction and
 * `type: 'Circle'` to return a box instead of a circle geometry.
 * @return {module:ol/interaction/Draw~GeometryFunction} Function that draws a box-shaped polygon.
 * @api
 */
export function createBox() {
  return (
    function(coordinates, opt_geometry) {
      const extent = boundingExtent(coordinates);
      const geometry = opt_geometry || new Polygon(null);
      geometry.setCoordinates([[
        getBottomLeft(extent),
        getBottomRight(extent),
        getTopRight(extent),
        getTopLeft(extent),
        getBottomLeft(extent)
      ]]);
      return geometry;
    }
  );
}


/**
 * Get the drawing mode.  The mode for mult-part geometries is the same as for
 * their single-part cousins.
 * @param {module:ol/geom/GeometryType} type Geometry type.
 * @return {module:ol/interaction/Draw~Mode} Drawing mode.
 */
function getMode(type) {
  let mode;
  if (type === GeometryType.POINT ||
      type === GeometryType.MULTI_POINT) {
    mode = Mode.POINT;
  } else if (type === GeometryType.LINE_STRING ||
      type === GeometryType.MULTI_LINE_STRING) {
    mode = Mode.LINE_STRING;
  } else if (type === GeometryType.POLYGON ||
      type === GeometryType.MULTI_POLYGON) {
    mode = Mode.POLYGON;
  } else if (type === GeometryType.CIRCLE) {
    mode = Mode.CIRCLE;
  }
  return (
    /** @type {!module:ol/interaction/Draw~Mode} */ (mode)
  );
}


export default Draw;
