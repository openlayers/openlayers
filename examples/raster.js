// NOCOMPILE
// this example uses d3 for which we don't have an externs file.
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Raster');

var minVgi = 0;
var maxVgi = 0.25;
var bins = 10;


/**
 * Calculate the Vegetation Greenness Index (VGI) from an input pixel.  This
 * is a rough estimate assuming that pixel values correspond to reflectance.
 * @param {Array.<number>} pixel An array of [R, G, B, A] values.
 * @return {number} The VGI value for the given pixel.
 */
function vgi(pixel) {
  var r = pixel[0] / 255;
  var g = pixel[1] / 255;
  var b = pixel[2] / 255;
  return (2 * g - r - b) / (2 * g + r + b);
}


/**
 * Summarize values for a histogram.
 * @param {numver} value A VGI value.
 * @param {Object} counts An object for keeping track of VGI counts.
 */
function summarize(value, counts) {
  var min = counts.min;
  var max = counts.max;
  var num = counts.values.length;
  if (value < min) {
    // do nothing
  } else if (value >= max) {
    counts.values[num - 1] += 1;
  } else {
    var index = Math.floor((value - min) / counts.delta);
    counts.values[index] += 1;
  }
}


/**
 * Use aerial imagery as the input data for the raster source.
 */
var bing = new ol.source.BingMaps({
  key: 'AkGbxXx6tDWf1swIhPJyoAVp06H0s0gDTYslNWWHZ6RoPqMpB9ld5FY1WutX8UoF',
  imagerySet: 'Aerial'
});


/**
 * Create a raster source where pixels with VGI values above a threshold will
 * be colored green.
 */
var raster = new ol.source.Raster({
  sources: [bing],
  /**
   * Run calculations on pixel data.
   * @param {Array} pixels List of pixels (one per source).
   * @param {Object} data User data object.
   * @return {Array} The output pixel.
   */
  operation: function(pixels, data) {
    var pixel = pixels[0];
    var value = vgi(pixel);
    summarize(value, data.counts);
    if (value >= data.threshold) {
      pixel[0] = 0;
      pixel[1] = 255;
      pixel[2] = 0;
      pixel[3] = 128;
    } else {
      pixel[3] = 0;
    }
    return pixel;
  },
  lib: {
    vgi: vgi,
    summarize: summarize
  }
});
raster.set('threshold', 0.1);

function createCounts(min, max, num) {
  var values = new Array(num);
  for (var i = 0; i < num; ++i) {
    values[i] = 0;
  }
  return {
    min: min,
    max: max,
    values: values,
    delta: (max - min) / num
  };
}

raster.on('beforeoperations', function(event) {
  event.data.counts = createCounts(minVgi, maxVgi, bins);
  event.data.threshold = raster.get('threshold');
});

raster.on('afteroperations', function(event) {
  schedulePlot(event.resolution, event.data.counts, event.data.threshold);
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: bing
    }),
    new ol.layer.Image({
      source: raster
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [-9651695, 4937351],
    zoom: 13,
    minZoom: 12,
    maxZoom: 19
  })
});


var timer = null;
function schedulePlot(resolution, counts, threshold) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(plot.bind(null, resolution, counts, threshold), 1000 / 60);
}

var barWidth = 15;
var plotHeight = 150;
var chart = d3.select('#plot').append('svg')
    .attr('width', barWidth * bins)
    .attr('height', plotHeight);

var chartRect = chart[0][0].getBoundingClientRect();

var tip = d3.select(document.body).append('div')
    .attr('class', 'tip');

function plot(resolution, counts, threshold) {
  var yScale = d3.scale.linear()
      .domain([0, d3.max(counts.values)])
      .range([0, plotHeight]);

  var bar = chart.selectAll('rect').data(counts.values);

  bar.enter().append('rect');

  bar.attr('class', function(count, index) {
    var value = counts.min + (index * counts.delta);
    return 'bar' + (value >= threshold ? ' selected' : '');
  })
  .attr('width', barWidth - 2);

  bar.transition().attr('transform', function(value, index) {
    return 'translate(' + (index * barWidth) + ', ' +
        (plotHeight - yScale(value)) + ')';
  })
  .attr('height', yScale);

  bar.on('mousemove', function(count, index) {
    var threshold = counts.min + (index * counts.delta);
    if (raster.get('threshold') !== threshold) {
      raster.set('threshold', threshold);
      raster.changed();
    }
  });

  bar.on('mouseover', function(count, index) {
    var area = 0;
    for (var i = counts.values.length - 1; i >= index; --i) {
      area += resolution * resolution * counts.values[i];
    }
    tip.html(message(counts.min + (index * counts.delta), area));
    tip.style('display', 'block');
    tip.transition().style({
      left: (chartRect.left + (index * barWidth) + (barWidth / 2)) + 'px',
      top: (d3.event.y - 60) + 'px',
      opacity: 1
    });
  });

  bar.on('mouseout', function() {
    tip.transition().style('opacity', 0).each('end', function() {
      tip.style('display', 'none');
    });
  });

}

function message(value, area) {
  var acres = (area / 4046.86).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return acres + ' acres at<br>' + value.toFixed(2) + ' VGI or above';
}
