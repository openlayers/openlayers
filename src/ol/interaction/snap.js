goog.provide('ol.interaction.Snap');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.Object');
goog.require('ol.Observable');
goog.require('ol.coordinate');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.interaction.Pointer');
goog.require('ol.functions');
goog.require('ol.obj');
goog.require('ol.source.Vector');
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

  ol.interaction.Pointer.call(this, {
    handleEvent: ol.interaction.Snap.handleEvent_,
    handleDownEvent: ol.functions.TRUE,
    handleUpEvent: ol.interaction.Snap.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

  /**
   * @type {ol.source.Vector}
   * @private
   */
  this.source_ = options.source ? options.source : null;

  /**
   * @private
   * @type {boolean}
   */
  this.vertex_ = options.vertex !== undefined ? options.vertex : true;

  /**
   * @private
   * @type {boolean}
   */
  this.edge_ = options.edge !== undefined ? options.edge : true;

  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features ? options.features : null;

  /**
   * @type {Array.<ol.EventsKey>}
   * @private
   */
  this.featuresListenerKeys_ = [];

  /**
   * @type {Object.<number, ol.EventsKey>}
   * @private
   */
  this.geometryChangeListenerKeys_ = {};

  /**
   * @type {Object.<number, ol.EventsKey>}
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
   * @type {function(ol.SnapSegmentDataType, ol.SnapSegmentDataType): number}
   * @private
   */
  this.sortByDistance_ = ol.interaction.Snap.sortByDistance.bind(this);


  /**
  * Segment RTree for each layer
  * @type {ol.structs.RBush.<ol.SnapSegmentDataType>}
  * @private
  */
  this.rBush_ = new ol.structs.RBush();


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
    'GeometryCollection': this.writeGeometryCollectionGeometry_
  };
};
ol.inherits(ol.interaction.Snap, ol.interaction.Pointer);


/**
 * Add a feature to the collection of features that we may snap to.
 * @param {ol.Feature} feature Feature.
 * @param {boolean=} opt_listen Whether to listen to the geometry change or not
 *     Defaults to `true`.
 * @api
 */
ol.interaction.Snap.prototype.addFeature = function(feature, opt_listen) {
  var listen = opt_listen !== undefined ? opt_listen : true;
  var feature_uid = ol.getUid(feature);
  var geometry = feature.getGeometry();
  if (geometry) {
    var segmentWriter = this.SEGMENT_WRITERS_[geometry.getType()];
    if (segmentWriter) {
      this.indexedFeaturesExtents_[feature_uid] = geometry.getExtent(
          ol.extent.createEmpty());
      segmentWriter.call(this, feature, geometry);

      if (listen) {
        this.geometryModifyListenerKeys_[feature_uid] = ol.events.listen(
            geometry,
            ol.events.EventType.CHANGE,
            this.handleGeometryModify_.bind(this, feature),
            this);
      }
    }
  }

  if (listen) {
    this.geometryChangeListenerKeys_[feature_uid] = ol.events.listen(
        feature,
        ol.Object.getChangeEventType(feature.getGeometryName()),
        this.handleGeometryChange_, this);
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
 * @return {ol.Collection.<ol.Feature>|Array.<ol.Feature>} Features.
 * @private
 */
ol.interaction.Snap.prototype.getFeatures_ = function() {
  var features;
  if (this.features_) {
    features = this.features_;
  } else if (this.source_) {
    features = this.source_.getFeatures();
  }
  return /** @type {!Array.<ol.Feature>|!ol.Collection.<ol.Feature>} */ (features);
};


/**
 * @param {ol.source.Vector.Event|ol.Collection.Event} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleFeatureAdd_ = function(evt) {
  var feature;
  if (evt instanceof ol.source.Vector.Event) {
    feature = evt.feature;
  } else if (evt instanceof ol.Collection.Event) {
    feature = evt.element;
  }
  this.addFeature(/** @type {ol.Feature} */ (feature));
};


/**
 * @param {ol.source.Vector.Event|ol.Collection.Event} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleFeatureRemove_ = function(evt) {
  var feature;
  if (evt instanceof ol.source.Vector.Event) {
    feature = evt.feature;
  } else if (evt instanceof ol.Collection.Event) {
    feature = evt.element;
  }
  this.removeFeature(/** @type {ol.Feature} */ (feature));
};


/**
 * @param {ol.events.Event} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleGeometryChange_ = function(evt) {
  var feature = /** @type {ol.Feature} */ (evt.target);
  this.removeFeature(feature, true);
  this.addFeature(feature, true);
};


/**
 * @param {ol.Feature} feature Feature which geometry was modified.
 * @param {ol.events.Event} evt Event.
 * @private
 */
ol.interaction.Snap.prototype.handleGeometryModify_ = function(feature, evt) {
  if (this.handlingDownUpSequence) {
    var uid = ol.getUid(feature);
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
  var feature_uid = ol.getUid(feature);
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
    }
  }

  if (unlisten) {
    ol.Observable.unByKey(this.geometryChangeListenerKeys_[feature_uid]);
    delete this.geometryChangeListenerKeys_[feature_uid];
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
  ol.interaction.Pointer.prototype.setMap.call(this, map);

  if (map) {
    if (this.features_) {
      keys.push(
        ol.events.listen(this.features_, ol.Collection.EventType.ADD,
            this.handleFeatureAdd_, this),
        ol.events.listen(this.features_, ol.Collection.EventType.REMOVE,
            this.handleFeatureRemove_, this)
      );
    } else if (this.source_) {
      keys.push(
        ol.events.listen(this.source_, ol.source.Vector.EventType.ADDFEATURE,
            this.handleFeatureAdd_, this),
        ol.events.listen(this.source_, ol.source.Vector.EventType.REMOVEFEATURE,
            this.handleFeatureRemove_, this)
      );
    }
    features.forEach(this.forEachFeatureAdd_, this);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Snap.prototype.shouldStopEvent = ol.functions.FALSE;


/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.Coordinate} pixelCoordinate Coordinate
 * @param {ol.Map} map Map.
 * @return {ol.SnapResultType} Snap result
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
  var dist, pixel1, pixel2, squaredDist1, squaredDist2;
  if (segments.length > 0) {
    this.pixelCoordinate_ = pixelCoordinate;
    segments.sort(this.sortByDistance_);
    var closestSegment = segments[0].segment;
    if (this.vertex_ && !this.edge_) {
      pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
      pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
      squaredDist1 = ol.coordinate.squaredDistance(pixel, pixel1);
      squaredDist2 = ol.coordinate.squaredDistance(pixel, pixel2);
      dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
      snappedToVertex = dist <= this.pixelTolerance_;
      if (snappedToVertex) {
        snapped = true;
        vertex = squaredDist1 > squaredDist2 ?
            closestSegment[1] : closestSegment[0];
        vertexPixel = map.getPixelFromCoordinate(vertex);
      }
    } else if (this.edge_) {
      vertex = (ol.coordinate.closestOnSegment(pixelCoordinate,
          closestSegment));
      vertexPixel = map.getPixelFromCoordinate(vertex);
      if (Math.sqrt(ol.coordinate.squaredDistance(pixel, vertexPixel)) <=
          this.pixelTolerance_) {
        snapped = true;
        if (this.vertex_) {
          pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
          pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
          squaredDist1 = ol.coordinate.squaredDistance(vertexPixel, pixel1);
          squaredDist2 = ol.coordinate.squaredDistance(vertexPixel, pixel2);
          dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
          snappedToVertex = dist <= this.pixelTolerance_;
          if (snappedToVertex) {
            vertex = squaredDist1 > squaredDist2 ?
                closestSegment[1] : closestSegment[0];
            vertexPixel = map.getPixelFromCoordinate(vertex);
          }
        }
      }
    }
    if (snapped) {
      vertexPixel = [Math.round(vertexPixel[0]), Math.round(vertexPixel[1])];
    }
  }
  return /** @type {ol.SnapResultType} */ ({
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
ol.interaction.Snap.prototype.writeGeometryCollectionGeometry_ = function(feature, geometry) {
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
ol.interaction.Snap.prototype.writeLineStringGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var i, ii, segment, segmentData;
  for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    segment = coordinates.slice(i, i + 2);
    segmentData = /** @type {ol.SnapSegmentDataType} */ ({
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
ol.interaction.Snap.prototype.writeMultiLineStringGeometry_ = function(feature, geometry) {
  var lines = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = lines.length; j < jj; ++j) {
    coordinates = lines[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.SnapSegmentDataType} */ ({
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
ol.interaction.Snap.prototype.writeMultiPointGeometry_ = function(feature, geometry) {
  var points = geometry.getCoordinates();
  var coordinates, i, ii, segmentData;
  for (i = 0, ii = points.length; i < ii; ++i) {
    coordinates = points[i];
    segmentData = /** @type {ol.SnapSegmentDataType} */ ({
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
ol.interaction.Snap.prototype.writeMultiPolygonGeometry_ = function(feature, geometry) {
  var polygons = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, k, kk, rings, segment, segmentData;
  for (k = 0, kk = polygons.length; k < kk; ++k) {
    rings = polygons[k];
    for (j = 0, jj = rings.length; j < jj; ++j) {
      coordinates = rings[j];
      for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        segment = coordinates.slice(i, i + 2);
        segmentData = /** @type {ol.SnapSegmentDataType} */ ({
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
ol.interaction.Snap.prototype.writePointGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var segmentData = /** @type {ol.SnapSegmentDataType} */ ({
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
ol.interaction.Snap.prototype.writePolygonGeometry_ = function(feature, geometry) {
  var rings = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = rings.length; j < jj; ++j) {
    coordinates = rings[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.SnapSegmentDataType} */ ({
        feature: feature,
        segment: segment
      });
      this.rBush_.insert(ol.extent.boundingExtent(segment), segmentData);
    }
  }
};


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
  var featuresToUpdate = ol.obj.getValues(this.pendingFeatures_);
  if (featuresToUpdate.length) {
    featuresToUpdate.forEach(this.updateFeature_, this);
    this.pendingFeatures_ = {};
  }
  return false;
};


/**
 * Sort segments by distance, helper function
 * @param {ol.SnapSegmentDataType} a The first segment data.
 * @param {ol.SnapSegmentDataType} b The second segment data.
 * @return {number} The difference in distance.
 * @this {ol.interaction.Snap}
 */
ol.interaction.Snap.sortByDistance = function(a, b) {
  return ol.coordinate.squaredDistanceToSegment(
      this.pixelCoordinate_, a.segment) -
      ol.coordinate.squaredDistanceToSegment(
      this.pixelCoordinate_, b.segment);
};
