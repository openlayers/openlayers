// NOCOMPILE
import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {getWidth, getCenter} from '../src/ol/extent.js';
import _ol_layer_Image_ from '../src/ol/layer/Image.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';
import _ol_source_ImageCanvas_ from '../src/ol/source/ImageCanvas.js';
import _ol_source_Stamen_ from '../src/ol/source/Stamen.js';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_Stamen_({
        layer: 'watercolor'
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: fromLonLat([-97, 38]),
    zoom: 4
  })
});


/**
 * Load the topojson data and create an ol.layer.Image for that data.
 */
d3.json('data/topojson/us.json', function(error, us) {
  var features = topojson.feature(us, us.objects.counties);

  /**
   * This function uses d3 to render the topojson features to a canvas.
   * @param {ol.Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {ol.Size} size Size.
   * @param {ol.proj.Projection} projection Projection.
   * @return {HTMLCanvasElement} A canvas element.
   */
  var canvasFunction = function(extent, resolution, pixelRatio, size, projection) {
    var canvasWidth = size[0];
    var canvasHeight = size[1];

    var canvas = d3.select(document.createElement('canvas'));
    canvas.attr('width', canvasWidth).attr('height', canvasHeight);

    var context = canvas.node().getContext('2d');

    var d3Projection = d3.geoMercator().scale(1).translate([0, 0]);
    var d3Path = d3.geoPath().projection(d3Projection);

    var pixelBounds = d3Path.bounds(features);
    var pixelBoundsWidth = pixelBounds[1][0] - pixelBounds[0][0];
    var pixelBoundsHeight = pixelBounds[1][1] - pixelBounds[0][1];

    var geoBounds = d3.geoBounds(features);
    var geoBoundsLeftBottom = fromLonLat(geoBounds[0], projection);
    var geoBoundsRightTop = fromLonLat(geoBounds[1], projection);
    var geoBoundsWidth = geoBoundsRightTop[0] - geoBoundsLeftBottom[0];
    if (geoBoundsWidth < 0) {
      geoBoundsWidth += getWidth(projection.getExtent());
    }
    var geoBoundsHeight = geoBoundsRightTop[1] - geoBoundsLeftBottom[1];

    var widthResolution = geoBoundsWidth / pixelBoundsWidth;
    var heightResolution = geoBoundsHeight / pixelBoundsHeight;
    var r = Math.max(widthResolution, heightResolution);
    var scale = r / (resolution / pixelRatio);

    var center = toLonLat(getCenter(extent), projection);
    d3Projection.scale(scale).center(center)
        .translate([canvasWidth / 2, canvasHeight / 2]);
    d3Path = d3Path.projection(d3Projection).context(context);
    d3Path(features);
    context.stroke();

    return canvas.node();
  };

  var layer = new _ol_layer_Image_({
    source: new _ol_source_ImageCanvas_({
      canvasFunction: canvasFunction,
      projection: 'EPSG:3857'
    })
  });
  map.addLayer(layer);
});
