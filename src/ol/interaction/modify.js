goog.provide('ol.interaction.Modify');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.MapBrowserEventType');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.ViewHint');
goog.require('ol.array');
goog.require('ol.coordinate');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.events.condition');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('ol.interaction.ModifyEventType');
goog.require('ol.interaction.Pointer');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('ol.structs.RBush');
goog.require('ol.style.Style');

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
ol.interaction.Modify = function(options) {

  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.Modify.handleDownEvent_,
    handleDragEvent: ol.interaction.Modify.handleDragEvent_,
    handleEvent: ol.interaction.Modify.handleEvent,
    handleUpEvent: ol.interaction.Modify.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : ol.events.condition.primaryAction;


  /**
   * @private
   * @param {ol.MapBrowserEvent} mapBrowserEvent Browser event.
   * @return {boolean} Combined condition result.
   */
  this.defaultDeleteCondition_ = function(mapBrowserEvent) {
    return ol.events.condition.altKeyOnly(mapBrowserEvent) &&
      ol.events.condition.singleClick(mapBrowserEvent);
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
    options.insertVertexCondition : ol.events.condition.always;

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
  this.rBush_ = new ol.structs.RBush();

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
  this.overlay_ = new ol.layer.Vector({
    source: new ol.source.Vector({
      useSpatialIndex: false,
      wrapX: !!options.wrapX
    }),
    style: options.style ? options.style :
      ol.interaction.Modify.getDefaultStyleFunction(),
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
    features = new ol.Collection(this.source_.getFeatures());
    ol.events.listen(this.source_, ol.source.VectorEventType.ADDFEATURE,
        this.handleSourceAdd_, this);
    ol.events.listen(this.source_, ol.source.VectorEventType.REMOVEFEATURE,
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
  ol.events.listen(this.features_, ol.CollectionEventType.ADD,
      this.handleFeatureAdd_, this);
  ol.events.listen(this.features_, ol.CollectionEventType.REMOVE,
      this.handleFeatureRemove_, this);

  /**
   * @type {ol.MapBrowserPointerEvent}
   * @private
   */
  this.lastPointerEvent_ = null;

};
ol.inherits(ol.interaction.Modify, ol.interaction.Pointer);


/**
 * @define {number} The segment index assigned to a circle's center when
 * breaking up a cicrle into ModifySegmentDataType segments.
 */
ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX = 0;

/**
 * @define {number} The segment index assigned to a circle's circumference when
 * breaking up a circle into ModifySegmentDataType segments.
 */
ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX = 1;


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.interaction.Modify.prototype.addFeature_ = function(feature) {
  var geometry = feature.getGeometry();
  if (geometry && geometry.getType() in this.SEGMENT_WRITERS_) {
    this.SEGMENT_WRITERS_[geometry.getType()].call(this, feature, geometry);
  }
  var map = this.getMap();
  if (map && map.isRendered() && this.getActive()) {
    this.handlePointerAtPixel_(this.lastPixel_, map);
  }
  ol.events.listen(feature, ol.events.EventType.CHANGE,
      this.handleFeatureChange_, this);
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Map browser event
 * @private
 */
ol.interaction.Modify.prototype.willModifyFeatures_ = function(evt) {
  if (!this.modified_) {
    this.modified_ = true;
    this.dispatchEvent(new ol.interaction.Modify.Event(
        ol.interaction.ModifyEventType.MODIFYSTART, this.features_, evt));
  }
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.interaction.Modify.prototype.removeFeature_ = function(feature) {
  this.removeFeatureSegmentData_(feature);
  // Remove the vertex feature if the collection of canditate features
  // is empty.
  if (this.vertexFeature_ && this.features_.getLength() === 0) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
  ol.events.unlisten(feature, ol.events.EventType.CHANGE,
      this.handleFeatureChange_, this);
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.interaction.Modify.prototype.removeFeatureSegmentData_ = function(feature) {
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
ol.interaction.Modify.prototype.setActive = function(active) {
  if (this.vertexFeature_ && !active) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
  ol.interaction.Pointer.prototype.setActive.call(this, active);
};


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  ol.interaction.Pointer.prototype.setMap.call(this, map);
};


/**
 * @param {ol.source.Vector.Event} event Event.
 * @private
 */
ol.interaction.Modify.prototype.handleSourceAdd_ = function(event) {
  if (event.feature) {
    this.features_.push(event.feature);
  }
};


/**
 * @param {ol.source.Vector.Event} event Event.
 * @private
 */
ol.interaction.Modify.prototype.handleSourceRemove_ = function(event) {
  if (event.feature) {
    this.features_.remove(event.feature);
  }
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleFeatureAdd_ = function(evt) {
  this.addFeature_(/** @type {ol.Feature} */ (evt.element));
};


/**
 * @param {ol.events.Event} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleFeatureChange_ = function(evt) {
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
ol.interaction.Modify.prototype.handleFeatureRemove_ = function(evt) {
  var feature = /** @type {ol.Feature} */ (evt.element);
  this.removeFeature_(feature);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Point} geometry Geometry.
 * @private
 */
ol.interaction.Modify.prototype.writePointGeometry_ = function(feature, geometry) {
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
ol.interaction.Modify.prototype.writeMultiPointGeometry_ = function(feature, geometry) {
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
ol.interaction.Modify.prototype.writeLineStringGeometry_ = function(feature, geometry) {
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
    this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiLineString} geometry Geometry.
 * @private
 */
ol.interaction.Modify.prototype.writeMultiLineStringGeometry_ = function(feature, geometry) {
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
      this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Polygon} geometry Geometry.
 * @private
 */
ol.interaction.Modify.prototype.writePolygonGeometry_ = function(feature, geometry) {
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
      this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @private
 */
ol.interaction.Modify.prototype.writeMultiPolygonGeometry_ = function(feature, geometry) {
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
        this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
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
ol.interaction.Modify.prototype.writeCircleGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCenter();
  var centerSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    feature: feature,
    geometry: geometry,
    index: ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX,
    segment: [coordinates, coordinates]
  });
  var circumferenceSegmentData = /** @type {ol.ModifySegmentDataType} */ ({
    feature: feature,
    geometry: geometry,
    index: ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX,
    segment: [coordinates, coordinates]
  });
  var featureSegments = [centerSegmentData, circumferenceSegmentData];
  centerSegmentData.featureSegments = circumferenceSegmentData.featureSegments = featureSegments;
  this.rBush_.insert(ol.extent.createOrUpdateFromCoordinate(coordinates), centerSegmentData);
  this.rBush_.insert(geometry.getExtent(), circumferenceSegmentData);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @private
 */
ol.interaction.Modify.prototype.writeGeometryCollectionGeometry_ = function(feature, geometry) {
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
ol.interaction.Modify.prototype.createOrUpdateVertexFeature_ = function(coordinates) {
  var vertexFeature = this.vertexFeature_;
  if (!vertexFeature) {
    vertexFeature = new ol.Feature(new ol.geom.Point(coordinates));
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
ol.interaction.Modify.compareIndexes_ = function(a, b) {
  return a.index - b.index;
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Modify}
 * @private
 */
ol.interaction.Modify.handleDownEvent_ = function(evt) {
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
    var vertexExtent = ol.extent.boundingExtent([vertex]);
    var segmentDataMatches = this.rBush_.getInExtent(vertexExtent);
    var componentSegments = {};
    segmentDataMatches.sort(ol.interaction.Modify.compareIndexes_);
    for (var i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
      var segmentDataMatch = segmentDataMatches[i];
      var segment = segmentDataMatch.segment;
      var uid = ol.getUid(segmentDataMatch.feature);
      var depth = segmentDataMatch.depth;
      if (depth) {
        uid += '-' + depth.join('-'); // separate feature components
      }
      if (!componentSegments[uid]) {
        componentSegments[uid] = new Array(2);
      }
      if (segmentDataMatch.geometry.getType() === ol.geom.GeometryType.CIRCLE &&
      segmentDataMatch.index === ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {

        var closestVertex = ol.interaction.Modify.closestOnSegmentData_(pixelCoordinate, segmentDataMatch);
        if (ol.coordinate.equals(closestVertex, vertex) && !componentSegments[uid][0]) {
          this.dragSegments_.push([segmentDataMatch, 0]);
          componentSegments[uid][0] = segmentDataMatch;
        }
      } else if (ol.coordinate.equals(segment[0], vertex) &&
          !componentSegments[uid][0]) {
        this.dragSegments_.push([segmentDataMatch, 0]);
        componentSegments[uid][0] = segmentDataMatch;
      } else if (ol.coordinate.equals(segment[1], vertex) &&
          !componentSegments[uid][1]) {

        // prevent dragging closed linestrings by the connecting node
        if ((segmentDataMatch.geometry.getType() ===
            ol.geom.GeometryType.LINE_STRING ||
            segmentDataMatch.geometry.getType() ===
            ol.geom.GeometryType.MULTI_LINE_STRING) &&
            componentSegments[uid][0] &&
            componentSegments[uid][0].index === 0) {
          continue;
        }

        this.dragSegments_.push([segmentDataMatch, 1]);
        componentSegments[uid][1] = segmentDataMatch;
      } else if (this.insertVertexCondition_(evt) && ol.getUid(segment) in this.vertexSegments_ &&
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
ol.interaction.Modify.handleDragEvent_ = function(evt) {
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
      case ol.geom.GeometryType.POINT:
        coordinates = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case ol.geom.GeometryType.MULTI_POINT:
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index] = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case ol.geom.GeometryType.LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case ol.geom.GeometryType.POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case ol.geom.GeometryType.MULTI_POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case ol.geom.GeometryType.CIRCLE:
        segment[0] = segment[1] = vertex;
        if (segmentData.index === ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CENTER_INDEX) {
          this.changingFeature_ = true;
          geometry.setCenter(vertex);
          this.changingFeature_ = false;
        } else { // We're dragging the circle's circumference:
          this.changingFeature_ = true;
          geometry.setRadius(ol.coordinate.distance(geometry.getCenter(), vertex));
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
ol.interaction.Modify.handleUpEvent_ = function(evt) {
  var segmentData;
  var geometry;
  for (var i = this.dragSegments_.length - 1; i >= 0; --i) {
    segmentData = this.dragSegments_[i][0];
    geometry = segmentData.geometry;
    if (geometry.getType() === ol.geom.GeometryType.CIRCLE) {
      // Update a circle object in the R* bush:
      var coordinates = geometry.getCenter();
      var centerSegmentData = segmentData.featureSegments[0];
      var circumferenceSegmentData = segmentData.featureSegments[1];
      centerSegmentData.segment[0] = centerSegmentData.segment[1] = coordinates;
      circumferenceSegmentData.segment[0] = circumferenceSegmentData.segment[1] = coordinates;
      this.rBush_.update(ol.extent.createOrUpdateFromCoordinate(coordinates), centerSegmentData);
      this.rBush_.update(geometry.getExtent(), circumferenceSegmentData);
    } else {
      this.rBush_.update(ol.extent.boundingExtent(segmentData.segment),
          segmentData);
    }
  }
  if (this.modified_) {
    this.dispatchEvent(new ol.interaction.Modify.Event(
        ol.interaction.ModifyEventType.MODIFYEND, this.features_, evt));
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
ol.interaction.Modify.handleEvent = function(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof ol.MapBrowserPointerEvent)) {
    return true;
  }
  this.lastPointerEvent_ = mapBrowserEvent;

  var handled;
  if (!mapBrowserEvent.map.getView().getHints()[ol.ViewHint.INTERACTING] &&
      mapBrowserEvent.type == ol.MapBrowserEventType.POINTERMOVE &&
      !this.handlingDownUpSequence) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  if (this.vertexFeature_ && this.deleteCondition_(mapBrowserEvent)) {
    if (mapBrowserEvent.type != ol.MapBrowserEventType.SINGLECLICK ||
        !this.ignoreNextSingleClick_) {
      handled = this.removePoint();
    } else {
      handled = true;
    }
  }

  if (mapBrowserEvent.type == ol.MapBrowserEventType.SINGLECLICK) {
    this.ignoreNextSingleClick_ = false;
  }

  return ol.interaction.Pointer.handleEvent.call(this, mapBrowserEvent) &&
      !handled;
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handlePointerMove_ = function(evt) {
  this.lastPixel_ = evt.pixel;
  this.handlePointerAtPixel_(evt.pixel, evt.map);
};


/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.PluggableMap} map Map.
 * @private
 */
ol.interaction.Modify.prototype.handlePointerAtPixel_ = function(pixel, map) {
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var sortByDistance = function(a, b) {
    return ol.interaction.Modify.pointDistanceToSegmentDataSquared_(pixelCoordinate, a) -
        ol.interaction.Modify.pointDistanceToSegmentDataSquared_(pixelCoordinate, b);
  };

  var box = ol.extent.buffer(
      ol.extent.createOrUpdateFromCoordinate(pixelCoordinate),
      map.getView().getResolution() * this.pixelTolerance_);

  var rBush = this.rBush_;
  var nodes = rBush.getInExtent(box);
  if (nodes.length > 0) {
    nodes.sort(sortByDistance);
    var node = nodes[0];
    var closestSegment = node.segment;
    var vertex = ol.interaction.Modify.closestOnSegmentData_(pixelCoordinate, node);
    var vertexPixel = map.getPixelFromCoordinate(vertex);
    var dist = ol.coordinate.distance(pixel, vertexPixel);
    if (dist <= this.pixelTolerance_) {
      var vertexSegments = {};

      if (node.geometry.getType() === ol.geom.GeometryType.CIRCLE &&
      node.index === ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {

        this.snappedToVertex_ = true;
        this.createOrUpdateVertexFeature_(vertex);
      } else {
        var pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
        var pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
        var squaredDist1 = ol.coordinate.squaredDistance(vertexPixel, pixel1);
        var squaredDist2 = ol.coordinate.squaredDistance(vertexPixel, pixel2);
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
          if ((ol.coordinate.equals(closestSegment[0], segment[0]) &&
              ol.coordinate.equals(closestSegment[1], segment[1]) ||
              (ol.coordinate.equals(closestSegment[0], segment[1]) &&
              ol.coordinate.equals(closestSegment[1], segment[0])))) {
            vertexSegments[ol.getUid(segment)] = true;
          } else {
            break;
          }
        }
      }

      vertexSegments[ol.getUid(closestSegment)] = true;
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
ol.interaction.Modify.pointDistanceToSegmentDataSquared_ = function(pointCoordinates, segmentData) {
  var geometry = segmentData.geometry;

  if (geometry.getType() === ol.geom.GeometryType.CIRCLE) {
    var circleGeometry = /** @type {ol.geom.Circle} */ (geometry);

    if (segmentData.index === ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {
      var distanceToCenterSquared =
            ol.coordinate.squaredDistance(circleGeometry.getCenter(), pointCoordinates);
      var distanceToCircumference =
            Math.sqrt(distanceToCenterSquared) - circleGeometry.getRadius();
      return distanceToCircumference * distanceToCircumference;
    }
  }
  return ol.coordinate.squaredDistanceToSegment(pointCoordinates, segmentData.segment);
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
ol.interaction.Modify.closestOnSegmentData_ = function(pointCoordinates, segmentData) {
  var geometry = segmentData.geometry;

  if (geometry.getType() === ol.geom.GeometryType.CIRCLE &&
  segmentData.index === ol.interaction.Modify.MODIFY_SEGMENT_CIRCLE_CIRCUMFERENCE_INDEX) {
    return geometry.getClosestPoint(pointCoordinates);
  }
  return ol.coordinate.closestOnSegment(pointCoordinates, segmentData.segment);
};


/**
 * @param {ol.ModifySegmentDataType} segmentData Segment data.
 * @param {ol.Coordinate} vertex Vertex.
 * @private
 */
ol.interaction.Modify.prototype.insertVertex_ = function(segmentData, vertex) {
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
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case ol.geom.GeometryType.POLYGON:
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      coordinates = geometry.getCoordinates();
      coordinates[depth[1]][depth[0]].splice(index + 1, 0, vertex);
      break;
    case ol.geom.GeometryType.LINE_STRING:
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
  rTree.insert(ol.extent.boundingExtent(newSegmentData.segment),
      newSegmentData);
  this.dragSegments_.push([newSegmentData, 1]);

  var newSegmentData2 = /** @type {ol.ModifySegmentDataType} */ ({
    segment: [vertex, segment[1]],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index + 1
  });
  rTree.insert(ol.extent.boundingExtent(newSegmentData2.segment),
      newSegmentData2);
  this.dragSegments_.push([newSegmentData2, 0]);
  this.ignoreNextSingleClick_ = true;
};

/**
 * Removes the vertex currently being pointed.
 * @return {boolean} True when a vertex was removed.
 * @api
 */
ol.interaction.Modify.prototype.removePoint = function() {
  if (this.lastPointerEvent_ && this.lastPointerEvent_.type != ol.MapBrowserEventType.POINTERDRAG) {
    var evt = this.lastPointerEvent_;
    this.willModifyFeatures_(evt);
    this.removeVertex_();
    this.dispatchEvent(new ol.interaction.Modify.Event(
        ol.interaction.ModifyEventType.MODIFYEND, this.features_, evt));
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
ol.interaction.Modify.prototype.removeVertex_ = function() {
  var dragSegments = this.dragSegments_;
  var segmentsByFeature = {};
  var deleted = false;
  var component, coordinates, dragSegment, geometry, i, index, left;
  var newIndex, right, segmentData, uid;
  for (i = dragSegments.length - 1; i >= 0; --i) {
    dragSegment = dragSegments[i];
    segmentData = dragSegment[0];
    uid = ol.getUid(segmentData.feature);
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
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        if (coordinates[segmentData.depth[0]].length > 2) {
          coordinates[segmentData.depth[0]].splice(index, 1);
          deleted = true;
        }
        break;
      case ol.geom.GeometryType.LINE_STRING:
        if (coordinates.length > 2) {
          coordinates.splice(index, 1);
          deleted = true;
        }
        break;
      case ol.geom.GeometryType.MULTI_POLYGON:
        component = component[segmentData.depth[1]];
        /* falls through */
      case ol.geom.GeometryType.POLYGON:
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
        this.rBush_.insert(ol.extent.boundingExtent(newSegmentData.segment),
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
ol.interaction.Modify.prototype.setGeometryCoordinates_ = function(geometry, coordinates) {
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
ol.interaction.Modify.prototype.updateSegmentIndices_ = function(
    geometry, index, depth, delta) {
  this.rBush_.forEachInExtent(geometry.getExtent(), function(segmentDataMatch) {
    if (segmentDataMatch.geometry === geometry &&
        (depth === undefined || segmentDataMatch.depth === undefined ||
        ol.array.equals(segmentDataMatch.depth, depth)) &&
        segmentDataMatch.index > index) {
      segmentDataMatch.index += delta;
    }
  });
};


/**
 * @return {ol.StyleFunction} Styles.
 */
ol.interaction.Modify.getDefaultStyleFunction = function() {
  var style = ol.style.Style.createDefaultEditing();
  return function(feature, resolution) {
    return style[ol.geom.GeometryType.POINT];
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
ol.interaction.Modify.Event = function(type, features, mapBrowserPointerEvent) {

  ol.events.Event.call(this, type);

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
ol.inherits(ol.interaction.Modify.Event, ol.events.Event);
