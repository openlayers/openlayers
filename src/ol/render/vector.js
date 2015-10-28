goog.provide('ol.renderer.vector');

goog.require('goog.asserts');
goog.require('ol.render.Feature');
goog.require('ol.render.IReplayGroup');
goog.require('ol.style.ImageState');
goog.require('ol.style.Style');


/**
 * @param {ol.Feature|ol.render.Feature} feature1 Feature 1.
 * @param {ol.Feature|ol.render.Feature} feature2 Feature 2.
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
 * @param {ol.geom.Circle} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderCircleGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawCircleGeometry(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getCenter(), 0, 2, 2, geometry, feature);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {function(this: T, goog.events.Event)} listener Listener function.
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
    if (imageState == ol.style.ImageState.LOADED ||
        imageState == ol.style.ImageState.ERROR) {
      imageStyle.unlistenImageChange(listener, thisArg);
    } else {
      if (imageState == ol.style.ImageState.IDLE) {
        imageStyle.load();
      }
      imageState = imageStyle.getImageState();
      goog.asserts.assert(imageState == ol.style.ImageState.LOADING,
          'imageState should be LOADING');
      imageStyle.listenImageChange(listener, thisArg);
      loading = true;
    }
  }
  ol.renderer.vector.renderFeature_(replayGroup, feature, style,
      squaredTolerance);
  return loading;
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
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
  var geometryRenderer =
      ol.renderer.vector.GEOMETRY_RENDERERS_[simplifiedGeometry.getType()];
  goog.asserts.assert(geometryRenderer !== undefined,
      'geometryRenderer should be defined');
  geometryRenderer(replayGroup, simplifiedGeometry, style, feature);
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderGeometryCollectionGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var geometries = geometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    var geometryRenderer =
        ol.renderer.vector.GEOMETRY_RENDERERS_[geometries[i].getType()];
    goog.asserts.assert(geometryRenderer !== undefined,
        'geometryRenderer should be defined');
    geometryRenderer(replayGroup, geometries[i], style, feature);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.LineString|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderLineStringGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var strokeStyle = style.getStroke();
  if (strokeStyle) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawLineStringGeometry(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getFlatMidpoint(), 0, 2, 2, geometry, feature);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiLineString|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderMultiLineStringGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var strokeStyle = style.getStroke();
  if (strokeStyle) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawMultiLineStringGeometry(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatMidpointCoordinates = geometry.getFlatMidpoints();
    textReplay.drawText(flatMidpointCoordinates, 0,
        flatMidpointCoordinates.length, 2, geometry, feature);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderMultiPolygonGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (strokeStyle || fillStyle) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawMultiPolygonGeometry(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatInteriorPointCoordinates = geometry.getFlatInteriorPoints();
    textReplay.drawText(flatInteriorPointCoordinates, 0,
        flatInteriorPointCoordinates.length, 2, geometry, feature);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Point|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderPointGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ol.style.ImageState.LOADED) {
      return;
    }
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawPointGeometry(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getFlatCoordinates(), 0, 2, 2, geometry,
        feature);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiPoint|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderMultiPointGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ol.style.ImageState.LOADED) {
      return;
    }
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawMultiPointGeometry(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatCoordinates = geometry.getFlatCoordinates();
    textReplay.drawText(flatCoordinates, 0, flatCoordinates.length,
        geometry.getStride(), geometry, feature);
  }
};


/**
 * @param {ol.render.IReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Polygon|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.renderer.vector.renderPolygonGeometry_ =
    function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawPolygonGeometry(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), ol.render.ReplayType.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(
        geometry.getFlatInteriorPoint(), 0, 2, 2, geometry, feature);
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
