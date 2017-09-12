goog.provide('ol.renderer.vector');

goog.require('ol');
goog.require('ol.ImageState');
goog.require('ol.geom.GeometryType');
goog.require('ol.render.ReplayType');


/**
 * @param {ol.Feature|ol.render.Feature} feature1 Feature 1.
 * @param {ol.Feature|ol.render.Feature} feature2 Feature 2.
 * @return {number} Order.
 */
ol.renderer.vector.defaultOrder = function(feature1, feature2) {
  return ol.getUid(feature1) - ol.getUid(feature2);
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
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Circle} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderCircleGeometry_ = function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    var circleReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.CIRCLE);
    circleReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    circleReplay.drawCircle(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {function(this: T, ol.events.Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @return {boolean} `true` if style is loading.
 * @template T
 */
ol.renderer.vector.renderFeature = function(
    replayGroup, feature, style, squaredTolerance, listener, thisArg) {
  var loading = false;
  var imageStyle, imageState;
  imageStyle = style.getImage();
  if (imageStyle) {
    imageState = imageStyle.getImageState();
    if (imageState == ol.ImageState.LOADED ||
        imageState == ol.ImageState.ERROR) {
      imageStyle.unlistenImageChange(listener, thisArg);
    } else {
      if (imageState == ol.ImageState.IDLE) {
        imageStyle.load();
      }
      imageState = imageStyle.getImageState();
      imageStyle.listenImageChange(listener, thisArg);
      loading = true;
    }
  }
  ol.renderer.vector.renderFeature_(replayGroup, feature, style,
      squaredTolerance);
  return loading;
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @private
 */
ol.renderer.vector.renderFeature_ = function(
    replayGroup, feature, style, squaredTolerance) {
  var geometry = style.getGeometryFunction()(feature);
  if (!geometry) {
    return;
  }
  var simplifiedGeometry = geometry.getSimplifiedGeometry(squaredTolerance);
  var renderer = style.getRenderer();
  if (renderer) {
    ol.renderer.vector.renderGeometry_(replayGroup, simplifiedGeometry, style, feature);
  } else {
    var geometryRenderer =
        ol.renderer.vector.GEOMETRY_RENDERERS_[simplifiedGeometry.getType()];
    geometryRenderer(replayGroup, simplifiedGeometry, style, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderGeometry_ = function(replayGroup, geometry, style, feature) {
  if (geometry.getType() == ol.geom.GeometryType.GEOMETRY_COLLECTION) {
    var geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
    for (var i = 0, ii = geometries.length; i < ii; ++i) {
      ol.renderer.vector.renderGeometry_(replayGroup, geometries[i], style, feature);
    }
    return;
  }
  var replay = replayGroup.getReplay(style.getZIndex(), ol.render.ReplayType.DEFAULT);
  replay.drawCustom(/** @type {ol.geom.SimpleGeometry} */ (geometry), feature, style.getRenderer());
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderGeometryCollectionGeometry_ = function(replayGroup, geometry, style, feature) {
  var geometries = geometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    var geometryRenderer =
        ol.renderer.vector.GEOMETRY_RENDERERS_[geometries[i].getType()];
    geometryRenderer(replayGroup, geometries[i], style, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.LineString|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderLineStringGeometry_ = function(replayGroup, geometry, style, feature) {
  var strokeStyle = style.getStroke();
  if (strokeStyle) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawLineString(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiLineString|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderMultiLineStringGeometry_ = function(replayGroup, geometry, style, feature) {
  var strokeStyle = style.getStroke();
  if (strokeStyle) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawMultiLineString(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderMultiPolygonGeometry_ = function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (strokeStyle || fillStyle) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawMultiPolygon(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Point|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderPointGeometry_ = function(replayGroup, geometry, style, feature) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ol.ImageState.LOADED) {
      return;
    }
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawPoint(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiPoint|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderMultiPointGeometry_ = function(replayGroup, geometry, style, feature) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ol.ImageState.LOADED) {
      return;
    }
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawMultiPoint(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Polygon|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderPolygonGeometry_ = function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawPolygon(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(ol.render.ReplayGroup, ol.geom.Geometry,
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
