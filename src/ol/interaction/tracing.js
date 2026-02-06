/**
 * Coordinate type when drawing lines.
 * @typedef {Array<import("../coordinate.js").Coordinate>} LineCoordType
 */

import {distance} from '../coordinate.js';
import {
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from '../geom.js';
import {clamp, squaredDistance, toFixed} from '../math.js';

/**
 * @param {LineCoordType} coordinates The ring coordinates.
 * @param {number} index The index.  May be wrapped.
 * @return {import("../coordinate.js").Coordinate} The coordinate.
 */
export function getCoordinate(coordinates, index) {
  const count = coordinates.length;
  if (index < 0) {
    return coordinates[index + count];
  }
  if (index >= count) {
    return coordinates[index - count];
  }
  return coordinates[index];
}

/**
 * @param {LineCoordType} coordinates The coordinates.
 * @param {number} index The index.  May be fractional and may wrap.
 * @return {import("../coordinate.js").Coordinate} The interpolated coordinate.
 */
export function interpolateCoordinate(coordinates, index) {
  const count = coordinates.length;

  let startIndex = Math.floor(index);
  const along = index - startIndex;
  if (startIndex >= count) {
    startIndex -= count;
  } else if (startIndex < 0) {
    startIndex += count;
  }

  let endIndex = startIndex + 1;
  if (endIndex >= count) {
    endIndex -= count;
  }

  const start = coordinates[startIndex];
  const x0 = start[0];
  const y0 = start[1];
  const end = coordinates[endIndex];
  const dx = end[0] - x0;
  const dy = end[1] - y0;

  return [x0 + dx * along, y0 + dy * along];
}

/**
 * @typedef {Object} TraceTarget
 * @property {Array<import("../coordinate.js").Coordinate>} coordinates Target coordinates.
 * @property {boolean} ring The target coordinates are a linear ring.
 * @property {number} startIndex The index of first traced coordinate.  A fractional index represents an
 * edge intersection.  Index values for rings will wrap (may be negative or larger than coordinates length).
 * @property {number} endIndex The index of last traced coordinate.  Details from startIndex also apply here.
 */

/**
 * @typedef {Object} TraceState
 * @property {boolean} active Tracing active.
 * @property {import("../coordinate.js").Coordinate} [startCoord] The initially clicked coordinate.
 * @property {Array<TraceTarget>} [targets] Targets available for tracing.
 * @property {number} [targetIndex] The index of the currently traced target.  A value of -1 indicates
 * that no trace target is active.
 */

/**
 * @typedef {Object} TraceTargetUpdateInfo
 * @property {number} index The new target index.
 * @property {number} endIndex The new segment end index.
 * @property {number} closestTargetDistance The squared distance to the closest target.
 */

/**
 * @type {TraceTargetUpdateInfo}
 */
const sharedUpdateInfo = {
  index: -1,
  endIndex: NaN,
  closestTargetDistance: Infinity,
};

/**
 * @param {import("../coordinate.js").Coordinate} coordinate The coordinate.
 * @param {TraceState} traceState The trace state.
 * @param {import("../Map.js").default} map The map.
 * @param {number} snapTolerance The snap tolerance.
 * @return {TraceTargetUpdateInfo} Information about the new trace target.  The returned
 * object is reused between calls and must not be modified by the caller.
 */
export function getTraceTargetUpdate(
  coordinate,
  traceState,
  map,
  snapTolerance,
) {
  const x = coordinate[0];
  const y = coordinate[1];

  let closestTargetDistance = Infinity;

  let newTargetIndex = -1;
  let newEndIndex = NaN;

  for (
    let targetIndex = 0;
    targetIndex < traceState.targets.length;
    ++targetIndex
  ) {
    const target = traceState.targets[targetIndex];
    const coordinates = target.coordinates;

    let minSegmentDistance = Infinity;
    let endIndex;
    for (
      let coordinateIndex = 0;
      coordinateIndex < coordinates.length - 1;
      ++coordinateIndex
    ) {
      const start = coordinates[coordinateIndex];
      const end = coordinates[coordinateIndex + 1];
      const rel = getPointSegmentRelationship(x, y, start, end);
      if (rel.squaredDistance < minSegmentDistance) {
        minSegmentDistance = rel.squaredDistance;
        endIndex = coordinateIndex + rel.along;
      }
    }

    if (minSegmentDistance < closestTargetDistance) {
      closestTargetDistance = minSegmentDistance;
      if (target.ring && traceState.targetIndex === targetIndex) {
        // same target, maintain the same trace direction
        if (target.endIndex > target.startIndex) {
          // forward trace
          if (endIndex < target.startIndex) {
            endIndex += coordinates.length;
          }
        } else if (target.endIndex < target.startIndex) {
          // reverse trace
          if (endIndex > target.startIndex) {
            endIndex -= coordinates.length;
          }
        }
      }
      newEndIndex = endIndex;
      newTargetIndex = targetIndex;
    }
  }

  const newTarget = traceState.targets[newTargetIndex];
  let considerBothDirections = newTarget.ring;
  if (traceState.targetIndex === newTargetIndex && considerBothDirections) {
    // only consider switching trace direction if close to the start
    const newCoordinate = interpolateCoordinate(
      newTarget.coordinates,
      newEndIndex,
    );
    const pixel = map.getPixelFromCoordinate(newCoordinate);
    const startPx = map.getPixelFromCoordinate(traceState.startCoord);
    if (distance(pixel, startPx) > snapTolerance) {
      considerBothDirections = false;
    }
  }

  if (considerBothDirections) {
    const coordinates = newTarget.coordinates;
    const count = coordinates.length;
    const startIndex = newTarget.startIndex;
    const endIndex = newEndIndex;
    if (startIndex < endIndex) {
      const forwardDistance = getCumulativeSquaredDistance(
        coordinates,
        startIndex,
        endIndex,
      );
      const reverseDistance = getCumulativeSquaredDistance(
        coordinates,
        startIndex,
        endIndex - count,
      );
      if (reverseDistance < forwardDistance) {
        newEndIndex -= count;
      }
    } else {
      const reverseDistance = getCumulativeSquaredDistance(
        coordinates,
        startIndex,
        endIndex,
      );
      const forwardDistance = getCumulativeSquaredDistance(
        coordinates,
        startIndex,
        endIndex + count,
      );
      if (forwardDistance < reverseDistance) {
        newEndIndex += count;
      }
    }
  }

  sharedUpdateInfo.index = newTargetIndex;
  sharedUpdateInfo.endIndex = newEndIndex;
  sharedUpdateInfo.closestTargetDistance = closestTargetDistance;
  return sharedUpdateInfo;
}

/**
 * @param {import("../coordinate.js").Coordinate} coordinate The coordinate.
 * @param {Array<import("../Feature.js").default>} features The candidate features.
 * @return {Array<TraceTarget>} The trace targets.
 */
export function getTraceTargets(coordinate, features) {
  /**
   * @type {Array<TraceTarget>}
   */
  const targets = [];

  for (let i = 0; i < features.length; ++i) {
    const feature = features[i];
    const geometry = feature.getGeometry();
    appendGeometryTraceTargets(coordinate, geometry, targets);
  }

  return targets;
}

/**
 * @param {import("../coordinate.js").Coordinate} coordinate The coordinate.
 * @param {import("../geom/Geometry.js").default} geometry The candidate geometry.
 * @param {Array<TraceTarget>} targets The trace targets.
 */
function appendGeometryTraceTargets(coordinate, geometry, targets) {
  if (geometry instanceof LineString) {
    appendTraceTarget(coordinate, geometry.getCoordinates(), false, targets);
    return;
  }
  if (geometry instanceof MultiLineString) {
    const coordinates = geometry.getCoordinates();
    for (let i = 0, ii = coordinates.length; i < ii; ++i) {
      appendTraceTarget(coordinate, coordinates[i], false, targets);
    }
    return;
  }
  if (geometry instanceof Polygon) {
    const coordinates = geometry.getCoordinates();
    for (let i = 0, ii = coordinates.length; i < ii; ++i) {
      appendTraceTarget(coordinate, coordinates[i], true, targets);
    }
    return;
  }
  if (geometry instanceof MultiPolygon) {
    const polys = geometry.getCoordinates();
    for (let i = 0, ii = polys.length; i < ii; ++i) {
      const coordinates = polys[i];
      for (let j = 0, jj = coordinates.length; j < jj; ++j) {
        appendTraceTarget(coordinate, coordinates[j], true, targets);
      }
    }
    return;
  }
  if (geometry instanceof GeometryCollection) {
    const geometries = geometry.getGeometries();
    for (let i = 0; i < geometries.length; ++i) {
      appendGeometryTraceTargets(coordinate, geometries[i], targets);
    }
    return;
  }
  // other types cannot be traced
}

/**
 * @param {import("../coordinate.js").Coordinate} coordinate The clicked coordinate.
 * @param {Array<import("../coordinate.js").Coordinate>} coordinates The geometry component coordinates.
 * @param {boolean} ring The coordinates represent a linear ring.
 * @param {Array<TraceTarget>} targets The trace targets.
 */
function appendTraceTarget(coordinate, coordinates, ring, targets) {
  const x = coordinate[0];
  const y = coordinate[1];
  for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    const rel = getPointSegmentRelationship(x, y, start, end);
    if (rel.squaredDistance === 0) {
      const index = i + rel.along;
      targets.push({
        coordinates: coordinates,
        ring: ring,
        startIndex: index,
        endIndex: index,
      });
      return;
    }
  }
}

/**
 * @param {import("../coordinate.js").Coordinate} a One coordinate.
 * @param {import("../coordinate.js").Coordinate} b Another coordinate.
 * @return {number} The squared distance between the two coordinates.
 */
function getSquaredDistance(a, b) {
  return squaredDistance(a[0], a[1], b[0], b[1]);
}

/**
 * Get the cumulative squared distance along a ring path.  The end index index may be "wrapped" and it may
 * be less than the start index to indicate the direction of travel.  The start and end index may have
 * a fractional part to indicate a point between two coordinates.
 * @param {LineCoordType} coordinates Ring coordinates.
 * @param {number} startIndex The start index.
 * @param {number} endIndex The end index.
 * @return {number} The cumulative squared distance along the ring path.
 */
function getCumulativeSquaredDistance(coordinates, startIndex, endIndex) {
  let lowIndex, highIndex;
  if (startIndex < endIndex) {
    lowIndex = startIndex;
    highIndex = endIndex;
  } else {
    lowIndex = endIndex;
    highIndex = startIndex;
  }
  const lowWholeIndex = Math.ceil(lowIndex);
  const highWholeIndex = Math.floor(highIndex);

  if (lowWholeIndex > highWholeIndex) {
    // both start and end are on the same segment
    const start = interpolateCoordinate(coordinates, lowIndex);
    const end = interpolateCoordinate(coordinates, highIndex);
    return getSquaredDistance(start, end);
  }

  let sd = 0;

  if (lowIndex < lowWholeIndex) {
    const start = interpolateCoordinate(coordinates, lowIndex);
    const end = getCoordinate(coordinates, lowWholeIndex);
    sd += getSquaredDistance(start, end);
  }

  if (highWholeIndex < highIndex) {
    const start = getCoordinate(coordinates, highWholeIndex);
    const end = interpolateCoordinate(coordinates, highIndex);
    sd += getSquaredDistance(start, end);
  }

  for (let i = lowWholeIndex; i < highWholeIndex - 1; ++i) {
    const start = getCoordinate(coordinates, i);
    const end = getCoordinate(coordinates, i + 1);
    sd += getSquaredDistance(start, end);
  }

  return sd;
}

/**
 * @typedef {Object} PointSegmentRelationship
 * @property {number} along The closest point expressed as a fraction along the segment length.
 * @property {number} squaredDistance The squared distance of the point to the segment.
 */

/**
 * @type {PointSegmentRelationship}
 */
const sharedRel = {along: 0, squaredDistance: 0};

/**
 * @param {number} x The point x.
 * @param {number} y The point y.
 * @param {import("../coordinate.js").Coordinate} start The segment start.
 * @param {import("../coordinate.js").Coordinate} end The segment end.
 * @return {PointSegmentRelationship} The point segment relationship.  The returned object is
 * shared between calls and must not be modified by the caller.
 */
export function getPointSegmentRelationship(x, y, start, end) {
  const x1 = start[0];
  const y1 = start[1];
  const x2 = end[0];
  const y2 = end[1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  let along = 0;
  let px = x1;
  let py = y1;
  if (dx !== 0 || dy !== 0) {
    along = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy), 0, 1);
    px += dx * along;
    py += dy * along;
  }

  sharedRel.along = along;
  sharedRel.squaredDistance = toFixed(squaredDistance(x, y, px, py), 10);
  return sharedRel;
}
