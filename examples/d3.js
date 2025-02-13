import {json} from 'd3-fetch';
import {geoBounds, geoMercator, geoPath} from 'd3-geo';
import {select} from 'd3-selection';
import {feature} from 'topojson-client';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter, getWidth} from '../src/ol/extent.js';
import Layer from '../src/ol/layer/Layer.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';
import StadiaMaps from '../src/ol/source/StadiaMaps.js';

class CanvasLayer extends Layer {
  constructor(options) {
    super(options);

    this.features = options.features;

    this.svg = select(document.createElement('div'))
      .append('svg')
      .style('position', 'absolute');

    this.svg.append('path').datum(this.features).attr('class', 'boundary');
  }

  getSourceState() {
    return 'ready';
  }

  render(frameState) {
    const width = frameState.size[0];
    const height = frameState.size[1];
    const projection = frameState.viewState.projection;
    const d3Projection = geoMercator().scale(1).translate([0, 0]);
    let d3Path = geoPath().projection(d3Projection);

    const pixelBounds = d3Path.bounds(this.features);
    const pixelBoundsWidth = pixelBounds[1][0] - pixelBounds[0][0];
    const pixelBoundsHeight = pixelBounds[1][1] - pixelBounds[0][1];

    const bounds = geoBounds(this.features);
    const geoBoundsLeftBottom = fromLonLat(bounds[0], projection);
    const geoBoundsRightTop = fromLonLat(bounds[1], projection);
    let geoBoundsWidth = geoBoundsRightTop[0] - geoBoundsLeftBottom[0];
    if (geoBoundsWidth < 0) {
      geoBoundsWidth += getWidth(projection.getExtent());
    }
    const geoBoundsHeight = geoBoundsRightTop[1] - geoBoundsLeftBottom[1];

    const widthResolution = geoBoundsWidth / pixelBoundsWidth;
    const heightResolution = geoBoundsHeight / pixelBoundsHeight;
    const r = Math.max(widthResolution, heightResolution);
    const scale = r / frameState.viewState.resolution;

    const center = toLonLat(getCenter(frameState.extent), projection);
    const angle = (-frameState.viewState.rotation * 180) / Math.PI;

    d3Projection
      .scale(scale)
      .center(center)
      .translate([width / 2, height / 2])
      .angle(angle);

    d3Path = d3Path.projection(d3Projection);
    d3Path(this.features);

    this.svg.attr('width', width);
    this.svg.attr('height', height);

    this.svg.select('path').attr('d', d3Path);

    return this.svg.node();
  }
}

const map = new Map({
  layers: [
    new TileLayer({
      source: new StadiaMaps({
        layer: 'stamen_watercolor',
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-97, 38]),
    zoom: 4,
  }),
});

/**
 * Load the topojson data and create an ol/layer/Layer for that data.
 */
json('data/topojson/us.json').then(function (us) {
  const layer = new CanvasLayer({
    features: feature(us, 'counties'),
  });

  map.addLayer(layer);
});
