/**
 * @module ol/geom/flat/intersectsextent
 */
import {
  containsExtent,
  createEmpty,
  extendFlatCoordinates,
  intersects,
  intersectsSegment,
} from '../../extent.js';
import {forEach as forEachSegment} from './segments.js';
import {linearRingContainsExtent, linearRingContainsXY} from './contains.js';

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
export function intersectsLineString(
  flatCoordinates,
  offset,
  end,
  stride,
  extent
) {
  const coordinatesExtent = extendFlatCoordinates(
    createEmpty(),
    flatCoordinates,
    offset,
    end,
    stride
  );
  if (!intersects(extent, coordinatesExtent)) {
    return false;
  }
  if (containsExtent(extent, coordinatesExtent)) {
    return true;
  }
  if (coordinatesExtent[0] >= extent[0] && coordinatesExtent[2] <= extent[2]) {
    return true;
  }
  if (coordinatesExtent[1] >= extent[1] && coordinatesExtent[3] <= extent[3]) {
    return true;
  }
  return forEachSegment(
    flatCoordinates,
    offset,
    end,
    stride,
    /**
     * @param {import("../../coordinate.js").Coordinate} point1 Start point.
     * @param {import("../../coordinate.js").Coordinate} point2 End point.
     * @return {boolean} `true` if the segment and the extent intersect,
     *     `false` otherwise.
     */
    function (point1, point2) {
      return intersectsSegment(extent, point1, point2);
    }
  );
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
export function intersectsLineStringArray(
  flatCoordinates,
  offset,
  ends,
  stride,
  extent
) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    if (
      intersectsLineString(flatCoordinates, offset, ends[i], stride, extent)
    ) {
      return true;
    }
    offset = ends[i];
  }
  return false;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
export function intersectsLinearRing(
  flatCoordinates,
  offset,
  end,
  stride,
  extent
) {
  if (intersectsLineString(flatCoordinates, offset, end, stride, extent)) {
    return true;
  }
  if (
    linearRingContainsXY(
      flatCoordinates,
      offset,
      end,
      stride,
      extent[0],
      extent[1]
    )
  ) {
    return true;
  }
  if (
    linearRingContainsXY(
      flatCoordinates,
      offset,
      end,
      stride,
      extent[0],
      extent[3]
    )
  ) {
    return true;
  }
  if (
    linearRingContainsXY(
      flatCoordinates,
      offset,
      end,
      stride,
      extent[2],
      extent[1]
    )
  ) {
    return true;
  }
  if (
    linearRingContainsXY(
      flatCoordinates,
      offset,
      end,
      stride,
      extent[2],
      extent[3]
    )
  ) {
    return true;
  }
  return false;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
export function intersectsLinearRingArray(
  flatCoordinates,
  offset,
  ends,
  stride,
  extent
) {
  if (!intersectsLinearRing(flatCoordinates, offset, ends[0], stride, extent)) {
    return false;
  }
  if (ends.length === 1) {
    return true;
  }
  for (let i = 1, ii = ends.length; i < ii; ++i) {
    if (
      linearRingContainsExtent(
        flatCoordinates,
        ends[i - 1],
        ends[i],
        stride,
        extent
      )
    ) {
      if (
        !intersectsLineString(
          flatCoordinates,
          ends[i - 1],
          ends[i],
          stride,
          extent
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
export function intersectsLinearRingMultiArray(
  flatCoordinates,
  offset,
  endss,
  stride,
  extent
) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    if (
      intersectsLinearRingArray(flatCoordinates, offset, ends, stride, extent)
    ) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
}
