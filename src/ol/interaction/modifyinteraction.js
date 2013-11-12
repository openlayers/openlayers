goog.provide('ol.interaction.Modify');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Drag');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorEventType');
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.source.Vector');
goog.require('ol.structs.RTree');


/**
 * @typedef {{feature: ol.Feature,
 *            geometry: ol.geom.Geometry,
 *            index: (number|undefined),
 *            style: ol.style.Style,
 *            segment: (Array.<ol.Extent>|undefined)}}
 */
ol.interaction.SegmentDataType;



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ModifyOptions=} opt_options Options.
 */
ol.interaction.Modify = function(opt_options) {
  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  var layerFilter = options.layers;
  if (!goog.isDef(layerFilter)) {
    layerFilter = goog.functions.TRUE;
  } else if (goog.isArray(layerFilter)) {
    layerFilter = function(layer) {return options.layers.indexOf(layer) > -1;};
  }

  /**
   * @type {null|function(ol.layer.Layer):boolean}
   * @private
   */
  this.layerFilter_ = goog.isDef(layerFilter) ? layerFilter : null;

  /**
   * Temporary sketch layer.
   * @type {ol.layer.Vector}
   * @private
   */
  this.sketchLayer_ = null;

  /**
   * Editing vertex.
   * @type {ol.Feature}
   * @private
   */
  this.vertexFeature_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.modifiable_ = false;

  /**
   * Segment RTree for each layer
   * @type {Object.<*, ol.structs.RTree>}
   * @private
   */
  this.rTree_ = null;

  /**
   * @type {number}
   * @private
   */
  this.pixelTolerance_ = goog.isDef(options.pixelTolerance) ?
      options.pixelTolerance : 20;

  /**
   * @type {Array}
   * @private
   */
  this.dragSegments_ = null;

  this.interactingHint = 0;
};
goog.inherits(ol.interaction.Modify, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.setMap = function(map) {
  var oldMap = this.getMap();
  var layers;
  if (!goog.isNull(oldMap)) {
    oldMap.removeLayer(this.sketchLayer_);
    layers = oldMap.getLayerGroup().getLayers();
    goog.asserts.assert(goog.isDef(layers));
    layers.forEach(goog.bind(this.removeLayer, this));
    layers.unlisten(ol.CollectionEventType.ADD, this.handleLayerAdded_, false,
        this);
    layers.unlisten(ol.CollectionEventType.REMOVE, this.handleLayerRemoved_,
        false, this);
  }

  if (!goog.isNull(map)) {
    if (goog.isNull(this.rTree_)) {
      this.rTree_ = new ol.structs.RTree();
    }
    if (goog.isNull(this.sketchLayer_)) {
      var sketchLayer = new ol.layer.Vector({
        source: new ol.source.Vector({parser: null})
      });
      this.sketchLayer_ = sketchLayer;
      sketchLayer.setTemporary(true);
      map.addLayer(sketchLayer);
    }
    layers = map.getLayerGroup().getLayers();
    goog.asserts.assert(goog.isDef(layers));
    layers.forEach(goog.bind(this.addLayer, this));
    layers.listen(ol.CollectionEventType.ADD, this.handleLayerAdded_, false,
        this);
    layers.listen(ol.CollectionEventType.REMOVE, this.handleLayerRemoved_,
        false, this);
  } else {
    // removing from a map, clean up
    this.rTree_ = null;
    this.sketchLayer_ = null;
  }

  goog.base(this, 'setMap', map);
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleLayerAdded_ = function(evt) {
  goog.asserts.assertInstanceof(evt.getElement, ol.layer.Layer);
  this.addLayer(evt.getElement);
};


/**
 * Add a layer for modification.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.interaction.Modify.prototype.addLayer = function(layer) {
  if (this.layerFilter_(layer) && layer instanceof ol.layer.Vector &&
      !layer.getTemporary()) {
    this.addIndex_(layer.getFeatures(ol.layer.Vector.selectedFeaturesFilter),
        layer);
    goog.events.listen(layer, ol.layer.VectorEventType.INTENTCHANGE,
        this.handleIntentChange_, false, this);
  }
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleLayerRemoved_ = function(evt) {
  goog.asserts.assertInstanceof(evt.getElement, ol.layer.Layer);
  this.removeLayer(evt.getElement());
};


/**
 * Remove a layer for modification.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.interaction.Modify.prototype.removeLayer = function(layer) {
  if (this.layerFilter_(layer) && layer instanceof ol.layer.Vector &&
      !layer.getTemporary()) {
    this.removeIndex_(
        layer.getFeatures(ol.layer.Vector.selectedFeaturesFilter));
    goog.events.unlisten(layer, ol.layer.VectorEventType.INTENTCHANGE,
        this.handleIntentChange_, false, this);
  }
};


/**
 * @param {Array.<ol.Feature>} features Array of features.
 * @param {ol.layer.Vector} layer Layer the features belong to.
 * @private
 */
ol.interaction.Modify.prototype.addIndex_ = function(features, layer) {
  for (var i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    var geometry = feature.getGeometry();
    if (geometry instanceof ol.geom.AbstractCollection) {
      var components = geometry.getComponents();
      for (var j = 0, jj = components.length; j < jj; ++j) {
        this.addSegments_(feature, components[j], layer);
      }
    } else {
      this.addSegments_(feature, geometry, layer);
    }
  }
};


/**
 * @param {Array.<ol.Feature>} features Array of features.
 * @private
 */
ol.interaction.Modify.prototype.removeIndex_ = function(features) {
  var rTree = this.rTree_;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    var segmentDataMatches = rTree.search(feature.getGeometry().getBounds(),
        goog.getUid(feature));
    for (var j = segmentDataMatches.length - 1; j >= 0; --j) {
      var segmentDataMatch = segmentDataMatches[j];
      rTree.remove(ol.extent.boundingExtent(segmentDataMatch.segment),
          segmentDataMatch);
    }
  }
};


/**
 * Listen for feature additions.
 * @param {ol.layer.VectorEvent} evt Event object.
 * @private
 */
ol.interaction.Modify.prototype.handleIntentChange_ = function(evt) {
  var layer = evt.target;
  goog.asserts.assertInstanceof(layer, ol.layer.Vector);
  var features = evt.features;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    var renderIntent = feature.getRenderIntent();
    if (renderIntent == ol.layer.VectorLayerRenderIntent.SELECTED) {
      this.addIndex_([feature], layer);
    } else {
      this.removeIndex_([feature]);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature to add segments for.
 * @param {ol.geom.Geometry} geometry Geometry to add segments for.
 * @param {ol.layer.Vector} layer Vector layer to add segments for.
 * @private
 */
ol.interaction.Modify.prototype.addSegments_ =
    function(feature, geometry, layer) {
  var uid = goog.getUid(feature);
  var rTree = this.rTree_;
  var segment, segmentData, coordinates;
  if (geometry instanceof ol.geom.Point) {
    segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
      feature: feature,
      geometry: geometry,
      style: layer.getStyle()
    });
    rTree.insert(geometry.getBounds(), segmentData, uid);
  } else if (geometry instanceof ol.geom.LineString ||
      geometry instanceof ol.geom.LinearRing) {
    coordinates = geometry.getCoordinates();
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
        feature: feature,
        geometry: geometry,
        index: i,
        style: layer.getStyle(),
        segment: segment
      });
      rTree.insert(ol.extent.boundingExtent(segment), segmentData, uid);
    }
  } else if (geometry instanceof ol.geom.Polygon) {
    var rings = geometry.getRings();
    for (var j = 0, jj = rings.length; j < jj; ++j) {
      this.addSegments_(feature, rings[j], layer);
    }
  }
};


/**
 * @param {ol.style.Style} style Style of the layer that the feature being
 *     modified belongs to.
 * @param {ol.Coordinate} coordinates Coordinates.
 * @return {ol.Feature} Vertex feature.
 * @private
 */
ol.interaction.Modify.prototype.createOrUpdateVertexFeature_ =
    function(style, coordinates) {
  var vertexFeature = this.vertexFeature_;
  if (goog.isNull(vertexFeature)) {
    vertexFeature = new ol.Feature({g: new ol.geom.Point(coordinates)});
    this.vertexFeature_ = vertexFeature;
    this.sketchLayer_.addFeatures([vertexFeature]);
  } else {
    var geometry = vertexFeature.getGeometry();
    geometry.setCoordinates(coordinates);
  }
  if (this.sketchLayer_.getStyle() !== style) {
    this.sketchLayer_.setStyle(style);
  }
  return vertexFeature;
};


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.handleDragStart = function(evt) {
  this.dragSegments_ = [];
  var vertexFeature = this.vertexFeature_;
  var renderIntent = vertexFeature.getRenderIntent();
  if (goog.isDef(vertexFeature) &&
      renderIntent != ol.layer.VectorLayerRenderIntent.HIDDEN) {
    var insertVertices = [];
    var vertex = vertexFeature.getGeometry().getCoordinates();
    var vertexExtent = ol.extent.boundingExtent([vertex]);
    var segmentDataMatches = this.rTree_.search(vertexExtent);
    var distinctFeatures = {};
    for (var i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
      var segmentDataMatch = segmentDataMatches[i];
      var segment = segmentDataMatch.segment;
      if (!(goog.getUid(segmentDataMatch.feature) in distinctFeatures)) {
        var feature = segmentDataMatch.feature;
        distinctFeatures[goog.getUid(feature)] = true;
        var original = new ol.Feature(feature.getAttributes());
        original.setGeometry(feature.getGeometry().clone());
        original.setId(feature.getId());
        original.setOriginal(feature.getOriginal());
        original.setSymbolizers(feature.getSymbolizers());
        feature.setOriginal(original);
      }
      if (renderIntent == ol.layer.VectorLayerRenderIntent.TEMPORARY) {
        if (ol.coordinate.equals(segment[0], vertex)) {
          this.dragSegments_.push([segmentDataMatch, 0]);
        } else if (ol.coordinate.equals(segment[1], vertex)) {
          this.dragSegments_.push([segmentDataMatch, 1]);
        }
      } else if (
          ol.coordinate.squaredDistanceToSegment(vertex, segment) === 0) {
        insertVertices.push([segmentDataMatch, vertex]);
      }
    }
    for (i = insertVertices.length - 1; i >= 0; --i) {
      this.insertVertex_.apply(this, insertVertices[i]);
    }
  }
  return this.modifiable_;
};


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.handleDrag = function(evt) {
  var vertex = evt.getCoordinate();
  for (var i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
    var dragSegment = this.dragSegments_[i];
    var segmentData = dragSegment[0];
    var feature = segmentData.feature;
    var geometry = segmentData.geometry;
    var coordinates = geometry.getCoordinates();

    var oldBounds, newBounds;
    if (geometry instanceof ol.geom.Point) {
      oldBounds = geometry.getBounds();
      geometry.setCoordinates(vertex);
      newBounds = geometry.getBounds();
    } else {
      var index = dragSegment[1];
      coordinates[segmentData.index + index] = vertex;
      geometry.setCoordinates(coordinates);
      var segment = segmentData.segment;
      oldBounds = ol.extent.boundingExtent(segment);
      segment[index] = vertex;
      newBounds = ol.extent.boundingExtent(segment);
    }
    this.createOrUpdateVertexFeature_(segmentData.style, vertex);
    this.rTree_.remove(oldBounds, segmentData);
    this.rTree_.insert(newBounds, segmentData, goog.getUid(feature));
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (!mapBrowserEvent.map.getView().getHints()[ol.ViewHint.INTERACTING] &&
      !this.getDragging() &&
      mapBrowserEvent.type == ol.MapBrowserEvent.EventType.MOUSEMOVE) {
    this.handleMouseMove_(mapBrowserEvent);
  }
  goog.base(this, 'handleMapBrowserEvent', mapBrowserEvent);
  return !this.modifiable_;
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleMouseMove_ = function(evt) {
  var map = evt.map;
  var pixel = evt.getPixel();
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

  this.modifiable_ = false;
  var vertexFeature = this.vertexFeature_;
  var rTree = this.rTree_;
  var segmentDataMatches = rTree.search(box);
  var renderIntent = ol.layer.VectorLayerRenderIntent.HIDDEN;
  if (segmentDataMatches.length > 0) {
    segmentDataMatches.sort(sortByDistance);
    var segmentDataMatch = segmentDataMatches[0];
    var segment = segmentDataMatch.segment; // the closest segment
    var vertex = (ol.coordinate.closestOnSegment(pixelCoordinate, segment));
    var vertexPixel = map.getPixelFromCoordinate(vertex);
    if (Math.sqrt(ol.coordinate.squaredDistance(pixel, vertexPixel)) <=
        this.pixelTolerance_) {
      var pixel1 = map.getPixelFromCoordinate(segment[0]);
      var pixel2 = map.getPixelFromCoordinate(segment[1]);
      var squaredDist1 = ol.coordinate.squaredDistance(vertexPixel, pixel1);
      var squaredDist2 = ol.coordinate.squaredDistance(vertexPixel, pixel2);
      var dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
      renderIntent = ol.layer.VectorLayerRenderIntent.FUTURE;
      if (dist <= 10) {
        vertex = squaredDist1 > squaredDist2 ? segment[1] : segment[0];
        renderIntent = ol.layer.VectorLayerRenderIntent.TEMPORARY;
      }
      vertexFeature = this.createOrUpdateVertexFeature_(segmentDataMatch.style,
          vertex);
      this.modifiable_ = true;
    }
  }

  if (!goog.isNull(vertexFeature) &&
      renderIntent != vertexFeature.getRenderIntent()) {
    vertexFeature.setRenderIntent(renderIntent);
  }
};


/**
 * @param {ol.interaction.SegmentDataType} segmentData Segment data.
 * @param {ol.Coordinate} vertex Vertex.
 * @private
 */
ol.interaction.Modify.prototype.insertVertex_ =
    function(segmentData, vertex) {
  var segment = segmentData.segment;
  var feature = segmentData.feature;
  var geometry = segmentData.geometry;
  var index = segmentData.index;
  var coordinates = geometry.getCoordinates();
  coordinates.splice(index + 1, 0, vertex);
  geometry.setCoordinates(coordinates);
  var rTree = this.rTree_;
  goog.asserts.assert(goog.isDef(segment));
  rTree.remove(ol.extent.boundingExtent(segment), segmentData);
  var uid = goog.getUid(feature);
  var segmentDataMatches = this.rTree_.search(geometry.getBounds(), uid);
  for (var i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
    var segmentDataMatch = segmentDataMatches[i];
    if (segmentDataMatch.geometry === geometry &&
        segmentDataMatch.index > index) {
      ++segmentDataMatch.index;
    }
  }
  var newSegmentData = /** @type {ol.interaction.SegmentDataType} */ ({
    style: segmentData.style,
    segment: [segment[0], vertex],
    feature: feature,
    geometry: geometry,
    index: index
  });
  rTree.insert(ol.extent.boundingExtent(newSegmentData.segment), newSegmentData,
      uid);
  this.dragSegments_.push([newSegmentData, 1]);
  newSegmentData = goog.object.clone(newSegmentData);
  newSegmentData.segment = [vertex, segment[1]];
  newSegmentData.index += 1;
  rTree.insert(ol.extent.boundingExtent(newSegmentData.segment), newSegmentData,
      uid);
  this.dragSegments_.push([newSegmentData, 0]);
};
