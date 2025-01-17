/**
 * @module ol/render/webgl/serialize
 */

import Feature from '../../Feature.js';
import Circle from '../../geom/Circle.js';
import LinearRing from '../../geom/LinearRing.js';
import SimpleGeometry from '../../geom/SimpleGeometry.js';
import {inflateEnds} from '../../geom/flat/orient.js';
import {
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from '../../geom.js';
import {get as getProjection} from '../../proj.js';

/**
 * This will serialize a frame state into a cloneable object.
 * Note: the user projection is baked in the frame state because it won't be available in the worker.
 * @param {import("../../Map.js").FrameState} frameState Frame state
 * @return {Object} Serialized as object
 */
export function serializeFrameState(frameState) {
  const viewState = frameState.viewState;
  return {
    viewState: {
      ...viewState,
      projection: viewState.projection.getCode(),
    },
    viewHints: frameState.viewHints,
    pixelRatio: frameState.pixelRatio,
    size: frameState.size,
    extent: frameState.extent,
    coordinateToPixelTransform: frameState.coordinateToPixelTransform,
    pixelToCoordinateTransform: frameState.coordinateToPixelTransform,
    layerStatesArray: frameState.layerStatesArray.map((l) => ({
      zIndex: l.zIndex,
      visible: l.visible,
      extent: l.extent,
      maxResolution: l.maxResolution,
      minResolution: l.minResolution,
      managed: l.managed,
      opacity: l.opacity,
    })),
  };
}

/**
 * @param {Object} serialized Serialized frame state
 * @return {import("../../Map.js").FrameState} Frame state
 */
export function deserializeFrameState(serialized) {
  return {
    ...serialized,
    viewState: {
      ...serialized.viewState,
      projection: getProjection(serialized.viewState.projection),
    },
  };
}

/**
 * @typedef {Object} SerializedFeature
 * @property {string|number} id Feature id
 * @property {import('../../geom/Geometry.js').Type} geometryType Geometry type
 * @property {Array<number>} flatCoords Flat coordinates
 * @property {Array<number> | Array<Array<number>> | null} ends Coordinate ends
 * @property {import("../../geom/Geometry.js").GeometryLayout} layout Layout
 * @property {Object<string, *>} properties Properties
 */

/**
 * @param {import("../../Feature.js").FeatureLike} feature Feature
 * @return {SerializedFeature|null} Serialized feature; `null` if the feature has no geometry
 */
export function serializeFeature(feature) {
  if (!feature.getGeometry()) {
    return null;
  }
  const properties = feature.getProperties();
  delete properties[
    feature instanceof Feature ? feature.getGeometryName() : 'geometry'
  ];
  const geom = feature.getGeometry();
  const geometryType = geom.getType();
  const layout = geom instanceof SimpleGeometry ? geom.getLayout() : 'XY';
  let ends = null;
  let flatCoords = [];
  switch (geometryType) {
    case 'GeometryCollection':
      // TODO
      break;
    case 'MultiPolygon':
      ends = /** @type {import('../../geom/MultiPolygon.js').default} */ (
        geom
      ).getEndss();
      flatCoords = /** @type {import('../../geom/MultiPolygon.js').default} */ (
        geom
      ).getFlatCoordinates();
      break;
    case 'MultiLineString':
    case 'Polygon':
      ends = /** @type {import('../../geom/Polygon.js').default} */ (
        geom
      ).getEnds();
      flatCoords = /** @type {import('../../geom/Polygon.js').default} */ (
        geom
      ).getFlatCoordinates();
      break;
    case 'Circle':
    case 'LineString':
    case 'LinearRing':
    case 'Point':
    case 'MultiPoint':
      flatCoords =
        /** @type {import('../../geom/SimpleGeometry.js').default} */ (
          geom
        ).getFlatCoordinates();
      break;
    default:
      return null;
  }
  return {
    id: feature.getId(),
    geometryType,
    flatCoords,
    ends,
    properties,
    layout,
  };
}

/**
 * @param {SerializedFeature} serialized Serialized feature
 * @return {import("../../Feature.js").default} Feature, deserialized
 */
export function deserializeFeature(serialized) {
  const {id, geometryType, flatCoords, ends, properties, layout} = serialized;
  /** @type {import("../../geom/Geometry.js").default} */
  let geometry = null;
  switch (geometryType) {
    case 'GeometryCollection':
      // TODO
      break;
    case 'Point':
      geometry = new Point(flatCoords);
      break;
    case 'MultiPoint':
      geometry = new MultiPoint(flatCoords, layout);
      break;
    case 'LineString':
      geometry = new LineString(flatCoords, layout);
      break;
    case 'LinearRing':
      geometry = new LinearRing(flatCoords, layout);
      break;
    case 'MultiLineString':
      geometry = new MultiLineString(
        flatCoords,
        layout,
        /** @type {Array<number>} */ (ends),
      );
      break;
    case 'Polygon':
      const endss = inflateEnds(
        flatCoords,
        /** @type {Array<number>} */ (ends),
      );
      geometry =
        endss.length > 1
          ? new MultiPolygon(flatCoords, layout, endss)
          : new Polygon(
              flatCoords,
              layout,
              /** @type {Array<number>} */ (ends),
            );
      break;
    case 'MultiPolygon':
      geometry = new MultiPolygon(
        flatCoords,
        layout,
        /** @type {Array<Array<number>>} */ (ends),
      );
      break;
    case 'Circle':
      geometry = new Circle(flatCoords);
      break;
    default:
      throw new Error('Invalid geometry type:' + geometryType);
  }

  return new Feature({
    id,
    geometry,
    ...properties,
  });
}
