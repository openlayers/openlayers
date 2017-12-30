goog.require('ol.coverage.CoverageType');
goog.require('ol.coverage.InterpolationMethod');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.obj');

goog.provide('ol.coverage.util');


/**
 * Convenience function for aligning input raster bands.
 * @param {Array.<ol.coverage.Band>} bands Bands.
 * @return {{matrices: Array.<ol.CoverageData>,
             properties: ol.CoverageProperties}} Aligned matrices with common properties.
 */
ol.coverage.util.alignRasterBands = function(bands) {
  var rasters = [];
  var i, ii;
  var resolution = ol.coverage.util.getOptimalResolution_(bands.map(function(curr) {
    return curr.getResolution();
  }));
  var extent = ol.extent.createEmpty();
  var refExtent = bands.length ? bands[0].getExtent() : extent;
  // Parse coverage data, resample, and align (if needed) in the first pass.
  for (i = 0, ii = bands.length; i < ii; ++i) {
    var raster = {
      matrix: bands[i].getCoverageData(),
      properties: {
        extent: bands[i].getExtent(),
        nodata: bands[i].getNullValue(),
        resolution: bands[i].getResolution(),
        stride: bands[i].getStride(),
        type: ol.coverage.CoverageType.RECTANGULAR
      }};
    raster = ol.coverage.util.resampleCoverage(/** @type {ol.CoverageData} */
        (raster.matrix), raster.properties, resolution);

    var xMod = Math.abs(refExtent[0] - raster.properties.extent[0]) % resolution[0];
    var yMod = Math.abs(refExtent[1] - raster.properties.extent[1]) % resolution[1];
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
    ol.extent.extend(extent, raster.properties.extent);
  }

  var aligned = {
    matrices: [],
    properties: {}
  };

  // Extend resampled coverages, if needed.
  for (i = 0, ii = rasters.length; i < ii; ++i) {
    rasters[i] = ol.coverage.util.extendCoverage(rasters[i].matrix,
        rasters[i].properties, refExtent);
    aligned.matrices.push(rasters[i].matrix);
  }

  aligned.properties = rasters[0].properties;

  return aligned;
};


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
ol.coverage.util.resampleCoverage = function(matrix, properties, newResolution,
    opt_method) {
  var method = opt_method ? opt_method : ol.coverage.InterpolationMethod.NEAREST;
  var resampled = {
    matrix: matrix,
    properties: properties
  };
  if (newResolution[0] === properties.resolution[0] &&
      newResolution[1] === properties.resolution[1]) {
    return resampled;
  }
  resampled.properties = /** @type {ol.CoverageProperties} */ (ol.obj.assign({}, properties));
  var resolution = newResolution.slice();
  resampled.properties.resolution = resolution;
  var xOffset = properties.type === ol.coverage.CoverageType.HEXAGONAL ?
    resolution[0] / 2 : 0;
  var yOffset = properties.type === ol.coverage.CoverageType.HEXAGONAL ?
    resolution[1] * (1 / 3) : 0;
  var cols = Math.ceil((ol.extent.getWidth(properties.extent) - xOffset) /
    resolution[0]);
  var rows = Math.ceil((ol.extent.getHeight(properties.extent) - yOffset) /
    resolution[1]);
  var flippedMatrix = new Array(rows * cols);
  resampled.matrix = [];
  resampled.properties.stride = cols;
  resampled.properties.extent = [properties.extent[0], properties.extent[1],
    properties.extent[0] + cols * resolution[0] + xOffset,
    properties.extent[1] + rows * resolution[1] + yOffset];

  var firstCell = properties.type === ol.coverage.CoverageType.HEXAGONAL ?
    [properties.resolution[0] / 2, properties.resolution[1] * (2 / 3)] :
    [properties.resolution[0] / 2, properties.resolution[1] / 2];
  var cursor = firstCell;
  var currRow = 1;
  // TODO: Implement bilinear interpolation.
  var numPoints = method === ol.coverage.InterpolationMethod.NEAREST ? 1 : 4;
  var i, ii;
  for (i = 0, ii = flippedMatrix.length; i < ii; ++i) {
    if (i > 0 && i % cols === 0) {
      cursor[0] = firstCell[0];
      cursor[1] += resolution[1];
      currRow++;
      if (properties.type === ol.coverage.CoverageType.HEXAGONAL) {
        cursor[0] += currRow % 2 === 0 ? xOffset : -xOffset;
      }
    }
    var nearest = ol.coverage.util.getNearestCells(matrix, properties, cursor,
        numPoints);
    flippedMatrix[i] = nearest[1];
    cursor[0] += resolution[0];
  }
  // Flip back the resampled matrix.
  for (i = 0, ii = rows; i < ii; ++i) {
    resampled.matrix = resampled.matrix.concat(
        flippedMatrix.splice((rows - 1 - i) * cols, cols));
  }

  return resampled;
};


/**
 * Fill a coverage with nodata values to match target extent.
 * @param {ol.CoverageData} matrix Coverage data.
 * @param {ol.CoverageProperties} properties Coverage properties.
 * @param {ol.Extent} targetExtent Target extent.
 * @return {{matrix: ol.CoverageData,
 *           properties: ol.CoverageProperties}} Extended coverage.
 */
ol.coverage.util.extendCoverage = function(matrix, properties, targetExtent) {
  var extended = {
    matrix: matrix,
    properties: properties
  };
  if (ol.extent.equals(targetExtent, properties.extent)) {
    return extended;
  }
  extended.properties = /** @type {ol.CoverageProperties} */ (ol.obj.assign({}, properties));
  extended.properties.resolution = properties.resolution.slice();
  extended.properties.extent = [targetExtent[0], targetExtent[1],
    targetExtent[2] + extended.properties.resolution[0] -
    ol.extent.getWidth(targetExtent) % extended.properties.resolution[0],
    targetExtent[3] + extended.properties.resolution[1] -
    ol.extent.getHeight(targetExtent) % extended.properties.resolution[1]];

  var left = Math.max(properties.extent[0] - extended.properties.extent[0], 0) /
    extended.properties.resolution[0];
  var bottom = Math.max(properties.extent[1] - extended.properties.extent[1], 0) /
    extended.properties.resolution[1];
  var right = Math.max(extended.properties.extent[2] - properties.extent[2], 0) /
    extended.properties.resolution[0];
  var top = Math.max(extended.properties.extent[3] - properties.extent[3], 0) /
    extended.properties.resolution[0];
  var cols = properties.stride + left + right;
  var rows = matrix.length / properties.stride + top + bottom;

  extended.properties.stride = cols;

  extended.matrix = new Array(cols * rows);
  var i, ii;
  var fillTop = top * cols;
  var fillBottom = (rows - bottom) * cols;
  var fillRight = cols - right;
  for (i = 0, ii = extended.matrix.length; i < ii; ++i) {
    if (i < fillTop || i >= fillBottom) {
      extended.matrix[i] = extended.properties.nodata;
    } else {
      var colPos = i % cols + 1;
      if (colPos <= left || colPos > fillRight) {
        extended.matrix[i] = extended.properties.nodata;
      } else {
        var rowPos = Math.floor(i / cols) - top;
        colPos -= left + 1;
        extended.matrix[i] = matrix[rowPos * properties.stride + colPos];
      }
    }

  }

  return extended;
};


/**
 * Returns the nearest x cells from the provided image coordinate in the provided matrix.
 * @param {ol.CoverageData} matrix Coverage data.
 * @param {ol.CoverageProperties} properties Coverage properties.
 * @param {ol.Coordinate} coord Image coordinate.
 * @param {number} numCells Number of nearest cells to return.
 * @return {Array.<number>} Distances and cell values.
 */
ol.coverage.util.getNearestCells = function(matrix, properties, coord, numCells) {
  var cellData = [];

  var offsetX = properties.resolution[0] / 2;
  var offsetY = properties.type === ol.coverage.CoverageType.HEXAGONAL ?
    properties.resolution[1] * (2 / 3) : properties.resolution[1] / 2;
  var r = Math.floor(coord[1] / properties.resolution[1]);
  var nearestY = offsetY + r * properties.resolution[1];
  var oddOffset = 0;
  if (properties.type === ol.coverage.CoverageType.HEXAGONAL) {
    oddOffset = ((nearestY - offsetY) / properties.resolution[1]) % 2 * offsetX;
  }
  var c = Math.floor(coord[0] / properties.resolution[0]);
  var nearestX = offsetX + c * properties.resolution[0] + oddOffset;
  nearestX -= nearestX > properties.extent[2] ? properties.resolution[0] + oddOffset : 0;
  nearestY -= nearestY > properties.extent[3] ? properties.resolution[1] : 0;
  // TODO: For hexagonal grids this is just an estimated starting point. Iterate through neighbors.
  cellData.push(Math.sqrt(Math.pow(nearestX - coord[0], 2) +
    Math.pow(nearestY - coord[1], 2)));

  var i = (matrix.length / properties.stride - r) * properties.stride + c;
  cellData.push(matrix[i]);
  // TODO: Implement finding KNN cells.
  return cellData;
};


/**
 * @private
 * @param {Array.<ol.Size>} resolutions Resolutions.
 * @return {ol.Size} Optimal resolution.
 */
ol.coverage.util.getOptimalResolution_ = function(resolutions) {
  var resolution;
  var diagonals = [];
  var i, ii;
  for (i = 0, ii = resolutions.length; i < ii; ++i) {
    var sign = resolutions[i][0] > resolutions[i][1] ? -1 : 1;
    var diagonal = Math.sqrt(Math.pow(resolutions[i][0], 2) + Math.pow(
        resolutions[i][1], 2));
    diagonals.push(diagonal * sign);
  }
  var mode = ol.math.mode(diagonals);
  if (mode.length > 1) {
    var abs = mode.map(Math.abs);
    var min = Math.min.apply(null, abs);
    resolution = resolutions[abs.indexOf(min)];
  } else {
    resolution = resolutions[diagonals.indexOf(mode[0])];
  }
  return resolution;
};
