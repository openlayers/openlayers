goog.provide('ol.interaction.Snap');
goog.provide('ol.interaction.SnapProperty');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('ol.Collection');
goog.require('ol.CollectionEvent');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.Observable');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.interaction.Pointer');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEvent');
goog.require('ol.source.VectorEventType');
goog.require('ol.structs.RBush');



/**
 * @classdesc
 * Helper class for providing snap in ol.interaction.Pointer.
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
    handleDownEvent: ol.interaction.Snap.handleDownAndUpEvent,
    handleEvent: ol.interaction.Snap.handleEvent,
    handleUpEvent: ol.interaction.Snap.handleDownAndUpEvent
  });

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {?ol.source.Vector}
   * @private
   */
  this.source_ = goog.isDef(options.source) ? options.source : null;

  /**
   * @type {?ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = goog.isDef(options.features) ?
      goog.isArray(options.features) ?
          new ol.Collection(options.features) :
          options.features :
      null;

  var features;
  if (!goog.isNull(this.features_)) {
    features = this.features_;
  } else if (!goog.isNull(this.source_)) {
    features = this.source_.getFeatures();
  }
  goog.asserts.assert(goog.isDef(features));

  /**
   * @type {ol.Collection.<goog.events.Key>}
   * @private
   */
  this.featuresListenerKeys_ = new ol.Collection();

  /**
   * @type {number}
   * @private
   */
  this.pixelTolerance_ = goog.isDef(options.pixelTolerance) ?
      options.pixelTolerance : 10;


  /**
  * Segment RTree for each layer
  * @type {Object.<*, ol.structs.RBush>}
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


  features.forEach(this.addFeature, this);
};
goog.inherits(ol.interaction.Snap, ol.interaction.Pointer);


/**
 * @param {ol.Feature} feature Feature.
 * @api
 */
ol.interaction.Snap.prototype.addFeature = function(feature) {
  var geometry = feature.getGeometry();
  if (goog.isDef(this.SEGMENT_WRITERS_[geometry.getType()])) {
    this.SEGMENT_WRITERS_[geometry.getType()].call(this, feature, geometry);
  }
};
goog.exportProperty(
    ol.interaction.Snap.prototype,
    'addFeature',
    ol.interaction.Snap.prototype.addFeature);


/**
 * @inheritDoc
 */
ol.interaction.Snap.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  var keys = this.featuresListenerKeys_;
  var features = this.features_;
  var source = this.source_;

  if (currentMap) {
    keys.forEach(ol.Observable.unByKey, this);
    keys.clear();
  }

  goog.base(this, 'setMap', map);

  if (map) {
    if (!goog.isNull(features)) {
      keys.push(features.on(ol.CollectionEventType.ADD,
          this.handleFeatureAdd_, this));
      keys.push(features.on(ol.CollectionEventType.REMOVE,
          this.handleFeatureRemove_, this));
    } else if (!goog.isNull(source)) {
      keys.push(source.on(ol.source.VectorEventType.ADDFEATURE,
          this.handleFeatureAdd_, this));
      keys.push(source.on(ol.source.VectorEventType.REMOVEFEATURE,
          this.handleFeatureRemove_, this));
    }
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Snap}
 * @api
 */
ol.interaction.Snap.handleDownAndUpEvent = function(evt) {
  return this.handleEvent_(evt);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.Snap}
 * @api
 */
ol.interaction.Snap.handleEvent = function(mapBrowserEvent) {
  var pass = true;
  if (mapBrowserEvent.type === ol.MapBrowserEvent.EventType.POINTERMOVE) {
    pass = this.handleEvent_(mapBrowserEvent);
  }
  return ol.interaction.Pointer.handleEvent.call(this, mapBrowserEvent) && pass;
};


/**
 * Handle 'pointerdown', 'pointermove' and 'pointerup' events.
 * @param {ol.MapBrowserEvent} evt A move event.
 * @return {boolean} Pass the event to other interactions.
 * @private
 */
ol.interaction.Snap.prototype.handleEvent_ = function(evt) {
  var result = this.snapTo(evt.pixel, evt.coordinate, evt.map);
  if (result.snapped) {
    evt.coordinate = result.vertex;
    evt.pixel = result.vertexPixel;
  }
  return true;
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
  goog.asserts.assertInstanceof(feature, ol.Feature);
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
  goog.asserts.assertInstanceof(feature, ol.Feature);
  this.removeFeature(feature,
      feature.getGeometry().getExtent());
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
 * @param {ol.Extent} extent Extent.
 * @api
 */
ol.interaction.Snap.prototype.removeFeature = function(feature, extent) {
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
};
goog.exportProperty(
    ol.interaction.Snap.prototype,
    'removeFeature',
    ol.interaction.Snap.prototype.removeFeature);


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
    segments.sort(goog.partial(
        ol.interaction.Snap.sortByDistance, pixelCoordinate));
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
 * Sort segments by distance, helper function
 * @param {ol.Coordinate} pixelCoordinate Coordinate to determine distance
 * @param {ol.interaction.Snap.SegmentDataType} a
 * @param {ol.interaction.Snap.SegmentDataType} b
 * @return {number}
 */
ol.interaction.Snap.sortByDistance = function(pixelCoordinate, a, b) {
  return ol.coordinate.squaredDistanceToSegment(pixelCoordinate, a.segment) -
      ol.coordinate.squaredDistanceToSegment(pixelCoordinate, b.segment);
};


/**
 * @inheritDoc
 */
ol.interaction.Snap.prototype.shouldStopEvent = goog.functions.FALSE;


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
