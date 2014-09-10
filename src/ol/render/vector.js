goog.provide('ol.renderer.vector');

goog.require('goog.asserts');
goog.require('ol.geom.Circle');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render.IReplayGroup');
goog.require('ol.style.ImageState');
goog.require('ol.style.Style');


/**
 * @param {ol.Feature} feature1 Feature 1.
 * @param {ol.Feature} feature2 Feature 2.
 * @return {number} Order.
 */
ol.renderer.vector.defaultOrder = function(feature1, feature2) {
  return goog.getUid(feature1) - goog.getUid(feature2);
};


/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Squared pixel tolerance.
 */
ol.renderer.vector.getSquaredTolerance = function(resolution, pixelRatio) {
  var tolerance = ol.renderer.vector.getTolerance(resolution, pixelRatio);
  return tolerance * tolerance;
};


/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Pixel tolerance.
 */
ol.renderer.vector.getTolerance = function(resolution, pixelRatio) {
  return ol.SIMPLIFY_TOLERANCE * resolution / pixelRatio;
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderCircleGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Circle);
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (!goog.isNull(fillStyle) || !goog.isNull(strokeStyle)) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawCircleGeometry(geometry, data);
  }
  var textStyle = style.getText();
  if (!goog.isNull(textStyle)) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getCenter(), 0, 2, 2, geometry, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Object} data Opaque data object.
 * @param {function(this: T, goog.events.Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @return {boolean} `true` if style is loading.
 * @template T
 */
ol.renderer.vector.renderFeature = function(
    replayGroup, feature, style, squaredTolerance, data, listener, thisArg) {
  var loading = false;
  var imageStyle, imageState;
  imageStyle = style.getImage();
  if (goog.isNull(imageStyle)) {
    ol.renderer.vector.renderFeature_(
        replayGroup, feature, style, squaredTolerance, data);
  } else {
    imageState = imageStyle.getImageState();
    if (imageState == ol.style.ImageState.LOADED ||
        imageState == ol.style.ImageState.ERROR) {
      imageStyle.unlistenImageChange(listener, thisArg);
      if (imageState == ol.style.ImageState.LOADED) {
        ol.renderer.vector.renderFeature_(
            replayGroup, feature, style, squaredTolerance, data);
      }
    } else {
      if (imageState == ol.style.ImageState.IDLE) {
        imageStyle.load();
      }
      imageState = imageStyle.getImageState();
      goog.asserts.assert(imageState == ol.style.ImageState.LOADING);
      imageStyle.listenImageChange(listener, thisArg);
      loading = true;
    }
  }
  return loading;
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderFeature_ = function(
    replayGroup, feature, style, squaredTolerance, data) {
  var geometry = feature.getGeometry();
  if (!goog.isDefAndNotNull(geometry)) {
    return;
  }
  var simplifiedGeometry = geometry.getSimplifiedGeometry(squaredTolerance);
  var geometryRenderer =
      ol.renderer.vector.GEOMETRY_RENDERERS_[simplifiedGeometry.getType()];
  goog.asserts.assert(goog.isDef(geometryRenderer));
  geometryRenderer(replayGroup, simplifiedGeometry, style, data);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderGeometryCollectionGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.GeometryCollection);
  var geometries = geometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    var geometryRenderer =
        ol.renderer.vector.GEOMETRY_RENDERERS_[geometries[i].getType()];
    goog.asserts.assert(goog.isDef(geometryRenderer));
    geometryRenderer(replayGroup, geometries[i], style, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderLineStringGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
  var strokeStyle = style.getStroke();
  if (!goog.isNull(strokeStyle)) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawLineStringGeometry(geometry, data);
  }
  var textStyle = style.getText();
  if (!goog.isNull(textStyle)) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getFlatMidpoint(), 0, 2, 2, geometry, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderMultiLineStringGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiLineString);
  var strokeStyle = style.getStroke();
  if (!goog.isNull(strokeStyle)) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawMultiLineStringGeometry(geometry, data);
  }
  var textStyle = style.getText();
  if (!goog.isNull(textStyle)) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatMidpointCoordinates = geometry.getFlatMidpoints();
    textReplay.drawText(flatMidpointCoordinates, 0,
        flatMidpointCoordinates.length, 2, geometry, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderMultiPolygonGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPolygon);
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (!goog.isNull(strokeStyle) || !goog.isNull(fillStyle)) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawMultiPolygonGeometry(geometry, data);
  }
  var textStyle = style.getText();
  if (!goog.isNull(textStyle)) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatInteriorPointCoordinates = geometry.getFlatInteriorPoints();
    textReplay.drawText(flatInteriorPointCoordinates, 0,
        flatInteriorPointCoordinates.length, 2, geometry, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderPointGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Point);
  var imageStyle = style.getImage();
  if (!goog.isNull(imageStyle)) {
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawPointGeometry(geometry, data);
  }
  var textStyle = style.getText();
  if (!goog.isNull(textStyle)) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getCoordinates(), 0, 2, 2, geometry, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderMultiPointGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPoint);
  var imageStyle = style.getImage();
  if (!goog.isNull(imageStyle)) {
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawMultiPointGeometry(geometry, data);
  }
  var textStyle = style.getText();
  if (!goog.isNull(textStyle)) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatCoordinates = geometry.getFlatCoordinates();
    textReplay.drawText(flatCoordinates, 0, flatCoordinates.length,
        geometry.getStride(), geometry, data);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {Object} data Opaque data object.
 * @private
 */
ol.renderer.vector.renderPolygonGeometry_ =
    function(replayGroup, geometry, style, data) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (!goog.isNull(fillStyle) || !goog.isNull(strokeStyle)) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawPolygonGeometry(geometry, data);
  }
  var textStyle = style.getText();
  if (!goog.isNull(textStyle)) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(
        geometry.getFlatInteriorPoint(), 0, 2, 2, geometry, data);
  }
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(ol.render.IReplayGroup, ol.geom.Geometry,
 *                         ol.style.Style, Object)>}
 */
ol.renderer.vector.GEOMETRY_RENDERERS_ = {
  'Point': ol.renderer.vector.renderPointGeometry_,
  'LineString': ol.renderer.vector.renderLineStringGeometry_,
  'Polygon': ol.renderer.vector.renderPolygonGeometry_,
  'MultiPoint': ol.renderer.vector.renderMultiPointGeometry_,
  'MultiLineString': ol.renderer.vector.renderMultiLineStringGeometry_,
  'MultiPolygon': ol.renderer.vector.renderMultiPolygonGeometry_,
  'GeometryCollection': ol.renderer.vector.renderGeometryCollectionGeometry_,
  'Circle': ol.renderer.vector.renderCircleGeometry_
};
