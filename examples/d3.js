import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getWidth, getCenter} from '../src/ol/extent.js';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';
import {ImageCanvas as ImageCanvasSource, Stamen} from '../src/ol/source.js';


const map = new Map({
  layers: [
    new TileLayer({
      source: new Stamen({
        layer: 'watercolor'
      })
    })
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-97, 38]),
    zoom: 4
  })
});


/**
 * Load the topojson data and create an ol/layer/Image for that data.
 */
d3.json('data/topojson/us.json', function(error, us) {
  const features = topojson.feature(us, us.objects.counties);

  /**
   * This function uses d3 to render the topojson features to a canvas.
   * @param {module:ol/extent~Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {module:ol/size~Size} size Size.
   * @param {module:ol/proj/Projection~Projection} projection Projection.
   * @return {HTMLCanvasElement} A canvas element.
   */
  const canvasFunction = function(extent, resolution, pixelRatio, size, projection) {
    const canvasWidth = size[0];
    const canvasHeight = size[1];

    const canvas = d3.select(document.createElement('canvas'));
    canvas.attr('width', canvasWidth).attr('height', canvasHeight);

    const context = canvas.node().getContext('2d');

    const d3Projection = d3.geoMercator().scale(1).translate([0, 0]);
    let d3Path = d3.geoPath().projection(d3Projection);

    const pixelBounds = d3Path.bounds(features);
    const pixelBoundsWidth = pixelBounds[1][0] - pixelBounds[0][0];
    const pixelBoundsHeight = pixelBounds[1][1] - pixelBounds[0][1];

    const geoBounds = d3.geoBounds(features);
    const geoBoundsLeftBottom = fromLonLat(geoBounds[0], projection);
    const geoBoundsRightTop = fromLonLat(geoBounds[1], projection);
    let geoBoundsWidth = geoBoundsRightTop[0] - geoBoundsLeftBottom[0];
    if (geoBoundsWidth < 0) {
      geoBoundsWidth += getWidth(projection.getExtent());
    }
    const geoBoundsHeight = geoBoundsRightTop[1] - geoBoundsLeftBottom[1];

    const widthResolution = geoBoundsWidth / pixelBoundsWidth;
    const heightResolution = geoBoundsHeight / pixelBoundsHeight;
    const r = Math.max(widthResolution, heightResolution);
    const scale = r / (resolution / pixelRatio);

    const center = toLonLat(getCenter(extent), projection);
    d3Projection.scale(scale).center(center)
      .translate([canvasWidth / 2, canvasHeight / 2]);
    d3Path = d3Path.projection(d3Projection).context(context);
    d3Path(features);
    context.stroke();

    return canvas.node();
  };

  const layer = new ImageLayer({
    source: new ImageCanvasSource({
      canvasFunction: canvasFunction,
      projection: 'EPSG:3857'
    })
  });
  map.addLayer(layer);
});
