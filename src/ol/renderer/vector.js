import _ol_ from '../index';
import _ol_ImageState_ from '../imagestate';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_render_ReplayType_ from '../render/replaytype';
var _ol_renderer_vector_ = {};


/**
 * @param {ol.Feature|ol.render.Feature} feature1 Feature 1.
 * @param {ol.Feature|ol.render.Feature} feature2 Feature 2.
 * @return {number} Order.
 */
_ol_renderer_vector_.defaultOrder = function(feature1, feature2) {
  return _ol_.getUid(feature1) - _ol_.getUid(feature2);
};


/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Squared pixel tolerance.
 */
_ol_renderer_vector_.getSquaredTolerance = function(resolution, pixelRatio) {
  var tolerance = _ol_renderer_vector_.getTolerance(resolution, pixelRatio);
  return tolerance * tolerance;
};


/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Pixel tolerance.
 */
_ol_renderer_vector_.getTolerance = function(resolution, pixelRatio) {
  return _ol_.SIMPLIFY_TOLERANCE * resolution / pixelRatio;
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Circle} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderCircleGeometry_ = function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    var circleReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.CIRCLE);
    circleReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    circleReplay.drawCircle(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getCenter(), 0, 2, 2, geometry, feature);
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
_ol_renderer_vector_.renderFeature = function(
    replayGroup, feature, style, squaredTolerance, listener, thisArg) {
  var loading = false;
  var imageStyle, imageState;
  imageStyle = style.getImage();
  if (imageStyle) {
    imageState = imageStyle.getImageState();
    if (imageState == _ol_ImageState_.LOADED ||
        imageState == _ol_ImageState_.ERROR) {
      imageStyle.unlistenImageChange(listener, thisArg);
    } else {
      if (imageState == _ol_ImageState_.IDLE) {
        imageStyle.load();
      }
      imageState = imageStyle.getImageState();
      imageStyle.listenImageChange(listener, thisArg);
      loading = true;
    }
  }
  _ol_renderer_vector_.renderFeature_(replayGroup, feature, style,
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
_ol_renderer_vector_.renderFeature_ = function(
    replayGroup, feature, style, squaredTolerance) {
  var geometry = style.getGeometryFunction()(feature);
  if (!geometry) {
    return;
  }
  var simplifiedGeometry = geometry.getSimplifiedGeometry(squaredTolerance);
  var renderer = style.getRenderer();
  if (renderer) {
    _ol_renderer_vector_.renderGeometry_(replayGroup, simplifiedGeometry, style, feature);
  } else {
    var geometryRenderer =
        _ol_renderer_vector_.GEOMETRY_RENDERERS_[simplifiedGeometry.getType()];
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
_ol_renderer_vector_.renderGeometry_ = function(replayGroup, geometry, style, feature) {
  if (geometry.getType() == _ol_geom_GeometryType_.GEOMETRY_COLLECTION) {
    var geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
    for (var i = 0, ii = geometries.length; i < ii; ++i) {
      _ol_renderer_vector_.renderGeometry_(replayGroup, geometries[i], style, feature);
    }
    return;
  }
  var replay = replayGroup.getReplay(style.getZIndex(), _ol_render_ReplayType_.DEFAULT);
  replay.drawCustom(/** @type {ol.geom.SimpleGeometry} */ (geometry), feature, style.getRenderer());
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderGeometryCollectionGeometry_ = function(replayGroup, geometry, style, feature) {
  var geometries = geometry.getGeometriesArray();
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    var geometryRenderer =
        _ol_renderer_vector_.GEOMETRY_RENDERERS_[geometries[i].getType()];
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
_ol_renderer_vector_.renderLineStringGeometry_ = function(replayGroup, geometry, style, feature) {
  var strokeStyle = style.getStroke();
  if (strokeStyle) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawLineString(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getFlatMidpoint(), 0, 2, 2, geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiLineString|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderMultiLineStringGeometry_ = function(replayGroup, geometry, style, feature) {
  var strokeStyle = style.getStroke();
  if (strokeStyle) {
    var lineStringReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawMultiLineString(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatMidpointCoordinates = geometry.getFlatMidpoints();
    textReplay.drawText(flatMidpointCoordinates, 0,
        flatMidpointCoordinates.length, 2, geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderMultiPolygonGeometry_ = function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (strokeStyle || fillStyle) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawMultiPolygon(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatInteriorPointCoordinates = geometry.getFlatInteriorPoints();
    textReplay.drawText(flatInteriorPointCoordinates, 0,
        flatInteriorPointCoordinates.length, 2, geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Point|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderPointGeometry_ = function(replayGroup, geometry, style, feature) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != _ol_ImageState_.LOADED) {
      return;
    }
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawPoint(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry.getFlatCoordinates(), 0, 2, 2, geometry,
        feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.MultiPoint|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderMultiPointGeometry_ = function(replayGroup, geometry, style, feature) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != _ol_ImageState_.LOADED) {
      return;
    }
    var imageReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.IMAGE);
    imageReplay.setImageStyle(imageStyle);
    imageReplay.drawMultiPoint(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.TEXT);
    textReplay.setTextStyle(textStyle);
    var flatCoordinates = geometry.getFlatCoordinates();
    textReplay.drawText(flatCoordinates, 0, flatCoordinates.length,
        geometry.getStride(), geometry, feature);
  }
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Polygon|ol.render.Feature} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderPolygonGeometry_ = function(replayGroup, geometry, style, feature) {
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    var polygonReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawPolygon(geometry, feature);
  }
  var textStyle = style.getText();
  if (textStyle) {
    var textReplay = replayGroup.getReplay(
        style.getZIndex(), _ol_render_ReplayType_.TEXT);
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(
        geometry.getFlatInteriorPoint(), 0, 2, 2, geometry, feature);
  }
};


/**
 * @const
 * @private
 * @type {Object.<ol.geom.GeometryType,
 *                function(ol.render.ReplayGroup, ol.geom.Geometry,
 *                         ol.style.Style, Object)>}
 */
_ol_renderer_vector_.GEOMETRY_RENDERERS_ = {
  'Point': _ol_renderer_vector_.renderPointGeometry_,
  'LineString': _ol_renderer_vector_.renderLineStringGeometry_,
  'Polygon': _ol_renderer_vector_.renderPolygonGeometry_,
  'MultiPoint': _ol_renderer_vector_.renderMultiPointGeometry_,
  'MultiLineString': _ol_renderer_vector_.renderMultiLineStringGeometry_,
  'MultiPolygon': _ol_renderer_vector_.renderMultiPolygonGeometry_,
  'GeometryCollection': _ol_renderer_vector_.renderGeometryCollectionGeometry_,
  'Circle': _ol_renderer_vector_.renderCircleGeometry_
};
export default _ol_renderer_vector_;
