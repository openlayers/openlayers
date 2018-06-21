/**
 * @module ol/interaction/Modify
 */
import {getUid, inherits} from '../util.js';
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import Feature from '../Feature.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import MapBrowserPointerEvent from '../MapBrowserPointerEvent.js';
import {equals} from '../array.js';
import {equals as coordinatesEqual, distance as coordinateDistance, squaredDistance as squaredCoordinateDistance, squaredDistanceToSegment, closestOnSegment} from '../coordinate.js';
import {listen, unlisten} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {always, primaryAction, altKeyOnly, singleClick} from '../events/condition.js';
import {boundingExtent, buffer, createOrUpdateFromCoordinate} from '../extent.js';
import GeometryType from '../geom/GeometryType.js';
import Point from '../geom/Point.js';
import PointerInteraction, {handleEvent as handlePointerEvent} from '../interaction/Pointer.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import VectorEventType from '../source/VectorEventType.js';
import RBush from '../structs/RBush.js';
import {createEditingStyle} from '../style/Style.js';


/**
 * @enum {string}
 */
const ModifyEventType = {
  /**
   * Triggered upon feature modification start
   * @event ModifyEvent#modifystart
   * @api
   */
  MODIFYSTART: 'modifystart',
  /**
   * Triggered upon feature modification end
   * @event ModifyEvent#modifyend
   * @api
   */
  MODIFYEND: 'modifyend'
};


/**
 * @typedef {Object} SegmentData
 * @property {Array.<number>} [depth]
 * @property {module:ol/Feature} feature
 * @property {module:ol/geom/SimpleGeometry} geometry
 * @property {number} index
 * @property {Array.<module:ol/extent~Extent>} segment
 * @property {Array.<module:ol/interaction/Modify~SegmentData>} [featureSegments]
 */


/**
 * @typedef {Object} Options
 * @property {module:ol/events/condition~Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event will be considered to add or move a
 * vertex to the sketch. Default is
 * {@link module:ol/events/condition~primaryAction}.
 * @property {module:ol/events/condition~Condition} [deleteCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. By default,
 * {@link module:ol/events/condition~singleClick} with
 * {@link module:ol/events/condition~altKeyOnly} results in a vertex deletion.
 * @property {module:ol/events/condition~Condition} [insertVertexCondition] A
 * function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and
 * returns a boolean to indicate whether a new vertex can be added to the sketch
 * features. Default is {@link module:ol/events/condition~always}.
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the
 * pointer close enough to a segment or vertex for editing.
 * @property {module:ol/style/Style|Array.<module:ol/style/Style>|module:ol/style/Style~StyleFunction} [style]
 * Style used for the features being modified. By default the default edit
 * style is used (see {@link module:ol/style}).
 * @property {module:ol/source/Vector} [source] The vector source with
 * features to modify.  If a vector source is not provided, a feature collection
 * must be provided with the features option.
 * @property {module:ol/Collection.<module:ol/Feature>} [features]
 * The features the interaction works on.  If a feature collection is not
 * provided, a vector source must be provided with the source option.
 * @property {boolean} [wrapX=false] Wrap the world horizontally on the sketch
 * overlay.
 */


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Modify~Modify} instances are
 * instances of this type.
 *
 * @constructor
 * @extends {module:ol/events/Event}
 * @param {ModifyEventType} type Type.
 * @param {module:ol/Collection.<module:ol/Feature>} features
 * The features modified.
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserPointerEvent
 * Associated {@link module:ol/MapBrowserPointerEvent}.
 */
export const ModifyEvent = function(type, features, mapBrowserPointerEvent) {

  Event.call(this, type);

  /**
   * The features being modified.
   * @type {module:ol/Collection.<module:ol/Feature>}
   * @api
   */
  this.features = features;

  /**
   * Associated {@link module:ol/MapBrowserEvent}.
   * @type {module:ol/MapBrowserEvent}
   * @api
   */
  this.mapBrowserEvent = mapBrowserPointerEvent;
};

inherits(ModifyEvent, Event);


/**
 * @classdesc
 * Interaction for modifying feature geometries.  To modify features that have
 * been added to an existing source, construct the modify interaction with the
 * `source` option.  If you want to modify features in a collection (for example,
 * the collection used by a select interaction), construct the interaction with
 * the `features` option.  The interaction must be constructed with either a
 * `source` or `features` option.
 *
 * By default, the interaction will allow deletion of vertices when the `alt`
 * key is pressed.  To configure the interaction with a different condition
 * for deletion, use the `deleteCondition` option.
 *
 * @constructor
 * @extends {module:ol/interaction/Pointer}
 * @param {module:ol/interaction/Modify~Options} options Options.
 * @fires module:ol/interaction/Modify~ModifyEvent
 * @api
 */
const Modify = function(options) {

  PointerInteraction.call(this, {
    handleDownEvent: handleDownEvent,
    handleDragEvent: handleDragEvent,
    handleEvent: handleEvent,
    handleUpEvent: handleUpEvent
  });

  /**
   * @private
   * @type {module:ol/events/condition~Condition}
   */
  this.condition_ = options.condition ? options.condition : primaryAction;


  /**
   * @private
   * @param {module:ol/MapBrowserEvent} mapBrowserEvent Browser event.
   * @return {boolean} Combined condition result.
   */
  this.defaultDeleteCondition_ = function(mapBrowserEvent) {
    return altKeyOnly(mapBrowserEvent) && singleClick(mapBrowserEvent);
  };

  /**
   * @type {module:ol/events/condition~Condition}
   * @private
   */
  this.deleteCondition_ = options.deleteCondition ?
    options.deleteCondition : this.defaultDeleteCondition_;

  /**
   * @type {module:ol/events/condition~Condition}
   * @private
   */
  this.insertVertexCondition_ = options.insertVertexCondition ?
    options.insertVertexCondition : always;

  /**
   * Editing vertex.
   * @type {module:ol/Feature}
   * @private
   */
  this.vertexFeature_ = null;

  /**
   * Segments intersecting {@link this.vertexFeature_} by segment uid.
   * @type {Object.<string, boolean>}
   * @private
   */
  this.vertexSegments_ = null;

  /**
   * @type {module:ol~Pixel}
   * @private
   */
  this.lastPixel_ = [0, 0];

  /**
   * Tracks if the next `singleclick` event should be ignored to prevent
   * accidental deletion right after vertex creation.
   * @type {boolean}
   * @private
   */
  this.ignoreNextSingleClick_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.modified_ = false;

  /**
   * Segment RTree for each layer
   * @type {module:ol/structs/RBush.<module:ol/interaction/Modify~SegmentData>}
   * @private
   */
  this.rBush_ = new RBush();

  /**
   * @type {number}
   * @private
   */
  this.pixelTolerance_ = options.pixelTolerance !== undefined ?
    options.pixelTolerance : 10;

  /**
   * @type {boolean}
   * @private
   */
  this.snappedToVertex_ = false;

  /**
   * Indicate whether the interaction is currently changing a feature's
   * coordinates.
   * @type {boolean}
   * @private
   */
  this.changingFeature_ = false;

  /**
   * @type {Array}
   * @private
   */
  this.dragSegments_ = [];

  /**
   * Draw overlay where sketch features are drawn.
   * @type {module:ol/layer/Vector}
   * @private
   */
  this.overlay_ = new VectorLayer({
    source: new VectorSource({
      useSpatialIndex: false,
      wrapX: !!options.wrapX
    }),
    style: options.style ? options.style :
      getDefaultStyleFunction(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  /**
   * @const
   * @private
   * @type {!Object.<string, function(module:ol/Feature, module:ol/geom/Geometry)>}
   */
  this.SEGMENT_WRITERS_ = {
    'Point': this.writePointGeometry_,
    'LineString': this.writeLineStringGeometry_,
    'LinearRing': this.writeLineStringGeometry_,
    'Polygon': this.writePolygonGeometry_,
    'MultiPoint': this.writeMultiPointGeometry_,
    'MultiLineString': this.writeMultiLineStringGeometry_,
    'MultiPolygon': this.writeMultiPolygonGeometry_,
    'Circle': this.writeCircleGeometry_,
    'GeometryCollection': this.writeGeometryCollectionGeometry_
  };


  /**
   * @type {module:ol/source/Vector}
   * @private
   */
  this.source_ = null;

  let features;
  if (options.source) {
    this.source_ = options.source;
    features = new Collection(this.source_.getFeatures());
    listen(this.source_, VectorEventType.ADDFEATURE,
      this.handleSourceAdd_, this);
    listen(this.source_, VectorEventType.REMOVEFEATURE,
      this.handleSourceRemove_, this);
  } else {
    features = options.features;
  }
  if (!features) {
    throw new Error('The modify interaction requires features or a source');
  }

  /**
   * @type {module:ol/Collection.<module:ol/Feature>}
   * @private
   */
  this.features_ = features;

  this.features_.forEach(this.addFeature_.bind(this));
  listen(this.features_, CollectionEventType.ADD,
    this.handleFeatureAdd_, this);
  listen(this.features_, CollectionEventType.REMOVE,
    this.handleFeatureRemove_, this);

  /**
   * @type {module:ol/MapBrowserPointerEvent}
   * @private
   */
  this.lastPointerEvent_ = null;

};

inherits(Modify, PointerInteraction);


/**
 * The segment index assigned to a circle's center when
 * breaking up a circle into ModifySegmentDataType segments.
 * @type {number}
 */
const CIRCLE_CENTER_INDEX = 0;

/**
 * The segment index assigned to a circle's circumference when
 * breaking up a circle into ModifySegmentDataType segments.
 * @type {number}
 */
const CIRCLE_CIRCUMFERENCE_INDEX = 1;


/**
 * @param {module:ol/Feature} feature Feature.
 * @private
 */
Modify.prototype.addFeature_ = function(feature) {
  const geometry = feature.getGeometry();
  if (geometry && geometry.getType() in this.SEGMENT_WRITERS_) {
    this.SEGMENT_WRITERS_[geometry.getType()].call(this, feature, geometry);
  }
  const map = this.getMap();
  if (map && map.isRendered() && this.getActive()) {
    this.handlePointerAtPixel_(this.lastPixel_, map);
  }
  listen(feature, EventType.CHANGE,
    this.handleFeatureChange_, this);
};


/**
 * @param {module:ol/MapBrowserPointerEvent} evt Map browser event
 * @private
 */
Modify.prototype.willModifyFeatures_ = function(evt) {
  if (!this.modified_) {
    this.modified_ = true;
    this.dispatchEvent(new ModifyEvent(
      ModifyEventType.MODIFYSTART, this.features_, evt));
  }
};


/**
 * @param {module:ol/Feature} feature Feature.
 * @private
 */
Modify.prototype.removeFeature_ = function(feature) {
  this.removeFeatureSegmentData_(feature);
  // Remove the vertex feature if the collection of canditate features
  // is empty.
  if (this.vertexFeature_ && this.features_.getLength() === 0) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
  unlisten(feature, EventType.CHANGE,
    this.handleFeatureChange_, this);
};


/**
 * @param {module:ol/Feature} feature Feature.
 * @private
 */
Modify.prototype.removeFeatureSegmentData_ = function(feature) {
  const rBush = this.rBush_;
  const /** @type {Array.<module:ol/interaction/Modify~SegmentData>} */ nodesToRemove = [];
  rBush.forEach(
    /**
     * @param {module:ol/interaction/Modify~SegmentData} node RTree node.
     */
    function(node) {
      if (feature === node.feature) {
        nodesToRemove.push(node);
      }
    });
  for (let i = nodesToRemove.length - 1; i >= 0; --i) {
    rBush.remove(nodesToRemove[i]);
  }
};


/**
 * @inheritDoc
 */
Modify.prototype.setActive = function(active) {
  if (this.vertexFeature_ && !active) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
  PointerInteraction.prototype.setActive.call(this, active);
};


/**
 * @inheritDoc
 */
Modify.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  PointerInteraction.prototype.setMap.call(this, map);
};


/**
 * @param {module:ol/source/Vector~VectorSourceEvent} event Event.
 * @private
 */
Modify.prototype.handleSourceAdd_ = function(event) {
  if (event.feature) {
    this.features_.push(event.feature);
  }
};


/**
 * @param {module:ol/source/Vector~VectorSourceEvent} event Event.
 * @private
 */
Modify.prototype.handleSourceRemove_ = function(event) {
  if (event.feature) {
    this.features_.remove(event.feature);
  }
};


/**
 * @param {module:ol/Collection~CollectionEvent} evt Event.
 * @private
 */
Modify.prototype.handleFeatureAdd_ = function(evt) {
  this.addFeature_(/** @type {module:ol/Feature} */ (evt.element));
};


/**
 * @param {module:ol/events/Event} evt Event.
 * @private
 */
Modify.prototype.handleFeatureChange_ = function(evt) {
  if (!this.changingFeature_) {
    const feature = /** @type {module:ol/Feature} */ (evt.target);
    this.removeFeature_(feature);
    this.addFeature_(feature);
  }
};


/**
 * @param {module:ol/Collection~CollectionEvent} evt Event.
 * @private
 */
Modify.prototype.handleFeatureRemove_ = function(evt) {
  const feature = /** @type {module:ol/Feature} */ (evt.element);
  this.removeFeature_(feature);
};


/**
 * @param {module:ol/Feature} feature Feature
 * @param {module:ol/geom/Point} geometry Geometry.
 * @private
 */
Modify.prototype.writePointGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCoordinates();
  const segmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
    feature: feature,
    geometry: geometry,
    segment: [coordinates, coordinates]
  });
  this.rBush_.insert(geometry.getExtent(), segmentData);
};


/**
 * @param {module:ol/Feature} feature Feature
 * @param {module:ol/geom/MultiPoint} geometry Geometry.
 * @private
 */
Modify.prototype.writeMultiPointGeometry_ = function(feature, geometry) {
  const points = geometry.getCoordinates();
  for (let i = 0, ii = points.length; i < ii; ++i) {
    const coordinates = points[i];
    const segmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
      feature: feature,
      geometry: geometry,
      depth: [i],
      index: i,
      segment: [coordinates, coordinates]
    });
    this.rBush_.insert(geometry.getExtent(), segmentData);
  }
};


/**
 * @param {module:ol/Feature} feature Feature
 * @param {module:ol/geom/LineString} geometry Geometry.
 * @private
 */
Modify.prototype.writeLineStringGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCoordinates();
  for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    const segment = coordinates.slice(i, i + 2);
    const segmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
      feature: feature,
      geometry: geometry,
      index: i,
      segment: segment
    });
    this.rBush_.insert(boundingExtent(segment), segmentData);
  }
};


/**
 * @param {module:ol/Feature} feature Feature
 * @param {module:ol/geom/MultiLineString} geometry Geometry.
 * @private
 */
Modify.prototype.writeMultiLineStringGeometry_ = function(feature, geometry) {
  const lines = geometry.getCoordinates();
  for (let j = 0, jj = lines.length; j < jj; ++j) {
    const coordinates = lines[j];
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const segment = coordinates.slice(i, i + 2);
      const segmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
        feature: feature,
        geometry: geometry,
        depth: [j],
        index: i,
        segment: segment
      });
      this.rBush_.insert(boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {module:ol/Feature} feature Feature
 * @param {module:ol/geom/Polygon} geometry Geometry.
 * @private
 */
Modify.prototype.writePolygonGeometry_ = function(feature, geometry) {
  const rings = geometry.getCoordinates();
  for (let j = 0, jj = rings.length; j < jj; ++j) {
    const coordinates = rings[j];
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const segment = coordinates.slice(i, i + 2);
      const segmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
        feature: feature,
        geometry: geometry,
        depth: [j],
        index: i,
        segment: segment
      });
      this.rBush_.insert(boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {module:ol/Feature} feature Feature
 * @param {module:ol/geom/MultiPolygon} geometry Geometry.
 * @private
 */
Modify.prototype.writeMultiPolygonGeometry_ = function(feature, geometry) {
  const polygons = geometry.getCoordinates();
  for (let k = 0, kk = polygons.length; k < kk; ++k) {
    const rings = polygons[k];
    for (let j = 0, jj = rings.length; j < jj; ++j) {
      const coordinates = rings[j];
      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        const segment = coordinates.slice(i, i + 2);
        const segmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
          feature: feature,
          geometry: geometry,
          depth: [j, k],
          index: i,
          segment: segment
        });
        this.rBush_.insert(boundingExtent(segment), segmentData);
      }
    }
  }
};


/**
 * We convert a circle into two segments.  The segment at index
 * {@link CIRCLE_CENTER_INDEX} is the
 * circle's center (a point).  The segment at index
 * {@link CIRCLE_CIRCUMFERENCE_INDEX} is
 * the circumference, and is not a line segment.
 *
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/geom/Circle} geometry Geometry.
 * @private
 */
Modify.prototype.writeCircleGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCenter();
  const centerSegmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
    feature: feature,
    geometry: geometry,
    index: CIRCLE_CENTER_INDEX,
    segment: [coordinates, coordinates]
  });
  const circumferenceSegmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
    feature: feature,
    geometry: geometry,
    index: CIRCLE_CIRCUMFERENCE_INDEX,
    segment: [coordinates, coordinates]
  });
  const featureSegments = [centerSegmentData, circumferenceSegmentData];
  centerSegmentData.featureSegments = circumferenceSegmentData.featureSegments = featureSegments;
  this.rBush_.insert(createOrUpdateFromCoordinate(coordinates), centerSegmentData);
  this.rBush_.insert(geometry.getExtent(), circumferenceSegmentData);
};


/**
 * @param {module:ol/Feature} feature Feature
 * @param {module:ol/geom/GeometryCollection} geometry Geometry.
 * @private
 */
Modify.prototype.writeGeometryCollectionGeometry_ = function(feature, geometry) {
  const geometries = geometry.getGeometriesArray();
  for (let i = 0; i < geometries.length; ++i) {
    this.SEGMENT_WRITERS_[geometries[i].getType()].call(this, feature, geometries[i]);
  }
};


/**
 * @param {module:ol/coordinate~Coordinate} coordinates Coordinates.
 * @return {module:ol/Feature} Vertex feature.
 * @private
 */
Modify.prototype.createOrUpdateVertexFeature_ = function(coordinates) {
  let vertexFeature = this.vertexFeature_;
  if (!vertexFeature) {
    vertexFeature = new Feature(new Point(coordinates));
    this.vertexFeature_ = vertexFeature;
    this.overlay_.getSource().addFeature(vertexFeature);
  } else {
    const geometry = /** @type {module:ol/geom/Point} */ (vertexFeature.getGeometry());
    geometry.setCoordinates(coordinates);
  }
  return vertexFeature;
};


/**
 * @param {module:ol/interaction/Modify~SegmentData} a The first segment data.
 * @param {module:ol/interaction/Modify~SegmentData} b The second segment data.
 * @return {number} The difference in indexes.
 */
function compareIndexes(a, b) {
  return a.index - b.index;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @this {module:ol/interaction/Modify}
 */
function handleDownEvent(evt) {
  if (!this.condition_(evt)) {
    return false;
  }
  this.handlePointerAtPixel_(evt.pixel, evt.map);
  const pixelCoordinate = evt.map.getCoordinateFromPixel(evt.pixel);
  this.dragSegments_.length = 0;
  this.modified_ = false;
  const vertexFeature = this.vertexFeature_;
  if (vertexFeature) {
    const insertVertices = [];
    const geometry = /** @type {module:ol/geom/Point} */ (vertexFeature.getGeometry());
    const vertex = geometry.getCoordinates();
    const vertexExtent = boundingExtent([vertex]);
    const segmentDataMatches = this.rBush_.getInExtent(vertexExtent);
    const componentSegments = {};
    segmentDataMatches.sort(compareIndexes);
    for (let i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
      const segmentDataMatch = segmentDataMatches[i];
      const segment = segmentDataMatch.segment;
      let uid = getUid(segmentDataMatch.feature);
      const depth = segmentDataMatch.depth;
      if (depth) {
        uid += '-' + depth.join('-'); // separate feature components
      }
      if (!componentSegments[uid]) {
        componentSegments[uid] = new Array(2);
      }
      if (segmentDataMatch.geometry.getType() === GeometryType.CIRCLE &&
      segmentDataMatch.index === CIRCLE_CIRCUMFERENCE_INDEX) {

        const closestVertex = closestOnSegmentData(pixelCoordinate, segmentDataMatch);
        if (coordinatesEqual(closestVertex, vertex) && !componentSegments[uid][0]) {
          this.dragSegments_.push([segmentDataMatch, 0]);
          componentSegments[uid][0] = segmentDataMatch;
        }
      } else if (coordinatesEqual(segment[0], vertex) &&
          !componentSegments[uid][0]) {
        this.dragSegments_.push([segmentDataMatch, 0]);
        componentSegments[uid][0] = segmentDataMatch;
      } else if (coordinatesEqual(segment[1], vertex) &&
          !componentSegments[uid][1]) {

        // prevent dragging closed linestrings by the connecting node
        if ((segmentDataMatch.geometry.getType() ===
            GeometryType.LINE_STRING ||
            segmentDataMatch.geometry.getType() ===
            GeometryType.MULTI_LINE_STRING) &&
            componentSegments[uid][0] &&
            componentSegments[uid][0].index === 0) {
          continue;
        }

        this.dragSegments_.push([segmentDataMatch, 1]);
        componentSegments[uid][1] = segmentDataMatch;
      } else if (this.insertVertexCondition_(evt) && getUid(segment) in this.vertexSegments_ &&
          (!componentSegments[uid][0] && !componentSegments[uid][1])) {
        insertVertices.push([segmentDataMatch, vertex]);
      }
    }
    if (insertVertices.length) {
      this.willModifyFeatures_(evt);
    }
    for (let j = insertVertices.length - 1; j >= 0; --j) {
      this.insertVertex_.apply(this, insertVertices[j]);
    }
  }
  return !!this.vertexFeature_;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} evt Event.
 * @this {module:ol/interaction/Modify}
 */
function handleDragEvent(evt) {
  this.ignoreNextSingleClick_ = false;
  this.willModifyFeatures_(evt);

  const vertex = evt.coordinate;
  for (let i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
    const dragSegment = this.dragSegments_[i];
    const segmentData = dragSegment[0];
    const depth = segmentData.depth;
    const geometry = segmentData.geometry;
    let coordinates;
    const segment = segmentData.segment;
    const index = dragSegment[1];

    while (vertex.length < geometry.getStride()) {
      vertex.push(segment[index][vertex.length]);
    }

    switch (geometry.getType()) {
      case GeometryType.POINT:
        coordinates = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case GeometryType.MULTI_POINT:
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index] = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case GeometryType.LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case GeometryType.MULTI_LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case GeometryType.POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case GeometryType.MULTI_POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case GeometryType.CIRCLE:
        segment[0] = segment[1] = vertex;
        if (segmentData.index === CIRCLE_CENTER_INDEX) {
          this.changingFeature_ = true;
          geometry.setCenter(vertex);
          this.changingFeature_ = false;
        } else { // We're dragging the circle's circumference:
          this.changingFeature_ = true;
          geometry.setRadius(coordinateDistance(geometry.getCenter(), vertex));
          this.changingFeature_ = false;
        }
        break;
      default:
        // pass
    }

    if (coordinates) {
      this.setGeometryCoordinates_(geometry, coordinates);
    }
  }
  this.createOrUpdateVertexFeature_(vertex);
}


/**
 * @param {module:ol/MapBrowserPointerEvent} evt Event.
 * @return {boolean} Stop drag sequence?
 * @this {module:ol/interaction/Modify}
 */
function handleUpEvent(evt) {
  for (let i = this.dragSegments_.length - 1; i >= 0; --i) {
    const segmentData = this.dragSegments_[i][0];
    const geometry = segmentData.geometry;
    if (geometry.getType() === GeometryType.CIRCLE) {
      // Update a circle object in the R* bush:
      const coordinates = geometry.getCenter();
      const centerSegmentData = segmentData.featureSegments[0];
      const circumferenceSegmentData = segmentData.featureSegments[1];
      centerSegmentData.segment[0] = centerSegmentData.segment[1] = coordinates;
      circumferenceSegmentData.segment[0] = circumferenceSegmentData.segment[1] = coordinates;
      this.rBush_.update(createOrUpdateFromCoordinate(coordinates), centerSegmentData);
      this.rBush_.update(geometry.getExtent(), circumferenceSegmentData);
    } else {
      this.rBush_.update(boundingExtent(segmentData.segment), segmentData);
    }
  }
  if (this.modified_) {
    this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYEND, this.features_, evt));
    this.modified_ = false;
  }
  return false;
}


/**
 * Handles the {@link module:ol/MapBrowserEvent map browser event} and may modify the
 * geometry.
 * @param {module:ol/MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {module:ol/interaction/Modify}
 */
function handleEvent(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof MapBrowserPointerEvent)) {
    return true;
  }
  this.lastPointerEvent_ = mapBrowserEvent;

  let handled;
  if (!mapBrowserEvent.map.getView().getInteracting() &&
      mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE &&
      !this.handlingDownUpSequence) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  if (this.vertexFeature_ && this.deleteCondition_(mapBrowserEvent)) {
    if (mapBrowserEvent.type != MapBrowserEventType.SINGLECLICK || !this.ignoreNextSingleClick_) {
      handled = this.removePoint();
    } else {
      handled = true;
    }
  }

  if (mapBrowserEvent.type == MapBrowserEventType.SINGLECLICK) {
    this.ignoreNextSingleClick_ = false;
  }

  return handlePointerEvent.call(this, mapBrowserEvent) && !handled;
}


/**
 * @param {module:ol/MapBrowserEvent} evt Event.
 * @private
 */
Modify.prototype.handlePointerMove_ = function(evt) {
  this.lastPixel_ = evt.pixel;
  this.handlePointerAtPixel_(evt.pixel, evt.map);
};


/**
 * @param {module:ol~Pixel} pixel Pixel
 * @param {module:ol/PluggableMap} map Map.
 * @private
 */
Modify.prototype.handlePointerAtPixel_ = function(pixel, map) {
  const pixelCoordinate = map.getCoordinateFromPixel(pixel);
  const sortByDistance = function(a, b) {
    return pointDistanceToSegmentDataSquared(pixelCoordinate, a) -
        pointDistanceToSegmentDataSquared(pixelCoordinate, b);
  };

  const box = buffer(createOrUpdateFromCoordinate(pixelCoordinate),
    map.getView().getResolution() * this.pixelTolerance_);

  const rBush = this.rBush_;
  const nodes = rBush.getInExtent(box);
  if (nodes.length > 0) {
    nodes.sort(sortByDistance);
    const node = nodes[0];
    const closestSegment = node.segment;
    let vertex = closestOnSegmentData(pixelCoordinate, node);
    const vertexPixel = map.getPixelFromCoordinate(vertex);
    let dist = coordinateDistance(pixel, vertexPixel);
    if (dist <= this.pixelTolerance_) {
      const vertexSegments = {};

      if (node.geometry.getType() === GeometryType.CIRCLE &&
      node.index === CIRCLE_CIRCUMFERENCE_INDEX) {

        this.snappedToVertex_ = true;
        this.createOrUpdateVertexFeature_(vertex);
      } else {
        const pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
        const pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
        const squaredDist1 = squaredCoordinateDistance(vertexPixel, pixel1);
        const squaredDist2 = squaredCoordinateDistance(vertexPixel, pixel2);
        dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
        this.snappedToVertex_ = dist <= this.pixelTolerance_;
        if (this.snappedToVertex_) {
          vertex = squaredDist1 > squaredDist2 ? closestSegment[1] : closestSegment[0];
        }
        this.createOrUpdateVertexFeature_(vertex);
        for (let i = 1, ii = nodes.length; i < ii; ++i) {
          const segment = nodes[i].segment;
          if ((coordinatesEqual(closestSegment[0], segment[0]) &&
              coordinatesEqual(closestSegment[1], segment[1]) ||
              (coordinatesEqual(closestSegment[0], segment[1]) &&
              coordinatesEqual(closestSegment[1], segment[0])))) {
            vertexSegments[getUid(segment)] = true;
          } else {
            break;
          }
        }
      }

      vertexSegments[getUid(closestSegment)] = true;
      this.vertexSegments_ = vertexSegments;
      return;
    }
  }
  if (this.vertexFeature_) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
};


/**
 * Returns the distance from a point to a line segment.
 *
 * @param {module:ol/coordinate~Coordinate} pointCoordinates The coordinates of the point from
 *        which to calculate the distance.
 * @param {module:ol/interaction/Modify~SegmentData} segmentData The object describing the line
 *        segment we are calculating the distance to.
 * @return {number} The square of the distance between a point and a line segment.
 */
function pointDistanceToSegmentDataSquared(pointCoordinates, segmentData) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE) {
    const circleGeometry = /** @type {module:ol/geom/Circle} */ (geometry);

    if (segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
      const distanceToCenterSquared =
            squaredCoordinateDistance(circleGeometry.getCenter(), pointCoordinates);
      const distanceToCircumference =
            Math.sqrt(distanceToCenterSquared) - circleGeometry.getRadius();
      return distanceToCircumference * distanceToCircumference;
    }
  }
  return squaredDistanceToSegment(pointCoordinates, segmentData.segment);
}

/**
 * Returns the point closest to a given line segment.
 *
 * @param {module:ol/coordinate~Coordinate} pointCoordinates The point to which a closest point
 *        should be found.
 * @param {module:ol/interaction/Modify~SegmentData} segmentData The object describing the line
 *        segment which should contain the closest point.
 * @return {module:ol/coordinate~Coordinate} The point closest to the specified line segment.
 */
function closestOnSegmentData(pointCoordinates, segmentData) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE &&
  segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
    return geometry.getClosestPoint(pointCoordinates);
  }
  return closestOnSegment(pointCoordinates, segmentData.segment);
}


/**
 * @param {module:ol/interaction/Modify~SegmentData} segmentData Segment data.
 * @param {module:ol/coordinate~Coordinate} vertex Vertex.
 * @private
 */
Modify.prototype.insertVertex_ = function(segmentData, vertex) {
  const segment = segmentData.segment;
  const feature = segmentData.feature;
  const geometry = segmentData.geometry;
  const depth = segmentData.depth;
  const index = /** @type {number} */ (segmentData.index);
  let coordinates;

  while (vertex.length < geometry.getStride()) {
    vertex.push(0);
  }

  switch (geometry.getType()) {
    case GeometryType.MULTI_LINE_STRING:
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case GeometryType.POLYGON:
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case GeometryType.MULTI_POLYGON:
      coordinates = geometry.getCoordinates();
      coordinates[depth[1]][depth[0]].splice(index + 1, 0, vertex);
      break;
    case GeometryType.LINE_STRING:
      coordinates = geometry.getCoordinates();
      coordinates.splice(index + 1, 0, vertex);
      break;
    default:
      return;
  }

  this.setGeometryCoordinates_(geometry, coordinates);
  const rTree = this.rBush_;
  rTree.remove(segmentData);
  this.updateSegmentIndices_(geometry, index, depth, 1);
  const newSegmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
    segment: [segment[0], vertex],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index
  });
  rTree.insert(boundingExtent(newSegmentData.segment),
    newSegmentData);
  this.dragSegments_.push([newSegmentData, 1]);

  const newSegmentData2 = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
    segment: [vertex, segment[1]],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index + 1
  });
  rTree.insert(boundingExtent(newSegmentData2.segment), newSegmentData2);
  this.dragSegments_.push([newSegmentData2, 0]);
  this.ignoreNextSingleClick_ = true;
};

/**
 * Removes the vertex currently being pointed.
 * @return {boolean} True when a vertex was removed.
 * @api
 */
Modify.prototype.removePoint = function() {
  if (this.lastPointerEvent_ && this.lastPointerEvent_.type != MapBrowserEventType.POINTERDRAG) {
    const evt = this.lastPointerEvent_;
    this.willModifyFeatures_(evt);
    this.removeVertex_();
    this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYEND, this.features_, evt));
    this.modified_ = false;
    return true;
  }
  return false;
};

/**
 * Removes a vertex from all matching features.
 * @return {boolean} True when a vertex was removed.
 * @private
 */
Modify.prototype.removeVertex_ = function() {
  const dragSegments = this.dragSegments_;
  const segmentsByFeature = {};
  let deleted = false;
  let component, coordinates, dragSegment, geometry, i, index, left;
  let newIndex, right, segmentData, uid;
  for (i = dragSegments.length - 1; i >= 0; --i) {
    dragSegment = dragSegments[i];
    segmentData = dragSegment[0];
    uid = getUid(segmentData.feature);
    if (segmentData.depth) {
      // separate feature components
      uid += '-' + segmentData.depth.join('-');
    }
    if (!(uid in segmentsByFeature)) {
      segmentsByFeature[uid] = {};
    }
    if (dragSegment[1] === 0) {
      segmentsByFeature[uid].right = segmentData;
      segmentsByFeature[uid].index = segmentData.index;
    } else if (dragSegment[1] == 1) {
      segmentsByFeature[uid].left = segmentData;
      segmentsByFeature[uid].index = segmentData.index + 1;
    }

  }
  for (uid in segmentsByFeature) {
    right = segmentsByFeature[uid].right;
    left = segmentsByFeature[uid].left;
    index = segmentsByFeature[uid].index;
    newIndex = index - 1;
    if (left !== undefined) {
      segmentData = left;
    } else {
      segmentData = right;
    }
    if (newIndex < 0) {
      newIndex = 0;
    }
    geometry = segmentData.geometry;
    coordinates = geometry.getCoordinates();
    component = coordinates;
    deleted = false;
    switch (geometry.getType()) {
      case GeometryType.MULTI_LINE_STRING:
        if (coordinates[segmentData.depth[0]].length > 2) {
          coordinates[segmentData.depth[0]].splice(index, 1);
          deleted = true;
        }
        break;
      case GeometryType.LINE_STRING:
        if (coordinates.length > 2) {
          coordinates.splice(index, 1);
          deleted = true;
        }
        break;
      case GeometryType.MULTI_POLYGON:
        component = component[segmentData.depth[1]];
        /* falls through */
      case GeometryType.POLYGON:
        component = component[segmentData.depth[0]];
        if (component.length > 4) {
          if (index == component.length - 1) {
            index = 0;
          }
          component.splice(index, 1);
          deleted = true;
          if (index === 0) {
            // close the ring again
            component.pop();
            component.push(component[0]);
            newIndex = component.length - 1;
          }
        }
        break;
      default:
        // pass
    }

    if (deleted) {
      this.setGeometryCoordinates_(geometry, coordinates);
      const segments = [];
      if (left !== undefined) {
        this.rBush_.remove(left);
        segments.push(left.segment[0]);
      }
      if (right !== undefined) {
        this.rBush_.remove(right);
        segments.push(right.segment[1]);
      }
      if (left !== undefined && right !== undefined) {
        const newSegmentData = /** @type {module:ol/interaction/Modify~SegmentData} */ ({
          depth: segmentData.depth,
          feature: segmentData.feature,
          geometry: segmentData.geometry,
          index: newIndex,
          segment: segments
        });
        this.rBush_.insert(boundingExtent(newSegmentData.segment),
          newSegmentData);
      }
      this.updateSegmentIndices_(geometry, index, segmentData.depth, -1);
      if (this.vertexFeature_) {
        this.overlay_.getSource().removeFeature(this.vertexFeature_);
        this.vertexFeature_ = null;
      }
      dragSegments.length = 0;
    }

  }
  return deleted;
};


/**
 * @param {module:ol/geom/SimpleGeometry} geometry Geometry.
 * @param {Array} coordinates Coordinates.
 * @private
 */
Modify.prototype.setGeometryCoordinates_ = function(geometry, coordinates) {
  this.changingFeature_ = true;
  geometry.setCoordinates(coordinates);
  this.changingFeature_ = false;
};


/**
 * @param {module:ol/geom/SimpleGeometry} geometry Geometry.
 * @param {number} index Index.
 * @param {Array.<number>|undefined} depth Depth.
 * @param {number} delta Delta (1 or -1).
 * @private
 */
Modify.prototype.updateSegmentIndices_ = function(
  geometry, index, depth, delta) {
  this.rBush_.forEachInExtent(geometry.getExtent(), function(segmentDataMatch) {
    if (segmentDataMatch.geometry === geometry &&
        (depth === undefined || segmentDataMatch.depth === undefined ||
        equals(segmentDataMatch.depth, depth)) &&
        segmentDataMatch.index > index) {
      segmentDataMatch.index += delta;
    }
  });
};


/**
 * @return {module:ol/style/Style~StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  const style = createEditingStyle();
  return function(feature, resolution) {
    return style[GeometryType.POINT];
  };
}


export default Modify;
