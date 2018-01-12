/**
 * @module ol/renderer/vector
 */
import {getUid} from '../index.js';
import ImageState from '../ImageState.js';
import GeometryType from '../geom/GeometryType.js';
import ReplayType from '../render/ReplayType.js';
const _ol_renderer_vector_ = {};


/**
 * @type {number} Tolerance for geometry simplification in device pixels.
 */
const SIMPLIFY_TOLERANCE = 0.5;


/**
 * @param {ol.Feature|ol.render.Feature} feature1 Feature 1.
 * @param {ol.Feature|ol.render.Feature} feature2 Feature 2.
 * @return {number} Order.
 */
_ol_renderer_vector_.defaultOrder = function(feature1, feature2) {
  return getUid(feature1) - getUid(feature2);
};


/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Squared pixel tolerance.
 */
_ol_renderer_vector_.getSquaredTolerance = function(resolution, pixelRatio) {
  const tolerance = _ol_renderer_vector_.getTolerance(resolution, pixelRatio);
  return tolerance * tolerance;
};


/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Pixel tolerance.
 */
_ol_renderer_vector_.getTolerance = function(resolution, pixelRatio) {
  return SIMPLIFY_TOLERANCE * resolution / pixelRatio;
};


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {ol.geom.Circle} geometry Geometry.
 * @param {ol.style.Style} style Style.
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_renderer_vector_.renderCircleGeometry_ = function(replayGroup, geometry, style, feature) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    const circleReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.CIRCLE);
    circleReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    circleReplay.drawCircle(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.TEXT);
    textReplay.setTextStyle(textStyle, replayGroup.addDeclutter(false));
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
_ol_renderer_vector_.renderFeature = function(
  replayGroup, feature, style, squaredTolerance, listener, thisArg) {
  let loading = false;
  const imageStyle = style.getImage();
  if (imageStyle) {
    let imageState = imageStyle.getImageState();
    if (imageState == ImageState.LOADED || imageState == ImageState.ERROR) {
      imageStyle.unlistenImageChange(listener, thisArg);
    } else {
      if (imageState == ImageState.IDLE) {
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
  const geometry = style.getGeometryFunction()(feature);
  if (!geometry) {
    return;
  }
  const simplifiedGeometry = geometry.getSimplifiedGeometry(squaredTolerance);
  const renderer = style.getRenderer();
  if (renderer) {
    _ol_renderer_vector_.renderGeometry_(replayGroup, simplifiedGeometry, style, feature);
  } else {
    const geometryRenderer =
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
  if (geometry.getType() == GeometryType.GEOMETRY_COLLECTION) {
    const geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      _ol_renderer_vector_.renderGeometry_(replayGroup, geometries[i], style, feature);
    }
    return;
  }
  const replay = replayGroup.getReplay(style.getZIndex(), ReplayType.DEFAULT);
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
  const geometries = geometry.getGeometriesArray();
  let i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    const geometryRenderer =
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
  const strokeStyle = style.getStroke();
  if (strokeStyle) {
    const lineStringReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawLineString(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.TEXT);
    textReplay.setTextStyle(textStyle, replayGroup.addDeclutter(false));
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
_ol_renderer_vector_.renderMultiLineStringGeometry_ = function(replayGroup, geometry, style, feature) {
  const strokeStyle = style.getStroke();
  if (strokeStyle) {
    const lineStringReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.LINE_STRING);
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawMultiLineString(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.TEXT);
    textReplay.setTextStyle(textStyle, replayGroup.addDeclutter(false));
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
_ol_renderer_vector_.renderMultiPolygonGeometry_ = function(replayGroup, geometry, style, feature) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (strokeStyle || fillStyle) {
    const polygonReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawMultiPolygon(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.TEXT);
    textReplay.setTextStyle(textStyle, replayGroup.addDeclutter(false));
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
_ol_renderer_vector_.renderPointGeometry_ = function(replayGroup, geometry, style, feature) {
  const imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ImageState.LOADED) {
      return;
    }
    const imageReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle, replayGroup.addDeclutter(false));
    imageReplay.drawPoint(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.TEXT);
    textReplay.setTextStyle(textStyle, replayGroup.addDeclutter(!!imageStyle));
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
_ol_renderer_vector_.renderMultiPointGeometry_ = function(replayGroup, geometry, style, feature) {
  const imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ImageState.LOADED) {
      return;
    }
    const imageReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.IMAGE);
    imageReplay.setImageStyle(imageStyle, replayGroup.addDeclutter(false));
    imageReplay.drawMultiPoint(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.TEXT);
    textReplay.setTextStyle(textStyle, replayGroup.addDeclutter(!!imageStyle));
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
_ol_renderer_vector_.renderPolygonGeometry_ = function(replayGroup, geometry, style, feature) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    const polygonReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.POLYGON);
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawPolygon(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = replayGroup.getReplay(style.getZIndex(), ReplayType.TEXT);
    textReplay.setTextStyle(textStyle, replayGroup.addDeclutter(false));
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
