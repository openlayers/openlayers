/**
 * @module ol/coverage/util
 */
import {createEmpty, extend, getHeight, getWidth, equals} from '../extent.js';
import CoverageType from './CoverageType.js';
import InterpolationMethod from './InterpolationMethod.js';
import {assign} from '../obj.js';
import {mode} from '../math.js';


/**
 * @private
 * @param {Array.<ol.Size>} resolutions Resolutions.
 * @return {ol.Size} Optimal resolution.
 */
function _getOptimalResolution(resolutions) {
  let resolution;
  const diagonals = [];
  let i, ii;
  for (i = 0, ii = resolutions.length; i < ii; ++i) {
    const sign = resolutions[i][0] > resolutions[i][1] ? -1 : 1;
    const diagonal = Math.sqrt(Math.pow(resolutions[i][0], 2) + Math.pow(
      resolutions[i][1], 2));
    diagonals.push(diagonal * sign);
  }
  const md = mode(diagonals);
  if (md.length > 1) {
    const abs = md.map(Math.abs);
    const min = Math.min.apply(null, abs);
    resolution = resolutions[abs.indexOf(min)];
  } else {
    resolution = resolutions[diagonals.indexOf(md[0])];
  }
  return resolution;
}


/**
 * Convenience function for aligning input raster bands.
 * @param {Array.<ol.coverage.Band>} bands Bands.
 * @return {{matrices: Array.<ol.CoverageData>,
             properties: ol.CoverageProperties}} Aligned matrices with common properties.
 */
export function alignRasterBands(bands) {
  const rasters = [];
  let i, ii;
  const resolution = _getOptimalResolution(bands.map(function(curr) {
    return curr.getResolution();
  }));
  const extent = createEmpty();
  const refExtent = bands.length ? bands[0].getExtent() : extent;
  // Parse coverage data, resample, and align (if needed) in the first pass.
  for (i = 0, ii = bands.length; i < ii; ++i) {
    let raster = {
      matrix: bands[i].getCoverageData(),
      properties: {
        extent: bands[i].getExtent(),
        nodata: bands[i].getNullValue(),
        resolution: bands[i].getResolution(),
        stride: bands[i].getStride(),
        type: CoverageType.RECTANGULAR
      }};
    raster = resampleCoverage(raster.matrix, raster.properties, resolution);

    const xMod = Math.abs(refExtent[0] - raster.properties.extent[0]) % resolution[0];
    const yMod = Math.abs(refExtent[1] - raster.properties.extent[1]) % resolution[1];
    if (xMod || yMod) {
      if (raster.properties.extent[0] + resolution[0] - xMod === refExtent[0]) {
        raster.properties.extent[0] += resolution[0] - xMod;
        raster.properties.extent[2] += resolution[0] - xMod;
      } else {
        raster.properties.extent[0] -= xMod;
        raster.properties.extent[2] -= xMod;
      }
      if (raster.properties.extent[1] + resolution[1] - yMod === refExtent[1]) {
        raster.properties.extent[1] += resolution[1] - yMod;
        raster.properties.extent[3] += resolution[1] - yMod;
      } else {
        raster.properties.extent[1] -= yMod;
        raster.properties.extent[3] -= yMod;
      }
    }
    rasters.push(raster);
    extend(extent, raster.properties.extent);
  }

  const aligned = {
    matrices: [],
    properties: {}
  };

  // Extend resampled coverages, if needed.
  for (i = 0, ii = rasters.length; i < ii; ++i) {
    rasters[i] = extendCoverage(rasters[i].matrix, rasters[i].properties,
      refExtent);
    aligned.matrices.push(rasters[i].matrix);
  }

  aligned.properties = rasters[0].properties;

  return aligned;
}


/**
 * Resample a coverage to another resolution.
 * @param {ol.CoverageData} matrix Coverage data.
 * @param {ol.CoverageProperties} properties Coverage properties.
 * @param {ol.Size} newResolution Output resolution.
 * @param {ol.coverage.InterpolationMethod=} opt_method Interpolation method.
 *        Default is NN.
 * @return {{matrix: ol.CoverageData,
 *           properties: ol.CoverageProperties}} Resampled coverage.
 */
export function resampleCoverage(matrix, properties, newResolution, opt_method) {
  const method = opt_method ? opt_method : InterpolationMethod.NEAREST;
  const resampled = {
    matrix: matrix,
    properties: properties
  };
  if (newResolution[0] === properties.resolution[0] &&
      newResolution[1] === properties.resolution[1]) {
    return resampled;
  }
  resampled.properties = /** @type {ol.CoverageProperties} */ (assign({}, properties));
  const resolution = newResolution.slice();
  resampled.properties.resolution = resolution;
  const xOffset = properties.type === CoverageType.HEXAGONAL ?
    resolution[0] / 2 : 0;
  const yOffset = properties.type === CoverageType.HEXAGONAL ?
    resolution[1] * (1 / 3) : 0;
  const cols = Math.ceil((getWidth(properties.extent) - xOffset) /
    resolution[0]);
  const rows = Math.ceil((getHeight(properties.extent) - yOffset) /
    resolution[1]);
  const flippedMatrix = new Array(rows * cols);
  resampled.matrix = [];
  resampled.properties.stride = cols;
  resampled.properties.extent = [properties.extent[0], properties.extent[1],
    properties.extent[0] + cols * resolution[0] + xOffset,
    properties.extent[1] + rows * resolution[1] + yOffset];

  const firstCell = properties.type === CoverageType.HEXAGONAL ?
    [properties.resolution[0] / 2, properties.resolution[1] * (2 / 3)] :
    [properties.resolution[0] / 2, properties.resolution[1] / 2];
  const cursor = firstCell;
  let currRow = 1;
  // TODO: Implement bilinear interpolation.
  const numPoints = method === InterpolationMethod.NEAREST ? 1 : 4;
  let i, ii;
  for (i = 0, ii = flippedMatrix.length; i < ii; ++i) {
    if (i > 0 && i % cols === 0) {
      cursor[0] = firstCell[0];
      cursor[1] += resolution[1];
      currRow++;
      if (properties.type === CoverageType.HEXAGONAL) {
        cursor[0] += currRow % 2 === 0 ? xOffset : -xOffset;
      }
    }
    const nearest = getNearestCells(matrix, properties, cursor, numPoints);
    flippedMatrix[i] = nearest[1];
    cursor[0] += resolution[0];
  }
  // Flip back the resampled matrix.
  for (i = 0, ii = rows; i < ii; ++i) {
    resampled.matrix = resampled.matrix.concat(
      flippedMatrix.splice((rows - 1 - i) * cols, cols));
  }

  return resampled;
}


/**
 * Fill a coverage with nodata values to match target extent.
 * @param {ol.CoverageData} matrix Coverage data.
 * @param {ol.CoverageProperties} properties Coverage properties.
 * @param {ol.Extent} targetExtent Target extent.
 * @return {{matrix: ol.CoverageData,
 *           properties: ol.CoverageProperties}} Extended coverage.
 */
export function extendCoverage(matrix, properties, targetExtent) {
  const extended = {
    matrix: matrix,
    properties: properties
  };
  if (equals(targetExtent, properties.extent)) {
    return extended;
  }
  extended.properties = /** @type {ol.CoverageProperties} */ (assign({}, properties));
  extended.properties.resolution = properties.resolution.slice();
  extended.properties.extent = [targetExtent[0], targetExtent[1],
    targetExtent[2] + extended.properties.resolution[0] -
    getWidth(targetExtent) % extended.properties.resolution[0],
    targetExtent[3] + extended.properties.resolution[1] -
    getHeight(targetExtent) % extended.properties.resolution[1]];

  const left = Math.max(properties.extent[0] - extended.properties.extent[0], 0) /
    extended.properties.resolution[0];
  const bottom = Math.max(properties.extent[1] - extended.properties.extent[1], 0) /
    extended.properties.resolution[1];
  const right = Math.max(extended.properties.extent[2] - properties.extent[2], 0) /
    extended.properties.resolution[0];
  const top = Math.max(extended.properties.extent[3] - properties.extent[3], 0) /
    extended.properties.resolution[0];
  const cols = properties.stride + left + right;
  const rows = matrix.length / properties.stride + top + bottom;

  extended.properties.stride = cols;

  extended.matrix = new Array(cols * rows);
  let i, ii;
  const fillTop = top * cols;
  const fillBottom = (rows - bottom) * cols;
  const fillRight = cols - right;
  for (i = 0, ii = extended.matrix.length; i < ii; ++i) {
    if (i < fillTop || i >= fillBottom) {
      extended.matrix[i] = extended.properties.nodata;
    } else {
      let colPos = i % cols + 1;
      if (colPos <= left || colPos > fillRight) {
        extended.matrix[i] = extended.properties.nodata;
      } else {
        const rowPos = Math.floor(i / cols) - top;
        colPos -= left + 1;
        extended.matrix[i] = matrix[rowPos * properties.stride + colPos];
      }
    }

  }

  return extended;
}


/**
 * Returns the nearest x cells from the provided image coordinate in the provided matrix.
 * @param {ol.CoverageData} matrix Coverage data.
 * @param {ol.CoverageProperties} properties Coverage properties.
 * @param {ol.Coordinate} coord Image coordinate.
 * @param {number} numCells Number of nearest cells to return.
 * @return {Array.<number>} Distances and cell values.
 */
export function getNearestCells(matrix, properties, coord, numCells) {
  const cellData = [];

  const offsetX = properties.resolution[0] / 2;
  const offsetY = properties.type === CoverageType.HEXAGONAL ?
    properties.resolution[1] * (2 / 3) : properties.resolution[1] / 2;
  const r = Math.floor(coord[1] / properties.resolution[1]);
  let nearestY = offsetY + r * properties.resolution[1];
  let oddOffset = 0;
  if (properties.type === CoverageType.HEXAGONAL) {
    oddOffset = ((nearestY - offsetY) / properties.resolution[1]) % 2 * offsetX;
  }
  const c = Math.floor(coord[0] / properties.resolution[0]);
  let nearestX = offsetX + c * properties.resolution[0] + oddOffset;
  nearestX -= nearestX > properties.extent[2] ? properties.resolution[0] + oddOffset : 0;
  nearestY -= nearestY > properties.extent[3] ? properties.resolution[1] : 0;
  // TODO: For hexagonal grids this is just an estimated starting point. Iterate through neighbors.
  cellData.push(Math.sqrt(Math.pow(nearestX - coord[0], 2) +
    Math.pow(nearestY - coord[1], 2)));

  const i = (matrix.length / properties.stride - r) * properties.stride + c;
  cellData.push(matrix[i]);
  // TODO: Implement finding KNN cells.
  return cellData;
}
