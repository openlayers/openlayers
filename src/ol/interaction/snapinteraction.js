goog.provide('ol.interaction.Snap');
goog.provide('ol.interaction.SnapProperty');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.CollectionEvent');
goog.require('ol.CollectionEventType');
goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.Object');
goog.require('ol.Observable');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');
goog.require('ol.interaction.Pointer');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEvent');
goog.require('ol.source.VectorEventType');
goog.require('ol.structs.RBush');



/**
 * @classdesc
 * Handles snapping of vector features while modifying or drawing them.  The
 * features can come from a {@link ol.source.Vector} or {@link ol.Collection}
 * Any interaction object that allows the user to interact
 * with the features using the mouse can benefit from the snapping, as long
 * as it is added before.
 *
 * The snap interaction modifies map browser event `coordinate` and `pixel`
 * properties to force the snap to occur to any interaction that them.
 *
 * Example:
 *
 *     var snap = new ol.interaction.Snap({
 *       source: source
 *     });
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.SnapOptions=} opt_options Options.
 * @api
 */
ol.interaction.Snap = function(opt_options) {

  goog.base(this, {
    handleEvent: ol.interaction.Snap.handleEvent_,
    handleDownEvent: goog.functions.TRUE,
    handleUpEvent: ol.interaction.Snap.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

  /**
   * @type {ol.source.Vector}
   * @private
   */
  this.source_ = options.source ? options.source : null;

  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features ? options.features : null;

  /**
   * @type {Array.<goog.events.Key>}
   * @private
   */
  this.featuresListenerKeys_ = [];

  /**
   * @type {Object.<number, goog.events.Key>}
   * @private
   */
  this.geometryChangeListenerKeys_ = {};

  /**
   * @type {Object.<number, goog.events.Key>}
   * @private
   */
  this.geometryModifyListenerKeys_ = {};

  /**
   * Extents are preserved so indexed segment can be quickly removed
   * when its feature geometry changes
   * @type {Object.<number, ol.Extent>}
   * @private
   */
  this.indexedFeaturesExtents_ = {};

  /**
   * If a feature geometry changes while a pointer drag|move event occurs, the
   * feature doesn't get updated right away.  It will be at the next 'pointerup'
   * event fired.
   * @type {Object.<number, ol.Feature>}
   * @private
   */
  this.pendingFeatures_ = {};

  /**
   * Used for distance sorting in sortByDistance_
   * @type {ol.Coordinate}
   * @private
   */
  this.pixelCoordinate_ = null;

  /**
   * @type {number}
   * @private
   */
  this.pixelTolerance_ = options.pixelTolerance !== undefined ?
      options.pixelTolerance : 10;

  /**
   * @type {function(ol.interaction.Snap.SegmentDataType, ol.interaction.Snap.SegmentDataType): number}
   * @private
   */
  this.sortByDistance_ = goog.bind(ol.interaction.Snap.sortByDistance, this);


  /**
  * Segment RTree for each layer
  * @type {ol.structs.RBush.<ol.interaction.Snap.SegmentDataType>}
  * @private
  */
  this.rBush_ = new ol.structs.RBush();


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
};
goog.inherits(ol.interaction.Snap, ol.interaction.Pointer);


/**
 * Add a feature to the collection of features that we may snap to.
 * @param {ol.Feature} feature Feature.
 * @param {boolean=} opt_listen Whether to listen to the geometry change or not
 *     Defaults to `true`.
 * @api
 */
ol.interaction.Snap.prototype.addFeature = function(feature, opt_listen) {
  var listen = opt_listen !== undefined ? opt_listen : true;
  var geometry = feature.getGeometry();
  var segmentWriter = this.SEGMENT_WRITERS_[geometry.getType()];
  if (segmentWriter) {
    var feature_uid = goog.getUid(feature);
    this.indexedFeaturesExtents_[feature_uid] = geometry.getExtent(
        ol.extent.createEmpty());
    segmentWriter.call(this, feature, geometry);

    if (listen) {
      this.geometryModifyListenerKeys_[feature_uid] = geometry.on(
          goog.events.EventType.CHANGE,
          goog.bind(this.handleGeometryModify_, this, feature),
          this);
      this.geometryChangeListenerKeys_[feature_uid] = feature.on(
          ol.Object.getChangeEventType(feature.getGeometryName()),
          this.handleGeometryChange_, this);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.interaction.Snap.prototype.forEachFeatureAdd_ = function(feature) {
  this.addFeature(feature);
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.interaction.Snap.prototype.forEachFeatureRemove_ = function(feature) {
  this.removeFeature(feature);
};


/**
 * @return {ol.Collection.<ol.Feature>|Array.<ol.Feature>}
 * @private
 */
ol.interaction.Snap.prototype.getFeatures_ = function() {
  var features;
  if (this.features_) {
    features = this.features_;
  } else if (this.source_) {
    features = this.source_.getFeatures();
  }
  goog.asserts.assert(features !== undefined, 'features should be defined');
  return features;
};


/**
 * @param {ol.source.VectorEvent|ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleFeatureAdd_ = function(evt) {
  var feature;
  if (evt instanceof ol.source.VectorEvent) {
    feature = evt.feature;
  } else if (evt instanceof ol.CollectionEvent) {
    feature = evt.element;
  }
  goog.asserts.assertInstanceof(feature, ol.Feature,
      'feature should be an ol.Feature');
  this.addFeature(feature);
};


/**
 * @param {ol.source.VectorEvent|ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleFeatureRemove_ = function(evt) {
  var feature;
  if (evt instanceof ol.source.VectorEvent) {
    feature = evt.feature;
  } else if (evt instanceof ol.CollectionEvent) {
    feature = evt.element;
  }
  goog.asserts.assertInstanceof(feature, ol.Feature,
      'feature should be an ol.Feature');
  this.removeFeature(feature);
};


/**
 * @param {goog.events.Event} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleGeometryChange_ = function(evt) {
  var feature = evt.currentTarget;
  goog.asserts.assertInstanceof(feature, ol.Feature);
  this.removeFeature(feature, true);
  this.addFeature(feature, true);
};


/**
 * @param {ol.Feature} feature Feature which geometry was modified.
 * @param {goog.events.Event} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleGeometryModify_ = function(feature, evt) {
  if (this.handlingDownUpSequence) {
    var uid = goog.getUid(feature);
    if (!(uid in this.pendingFeatures_)) {
      this.pendingFeatures_[uid] = feature;
    }
  } else {
    this.updateFeature_(feature);
  }
};


/**
 * Remove a feature from the collection of features that we may snap to.
 * @param {ol.Feature} feature Feature
 * @param {boolean=} opt_unlisten Whether to unlisten to the geometry change
 *     or not. Defaults to `true`.
 * @api
 */
ol.interaction.Snap.prototype.removeFeature = function(feature, opt_unlisten) {
  var unlisten = opt_unlisten !== undefined ? opt_unlisten : true;
  var feature_uid = goog.getUid(feature);
  var extent = this.indexedFeaturesExtents_[feature_uid];
  if (extent) {
    var rBush = this.rBush_;
    var i, nodesToRemove = [];
    rBush.forEachInExtent(extent, function(node) {
      if (feature === node.feature) {
        nodesToRemove.push(node);
      }
    });
    for (i = nodesToRemove.length - 1; i >= 0; --i) {
      rBush.remove(nodesToRemove[i]);
    }
    if (unlisten) {
      ol.Observable.unByKey(this.geometryModifyListenerKeys_[feature_uid]);
      delete this.geometryModifyListenerKeys_[feature_uid];

      ol.Observable.unByKey(this.geometryChangeListenerKeys_[feature_uid]);
      delete this.geometryChangeListenerKeys_[feature_uid];
    }
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Snap.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  var keys = this.featuresListenerKeys_;
  var features = this.getFeatures_();

  if (currentMap) {
    keys.forEach(ol.Observable.unByKey);
    keys.length = 0;
    features.forEach(this.forEachFeatureRemove_, this);
  }

  goog.base(this, 'setMap', map);

  if (map) {
    if (this.features_) {
      keys.push(this.features_.on(ol.CollectionEventType.ADD,
          this.handleFeatureAdd_, this));
      keys.push(this.features_.on(ol.CollectionEventType.REMOVE,
          this.handleFeatureRemove_, this));
    } else if (this.source_) {
      keys.push(this.source_.on(ol.source.VectorEventType.ADDFEATURE,
          this.handleFeatureAdd_, this));
      keys.push(this.source_.on(ol.source.VectorEventType.REMOVEFEATURE,
          this.handleFeatureRemove_, this));
    }
    features.forEach(this.forEachFeatureAdd_, this);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Snap.prototype.shouldStopEvent = goog.functions.FALSE;


/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.Coordinate} pixelCoordinate Coordinate
 * @param {ol.Map} map Map.
 * @return {ol.interaction.Snap.ResultType} Snap result
 */
ol.interaction.Snap.prototype.snapTo = function(pixel, pixelCoordinate, map) {

  var lowerLeft = map.getCoordinateFromPixel(
      [pixel[0] - this.pixelTolerance_, pixel[1] + this.pixelTolerance_]);
  var upperRight = map.getCoordinateFromPixel(
      [pixel[0] + this.pixelTolerance_, pixel[1] - this.pixelTolerance_]);
  var box = ol.extent.boundingExtent([lowerLeft, upperRight]);

  var segments = this.rBush_.getInExtent(box);
  var snappedToVertex = false;
  var snapped = false;
  var vertex = null;
  var vertexPixel = null;
  if (segments.length > 0) {
    this.pixelCoordinate_ = pixelCoordinate;
    segments.sort(this.sortByDistance_);
    var closestSegment = segments[0].segment;
    vertex = (ol.coordinate.closestOnSegment(pixelCoordinate,
        closestSegment));
    vertexPixel = map.getPixelFromCoordinate(vertex);
    if (Math.sqrt(ol.coordinate.squaredDistance(pixel, vertexPixel)) <=
        this.pixelTolerance_) {
      snapped = true;
      var pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
      var pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
      var squaredDist1 = ol.coordinate.squaredDistance(vertexPixel, pixel1);
      var squaredDist2 = ol.coordinate.squaredDistance(vertexPixel, pixel2);
      var dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
      snappedToVertex = dist <= this.pixelTolerance_;
      if (snappedToVertex) {
        vertex = squaredDist1 > squaredDist2 ?
            closestSegment[1] : closestSegment[0];
        vertexPixel = map.getPixelFromCoordinate(vertex);
        vertexPixel = [Math.round(vertexPixel[0]), Math.round(vertexPixel[1])];
      }
    }
  }
  return /** @type {ol.interaction.Snap.ResultType} */ ({
    snapped: snapped,
    vertex: vertex,
    vertexPixel: vertexPixel
  });
};


/**
 * @param {ol.Feature} feature Feature
 * @private
 */
ol.interaction.Snap.prototype.updateFeature_ = function(feature) {
  this.removeFeature(feature, false);
  this.addFeature(feature, false);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @private
 */
ol.interaction.Snap.prototype.writeGeometryCollectionGeometry_ =
    function(feature, geometry) {
  var i, geometries = geometry.getGeometriesArray();
  for (i = 0; i < geometries.length; ++i) {
    this.SEGMENT_WRITERS_[geometries[i].getType()].call(
        this, feature, geometries[i]);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.LineString} geometry Geometry.
 * @private
 */
ol.interaction.Snap.prototype.writeLineStringGeometry_ =
    function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var i, ii, segment, segmentData;
  for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    segment = coordinates.slice(i, i + 2);
    segmentData = /** @type {ol.interaction.Snap.SegmentDataType} */ ({
      feature: feature,
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
ol.interaction.Snap.prototype.writeMultiLineStringGeometry_ =
    function(feature, geometry) {
  var lines = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = lines.length; j < jj; ++j) {
    coordinates = lines[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.interaction.Snap.SegmentDataType} */ ({
        feature: feature,
        segment: segment
      });
      this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPoint} geometry Geometry.
 * @private
 */
ol.interaction.Snap.prototype.writeMultiPointGeometry_ =
    function(feature, geometry) {
  var points = geometry.getCoordinates();
  var coordinates, i, ii, segmentData;
  for (i = 0, ii = points.length; i < ii; ++i) {
    coordinates = points[i];
    segmentData = /** @type {ol.interaction.Snap.SegmentDataType} */ ({
      feature: feature,
      segment: [coordinates, coordinates]
    });
    this.rBush_.insert(geometry.getExtent(), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @private
 */
ol.interaction.Snap.prototype.writeMultiPolygonGeometry_ =
    function(feature, geometry) {
  var polygons = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, k, kk, rings, segment, segmentData;
  for (k = 0, kk = polygons.length; k < kk; ++k) {
    rings = polygons[k];
    for (j = 0, jj = rings.length; j < jj; ++j) {
      coordinates = rings[j];
      for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        segment = coordinates.slice(i, i + 2);
        segmentData = /** @type {ol.interaction.Snap.SegmentDataType} */ ({
          feature: feature,
          segment: segment
        });
        this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
      }
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Point} geometry Geometry.
 * @private
 */
ol.interaction.Snap.prototype.writePointGeometry_ =
    function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var segmentData = /** @type {ol.interaction.Snap.SegmentDataType} */ ({
    feature: feature,
    segment: [coordinates, coordinates]
  });
  this.rBush_.insert(geometry.getExtent(), segmentData);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Polygon} geometry Geometry.
 * @private
 */
ol.interaction.Snap.prototype.writePolygonGeometry_ =
    function(feature, geometry) {
  var rings = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = rings.length; j < jj; ++j) {
    coordinates = rings[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.interaction.Snap.SegmentDataType} */ ({
        feature: feature,
        segment: segment
      });
      this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @typedef {{
 *     snapped: {boolean},
 *     vertex: (ol.Coordinate|null),
 *     vertexPixel: (ol.Pixel|null)
 * }}
 */
ol.interaction.Snap.ResultType;


/**
 * @typedef {{
 *     feature: ol.Feature,
 *     segment: Array.<ol.Coordinate>
 * }}
 */
ol.interaction.Snap.SegmentDataType;


/**
 * Handle all pointer events events.
 * @param {ol.MapBrowserEvent} evt A move event.
 * @return {boolean} Pass the event to other interactions.
 * @this {ol.interaction.Snap}
 * @private
 */
ol.interaction.Snap.handleEvent_ = function(evt) {
  var result = this.snapTo(evt.pixel, evt.coordinate, evt.map);
  if (result.snapped) {
    evt.coordinate = result.vertex.slice(0, 2);
    evt.pixel = result.vertexPixel;
  }
  return ol.interaction.Pointer.handleEvent.call(this, evt);
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Snap}
 * @private
 */
ol.interaction.Snap.handleUpEvent_ = function(evt) {
  var featuresToUpdate = goog.object.getValues(this.pendingFeatures_);
  if (featuresToUpdate.length) {
    featuresToUpdate.forEach(this.updateFeature_, this);
    this.pendingFeatures_ = {};
  }
  return false;
};


/**
 * Sort segments by distance, helper function
 * @param {ol.interaction.Snap.SegmentDataType} a
 * @param {ol.interaction.Snap.SegmentDataType} b
 * @return {number}
 * @this {ol.interaction.Snap}
 */
ol.interaction.Snap.sortByDistance = function(a, b) {
  return ol.coordinate.squaredDistanceToSegment(
      this.pixelCoordinate_, a.segment) -
      ol.coordinate.squaredDistanceToSegment(
      this.pixelCoordinate_, b.segment);
};
