goog.provide('ol.interaction.Modify');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.object');
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
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorLayerEventType');
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.structs.RTree');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ModifyOptions=} opt_options Options.
 */
ol.interaction.Modify = function(opt_options) {
  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {null|function(ol.layer.Layer):boolean}
   * @private
   */
  this.layerFilter_ = goog.isDef(options.layerFilter) ?
      options.layerFilter : null;

  /**
   * @type {Array.<ol.layer.Layer>}
   * @private
   */
  this.layers_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.modifiable_ = false;

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
  this.dragVertices_ = null;

  this.interactingHint = 0;
};
goog.inherits(ol.interaction.Modify, ol.interaction.Drag);


/**
 * @param {ol.layer.VectorLayerEventObject} evt Event object.
 */
ol.interaction.Modify.prototype.addIndex = function(evt) {
  var layer = evt.target;
  var features = evt.features;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    var geometry = feature.getGeometry();
    if (geometry instanceof ol.geom.AbstractCollection) {
      for (var j = 0, jj = geometry.components.length; j < jj; ++j) {
        this.addSegments_(layer, feature, geometry.components[j],
            [[geometry.components, j]]);
      }
    } else {
      this.addSegments_(layer, feature, geometry);
    }
  }
};


/**
 * @param {ol.layer.Layer} layer Layer.
 */
ol.interaction.Modify.prototype.addLayer = function(layer) {
  var selectionData = layer.getSelectionData();
  var selectionLayer = selectionData.layer;
  var editData = selectionLayer.getEditData();
  if (goog.isNull(editData.rTree)) {
    editData.rTree = new ol.structs.RTree();
    var vertexFeature = new ol.Feature();
    vertexFeature.renderIntent = ol.layer.VectorLayerRenderIntent.HIDDEN;
    vertexFeature.setGeometry(new ol.geom.Point([NaN, NaN]));
    selectionLayer.addFeatures([vertexFeature]);
    editData.vertexFeature = vertexFeature;
  }
  this.addIndex(/** @type {ol.layer.VectorLayerEventObject} */
      ({target: selectionLayer, features: goog.object.getValues(
          selectionData.selectedFeaturesByFeatureUid)}));
  goog.events.listen(selectionLayer, ol.layer.VectorLayerEventType.ADD,
      this.addIndex, false, this);
  goog.events.listen(selectionLayer, ol.layer.VectorLayerEventType.REMOVE,
      this.removeIndex, false, this);
};


/**
 * @param {ol.layer.Vector} selectionLayer Selection layer.
 * @param {ol.Feature} feature Feature to add segments for.
 * @param {ol.geom.Geometry} geometry Geometry to add segments for.
 * @param {Array=} opt_parent Parent structure on the feature that the geometry
 *     belongs to. This array has two values:
 *     [0] the parent array;
 *     [1] the index of the geometry in the parent array.
 * @private
 */
ol.interaction.Modify.prototype.addSegments_ =
    function(selectionLayer, feature, geometry, opt_parent) {
  var uid = goog.getUid(feature);
  var rTree = selectionLayer.getEditData().rTree;
  var vertex, segment, segmentData, coordinates;
  if (geometry instanceof ol.geom.Point) {
    vertex = geometry.getCoordinates();
    segmentData = [[vertex, vertex], feature, geometry, NaN];
    if (goog.isDef(opt_parent)) {
      segmentData.push(opt_parent);
    }
    rTree.insert(geometry.getBounds(), segmentData, uid);
  } else if (geometry instanceof ol.geom.LineString ||
      geometry instanceof ol.geom.LinearRing) {
    coordinates = geometry.getCoordinates();
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = [segment, feature, geometry, i];
      if (opt_parent) {
        segmentData.push(opt_parent);
      }
      rTree.insert(ol.extent.boundingExtent(segment), segmentData, uid);
    }
  } else if (geometry instanceof ol.geom.Polygon) {
    for (var j = 0, jj = geometry.rings.length; j < jj; ++j) {
      this.addSegments_(selectionLayer, feature, geometry.rings[j],
          [geometry.rings, j]);
    }
  }
};


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.handleDragStart = function(evt) {
  this.dragVertices_ = [];
  for (var i = 0, ii = this.layers_.length; i < ii; ++i) {
    var selectionData = this.layers_[i].getSelectionData();
    var selectionLayer = selectionData.layer;
    if (!goog.isNull(selectionLayer)) {
      var editData = selectionLayer.getEditData();
      var vertexFeature = editData.vertexFeature;
      if (!goog.isNull(vertexFeature) && vertexFeature.renderIntent !=
          ol.layer.VectorLayerRenderIntent.HIDDEN) {
        var vertex = vertexFeature.getGeometry().getCoordinates();
        var vertexExtent = ol.extent.boundingExtent([vertex]);
        var segments = editData.rTree.search(vertexExtent);
        for (var j = 0, jj = segments.length; j < jj; ++j) {
          var segmentData = segments[j];
          var segment = segmentData[0];
          if (vertexFeature.renderIntent ==
              ol.layer.VectorLayerRenderIntent.TEMPORARY) {
            if (ol.coordinate.equals(segment[0], vertex)) {
              this.dragVertices_.push([selectionLayer, segmentData, 0]);
            } else {
              this.dragVertices_.push([selectionLayer, segmentData, 1]);
            }
          } else {
            this.insertVertex_(selectionLayer, segmentData, vertex);
          }
        }
      }
    }
  }
  return this.modifiable_;
};


/**
 * @inheritDoc
 */
ol.interaction.Modify.prototype.handleDrag = function(evt) {
  var vertex = evt.getCoordinate();
  for (var i = 0, ii = this.dragVertices_.length; i < ii; ++i) {
    var dragVertex = this.dragVertices_[i];
    var selectionLayer = dragVertex[0];
    var segmentData = dragVertex[1];
    var feature = segmentData[1];
    var geometry = segmentData[2];
    var index = dragVertex[2];
    geometry.set(segmentData[3] + index, 0, vertex[0]);
    geometry.set(segmentData[3] + index, 1, vertex[1]);
    feature.getGeometry().invalidateBounds();

    var editData = selectionLayer.getEditData();
    var vertexFeature = editData.vertexFeature;
    var vertexGeometry = vertexFeature.getGeometry();
    var segment = segmentData[0];
    editData.rTree.remove(ol.extent.boundingExtent(segment), segmentData);
    segment[index] = vertex;
    vertexGeometry.set(0, vertex[0]);
    vertexGeometry.set(1, vertex[1]);
    editData.rTree.insert(ol.extent.boundingExtent(segment), segmentData,
        goog.getUid(feature));

    selectionLayer.updateFeatures([feature, vertexFeature]);
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
  var layers = goog.array.filter(map.getLayerGroup().getLayers().getArray(),
      this.ignoreTemporaryLayersFilter_);
  if (!goog.isNull(this.layerFilter_)) {
    layers = goog.array.filter(layers, this.layerFilter_);
  }
  this.layers_ = layers;
  var pixel = evt.getPixel();
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var sortByDistance = function(a, b) {
    return ol.coordinate.closestOnSegment(pixelCoordinate, a[0])[2] -
        ol.coordinate.closestOnSegment(pixelCoordinate, b[0])[2];
  };

  var lowerLeft = map.getCoordinateFromPixel(
      [pixel[0] - this.pixelTolerance_, pixel[1] + this.pixelTolerance_]);
  var upperRight = map.getCoordinateFromPixel(
      [pixel[0] + this.pixelTolerance_, pixel[1] - this.pixelTolerance_]);
  var box = ol.extent.boundingExtent([lowerLeft, upperRight]);
  var vertexFeature;
  this.modifiable_ = false;
  for (var i = layers.length - 1; i >= 0; --i) {
    var layer = layers[i];
    var selectionLayer = layer.getSelectionData().layer;
    if (!goog.isNull(selectionLayer)) {
      if (goog.isNull(goog.events.getListener(selectionLayer,
          ol.layer.VectorLayerEventType.ADD, this.addIndex, false, this))) {
        this.addLayer(layer);
      }
      var editData = selectionLayer.getEditData();
      vertexFeature = editData.vertexFeature;
      var segments = editData.rTree.search(box);
      var renderIntent = ol.layer.VectorLayerRenderIntent.HIDDEN;
      if (segments.length > 0) {
        segments.sort(sortByDistance);
        var segment = segments[0][0]; // the closest segment
        var geometry = vertexFeature.getGeometry();
        var vertex = /** @type {ol.Coordinate} */
            (ol.coordinate.closestOnSegment(pixelCoordinate, segment));
        var coordPixel = map.getPixelFromCoordinate(vertex);
        var pixel1 = map.getPixelFromCoordinate(segment[0]);
        var pixel2 = map.getPixelFromCoordinate(segment[1]);
        var squaredDist1 = ol.coordinate.squaredDistance(coordPixel, pixel1);
        var squaredDist2 = ol.coordinate.squaredDistance(coordPixel, pixel2);
        var dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
        renderIntent = ol.layer.VectorLayerRenderIntent.FUTURE;
        if (dist <= 10) {
          vertex = squaredDist1 > squaredDist2 ? segment[1] : segment[0];
          renderIntent = ol.layer.VectorLayerRenderIntent.TEMPORARY;
        }
        geometry.set(0, vertex[0]);
        geometry.set(1, vertex[1]);
        selectionLayer.updateFeatures([vertexFeature]);
        this.modifiable_ = true;
      }
      if (vertexFeature.renderIntent != renderIntent) {
        selectionLayer.setRenderIntent(renderIntent, [vertexFeature]);
      }
    }
  }
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @return {boolean} Whether the layer is no temporary vector layer.
 * @private
 */
ol.interaction.Modify.prototype.ignoreTemporaryLayersFilter_ = function(layer) {
  return !(layer instanceof ol.layer.Vector && layer.getTemporary());
};


/**
 * @param {ol.layer.Vector} selectionLayer Selection layer.
 * @param {Array} segmentData Segment data.
 * @param {ol.Coordinate} vertex Vertex.
 * @private
 */
ol.interaction.Modify.prototype.insertVertex_ =
    function(selectionLayer, segmentData, vertex) {
  var segment = segmentData[0];
  var feature = segmentData[1];
  var geometry = segmentData[2];
  var index = segmentData[3];
  var coordinates = geometry.getCoordinates();
  coordinates.splice(index + 1, 0, vertex);
  var oldGeometry = geometry;
  geometry = new geometry.constructor(coordinates);
  var parent;
  if (segmentData.length > 4) {
    parent = segmentData[4];
    parent[0][parent[1]] = geometry;
    feature.getGeometry().invalidateBounds();
  } else {
    feature.setGeometry(geometry);
  }
  var rTree = selectionLayer.getEditData().rTree;
  rTree.remove(ol.extent.boundingExtent(segment), segmentData);
  var uid = goog.getUid(feature);
  var allSegments = rTree.search(geometry.getBounds(), uid);
  for (var i = 0, ii = allSegments.length; i < ii; ++i) {
    var allSegmentsData = allSegments[i];
    if (allSegmentsData[2] === oldGeometry) {
      allSegmentsData[2] = geometry;
      if (allSegmentsData[3] > index) {
        ++allSegmentsData[3];
      }
    }
  }
  var newSegment = [segment[0], vertex];
  var newSegmentData = [newSegment, feature, geometry, index];
  if (goog.isDef(parent)) {
    newSegmentData.push(parent);
  }
  rTree.insert(ol.extent.boundingExtent(newSegment), newSegmentData, uid);
  this.dragVertices_.push([selectionLayer, newSegmentData, 1]);
  newSegment = [vertex, segment[1]];
  newSegmentData = [newSegment, feature, geometry, index + 1];
  if (goog.isDef(parent)) {
    newSegmentData.push(parent);
  }
  rTree.insert(ol.extent.boundingExtent(newSegment), newSegmentData, uid);
  this.dragVertices_.push([selectionLayer, newSegmentData, 0]);
};


/**
 * @param {ol.layer.VectorLayerEventObject} evt Event object.
 */
ol.interaction.Modify.prototype.removeIndex = function(evt) {
  var layer = evt.target;
  var rTree = layer.getEditData().rTree;
  var features = evt.features;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    var segments = rTree.search(feature.getGeometry().getBounds(),
        goog.getUid(feature));
    for (var j = segments.length - 1; j >= 0; --j) {
      var segment = segments[j];
      rTree.remove(ol.extent.boundingExtent(segment[0]), segment);
    }
  }
};
