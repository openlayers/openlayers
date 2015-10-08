goog.provide('ol.interaction.Modify');
goog.provide('ol.interaction.ModifyEvent');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Pointer');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.structs.RBush');


/**
 * @enum {string}
 */
ol.ModifyEventType = {
  /**
   * Triggered upon feature modification start
   * @event ol.interaction.ModifyEvent#modifystart
   * @api
   */
  MODIFYSTART: 'modifystart',
  /**
   * Triggered upon feature modification end
   * @event ol.interaction.ModifyEvent#modifyend
   * @api
   */
  MODIFYEND: 'modifyend'
};



/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Modify} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.ModifyEvent}
 * @param {ol.ModifyEventType} type Type.
 * @param {ol.Collection.<ol.Feature>} features The features modified.
 * @param {ol.MapBrowserPointerEvent} mapBrowserPointerEvent Associated
 *     {@link ol.MapBrowserPointerEvent}.
 */
ol.interaction.ModifyEvent = function(type, features, mapBrowserPointerEvent) {

  goog.base(this, type);

  /**
   * The features being modified.
   * @type {ol.Collection.<ol.Feature>}
   * @api
   */
  this.features = features;

  /**
   * Associated {@link ol.MapBrowserPointerEvent}.
   * @type {ol.MapBrowserPointerEvent}
   * @api
   */
  this.mapBrowserPointerEvent = mapBrowserPointerEvent;
};
goog.inherits(ol.interaction.ModifyEvent, goog.events.Event);


/**
 * @typedef {{depth: (Array.<number>|undefined),
 *            feature: ol.Feature,
 *            geometry: ol.geom.SimpleGeometry,
 *            index: (number|undefined),
 *            segment: Array.<ol.Extent>}}
 */
ol.interaction.SegmentDataType;



/**
 * @classdesc
 * Interaction for modifying feature geometries.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.ModifyOptions} options Options.
 * @fires ol.interaction.ModifyEvent
 * @api
 */
ol.interaction.Modify = function(options) {

  goog.base(this, {
    handleDownEvent: ol.interaction.Modify.handleDownEvent_,
    handleDragEvent: ol.interaction.Modify.handleDragEvent_,
    handleEvent: ol.interaction.Modify.handleEvent,
    handleUpEvent: ol.interaction.Modify.handleUpEvent_
  });

  /**
   * @type {ol.events.ConditionType}
   * @private
   */
  this.deleteCondition_ = options.deleteCondition ?
      options.deleteCondition :
      /** @type {ol.events.ConditionType} */ (goog.functions.and(
          ol.events.condition.noModifierKeys,
          ol.events.condition.singleClick));

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
   * @type {ol.structs.RBush.<ol.interaction.SegmentDataType>}
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
  this.dragSegments_ = null;

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
  * @type {Object.<string, function(ol.Feature, ol.geom.Geometry)> }
  */
  this.SEGMENT_WRITERS_ = {
    'Point': this.writePointGeometry_,
    'LineString': this.writeLineStringGeometry_,
    'LinearRing': this.writeLineStringGeometry_,
    'Polygon': this.writePolygonGeometry_,
    'MultiPoint': this.writeMultiPointGeometry_,
    'MultiLineString': this.writeMultiLineStringGeometry_,
    'MultiPolygon': this.writeMultiPolygonGeometry_,
    'GeometryCollection': this.writeGeometryCollectionGeometry_
  };

  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features;

  this.features_.forEach(this.addFeature_, this);
  goog.events.listen(this.features_, ol.CollectionEventType.ADD,
      this.handleFeatureAdd_, false, this);
  goog.events.listen(this.features_, ol.CollectionEventType.REMOVE,
      this.handleFeatureRemove_, false, this);

};
goog.inherits(ol.interaction.Modify, ol.interaction.Pointer);


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.interaction.Modify.prototype.addFeature_ = function(feature) {
  var geometry = feature.getGeometry();
  if (geometry.getType() in this.SEGMENT_WRITERS_) {
    this.SEGMENT_WRITERS_[geometry.getType()].call(this, feature, geometry);
  }
  var map = this.getMap();
  if (map) {
    this.handlePointerAtPixel_(this.lastPixel_, map);
  }
  goog.events.listen(feature, goog.events.EventType.CHANGE,
      this.handleFeatureChange_, false, this);
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Map browser event
 * @private
 */
ol.interaction.Modify.prototype.willModifyFeatures_ = function(evt) {
  if (!this.modified_) {
    this.modified_ = true;
    this.dispatchEvent(new ol.interaction.ModifyEvent(
        ol.ModifyEventType.MODIFYSTART, this.features_, evt));
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
  goog.events.unlisten(feature, goog.events.EventType.CHANGE,
      this.handleFeatureChange_, false, this);
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.interaction.Modify.prototype.removeFeatureSegmentData_ = function(feature) {
  var rBush = this.rBush_;
  var /** @type {Array.<ol.interaction.SegmentDataType>} */ nodesToRemove = [];
  rBush.forEach(
      /**
       * @param {ol.interaction.SegmentDataType} node RTree node.
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
ol.interaction.Modify.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  goog.base(this, 'setMap', map);
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleFeatureAdd_ = function(evt) {
  var feature = evt.element;
  goog.asserts.assertInstanceof(feature, ol.Feature,
      'feature should be an ol.Feature');
  this.addFeature_(feature);
};


/**
 * @param {goog.events.Event} evt Event.
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
 * @param {ol.CollectionEvent} evt Event.
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
ol.interaction.Modify.prototype.writePointGeometry_ =
    function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
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
ol.interaction.Modify.prototype.writeMultiPointGeometry_ =
    function(feature, geometry) {
  var points = geometry.getCoordinates();
  var coordinates, i, ii, segmentData;
  for (i = 0, ii = points.length; i < ii; ++i) {
    coordinates = points[i];
    segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
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
ol.interaction.Modify.prototype.writeLineStringGeometry_ =
    function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var i, ii, segment, segmentData;
  for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    segment = coordinates.slice(i, i + 2);
    segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
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
ol.interaction.Modify.prototype.writeMultiLineStringGeometry_ =
    function(feature, geometry) {
  var lines = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = lines.length; j < jj; ++j) {
    coordinates = lines[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
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
ol.interaction.Modify.prototype.writePolygonGeometry_ =
    function(feature, geometry) {
  var rings = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = rings.length; j < jj; ++j) {
    coordinates = rings[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
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
ol.interaction.Modify.prototype.writeMultiPolygonGeometry_ =
    function(feature, geometry) {
  var polygons = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, k, kk, rings, segment, segmentData;
  for (k = 0, kk = polygons.length; k < kk; ++k) {
    rings = polygons[k];
    for (j = 0, jj = rings.length; j < jj; ++j) {
      coordinates = rings[j];
      for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        segment = coordinates.slice(i, i + 2);
        segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
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
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @private
 */
ol.interaction.Modify.prototype.writeGeometryCollectionGeometry_ =
    function(feature, geometry) {
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
ol.interaction.Modify.prototype.createOrUpdateVertexFeature_ =
    function(coordinates) {
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
 * @param {ol.interaction.SegmentDataType} a
 * @param {ol.interaction.SegmentDataType} b
 * @return {number}
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
  this.handlePointerAtPixel_(evt.pixel, evt.map);
  this.dragSegments_ = [];
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
      var uid = goog.getUid(segmentDataMatch.feature);
      var depth = segmentDataMatch.depth;
      if (depth) {
        uid += '-' + depth.join('-'); // separate feature components
      }
      if (!componentSegments[uid]) {
        componentSegments[uid] = new Array(2);
      }
      if (ol.coordinate.equals(segment[0], vertex) &&
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
      } else if (goog.getUid(segment) in this.vertexSegments_ &&
          (!componentSegments[uid][0] && !componentSegments[uid][1])) {
        insertVertices.push([segmentDataMatch, vertex]);
      }
    }
    if (insertVertices.length) {
      this.willModifyFeatures_(evt);
    }
    for (i = insertVertices.length - 1; i >= 0; --i) {
      this.insertVertex_.apply(this, insertVertices[i]);
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
    var coordinates = geometry.getCoordinates();
    var segment = segmentData.segment;
    var index = dragSegment[1];

    while (vertex.length < geometry.getStride()) {
      vertex.push(0);
    }

    switch (geometry.getType()) {
      case ol.geom.GeometryType.POINT:
        coordinates = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case ol.geom.GeometryType.MULTI_POINT:
        coordinates[segmentData.index] = vertex;
        segment[0] = segment[1] = vertex;
        break;
      case ol.geom.GeometryType.LINE_STRING:
        coordinates[segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case ol.geom.GeometryType.POLYGON:
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case ol.geom.GeometryType.MULTI_POLYGON:
        coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
    }

    this.setGeometryCoordinates_(geometry, coordinates);
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
  for (var i = this.dragSegments_.length - 1; i >= 0; --i) {
    segmentData = this.dragSegments_[i][0];
    this.rBush_.update(ol.extent.boundingExtent(segmentData.segment),
        segmentData);
  }
  if (this.modified_) {
    this.dispatchEvent(new ol.interaction.ModifyEvent(
        ol.ModifyEventType.MODIFYEND, this.features_, evt));
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

  var handled;
  if (!mapBrowserEvent.map.getView().getHints()[ol.ViewHint.INTERACTING] &&
      mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERMOVE &&
      !this.handlingDownUpSequence) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  if (this.vertexFeature_ && this.deleteCondition_(mapBrowserEvent)) {
    if (mapBrowserEvent.type != ol.MapBrowserEvent.EventType.SINGLECLICK ||
        !this.ignoreNextSingleClick_) {
      var geometry = this.vertexFeature_.getGeometry();
      goog.asserts.assertInstanceof(geometry, ol.geom.Point,
          'geometry should be an ol.geom.Point');
      this.willModifyFeatures_(mapBrowserEvent);
      handled = this.removeVertex_();
      this.dispatchEvent(new ol.interaction.ModifyEvent(
          ol.ModifyEventType.MODIFYEND, this.features_, mapBrowserEvent));
      this.modified_ = false;
    } else {
      handled = true;
    }
  }

  if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.SINGLECLICK) {
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
 * @param {ol.Map} map Map.
 * @private
 */
ol.interaction.Modify.prototype.handlePointerAtPixel_ = function(pixel, map) {
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var sortByDistance = function(a, b) {
    return ol.coordinate.squaredDistanceToSegment(pixelCoordinate, a.segment) -
        ol.coordinate.squaredDistanceToSegment(pixelCoordinate, b.segment);
  };

  var lowerLeft = map.getCoordinateFromPixel(
      [pixel[0] - this.pixelTolerance_, pixel[1] + this.pixelTolerance_]);
  var upperRight = map.getCoordinateFromPixel(
      [pixel[0] + this.pixelTolerance_, pixel[1] - this.pixelTolerance_]);
  var box = ol.extent.boundingExtent([lowerLeft, upperRight]);

  var rBush = this.rBush_;
  var nodes = rBush.getInExtent(box);
  if (nodes.length > 0) {
    nodes.sort(sortByDistance);
    var node = nodes[0];
    var closestSegment = node.segment;
    var vertex = (ol.coordinate.closestOnSegment(pixelCoordinate,
        closestSegment));
    var vertexPixel = map.getPixelFromCoordinate(vertex);
    if (Math.sqrt(ol.coordinate.squaredDistance(pixel, vertexPixel)) <=
        this.pixelTolerance_) {
      var pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
      var pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
      var squaredDist1 = ol.coordinate.squaredDistance(vertexPixel, pixel1);
      var squaredDist2 = ol.coordinate.squaredDistance(vertexPixel, pixel2);
      var dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
      this.snappedToVertex_ = dist <= this.pixelTolerance_;
      if (this.snappedToVertex_) {
        vertex = squaredDist1 > squaredDist2 ?
            closestSegment[1] : closestSegment[0];
      }
      this.createOrUpdateVertexFeature_(vertex);
      var vertexSegments = {};
      vertexSegments[goog.getUid(closestSegment)] = true;
      var segment;
      for (var i = 1, ii = nodes.length; i < ii; ++i) {
        segment = nodes[i].segment;
        if ((ol.coordinate.equals(closestSegment[0], segment[0]) &&
            ol.coordinate.equals(closestSegment[1], segment[1]) ||
            (ol.coordinate.equals(closestSegment[0], segment[1]) &&
            ol.coordinate.equals(closestSegment[1], segment[0])))) {
          vertexSegments[goog.getUid(segment)] = true;
        } else {
          break;
        }
      }
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
 * @param {ol.interaction.SegmentDataType} segmentData Segment data.
 * @param {ol.Coordinate} vertex Vertex.
 * @private
 */
ol.interaction.Modify.prototype.insertVertex_ = function(segmentData, vertex) {
  var segment = segmentData.segment;
  var feature = segmentData.feature;
  var geometry = segmentData.geometry;
  var depth = segmentData.depth;
  var index = segmentData.index;
  var coordinates;

  while (vertex.length < geometry.getStride()) {
    vertex.push(0);
  }

  switch (geometry.getType()) {
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      goog.asserts.assertInstanceof(geometry, ol.geom.MultiLineString,
          'geometry should be an ol.geom.MultiLineString');
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case ol.geom.GeometryType.POLYGON:
      goog.asserts.assertInstanceof(geometry, ol.geom.Polygon,
          'geometry should be an ol.geom.Polygon');
      coordinates = geometry.getCoordinates();
      coordinates[depth[0]].splice(index + 1, 0, vertex);
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      goog.asserts.assertInstanceof(geometry, ol.geom.MultiPolygon,
          'geometry should be an ol.geom.MultiPolygon');
      coordinates = geometry.getCoordinates();
      coordinates[depth[1]][depth[0]].splice(index + 1, 0, vertex);
      break;
    case ol.geom.GeometryType.LINE_STRING:
      goog.asserts.assertInstanceof(geometry, ol.geom.LineString,
          'geometry should be an ol.geom.LineString');
      coordinates = geometry.getCoordinates();
      coordinates.splice(index + 1, 0, vertex);
      break;
    default:
      return;
  }

  this.setGeometryCoordinates_(geometry, coordinates);
  var rTree = this.rBush_;
  goog.asserts.assert(segment !== undefined, 'segment should be defined');
  rTree.remove(segmentData);
  goog.asserts.assert(index !== undefined, 'index should be defined');
  this.updateSegmentIndices_(geometry, index, depth, 1);
  var newSegmentData = /** @type {ol.interaction.SegmentDataType} */ ({
    segment: [segment[0], vertex],
    feature: feature,
    geometry: geometry,
    depth: depth,
    index: index
  });
  rTree.insert(ol.extent.boundingExtent(newSegmentData.segment),
      newSegmentData);
  this.dragSegments_.push([newSegmentData, 1]);

  var newSegmentData2 = /** @type {ol.interaction.SegmentDataType} */ ({
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
 * Removes a vertex from all matching features.
 * @return {boolean} True when a vertex was removed.
 * @private
 */
ol.interaction.Modify.prototype.removeVertex_ = function() {
  var dragSegments = this.dragSegments_;
  var segmentsByFeature = {};
  var component, coordinates, dragSegment, geometry, i, index, left;
  var newIndex, newSegment, right, segmentData, uid, deleted;
  for (i = dragSegments.length - 1; i >= 0; --i) {
    dragSegment = dragSegments[i];
    segmentData = dragSegment[0];
    geometry = segmentData.geometry;
    coordinates = geometry.getCoordinates();
    uid = goog.getUid(segmentData.feature);
    if (segmentData.depth) {
      // separate feature components
      uid += '-' + segmentData.depth.join('-');
    }
    left = right = index = undefined;
    if (dragSegment[1] === 0) {
      right = segmentData;
      index = segmentData.index;
    } else if (dragSegment[1] == 1) {
      left = segmentData;
      index = segmentData.index + 1;
    }
    if (!(uid in segmentsByFeature)) {
      segmentsByFeature[uid] = [left, right, index];
    }
    newSegment = segmentsByFeature[uid];
    if (left !== undefined) {
      newSegment[0] = left;
    }
    if (right !== undefined) {
      newSegment[1] = right;
    }
    if (newSegment[0] !== undefined && newSegment[1] !== undefined) {
      component = coordinates;
      deleted = false;
      newIndex = index - 1;
      switch (geometry.getType()) {
        case ol.geom.GeometryType.MULTI_LINE_STRING:
          coordinates[segmentData.depth[0]].splice(index, 1);
          deleted = true;
          break;
        case ol.geom.GeometryType.LINE_STRING:
          coordinates.splice(index, 1);
          deleted = true;
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
      }

      if (deleted) {
        this.rBush_.remove(newSegment[0]);
        this.rBush_.remove(newSegment[1]);
        this.setGeometryCoordinates_(geometry, coordinates);
        goog.asserts.assert(newIndex >= 0, 'newIndex should be larger than 0');
        var newSegmentData = /** @type {ol.interaction.SegmentDataType} */ ({
          depth: segmentData.depth,
          feature: segmentData.feature,
          geometry: segmentData.geometry,
          index: newIndex,
          segment: [newSegment[0].segment[0], newSegment[1].segment[1]]
        });
        this.rBush_.insert(ol.extent.boundingExtent(newSegmentData.segment),
            newSegmentData);
        this.updateSegmentIndices_(geometry, index, segmentData.depth, -1);

        if (this.vertexFeature_) {
          this.overlay_.getSource().removeFeature(this.vertexFeature_);
          this.vertexFeature_ = null;
        }
      }
    }
  }
  return true;
};


/**
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {Array} coordinates Coordinates.
 * @private
 */
ol.interaction.Modify.prototype.setGeometryCoordinates_ =
    function(geometry, coordinates) {
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
        goog.array.equals(
            /** @type {null|{length: number}} */ (segmentDataMatch.depth),
            depth)) &&
        segmentDataMatch.index > index) {
      segmentDataMatch.index += delta;
    }
  });
};


/**
 * @return {ol.style.StyleFunction} Styles.
 */
ol.interaction.Modify.getDefaultStyleFunction = function() {
  var style = ol.style.createDefaultEditingStyles();
  return function(feature, resolution) {
    return style[ol.geom.GeometryType.POINT];
  };
};
