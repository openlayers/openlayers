import _ol_ from '../index';
import _ol_Collection_ from '../collection';
import _ol_CollectionEventType_ from '../collectioneventtype';
import _ol_Feature_ from '../feature';
import _ol_MapBrowserEventType_ from '../mapbrowsereventtype';
import _ol_MapBrowserPointerEvent_ from '../mapbrowserpointerevent';
import _ol_ViewHint_ from '../viewhint';
import _ol_array_ from '../array';
import _ol_coordinate_ from '../coordinate';
import _ol_events_ from '../events';
import _ol_events_Event_ from '../events/event';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_events_condition_ from '../events/condition';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_Point_ from '../geom/point';
import _ol_interaction_ModifyEventType_ from '../interaction/modifyeventtype';
import _ol_interaction_Pointer_ from '../interaction/pointer';
import _ol_layer_Vector_ from '../layer/vector';
import _ol_source_Vector_ from '../source/vector';
import _ol_source_VectorEventType_ from '../source/vectoreventtype';
import _ol_structs_RBush_ from '../structs/rbush';
import _ol_style_Style_ from '../style/style';

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
var _ol_interaction_Modify_ = function(options) {

  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_Modify_.handleDownEvent_,
    handleDragEvent: _ol_interaction_Modify_.handleDragEvent_,
    handleEvent: _ol_interaction_Modify_.handleEvent,
    handleUpEvent: _ol_interaction_Modify_.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : _ol_events_condition_.primaryAction;


  /**
   * @private
   * @param {ol.MapBrowserEvent} mapBrowserEvent Browser event.
   * @return {boolean} Combined condition result.
   */
  this.defaultDeleteCondition_ = function(mapBrowserEvent) {
    return _ol_events_condition_.altKeyOnly(mapBrowserEvent) &&
      _ol_events_condition_.singleClick(mapBrowserEvent);
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
    options.insertVertexCondition : _ol_events_condition_.always;

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
  this.rBush_ = new _ol_structs_RBush_();

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
  this.overlay_ = new _ol_layer_Vector_({
    source: new _ol_source_Vector_({
      useSpatialIndex: false,
      wrapX: !!options.wrapX
    }),
    style: options.style ? options.style :
      _ol_interaction_Modify_.getDefaultStyleFunction(),
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

  var features;
  if (options.source) {
    this.source_ = options.source;
    features = new _ol_Collection_(this.source_.getFeatures());
    _ol_events_.listen(this.source_, _ol_source_VectorEventType_.ADDFEATURE,
        this.handleSourceAdd_, this);
    _ol_events_.listen(this.source_, _ol_source_VectorEventType_.REMOVEFEATURE,
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

  this.features_.forEach(this.addFeature_, this);
  _ol_events_.listen(this.features_, _ol_CollectionEventType_.ADD,
      this.handleFeatureAdd_, this);
  _ol_events_.listen(this.features_, _ol_CollectionEventType_.REMOVE,
      this.handleFeatureRemove_, this);

  /**
   * @type {ol.MapBrowserPointerEvent}
   * @private
   */
  this.lastPointerEvent_ = null;

};

_ol_.inherits(_ol_interaction_Modify_, _ol_interaction_Pointer_);


/**
 * @define {number} The segment index assigned to a circle's center when
 * breaking up a cicrle into ModifySegmentDataType segments.
 */
_ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX = 0;

/**
 * @define {number} The segment index assigned to a circle's circumference when
 * breaking up a circle into ModifySegmentDataType segments.
 */
_ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX = 1;


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_interaction_Modify_.prototype.addFeature_ = function(feature) {
  var geometry = feature.getGeometry();
  if (geometry && geometry.getType() in this.SEGMENT_WRITERS_) {
    this.SEGMENT_WRITERS_[geometry.getType()].call(this, feature, geometry);
  }
  var map = this.getMap();
  if (map && map.isRendered() && this.getActive()) {
    this.handlePointerAtPixel_(this.lastPixel_, map);
  }
  _ol_events_.listen(feature, _ol_events_EventType_.CHANGE,
      this.handleFeatureChange_, this);
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Map browser event
 * @private
 */
_ol_interaction_Modify_.prototype.willModifyFeatures_ = function(evt) {
  if (!this.modified_) {
    this.modified_ = true;
    this.dispatchEvent(new _ol_interaction_Modify_.Event(
        _ol_interaction_ModifyEventType_.MODIFYSTART, this.features_, evt));
  }
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_interaction_Modify_.prototype.removeFeature_ = function(feature) {
  this.removeFeatureSegmentData_(feature);
  // Remove the vertex feature if the collection of canditate features
  // is empty.
  if (this.vertexFeature_ && this.features_.getLength() === 0) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
  _ol_events_.unlisten(feature, _ol_events_EventType_.CHANGE,
      this.handleFeatureChange_, this);
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_interaction_Modify_.prototype.removeFeatureSegmentData_ = function(feature) {
  var rBush = this.rBush_;
  var /** @type {Array.<ol.ModifySegmentDataType>} */ nodesToRemove = [];
  rBush.forEach(
      /**
       * @param {ol.ModifySegmentDataType} node RTree node.
       */
      function(node) {
        if (feature === node.feature) {
          nodesToRemove.push(node);
        }
      });
  for (var i = nodesToRemove.length - 1; i >= 0; --i) {
    rBush.remove(nodesToRemove[i]);
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_Modify_.prototype.setActive = function(active) {
  if (this.vertexFeature_ && !active) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
  _ol_interaction_Pointer_.prototype.setActive.call(this, active);
};


/**
 * @inheritDoc
 */
_ol_interaction_Modify_.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  _ol_interaction_Pointer_.prototype.setMap.call(this, map);
};


/**
 * @param {ol.source.Vector.Event} event Event.
 * @private
 */
_ol_interaction_Modify_.prototype.handleSourceAdd_ = function(event) {
  if (event.feature) {
    this.features_.push(event.feature);
  }
};


/**
 * @param {ol.source.Vector.Event} event Event.
 * @private
 */
_ol_interaction_Modify_.prototype.handleSourceRemove_ = function(event) {
  if (event.feature) {
    this.features_.remove(event.feature);
  }
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
_ol_interaction_Modify_.prototype.handleFeatureAdd_ = function(evt) {
  this.addFeature_(/** @type {ol.Feature} */ (evt.element));
};


/**
 * @param {ol.events.Event} evt Event.
 * @private
 */
_ol_interaction_Modify_.prototype.handleFeatureChange_ = function(evt) {
  if (!this.changingFeature_) {
    var feature = /** @type {ol.Feature} */ (evt.target);
    this.removeFeature_(feature);
    this.addFeature_(feature);
  }
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
_ol_interaction_Modify_.prototype.handleFeatureRemove_ = function(evt) {
  var feature = /** @type {ol.Feature} */ (evt.element);
  this.removeFeature_(feature);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Point} geometry Geometry.
 * @private
 */
_ol_interaction_Modify_.prototype.writePointGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var segmentData = /** @type {ol.ModifySegmentDataType} */ ({
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
_ol_interaction_Modify_.prototype.writeMultiPointGeometry_ = function(feature, geometry) {
  var points = geometry.getCoordinates();
  var coordinates, i, ii, segmentData;
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
_ol_interaction_Modify_.prototype.writeLineStringGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var i, ii, segment, segmentData;
  for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    segment = coordinates.slice(i, i + 2);
    segmentData = /** @type {ol.ModifySegmentDataType} */ ({
      feature: feature,
      geometry: geometry,
      index: i,
      segment: segment
    });
    this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiLineString} geometry Geometry.
 * @private
 */
_ol_interaction_Modify_.prototype.writeMultiLineStringGeometry_ = function(feature, geometry) {
  var lines = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
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
      this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Polygon} geometry Geometry.
 * @private
 */
_ol_interaction_Modify_.prototype.writePolygonGeometry_ = function(feature, geometry) {
  var rings = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
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
      this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @private
 */
_ol_interaction_Modify_.prototype.writeMultiPolygonGeometry_ = function(feature, geometry) {
  var polygons = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, k, kk, rings, segment, segmentData;
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
        this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
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
_ol_interaction_Modify_.prototype.writeCircleGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCenter();
  var centerSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    feature: feature,
    geometry: geometry,
    index: _ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX,
    segment: [coordinates, coordinates]
  });
  var circumferenceSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    feature: feature,
    geometry: geometry,
    index: _ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX,
    segment: [coordinates, coordinates]
  });
  var featureSegments = [centerSegmentData, circumferenceSegmentData];
  centerSegmentData.featureSegments = circumferenceSegmentData.featureSegments = featureSegments;
  this.rBush_.insert(_ol_extent_.createOrUpdateFromCoordinate(coordinates), centerSegmentData);
  this.rBush_.insert(geometry.getExtent(), circumferenceSegmentData);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @private
 */
_ol_interaction_Modify_.prototype.writeGeometryCollectionGeometry_ = function(feature, geometry) {
  var i, geometries = geometry.getGeometriesArray();
  for (i = 0; i < geometries.length; ++i) {
    this.SEGMENT_WRITERS_[geometries[i].getType()].call(
        this, feature, geometries[i]);
  }
};


/**
 * @param {ol.Coordinate} coordinates Coordinates.
 * @return {ol.Feature} Vertex feature.
 * @private
 */
_ol_interaction_Modify_.prototype.createOrUpdateVertexFeature_ = function(coordinates) {
  var vertexFeature = this.vertexFeature_;
  if (!vertexFeature) {
    vertexFeature = new _ol_Feature_(new _ol_geom_Point_(coordinates));
    this.vertexFeature_ = vertexFeature;
    this.overlay_.getSource().addFeature(vertexFeature);
  } else {
    var geometry = /** @type {ol.geom.Point} */ (vertexFeature.getGeometry());
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
_ol_interaction_Modify_.compareIndexes_ = function(a, b) {
  return a.index - b.index;
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Modify}
 * @private
 */
_ol_interaction_Modify_.handleDownEvent_ = function(evt) {
  if (!this.condition_(evt)) {
    return false;
  }
  this.handlePointerAtPixel_(evt.pixel, evt.map);
  var pixelCoordinate = evt.map.getCoordinateFromPixel(evt.pixel);
  this.dragSegments_.length = 0;
  this.modified_ = false;
  var vertexFeature = this.vertexFeature_;
  if (vertexFeature) {
    var insertVertices = [];
    var geometry = /** @type {ol.geom.Point} */ (vertexFeature.getGeometry());
    var vertex = geometry.getCoordinates();
    var vertexExtent = _ol_extent_.boundingExtent([vertex]);
    var segmentDataMatches = this.rBush_.getInExtent(vertexExtent);
    var componentSegments = {};
    segmentDataMatches.sort(_ol_interaction_Modify_.compareIndexes_);
    for (var i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
      var segmentDataMatch = segmentDataMatches[i];
      var segment = segmentDataMatch.segment;
      var uid = _ol_.getUid(segmentDataMatch.feature);
      var depth = segmentDataMatch.depth;
      if (depth) {
        uid += '-' + depth.join('-'); // separate feature components
      }
      if (!componentSegments[uid]) {
        componentSegments[uid] = new Array(2);
      }
      if (segmentDataMatch.geometry.getType() === _ol_geom_GeometryType_.CIRCLE &&
      segmentDataMatch.index === _ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {

        var closestVertex = _ol_interaction_Modify_.closestOnSegmentData_(pixelCoordinate, segmentDataMatch);
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
            _ol_geom_GeometryType_.LINE_STRING ||
            segmentDataMatch.geometry.getType() ===
            _ol_geom_GeometryType_.MULTI_LINE_STRING) &&
            componentSegments[uid][0] &&
            componentSegments[uid][0].index === 0) {
          continue;
        }

        this.dragSegments_.push([segmentDataMatch, 1]);
        componentSegments[uid][1] = segmentDataMatch;
      } else if (this.insertVertexCondition_(evt) && _ol_.getUid(segment) in this.vertexSegments_ &&
          (!componentSegments[uid][0] && !componentSegments[uid][1])) {
        insertVertices.push([segmentDataMatch, vertex]);
      }
    }
    if (insertVertices.length) {
      this.willModifyFeatures_(evt);
    }
    for (var j = insertVertices.length - 1; j >= 0; --j) {
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
_ol_interaction_Modify_.handleDragEvent_ = function(evt) {
  this.ignoreNextSingleClick_ = false;
  this.willModifyFeatures_(evt);

  var vertex = evt.coordinate;
  for (var i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
    var dragSegment = this.dragSegments_[i];
    var segmentData = dragSegment[0];
    var depth = segmentData.depth;
    var geometry = segmentData.geometry;
    var coordinates;
    var segment = segmentData.segment;
    var index = dragSegment[1];

    while (vertex.length < geometry.getStride()) {
      vertex.push(segment[index][vertex.length]);
    }

    switch (geometry.getType()) {
      case _ol_geom_GeometryType_.POINT:
        coordinates = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case _ol_geom_GeometryType_.MULTI_POINT:
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index] = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case _ol_geom_GeometryType_.LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case _ol_geom_GeometryType_.MULTI_LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case _ol_geom_GeometryType_.POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case _ol_geom_GeometryType_.MULTI_POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case _ol_geom_GeometryType_.CIRCLE:
        segment[0] = segment[1] = vertex;
        if (segmentData.index === _ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX) {
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
_ol_interaction_Modify_.handleUpEvent_ = function(evt) {
  var segmentData;
  var geometry;
  for (var i = this.dragSegments_.length - 1; i >= 0; --i) {
    segmentData = this.dragSegments_[i][0];
    geometry = segmentData.geometry;
    if (geometry.getType() === _ol_geom_GeometryType_.CIRCLE) {
      // Update a circle object in the R* bush:
      var coordinates = geometry.getCenter();
      var centerSegmentData = segmentData.featureSegments[0];
      var circumferenceSegmentData = segmentData.featureSegments[1];
      centerSegmentData.segment[0] = centerSegmentData.segment[1] = coordinates;
      circumferenceSegmentData.segment[0] = circumferenceSegmentData.segment[1] = coordinates;
      this.rBush_.update(_ol_extent_.createOrUpdateFromCoordinate(coordinates), centerSegmentData);
      this.rBush_.update(geometry.getExtent(), circumferenceSegmentData);
    } else {
      this.rBush_.update(_ol_extent_.boundingExtent(segmentData.segment),
          segmentData);
    }
  }
  if (this.modified_) {
    this.dispatchEvent(new _ol_interaction_Modify_.Event(
        _ol_interaction_ModifyEventType_.MODIFYEND, this.features_, evt));
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
_ol_interaction_Modify_.handleEvent = function(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof _ol_MapBrowserPointerEvent_)) {
    return true;
  }
  this.lastPointerEvent_ = mapBrowserEvent;

  var handled;
  if (!mapBrowserEvent.map.getView().getHints()[_ol_ViewHint_.INTERACTING] &&
      mapBrowserEvent.type == _ol_MapBrowserEventType_.POINTERMOVE &&
      !this.handlingDownUpSequence) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  if (this.vertexFeature_ && this.deleteCondition_(mapBrowserEvent)) {
    if (mapBrowserEvent.type != _ol_MapBrowserEventType_.SINGLECLICK ||
        !this.ignoreNextSingleClick_) {
      handled = this.removePoint();
    } else {
      handled = true;
    }
  }

  if (mapBrowserEvent.type == _ol_MapBrowserEventType_.SINGLECLICK) {
    this.ignoreNextSingleClick_ = false;
  }

  return _ol_interaction_Pointer_.handleEvent.call(this, mapBrowserEvent) &&
      !handled;
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 * @private
 */
_ol_interaction_Modify_.prototype.handlePointerMove_ = function(evt) {
  this.lastPixel_ = evt.pixel;
  this.handlePointerAtPixel_(evt.pixel, evt.map);
};


/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.PluggableMap} map Map.
 * @private
 */
_ol_interaction_Modify_.prototype.handlePointerAtPixel_ = function(pixel, map) {
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var sortByDistance = function(a, b) {
    return _ol_interaction_Modify_.pointDistanceToSegmentDataSquared_(pixelCoordinate, a) -
        _ol_interaction_Modify_.pointDistanceToSegmentDataSquared_(pixelCoordinate, b);
  };

  var box = _ol_extent_.buffer(
      _ol_extent_.createOrUpdateFromCoordinate(pixelCoordinate),
      map.getView().getResolution() * this.pixelTolerance_);

  var rBush = this.rBush_;
  var nodes = rBush.getInExtent(box);
  if (nodes.length > 0) {
    nodes.sort(sortByDistance);
    var node = nodes[0];
    var closestSegment = node.segment;
    var vertex = _ol_interaction_Modify_.closestOnSegmentData_(pixelCoordinate, node);
    var vertexPixel = map.getPixelFromCoordinate(vertex);
    var dist = _ol_coordinate_.distance(pixel, vertexPixel);
    if (dist <= this.pixelTolerance_) {
      var vertexSegments = {};

      if (node.geometry.getType() === _ol_geom_GeometryType_.CIRCLE &&
      node.index === _ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {

        this.snappedToVertex_ = true;
        this.createOrUpdateVertexFeature_(vertex);
      } else {
        var pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
        var pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
        var squaredDist1 = _ol_coordinate_.squaredDistance(vertexPixel, pixel1);
        var squaredDist2 = _ol_coordinate_.squaredDistance(vertexPixel, pixel2);
        dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
        this.snappedToVertex_ = dist <= this.pixelTolerance_;
        if (this.snappedToVertex_) {
          vertex = squaredDist1 > squaredDist2 ?
            closestSegment[1] : closestSegment[0];
        }
        this.createOrUpdateVertexFeature_(vertex);
        var segment;
        for (var i = 1, ii = nodes.length; i < ii; ++i) {
          segment = nodes[i].segment;
          if ((_ol_coordinate_.equals(closestSegment[0], segment[0]) &&
              _ol_coordinate_.equals(closestSegment[1], segment[1]) ||
              (_ol_coordinate_.equals(closestSegment[0], segment[1]) &&
              _ol_coordinate_.equals(closestSegment[1], segment[0])))) {
            vertexSegments[_ol_.getUid(segment)] = true;
          } else {
            break;
          }
        }
      }

      vertexSegments[_ol_.getUid(closestSegment)] = true;
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
_ol_interaction_Modify_.pointDistanceToSegmentDataSquared_ = function(pointCoordinates, segmentData) {
  var geometry = segmentData.geometry;

  if (geometry.getType() === _ol_geom_GeometryType_.CIRCLE) {
    var circleGeometry = /** @type {ol.geom.Circle} */ (geometry);

    if (segmentData.index === _ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {
      var distanceToCenterSquared =
            _ol_coordinate_.squaredDistance(circleGeometry.getCenter(), pointCoordinates);
      var distanceToCircumference =
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
_ol_interaction_Modify_.closestOnSegmentData_ = function(pointCoordinates, segmentData) {
  var geometry = segmentData.geometry;

  if (geometry.getType() === _ol_geom_GeometryType_.CIRCLE &&
  segmentData.index === _ol_interaction_Modify_.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {
    return geometry.getClosestPoint(pointCoordinates);
  }
  return _ol_coordinate_.closestOnSegment(pointCoordinates, segmentData.segment);
};


/**
 * @param {ol.ModifySegmentDataType} segmentData Segment data.
 * @param {ol.Coordinate} vertex Vertex.
 * @private
 */
_ol_interaction_Modify_.prototype.insertVertex_ = function(segmentData, vertex) {
  var segment = segmentData.segment;
  var feature = segmentData.feature;
  var geometry = segmentData.geometry;
  var depth = segmentData.depth;
  var index = /** @type {number} */ (segmentData.index);
  var coordinates;

  while (vertex.length < geometry.getStride()) {
    vertex.push(0);
  }

  switch (geometry.getType()) {
    case _ol_geom_GeometryType_.MULTI_LINE_STRING:
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case _ol_geom_GeometryType_.POLYGON:
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case _ol_geom_GeometryType_.MULTI_POLYGON:
      coordinates = geometry.getCoordinates();
      coordinates[depth[1]][depth[0]].splice(index + 1, 0, vertex);
      break;
    case _ol_geom_GeometryType_.LINE_STRING:
      coordinates = geometry.getCoordinates();
      coordinates.splice(index + 1, 0, vertex);
      break;
    default:
      return;
  }

  this.setGeometryCoordinates_(geometry, coordinates);
  var rTree = this.rBush_;
  rTree.remove(segmentData);
  this.updateSegmentIndices_(geometry, index, depth, 1);
  var newSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    segment: [segment[0], vertex],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index
  });
  rTree.insert(_ol_extent_.boundingExtent(newSegmentData.segment),
      newSegmentData);
  this.dragSegments_.push([newSegmentData, 1]);

  var newSegmentData2 = /** @type {ol.ModifySegmentDataType} */ ({
    segment: [vertex, segment[1]],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index + 1
  });
  rTree.insert(_ol_extent_.boundingExtent(newSegmentData2.segment),
      newSegmentData2);
  this.dragSegments_.push([newSegmentData2, 0]);
  this.ignoreNextSingleClick_ = true;
};

/**
 * Removes the vertex currently being pointed.
 * @return {boolean} True when a vertex was removed.
 * @api
 */
_ol_interaction_Modify_.prototype.removePoint = function() {
  if (this.lastPointerEvent_ && this.lastPointerEvent_.type != _ol_MapBrowserEventType_.POINTERDRAG) {
    var evt = this.lastPointerEvent_;
    this.willModifyFeatures_(evt);
    this.removeVertex_();
    this.dispatchEvent(new _ol_interaction_Modify_.Event(
        _ol_interaction_ModifyEventType_.MODIFYEND, this.features_, evt));
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
_ol_interaction_Modify_.prototype.removeVertex_ = function() {
  var dragSegments = this.dragSegments_;
  var segmentsByFeature = {};
  var deleted = false;
  var component, coordinates, dragSegment, geometry, i, index, left;
  var newIndex, right, segmentData, uid;
  for (i = dragSegments.length - 1; i >= 0; --i) {
    dragSegment = dragSegments[i];
    segmentData = dragSegment[0];
    uid = _ol_.getUid(segmentData.feature);
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
      case _ol_geom_GeometryType_.MULTI_LINE_STRING:
        if (coordinates[segmentData.depth[0]].length > 2) {
          coordinates[segmentData.depth[0]].splice(index, 1);
          deleted = true;
        }
        break;
      case _ol_geom_GeometryType_.LINE_STRING:
        if (coordinates.length > 2) {
          coordinates.splice(index, 1);
          deleted = true;
        }
        break;
      case _ol_geom_GeometryType_.MULTI_POLYGON:
        component = component[segmentData.depth[1]];
        /* falls through */
      case _ol_geom_GeometryType_.POLYGON:
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
      var segments = [];
      if (left !== undefined) {
        this.rBush_.remove(left);
        segments.push(left.segment[0]);
      }
      if (right !== undefined) {
        this.rBush_.remove(right);
        segments.push(right.segment[1]);
      }
      if (left !== undefined && right !== undefined) {
        var newSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
          depth: segmentData.depth,
          feature: segmentData.feature,
          geometry: segmentData.geometry,
          index: newIndex,
          segment: segments
        });
        this.rBush_.insert(_ol_extent_.boundingExtent(newSegmentData.segment),
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
_ol_interaction_Modify_.prototype.setGeometryCoordinates_ = function(geometry, coordinates) {
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
_ol_interaction_Modify_.prototype.updateSegmentIndices_ = function(
    geometry, index, depth, delta) {
  this.rBush_.forEachInExtent(geometry.getExtent(), function(segmentDataMatch) {
    if (segmentDataMatch.geometry === geometry &&
        (depth === undefined || segmentDataMatch.depth === undefined ||
        _ol_array_.equals(segmentDataMatch.depth, depth)) &&
        segmentDataMatch.index > index) {
      segmentDataMatch.index += delta;
    }
  });
};


/**
 * @return {ol.StyleFunction} Styles.
 */
_ol_interaction_Modify_.getDefaultStyleFunction = function() {
  var style = _ol_style_Style_.createDefaultEditing();
  return function(feature, resolution) {
    return style[_ol_geom_GeometryType_.POINT];
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
_ol_interaction_Modify_.Event = function(type, features, mapBrowserPointerEvent) {

  _ol_events_Event_.call(this, type);

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
_ol_.inherits(_ol_interaction_Modify_.Event, _ol_events_Event_);
export default _ol_interaction_Modify_;
