/**
 * @module ol/interaction/Modify
 */
import {getUid, inherits} from '../index.js';
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import Feature from '../Feature.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import MapBrowserPointerEvent from '../MapBrowserPointerEvent.js';
import {equals} from '../array.js';
import _ol_coordinate_ from '../coordinate.js';
import {listen, unlisten} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {always, primaryAction, altKeyOnly, singleClick} from '../events/condition.js';
import {boundingExtent, buffer, createOrUpdateFromCoordinate} from '../extent.js';
import GeometryType from '../geom/GeometryType.js';
import Point from '../geom/Point.js';
import ModifyEventType from '../interaction/ModifyEventType.js';
import PointerInteraction from '../interaction/Pointer.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import VectorEventType from '../source/VectorEventType.js';
import RBush from '../structs/RBush.js';
import Style from '../style/Style.js';

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
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.ModifyOptions} options Options.
 * @fires ol.interaction.Modify.Event
 * @api
 */
const Modify = function(options) {

  PointerInteraction.call(this, {
    handleDownEvent: Modify.handleDownEvent_,
    handleDragEvent: Modify.handleDragEvent_,
    handleEvent: Modify.handleEvent,
    handleUpEvent: Modify.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ? options.condition : primaryAction;


  /**
   * @private
   * @param {ol.MapBrowserEvent} mapBrowserEvent Browser event.
   * @return {boolean} Combined condition result.
   */
  this.defaultDeleteCondition_ = function(mapBrowserEvent) {
    return altKeyOnly(mapBrowserEvent) && singleClick(mapBrowserEvent);
  };

  /**
   * @type {ol.EventsConditionType}
   * @private
   */
  this.deleteCondition_ = options.deleteCondition ?
    options.deleteCondition : this.defaultDeleteCondition_;

  /**
   * @type {ol.EventsConditionType}
   * @private
   */
  this.insertVertexCondition_ = options.insertVertexCondition ?
    options.insertVertexCondition : always;

  /**
   * Editing vertex.
   * @type {ol.Feature}
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
   * @type {ol.Pixel}
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
   * @type {ol.structs.RBush.<ol.ModifySegmentDataType>}
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
   * @type {ol.layer.Vector}
   * @private
   */
  this.overlay_ = new VectorLayer({
    source: new VectorSource({
      useSpatialIndex: false,
      wrapX: !!options.wrapX
    }),
    style: options.style ? options.style :
      Modify.getDefaultStyleFunction(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  /**
  * @const
  * @private
  * @type {Object.<string, function(ol.Feature, ol.geom.Geometry)>}
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
   * @type {ol.source.Vector}
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
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = features;

  this.features_.forEach(this.addFeature_.bind(this));
  listen(this.features_, CollectionEventType.ADD,
    this.handleFeatureAdd_, this);
  listen(this.features_, CollectionEventType.REMOVE,
    this.handleFeatureRemove_, this);

  /**
   * @type {ol.MapBrowserPointerEvent}
   * @private
   */
  this.lastPointerEvent_ = null;

};

inherits(Modify, PointerInteraction);


/**
 * @define {number} The segment index assigned to a circle's center when
 * breaking up a cicrle into ModifySegmentDataType segments.
 */
Modify.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX = 0;

/**
 * @define {number} The segment index assigned to a circle's circumference when
 * breaking up a circle into ModifySegmentDataType segments.
 */
Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX = 1;


/**
 * @param {ol.Feature} feature Feature.
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
 * @param {ol.MapBrowserPointerEvent} evt Map browser event
 * @private
 */
Modify.prototype.willModifyFeatures_ = function(evt) {
  if (!this.modified_) {
    this.modified_ = true;
    this.dispatchEvent(new Modify.Event(
      ModifyEventType.MODIFYSTART, this.features_, evt));
  }
};


/**
 * @param {ol.Feature} feature Feature.
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
 * @param {ol.Feature} feature Feature.
 * @private
 */
Modify.prototype.removeFeatureSegmentData_ = function(feature) {
  const rBush = this.rBush_;
  const /** @type {Array.<ol.ModifySegmentDataType>} */ nodesToRemove = [];
  rBush.forEach(
    /**
       * @param {ol.ModifySegmentDataType} node RTree node.
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
 * @param {ol.source.Vector.Event} event Event.
 * @private
 */
Modify.prototype.handleSourceAdd_ = function(event) {
  if (event.feature) {
    this.features_.push(event.feature);
  }
};


/**
 * @param {ol.source.Vector.Event} event Event.
 * @private
 */
Modify.prototype.handleSourceRemove_ = function(event) {
  if (event.feature) {
    this.features_.remove(event.feature);
  }
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
Modify.prototype.handleFeatureAdd_ = function(evt) {
  this.addFeature_(/** @type {ol.Feature} */ (evt.element));
};


/**
 * @param {ol.events.Event} evt Event.
 * @private
 */
Modify.prototype.handleFeatureChange_ = function(evt) {
  if (!this.changingFeature_) {
    const feature = /** @type {ol.Feature} */ (evt.target);
    this.removeFeature_(feature);
    this.addFeature_(feature);
  }
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
Modify.prototype.handleFeatureRemove_ = function(evt) {
  const feature = /** @type {ol.Feature} */ (evt.element);
  this.removeFeature_(feature);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Point} geometry Geometry.
 * @private
 */
Modify.prototype.writePointGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCoordinates();
  const segmentData = /** @type {ol.ModifySegmentDataType} */ ({
    feature: feature,
    geometry: geometry,
    segment: [coordinates, coordinates]
  });
  this.rBush_.insert(geometry.getExtent(), segmentData);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPoint} geometry Geometry.
 * @private
 */
Modify.prototype.writeMultiPointGeometry_ = function(feature, geometry) {
  const points = geometry.getCoordinates();
  let coordinates, i, ii, segmentData;
  for (i = 0, ii = points.length; i < ii; ++i) {
    coordinates = points[i];
    segmentData = /** @type {ol.ModifySegmentDataType} */ ({
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
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.LineString} geometry Geometry.
 * @private
 */
Modify.prototype.writeLineStringGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCoordinates();
  let i, ii, segment, segmentData;
  for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    segment = coordinates.slice(i, i + 2);
    segmentData = /** @type {ol.ModifySegmentDataType} */ ({
      feature: feature,
      geometry: geometry,
      index: i,
      segment: segment
    });
    this.rBush_.insert(boundingExtent(segment), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiLineString} geometry Geometry.
 * @private
 */
Modify.prototype.writeMultiLineStringGeometry_ = function(feature, geometry) {
  const lines = geometry.getCoordinates();
  let coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = lines.length; j < jj; ++j) {
    coordinates = lines[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.ModifySegmentDataType} */ ({
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
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Polygon} geometry Geometry.
 * @private
 */
Modify.prototype.writePolygonGeometry_ = function(feature, geometry) {
  const rings = geometry.getCoordinates();
  let coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = rings.length; j < jj; ++j) {
    coordinates = rings[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.ModifySegmentDataType} */ ({
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
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @private
 */
Modify.prototype.writeMultiPolygonGeometry_ = function(feature, geometry) {
  const polygons = geometry.getCoordinates();
  let coordinates, i, ii, j, jj, k, kk, rings, segment, segmentData;
  for (k = 0, kk = polygons.length; k < kk; ++k) {
    rings = polygons[k];
    for (j = 0, jj = rings.length; j < jj; ++j) {
      coordinates = rings[j];
      for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        segment = coordinates.slice(i, i + 2);
        segmentData = /** @type {ol.ModifySegmentDataType} */ ({
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
 * {@link ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX} is the
 * circle's center (a point).  The segment at index
 * {@link ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX} is
 * the circumference, and is not a line segment.
 *
 * @param {ol.Feature} feature Feature.
 * @param {ol.geom.Circle} geometry Geometry.
 * @private
 */
Modify.prototype.writeCircleGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCenter();
  const centerSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    feature: feature,
    geometry: geometry,
    index: Modify.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX,
    segment: [coordinates, coordinates]
  });
  const circumferenceSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    feature: feature,
    geometry: geometry,
    index: Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX,
    segment: [coordinates, coordinates]
  });
  const featureSegments = [centerSegmentData, circumferenceSegmentData];
  centerSegmentData.featureSegments = circumferenceSegmentData.featureSegments = featureSegments;
  this.rBush_.insert(createOrUpdateFromCoordinate(coordinates), centerSegmentData);
  this.rBush_.insert(geometry.getExtent(), circumferenceSegmentData);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @private
 */
Modify.prototype.writeGeometryCollectionGeometry_ = function(feature, geometry) {
  const geometries = geometry.getGeometriesArray();
  for (let i = 0; i < geometries.length; ++i) {
    this.SEGMENT_WRITERS_[geometries[i].getType()].call(
      this, feature, geometries[i]);
  }
};


/**
 * @param {ol.Coordinate} coordinates Coordinates.
 * @return {ol.Feature} Vertex feature.
 * @private
 */
Modify.prototype.createOrUpdateVertexFeature_ = function(coordinates) {
  let vertexFeature = this.vertexFeature_;
  if (!vertexFeature) {
    vertexFeature = new Feature(new Point(coordinates));
    this.vertexFeature_ = vertexFeature;
    this.overlay_.getSource().addFeature(vertexFeature);
  } else {
    const geometry = /** @type {ol.geom.Point} */ (vertexFeature.getGeometry());
    geometry.setCoordinates(coordinates);
  }
  return vertexFeature;
};


/**
 * @param {ol.ModifySegmentDataType} a The first segment data.
 * @param {ol.ModifySegmentDataType} b The second segment data.
 * @return {number} The difference in indexes.
 * @private
 */
Modify.compareIndexes_ = function(a, b) {
  return a.index - b.index;
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Modify}
 * @private
 */
Modify.handleDownEvent_ = function(evt) {
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
    const geometry = /** @type {ol.geom.Point} */ (vertexFeature.getGeometry());
    const vertex = geometry.getCoordinates();
    const vertexExtent = boundingExtent([vertex]);
    const segmentDataMatches = this.rBush_.getInExtent(vertexExtent);
    const componentSegments = {};
    segmentDataMatches.sort(Modify.compareIndexes_);
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
      segmentDataMatch.index === Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {

        const closestVertex = Modify.closestOnSegmentData_(pixelCoordinate, segmentDataMatch);
        if (_ol_coordinate_.equals(closestVertex, vertex) && !componentSegments[uid][0]) {
          this.dragSegments_.push([segmentDataMatch, 0]);
          componentSegments[uid][0] = segmentDataMatch;
        }
      } else if (_ol_coordinate_.equals(segment[0], vertex) &&
          !componentSegments[uid][0]) {
        this.dragSegments_.push([segmentDataMatch, 0]);
        componentSegments[uid][0] = segmentDataMatch;
      } else if (_ol_coordinate_.equals(segment[1], vertex) &&
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
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @this {ol.interaction.Modify}
 * @private
 */
Modify.handleDragEvent_ = function(evt) {
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
        if (segmentData.index === Modify.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX) {
          this.changingFeature_ = true;
          geometry.setCenter(vertex);
          this.changingFeature_ = false;
        } else { // We're dragging the circle's circumference:
          this.changingFeature_ = true;
          geometry.setRadius(_ol_coordinate_.distance(geometry.getCenter(), vertex));
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
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Modify}
 * @private
 */
Modify.handleUpEvent_ = function(evt) {
  let segmentData;
  let geometry;
  for (let i = this.dragSegments_.length - 1; i >= 0; --i) {
    segmentData = this.dragSegments_[i][0];
    geometry = segmentData.geometry;
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
      this.rBush_.update(boundingExtent(segmentData.segment),
        segmentData);
    }
  }
  if (this.modified_) {
    this.dispatchEvent(new Modify.Event(
      ModifyEventType.MODIFYEND, this.features_, evt));
    this.modified_ = false;
  }
  return false;
};


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} and may modify the
 * geometry.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.Modify}
 * @api
 */
Modify.handleEvent = function(mapBrowserEvent) {
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
    if (mapBrowserEvent.type != MapBrowserEventType.SINGLECLICK ||
        !this.ignoreNextSingleClick_) {
      handled = this.removePoint();
    } else {
      handled = true;
    }
  }

  if (mapBrowserEvent.type == MapBrowserEventType.SINGLECLICK) {
    this.ignoreNextSingleClick_ = false;
  }

  return PointerInteraction.handleEvent.call(this, mapBrowserEvent) &&
      !handled;
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 * @private
 */
Modify.prototype.handlePointerMove_ = function(evt) {
  this.lastPixel_ = evt.pixel;
  this.handlePointerAtPixel_(evt.pixel, evt.map);
};


/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.PluggableMap} map Map.
 * @private
 */
Modify.prototype.handlePointerAtPixel_ = function(pixel, map) {
  const pixelCoordinate = map.getCoordinateFromPixel(pixel);
  const sortByDistance = function(a, b) {
    return Modify.pointDistanceToSegmentDataSquared_(pixelCoordinate, a) -
        Modify.pointDistanceToSegmentDataSquared_(pixelCoordinate, b);
  };

  const box = buffer(createOrUpdateFromCoordinate(pixelCoordinate),
    map.getView().getResolution() * this.pixelTolerance_);

  const rBush = this.rBush_;
  const nodes = rBush.getInExtent(box);
  if (nodes.length > 0) {
    nodes.sort(sortByDistance);
    const node = nodes[0];
    const closestSegment = node.segment;
    let vertex = Modify.closestOnSegmentData_(pixelCoordinate, node);
    const vertexPixel = map.getPixelFromCoordinate(vertex);
    let dist = _ol_coordinate_.distance(pixel, vertexPixel);
    if (dist <= this.pixelTolerance_) {
      const vertexSegments = {};

      if (node.geometry.getType() === GeometryType.CIRCLE &&
      node.index === Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {

        this.snappedToVertex_ = true;
        this.createOrUpdateVertexFeature_(vertex);
      } else {
        const pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
        const pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
        const squaredDist1 = _ol_coordinate_.squaredDistance(vertexPixel, pixel1);
        const squaredDist2 = _ol_coordinate_.squaredDistance(vertexPixel, pixel2);
        dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
        this.snappedToVertex_ = dist <= this.pixelTolerance_;
        if (this.snappedToVertex_) {
          vertex = squaredDist1 > squaredDist2 ?
            closestSegment[1] : closestSegment[0];
        }
        this.createOrUpdateVertexFeature_(vertex);
        let segment;
        for (let i = 1, ii = nodes.length; i < ii; ++i) {
          segment = nodes[i].segment;
          if ((_ol_coordinate_.equals(closestSegment[0], segment[0]) &&
              _ol_coordinate_.equals(closestSegment[1], segment[1]) ||
              (_ol_coordinate_.equals(closestSegment[0], segment[1]) &&
              _ol_coordinate_.equals(closestSegment[1], segment[0])))) {
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
 * @param {ol.Coordinate} pointCoordinates The coordinates of the point from
 *        which to calculate the distance.
 * @param {ol.ModifySegmentDataType} segmentData The object describing the line
 *        segment we are calculating the distance to.
 * @return {number} The square of the distance between a point and a line segment.
 */
Modify.pointDistanceToSegmentDataSquared_ = function(pointCoordinates, segmentData) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE) {
    const circleGeometry = /** @type {ol.geom.Circle} */ (geometry);

    if (segmentData.index === Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {
      const distanceToCenterSquared =
            _ol_coordinate_.squaredDistance(circleGeometry.getCenter(), pointCoordinates);
      const distanceToCircumference =
            Math.sqrt(distanceToCenterSquared) - circleGeometry.getRadius();
      return distanceToCircumference * distanceToCircumference;
    }
  }
  return _ol_coordinate_.squaredDistanceToSegment(pointCoordinates, segmentData.segment);
};

/**
 * Returns the point closest to a given line segment.
 *
 * @param {ol.Coordinate} pointCoordinates The point to which a closest point
 *        should be found.
 * @param {ol.ModifySegmentDataType} segmentData The object describing the line
 *        segment which should contain the closest point.
 * @return {ol.Coordinate} The point closest to the specified line segment.
 */
Modify.closestOnSegmentData_ = function(pointCoordinates, segmentData) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE &&
  segmentData.index === Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {
    return geometry.getClosestPoint(pointCoordinates);
  }
  return _ol_coordinate_.closestOnSegment(pointCoordinates, segmentData.segment);
};


/**
 * @param {ol.ModifySegmentDataType} segmentData Segment data.
 * @param {ol.Coordinate} vertex Vertex.
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
  const newSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    segment: [segment[0], vertex],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index
  });
  rTree.insert(boundingExtent(newSegmentData.segment),
    newSegmentData);
  this.dragSegments_.push([newSegmentData, 1]);

  const newSegmentData2 = /** @type {ol.ModifySegmentDataType} */ ({
    segment: [vertex, segment[1]],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index + 1
  });
  rTree.insert(boundingExtent(newSegmentData2.segment),
    newSegmentData2);
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
    this.dispatchEvent(new Modify.Event(
      ModifyEventType.MODIFYEND, this.features_, evt));
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
        const newSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
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
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {Array} coordinates Coordinates.
 * @private
 */
Modify.prototype.setGeometryCoordinates_ = function(geometry, coordinates) {
  this.changingFeature_ = true;
  geometry.setCoordinates(coordinates);
  this.changingFeature_ = false;
};


/**
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
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
 * @return {ol.StyleFunction} Styles.
 */
Modify.getDefaultStyleFunction = function() {
  const style = Style.createDefaultEditing();
  return function(feature, resolution) {
    return style[GeometryType.POINT];
  };
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Modify} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.ModifyEvent}
 * @param {ol.interaction.ModifyEventType} type Type.
 * @param {ol.Collection.<ol.Feature>} features The features modified.
 * @param {ol.MapBrowserPointerEvent} mapBrowserPointerEvent Associated
 *     {@link ol.MapBrowserPointerEvent}.
 */
Modify.Event = function(type, features, mapBrowserPointerEvent) {

  Event.call(this, type);

  /**
   * The features being modified.
   * @type {ol.Collection.<ol.Feature>}
   * @api
   */
  this.features = features;

  /**
   * Associated {@link ol.MapBrowserEvent}.
   * @type {ol.MapBrowserEvent}
   * @api
   */
  this.mapBrowserEvent = mapBrowserPointerEvent;
};
inherits(Modify.Event, Event);
export default Modify;
