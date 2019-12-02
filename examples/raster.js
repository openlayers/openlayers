import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import XYZ from '../src/ol/source/XYZ.js';
import RasterSource from '../src/ol/source/Raster.js';

const minVgi = 0;
const maxVgi = 0.25;
const bins = 10;


/**
 * Calculate the Vegetation Greenness Index (VGI) from an input pixel.  This
 * is a rough estimate assuming that pixel values correspond to reflectance.
 * @param {Array<number>} pixel An array of [R, G, B, A] values.
 * @return {number} The VGI value for the given pixel.
 */
function vgi(pixel) {
  const r = pixel[0] / 255;
  const g = pixel[1] / 255;
  const b = pixel[2] / 255;
  return (2 * g - r - b) / (2 * g + r + b);
}


/**
 * Summarize values for a histogram.
 * @param {numver} value A VGI value.
 * @param {Object} counts An object for keeping track of VGI counts.
 */
function summarize(value, counts) {
  const min = counts.min;
  const max = counts.max;
  const num = counts.values.length;
  if (value < min) {
    // do nothing
  } else if (value >= max) {
    counts.values[num - 1] += 1;
  } else {
    const index = Math.floor((value - min) / counts.delta);
    counts.values[index] += 1;
  }
}


/**
 * Use aerial imagery as the input data for the raster source.
 */

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const aerial = new XYZ({
  attributions: attributions,
  url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
  maxZoom: 20,
  crossOrigin: ''
});


/**
 * Create a raster source where pixels with VGI values above a threshold will
 * be colored green.
 */
const raster = new RasterSource({
  sources: [aerial],
  /**
   * Run calculations on pixel data.
   * @param {Array} pixels List of pixels (one per source).
   * @param {Object} data User data object.
   * @return {Array} The output pixel.
   */
  operation: function(pixels, data) {
    const pixel = pixels[0];
    const value = vgi(pixel);
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
  const values = new Array(num);
  for (let i = 0; i < num; ++i) {
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

const map = new Map({
  layers: [
    new TileLayer({
      source: aerial
    }),
    new ImageLayer({
      source: raster
    })
  ],
  target: 'map',
  view: new View({
    center: [-9651695, 4937351],
    zoom: 13,
    minZoom: 12,
    maxZoom: 19
  })
});


let timer = null;
function schedulePlot(resolution, counts, threshold) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(plot.bind(null, resolution, counts, threshold), 1000 / 60);
}

const barWidth = 15;
const plotHeight = 150;
const chart = d3.select('#plot').append('svg')
  .attr('width', barWidth * bins)
  .attr('height', plotHeight);

const chartRect = chart.node().getBoundingClientRect();

const tip = d3.select(document.body).append('div')
  .attr('class', 'tip');

function plot(resolution, counts, threshold) {
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(counts.values)])
    .range([0, plotHeight]);

  const bar = chart.selectAll('rect').data(counts.values);

  bar.enter().append('rect');

  bar.attr('class', function(count, index) {
    const value = counts.min + (index * counts.delta);
    return 'bar' + (value >= threshold ? ' selected' : '');
  })
    .attr('width', barWidth - 2);

  bar.transition().attr('transform', function(value, index) {
    return 'translate(' + (index * barWidth) + ', ' +
        (plotHeight - yScale(value)) + ')';
  })
    .attr('height', yScale);

  bar.on('mousemove', function(count, index) {
    const threshold = counts.min + (index * counts.delta);
    if (raster.get('threshold') !== threshold) {
      raster.set('threshold', threshold);
      raster.changed();
    }
  });

  bar.on('mouseover', function(count, index) {
    let area = 0;
    for (let i = counts.values.length - 1; i >= index; --i) {
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
  const acres = (area / 4046.86).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return acres + ' acres at<br>' + value.toFixed(2) + ' VGI or above';
}
