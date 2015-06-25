// NOCOMPILE
// this example uses d3 for which we don't have an externs file.
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Raster');

function tgi(pixels, data) {
  var pixel = pixels[0];
  var r = pixel[0] / 255;
  var g = pixel[1] / 255;
  var b = pixel[2] / 255;
  var value = (120 * (r - b) - (190 * (r - g))) / 2;
  pixel[0] = value;
  return pixels;
}


function summarize(pixels, data) {
  var value = pixels[0][0];
  data.counts.increment(value);
  return pixels;
}

function color(pixels, data) {
  var pixel = pixels[0];
  var value = pixel[0];
  if (value > data.threshold) {
    pixel[0] = 0;
    pixel[1] = 255;
    pixel[2] = 0;
    pixel[3] = 128;
  } else {
    pixel[3] = 0;
  }
  return pixels;
}

var bing = new ol.source.BingMaps({
  key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
  imagerySet: 'Aerial'
});

var raster = new ol.source.Raster({
  sources: [bing],
  operations: [tgi, summarize, color]
});

var counts = new Counts(0, 25);
var threshold = 10;

raster.on('beforeoperations', function(event) {
  counts.clear();
  event.data.counts = counts;
  event.data.threshold = threshold;
});

raster.on('afteroperations', function(event) {
  schedulePlot(event.resolution, event.data.counts);
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



/**
 * Maintain counts of values between a min and max.
 * @param {number} min The minimum value (inclusive).
 * @param {[type]} max The maximum value (exclusive).
 * @constructor
 */
function Counts(min, max) {
  this.min = min;
  this.max = max;
  this.values = new Array(max - min);
}


/**
 * Clear all counts.
 */
Counts.prototype.clear = function() {
  for (var i = 0, ii = this.values.length; i < ii; ++i) {
    this.values[i] = 0;
  }
};


/**
 * Increment the count for a value.
 * @param {number} value The value.
 */
Counts.prototype.increment = function(value) {
  value = Math.floor(value);
  if (value >= this.min && value < this.max) {
    this.values[value - this.min] += 1;
  }
};

var timer = null;
function schedulePlot(resolution, counts) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(plot.bind(null, resolution, counts), 1000 / 60);
}

var barWidth = 15;
var plotHeight = 150;
var chart = d3.select('#plot').append('svg')
    .attr('width', barWidth * counts.values.length)
    .attr('height', plotHeight);

var chartRect = chart[0][0].getBoundingClientRect();

var tip = d3.select(document.body).append('div')
    .attr('class', 'tip');

function plot(resolution, counts) {
  var yScale = d3.scale.linear()
      .domain([0, d3.max(counts.values)])
      .range([0, plotHeight]);

  var bar = chart.selectAll('rect').data(counts.values);

  bar.enter().append('rect');

  bar.attr('class', function(value, index) {
    return 'bar' + (index - counts.min >= threshold ? ' selected' : '');
  })
  .attr('width', barWidth - 2);

  bar.transition()
      .attr('transform', function(value, index) {
        return 'translate(' + (index * barWidth) + ', ' +
            (plotHeight - yScale(value)) + ')';
      })
      .attr('height', yScale);

  bar.on('mousemove', function() {
    var old = threshold;
    threshold = counts.min +
        Math.floor((d3.event.pageX - chartRect.left) / barWidth);
    if (old !== threshold) {
      map.render();
    }
  });

  bar.on('mouseover', function() {
    var index = Math.floor((d3.event.pageX - chartRect.left) / barWidth);
    var area = 0;
    for (var i = counts.values.length - 1; i >= index; --i) {
      area += resolution * resolution * counts.values[i];
    }
    tip.html(message(index + counts.min, area));
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
  return acres + ' acres at<br>' + value + ' TGI or above';
}
