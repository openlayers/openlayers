/**
 * @module ol/renderer/vector
 */
import BuilderType from '../render/canvas/BuilderType.js';
import GeometryType from '../geom/GeometryType.js';
import ImageState from '../ImageState.js';
import {getUid} from '../util.js';

/**
 * Tolerance for geometry simplification in device pixels.
 * @type {number}
 */
const SIMPLIFY_TOLERANCE = 0.5;

/**
 * @const
 * @type {Object<import("../geom/GeometryType.js").default,
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
 */
function renderCircleGeometry(builderGroup, geometry, style, feature) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    const circleReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.CIRCLE
    );
    circleReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    circleReplay.drawCircle(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.TEXT
    );
    textReplay.setTextStyle(textStyle, builderGroup.addDeclutter(false));
    textReplay.drawText(geometry, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {import("../style/Style.js").default} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {function(import("../events/Event.js").default): void} listener Listener function.
 * @param {import("../proj.js").TransformFunction} [opt_transform] Transform from user to view projection.
 * @return {boolean} `true` if style is loading.
 * @template T
 */
export function renderFeature(
  replayGroup,
  feature,
  style,
  squaredTolerance,
  listener,
  opt_transform
) {
  let loading = false;
  const imageStyle = style.getImage();
  if (imageStyle) {
    let imageState = imageStyle.getImageState();
    if (imageState == ImageState.LOADED || imageState == ImageState.ERROR) {
      imageStyle.unlistenImageChange(listener);
    } else {
      if (imageState == ImageState.IDLE) {
        imageStyle.load();
      }
      imageState = imageStyle.getImageState();
      imageStyle.listenImageChange(listener);
      loading = true;
    }
  }
  renderFeatureInternal(
    replayGroup,
    feature,
    style,
    squaredTolerance,
    opt_transform
  );

  return loading;
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {import("../style/Style.js").default} style Style.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {import("../proj.js").TransformFunction} [opt_transform] Optional transform function.
 */
function renderFeatureInternal(
  replayGroup,
  feature,
  style,
  squaredTolerance,
  opt_transform
) {
  const geometry = style.getGeometryFunction()(feature);
  if (!geometry) {
    return;
  }
  const simplifiedGeometry = geometry.simplifyTransformed(
    squaredTolerance,
    opt_transform
  );
  const renderer = style.getRenderer();
  if (renderer) {
    renderGeometry(replayGroup, simplifiedGeometry, style, feature);
  } else {
    const geometryRenderer = GEOMETRY_RENDERERS[simplifiedGeometry.getType()];
    geometryRenderer(replayGroup, simplifiedGeometry, style, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../geom/Geometry.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 */
function renderGeometry(replayGroup, geometry, style, feature) {
  if (geometry.getType() == GeometryType.GEOMETRY_COLLECTION) {
    const geometries = /** @type {import("../geom/GeometryCollection.js").default} */ (geometry).getGeometries();
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      renderGeometry(replayGroup, geometries[i], style, feature);
    }
    return;
  }
  const replay = replayGroup.getBuilder(style.getZIndex(), BuilderType.DEFAULT);
  replay.drawCustom(
    /** @type {import("../geom/SimpleGeometry.js").default} */ (geometry),
    feature,
    style.getRenderer()
  );
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} replayGroup Replay group.
 * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").default} feature Feature.
 */
function renderGeometryCollectionGeometry(
  replayGroup,
  geometry,
  style,
  feature
) {
  const geometries = geometry.getGeometriesArray();
  let i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    const geometryRenderer = GEOMETRY_RENDERERS[geometries[i].getType()];
    geometryRenderer(replayGroup, geometries[i], style, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/LineString.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 */
function renderLineStringGeometry(builderGroup, geometry, style, feature) {
  const strokeStyle = style.getStroke();
  if (strokeStyle) {
    const lineStringReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.LINE_STRING
    );
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawLineString(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.TEXT
    );
    textReplay.setTextStyle(textStyle, builderGroup.addDeclutter(false));
    textReplay.drawText(geometry, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/MultiLineString.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 */
function renderMultiLineStringGeometry(builderGroup, geometry, style, feature) {
  const strokeStyle = style.getStroke();
  if (strokeStyle) {
    const lineStringReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.LINE_STRING
    );
    lineStringReplay.setFillStrokeStyle(null, strokeStyle);
    lineStringReplay.drawMultiLineString(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.TEXT
    );
    textReplay.setTextStyle(textStyle, builderGroup.addDeclutter(false));
    textReplay.drawText(geometry, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").default} feature Feature.
 */
function renderMultiPolygonGeometry(builderGroup, geometry, style, feature) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (strokeStyle || fillStyle) {
    const polygonReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.POLYGON
    );
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawMultiPolygon(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.TEXT
    );
    textReplay.setTextStyle(textStyle, builderGroup.addDeclutter(false));
    textReplay.drawText(geometry, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/Point.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 */
function renderPointGeometry(builderGroup, geometry, style, feature) {
  const imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ImageState.LOADED) {
      return;
    }
    const imageReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.IMAGE
    );
    imageReplay.setImageStyle(imageStyle, builderGroup.addDeclutter(false));
    imageReplay.drawPoint(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.TEXT
    );
    textReplay.setTextStyle(textStyle, builderGroup.addDeclutter(!!imageStyle));
    textReplay.drawText(geometry, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/MultiPoint.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 */
function renderMultiPointGeometry(builderGroup, geometry, style, feature) {
  const imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle.getImageState() != ImageState.LOADED) {
      return;
    }
    const imageReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.IMAGE
    );
    imageReplay.setImageStyle(imageStyle, builderGroup.addDeclutter(false));
    imageReplay.drawMultiPoint(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.TEXT
    );
    textReplay.setTextStyle(textStyle, builderGroup.addDeclutter(!!imageStyle));
    textReplay.drawText(geometry, feature);
  }
}

/**
 * @param {import("../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
 * @param {import("../geom/Polygon.js").default|import("../render/Feature.js").default} geometry Geometry.
 * @param {import("../style/Style.js").default} style Style.
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 */
function renderPolygonGeometry(builderGroup, geometry, style, feature) {
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  if (fillStyle || strokeStyle) {
    const polygonReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.POLYGON
    );
    polygonReplay.setFillStrokeStyle(fillStyle, strokeStyle);
    polygonReplay.drawPolygon(geometry, feature);
  }
  const textStyle = style.getText();
  if (textStyle) {
    const textReplay = builderGroup.getBuilder(
      style.getZIndex(),
      BuilderType.TEXT
    );
    textReplay.setTextStyle(textStyle, builderGroup.addDeclutter(false));
    textReplay.drawText(geometry, feature);
  }
}
