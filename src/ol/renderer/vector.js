/**
 * @module ol/renderer/vector
 */
import ImageState from '../ImageState.js';
import {getUid} from '../util.js';

/**
 * Feature callback. The callback will be called with three arguments. The first
 * argument is one {@link module:ol/Feature~Feature feature} or {@link module:ol/render/Feature~RenderFeature render feature}
 * at the pixel, the second is the {@link module:ol/layer/Layer~Layer layer} of the feature and will be null for
 * unmanaged layers. The third is the {@link module:ol/geom/SimpleGeometry~SimpleGeometry} of the feature. For features
 * with a GeometryCollection geometry, it will be the first detected geometry from the collection.
 * @template T
 * @typedef {function(import("../Feature.js").FeatureLike, import("../layer/Layer.js").default<import("../source/Source").default>, import("../geom/SimpleGeometry.js").default): T} FeatureCallback
 */

/**
 * Tolerance for geometry simplification in device pixels.
 * @type {number}
 */
const SIMPLIFY_TOLERANCE = 0.5;

/**
 * @const
 * @type {Object<import("../geom/Geometry.js").Type,
 *                function(import("../render/canvas/BuilderGroup.js").default, import("../geom/Geometry.js").default,
 *                         import("../style/Style.js").default, Object): void>}
 */
const GEOMETRY_RENDERERS = {
  'Point': renderPointGeometry,
  'LineString': renderLineStringGeometry,
  'Polygon': renderPolygonGeometry,
  'MultiPoint': renderMultiPointGeometry,
  'MultiLineString': renderMultiLineStringGeometry,
  'MultiPolygon': renderMultiPolygonGeometry,
  'GeometryCollection': renderGeometryCollectionGeometry,
  'Circle': renderCircleGeometry,
};

/**
 * @param {import("../Feature.js").FeatureLike} feature1 Feature 1.
 * @param {import("../Feature.js").FeatureLike} feature2 Feature 2.
 * @return {number} Order.
 */
export function defaultOrder(feature1, feature2) {
  return parseInt(getUid(feature1), 10) - parseInt(getUid(feature2), 10);
}

/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Squared pixel tolerance.
 */
export function getSquaredTolerance(resolution, pixelRatio) {
  const tolerance = getTolerance(resolution, pixelRatio);
  return tolerance * tolerance;
}

/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Pixel tolerance.
 */
export function getTolerance(resolution, pixelRatio) {
  return (SIMPLIFY_TOLERANCE * resolution) / pixelRatio;
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Builder group.
 * @param {import("../geom/Circle.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").default} feature Feature.
 * @param {number} [index] Render order index.
 */
function renderCircleGeometry(builderGroup, geometry, style, feature, index) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    const circleReplay = builderGroup.getBuilder(style.getZIndex(), 'Circle');
    circleReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    circleReplay.drawCircle(geometry, feature, index);
  }
  const textStyle = style.getText();
  if (textStyle && textStyle.getText()) {
    const textReplay = builderGroup.getBuilder(style.getZIndex(), 'Text');
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {import("../style/Style.js").default} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {function(import("../events/Event.js").default): void} listener Listener function.
 * @param {import("../proj.js").TransformFunction} [transform] Transform from user to view projection.
 * @param {boolean} [declutter] Enable decluttering.
 * @param {number} [index] Render order index..
 * @return {boolean} `true` if style is loading.
 */
export function renderFeature(
  replayGroup,
  feature,
  style,
  squaredTolerance,
  listener,
  transform,
  declutter,
  index,
) {
  const loadingPromises = [];
  const imageStyle = style.getImage();
  if (imageStyle) {
    let loading = true;
    const imageState = imageStyle.getImageState();
    if (imageState == ImageState.LOADED || imageState == ImageState.ERROR) {
      loading = false;
    } else {
      if (imageState == ImageState.IDLE) {
        imageStyle.load();
      }
    }
    if (loading) {
      loadingPromises.push(imageStyle.ready());
    }
  }
  const fillStyle = style.getFill();
  if (fillStyle && fillStyle.loading()) {
    loadingPromises.push(fillStyle.ready());
  }
  const loading = loadingPromises.length > 0;
  if (loading) {
    Promise.all(loadingPromises).then(() => listener(null));
  }
  renderFeatureInternal(
    replayGroup,
    feature,
    style,
    squaredTolerance,
    transform,
    declutter,
    index,
  );

  return loading;
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {import("../style/Style.js").default} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {import("../proj.js").TransformFunction} [transform] Optional transform function.
 * @param {boolean} [declutter] Enable decluttering.
 * @param {number} [index] Render order index..
 */
function renderFeatureInternal(
  replayGroup,
  feature,
  style,
  squaredTolerance,
  transform,
  declutter,
  index,
) {
  const geometry = style.getGeometryFunction()(feature);
  if (!geometry) {
    return;
  }
  const simplifiedGeometry = geometry.simplifyTransformed(
    squaredTolerance,
    transform,
  );
  const renderer = style.getRenderer();
  if (renderer) {
    renderGeometry(replayGroup, simplifiedGeometry, style, feature, index);
  } else {
    const geometryRenderer = GEOMETRY_RENDERERS[simplifiedGeometry.getType()];
    geometryRenderer(
      replayGroup,
      simplifiedGeometry,
      style,
      feature,
      index,
      declutter,
    );
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../geom/Geometry.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {number} [index] Render order index.
 */
function renderGeometry(replayGroup, geometry, style, feature, index) {
  if (geometry.getType() == 'GeometryCollection') {
    const geometries =
      /** @type {import("../geom/GeometryCollection.js").default} */ (
        geometry
      ).getGeometries();
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      renderGeometry(replayGroup, geometries[i], style, feature, index);
    }
    return;
  }
  const replay = replayGroup.getBuilder(style.getZIndex(), 'Default');
  replay.drawCustom(
    /** @type {import("../geom/SimpleGeometry.js").default} */ (geometry),
    feature,
    style.getRenderer(),
    style.getHitDetectionRenderer(),
    index,
  );
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").default} feature Feature.
 * @param {import("../render/canvas/BuilderGroup.js").default} [declutterBuilderGroup] Builder for decluttering.
 * @param {number} [index] Render order index.
 */
function renderGeometryCollectionGeometry(
  replayGroup,
  geometry,
  style,
  feature,
  declutterBuilderGroup,
  index,
) {
  const geometries = geometry.getGeometriesArray();
  let i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    const geometryRenderer = GEOMETRY_RENDERERS[geometries[i].getType()];
    geometryRenderer(
      replayGroup,
      geometries[i],
      style,
      feature,
      declutterBuilderGroup,
      index,
    );
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/LineString.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {number} [index] Render order index.
 */
function renderLineStringGeometry(
  builderGroup,
  geometry,
  style,
  feature,
  index,
) {
  const strokeStyle = style.getStroke();
  if (strokeStyle) {
    const lineStringReplay = builderGroup.getBuilder(
      style.getZIndex(),
      'LineString',
    );
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawLineString(geometry, feature, index);
  }
  const textStyle = style.getText();
  if (textStyle && textStyle.getText()) {
    const textReplay = builderGroup.getBuilder(style.getZIndex(), 'Text');
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature, index);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/MultiLineString.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {number} [index] Render order index.
 */
function renderMultiLineStringGeometry(
  builderGroup,
  geometry,
  style,
  feature,
  index,
) {
  const strokeStyle = style.getStroke();
  if (strokeStyle) {
    const lineStringReplay = builderGroup.getBuilder(
      style.getZIndex(),
      'LineString',
    );
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawMultiLineString(geometry, feature, index);
  }
  const textStyle = style.getText();
  if (textStyle && textStyle.getText()) {
    const textReplay = builderGroup.getBuilder(style.getZIndex(), 'Text');
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature, index);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").default} feature Feature.
 * @param {number} [index] Render order index.
 */
function renderMultiPolygonGeometry(
  builderGroup,
  geometry,
  style,
  feature,
  index,
) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (strokeStyle || fillStyle) {
    const polygonReplay = builderGroup.getBuilder(style.getZIndex(), 'Polygon');
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawMultiPolygon(geometry, feature, index);
  }
  const textStyle = style.getText();
  if (textStyle && textStyle.getText()) {
    const textReplay = builderGroup.getBuilder(style.getZIndex(), 'Text');
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature, index);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/Point.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {number} [index] Render order index.
 * @param {boolean} [declutter] Enable decluttering.
 */
function renderPointGeometry(
  builderGroup,
  geometry,
  style,
  feature,
  index,
  declutter,
) {
  const imageStyle = style.getImage();
  const textStyle = style.getText();
  const hasText = textStyle && textStyle.getText();
  /** @type {import("../render/canvas.js").DeclutterImageWithText} */
  const declutterImageWithText =
    declutter && imageStyle && hasText ? {} : undefined;
  if (imageStyle) {
    if (imageStyle.getImageState() != ImageState.LOADED) {
      return;
    }
    const imageReplay = builderGroup.getBuilder(style.getZIndex(), 'Image');
    imageReplay.setImageStyle(imageStyle, declutterImageWithText);
    imageReplay.drawPoint(geometry, feature, index);
  }
  if (hasText) {
    const textReplay = builderGroup.getBuilder(style.getZIndex(), 'Text');
    textReplay.setTextStyle(textStyle, declutterImageWithText);
    textReplay.drawText(geometry, feature, index);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/MultiPoint.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {number} [index] Render order index.
 * @param {boolean} [declutter] Enable decluttering.
 */
function renderMultiPointGeometry(
  builderGroup,
  geometry,
  style,
  feature,
  index,
  declutter,
) {
  const imageStyle = style.getImage();
  const hasImage = imageStyle && imageStyle.getOpacity() !== 0;
  const textStyle = style.getText();
  const hasText = textStyle && textStyle.getText();
  /** @type {import("../render/canvas.js").DeclutterImageWithText} */
  const declutterImageWithText =
    declutter && hasImage && hasText ? {} : undefined;
  if (hasImage) {
    if (imageStyle.getImageState() != ImageState.LOADED) {
      return;
    }
    const imageReplay = builderGroup.getBuilder(style.getZIndex(), 'Image');
    imageReplay.setImageStyle(imageStyle, declutterImageWithText);
    imageReplay.drawMultiPoint(geometry, feature, index);
  }
  if (hasText) {
    const textReplay = builderGroup.getBuilder(style.getZIndex(), 'Text');
    textReplay.setTextStyle(textStyle, declutterImageWithText);
    textReplay.drawText(geometry, feature, index);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/Polygon.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {number} [index] Render order index.
 */
function renderPolygonGeometry(builderGroup, geometry, style, feature, index) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    const polygonReplay = builderGroup.getBuilder(style.getZIndex(), 'Polygon');
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawPolygon(geometry, feature, index);
  }
  const textStyle = style.getText();
  if (textStyle && textStyle.getText()) {
    const textReplay = builderGroup.getBuilder(style.getZIndex(), 'Text');
    textReplay.setTextStyle(textStyle);
    textReplay.drawText(geometry, feature, index);
  }
}
