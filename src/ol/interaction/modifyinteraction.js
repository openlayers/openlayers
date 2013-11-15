goog.provide('ol.interaction.Modify');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.functions');
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
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('ol.structs.RBush');


/**
 * @typedef {{feature: ol.Feature,
 *            geometry: ol.geom.Geometry,
 *            index: (number|undefined),
 *            style: ol.style.Style,
 *            segment: Array.<ol.Extent>}}
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
  goog.asserts.assertFunction(layerFilter);

  /**
   * @type {function(ol.layer.Layer):boolean}
   * @private
   */
  this.layerFilter_ = layerFilter;

  /**
   * Layer lookup.  Keys source id to layer.
   * @type {Object.<number, ol.layer.Vector>}
   * @private
   */
  this.layerLookup_ = null;

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
   * Segment RBush for each layer
   * @type {Object.<*, ol.structs.RBush>}
   * @private
   */
  this.rBush_ = null;

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
    layers.forEach(goog.bind(this.removeLayer_, this));
    layers.unlisten(ol.CollectionEventType.ADD, this.handleLayerAdded_, false,
        this);
    layers.unlisten(ol.CollectionEventType.REMOVE, this.handleLayerRemoved_,
        false, this);
  }

  if (!goog.isNull(map)) {
    this.layerLookup_ = {};
    if (goog.isNull(this.rBush_)) {
      this.rBush_ = new ol.structs.RBush();
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
    layers.forEach(goog.bind(this.addLayer_, this));
    layers.listen(ol.CollectionEventType.ADD, this.handleLayerAdded_, false,
        this);
    layers.listen(ol.CollectionEventType.REMOVE, this.handleLayerRemoved_,
        false, this);
  } else {
    // removing from a map, clean up
    this.layerLookup_ = null;
    this.rBush_ = null;
    this.sketchLayer_ = null;
  }

  goog.base(this, 'setMap', map);
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleLayerAdded_ = function(evt) {
  var layer = evt.getElement();
  goog.asserts.assertInstanceof(layer, ol.layer.Layer);
  this.addLayer_(layer);
};


/**
 * Add a layer for modification.
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
ol.interaction.Modify.prototype.addLayer_ = function(layer) {
  if (this.layerFilter_(layer) && layer instanceof ol.layer.Vector &&
      !layer.getTemporary()) {
    var source = layer.getVectorSource();
    this.layerLookup_[goog.getUid(source)] = layer;
    this.addIndex_(source.getFeatures(ol.layer.Vector.selectedFeaturesFilter),
        layer);
    goog.events.listen(source, ol.source.VectorEventType.INTENTCHANGE,
        this.handleIntentChange_, false, this);
  }
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Modify.prototype.handleLayerRemoved_ = function(evt) {
  var layer = evt.getElement();
  goog.asserts.assertInstanceof(layer, ol.layer.Layer);
  this.removeLayer_(layer);
};


/**
 * Remove a layer for modification.
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
ol.interaction.Modify.prototype.removeLayer_ = function(layer) {
  if (this.layerFilter_(layer) && layer instanceof ol.layer.Vector &&
      !layer.getTemporary()) {
    var source = layer.getVectorSource();
    delete this.layerLookup_[goog.getUid(source)];
    this.removeIndex_(
        source.getFeatures(ol.layer.Vector.selectedFeaturesFilter));
    goog.events.unlisten(source, ol.source.VectorEventType.INTENTCHANGE,
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
  var rBush = this.rBush_;
  var i, feature, nodesToRemove;
  for (i = features.length - 1; i >= 0; --i) {
    feature = features[i];
    nodesToRemove = [];
    rBush.forEachInExtent(feature.getGeometry().getBounds(), function(node) {
      if (feature === node.feature) {
        nodesToRemove.push(node);
      }
    });
  }
  for (i = nodesToRemove.length - 1; i >= 0; --i) {
    rBush.remove(nodesToRemove[i]);
  }
};


/**
 * Listen for feature additions.
 * @param {ol.source.VectorEvent} evt Event object.
 * @private
 */
ol.interaction.Modify.prototype.handleIntentChange_ = function(evt) {
  var source = evt.target;
  goog.asserts.assertInstanceof(source, ol.source.Vector);
  var layer = this.layerLookup_[goog.getUid(source)];
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
  var rBush = this.rBush_;
  var segment, segmentData, coordinates;
  if (geometry instanceof ol.geom.Point) {
    coordinates = geometry.getCoordinates();
    segmentData = /** @type {ol.interaction.SegmentDataType} */ ({
      feature: feature,
      geometry: geometry,
      segment: [coordinates, coordinates],
      style: layer.getStyle()
    });
    rBush.insert(geometry.getBounds(), segmentData);
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
      rBush.insert(ol.extent.boundingExtent(segment), segmentData);
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
    this.sketchLayer_.getVectorSource().addFeatures([vertexFeature]);
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
  if (!goog.isNull(vertexFeature) && vertexFeature.getRenderIntent() !=
      ol.layer.VectorLayerRenderIntent.HIDDEN) {
    var renderIntent = vertexFeature.getRenderIntent();
    var insertVertices = [];
    var vertex = vertexFeature.getGeometry().getCoordinates();
    var vertexExtent = ol.extent.boundingExtent([vertex]);
    var distinctFeatures = {};
    var dragSegments = this.dragSegments_;
    this.rBush_.forEachInExtent(vertexExtent, function(node) {
      var segment = node.segment;
      if (!(goog.getUid(node.feature) in distinctFeatures)) {
        var feature = node.feature;
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
          dragSegments.push([node, 0]);
        } else if (ol.coordinate.equals(segment[1], vertex)) {
          dragSegments.push([node, 1]);
        }
      } else if (
          ol.coordinate.squaredDistanceToSegment(vertex, segment) === 0) {
        insertVertices.push([node, vertex]);
      }
    });
    for (var i = insertVertices.length - 1; i >= 0; --i) {
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
    var geometry = segmentData.geometry;
    var coordinates = geometry.getCoordinates();
    var segment = segmentData.segment;
    if (geometry instanceof ol.geom.Point) {
      coordinates = vertex;
      segment[0] = segment[1] = vertex;
    } else {
      var index = dragSegment[1];
      coordinates[segmentData.index + index] = vertex;
      segment[index] = vertex;
    }
    geometry.setCoordinates(coordinates);
    this.createOrUpdateVertexFeature_(segmentData.style, vertex);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.handleDragEnd = function(evt) {
  var segmentData;
  for (var i = this.dragSegments_.length - 1; i >= 0; --i) {
    segmentData = this.dragSegments_[i][0];
    this.rBush_.update(ol.extent.boundingExtent(segmentData.segment),
        segmentData);
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
  var rBush = this.rBush_;
  var nodes = rBush.getAllInExtent(box);
  var renderIntent = ol.layer.VectorLayerRenderIntent.HIDDEN;
  if (nodes.length > 0) {
    nodes.sort(sortByDistance);
    var node = nodes[0];
    var segment = node.segment; // the closest segment
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
      vertexFeature = this.createOrUpdateVertexFeature_(node.style, vertex);
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
  var rBush = this.rBush_;
  goog.asserts.assert(goog.isDef(segment));
  rBush.remove(segmentData);
  this.rBush_.forEachInExtent(geometry.getBounds(), function(node) {
    if (node.geometry === geometry && node.index > index) {
      ++node.index;
    }
  });
  var newSegmentData = /** @type {ol.interaction.SegmentDataType} */ ({
    style: segmentData.style,
    segment: [segment[0], vertex],
    feature: feature,
    geometry: geometry,
    index: index
  });
  rBush.insert(ol.extent.boundingExtent(newSegmentData.segment),
      newSegmentData);
  this.dragSegments_.push([newSegmentData, 1]);
  newSegmentData = /** @type {ol.interaction.SegmentDataType} */ ({
    style: segmentData.style,
    segment: [vertex, segment[1]],
    feature: feature,
    geometry: geometry,
    index: index + 1
  });
  rBush.insert(ol.extent.boundingExtent(newSegmentData.segment),
      newSegmentData);
  this.dragSegments_.push([newSegmentData, 0]);
};
