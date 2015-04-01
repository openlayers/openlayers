// NOCOMPILE
// this example uses d3 for which we don't have an externs file.
goog.require('ol');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.ImageCanvas');
goog.require('ol.source.Stamen');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.Stamen({
        layer: 'watercolor'
      })
    })
  ],
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform([-97, 38], 'EPSG:4326', 'EPSG:3857'),
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
   * @return {HTMLCanvasElement}
   */
  var canvasFunction = function(extent, resolution, pixelRatio,
      size, projection) {
    var canvasWidth = size[0];
    var canvasHeight = size[1];

    var canvas = d3.select(document.createElement('canvas'));
    canvas.attr('width', canvasWidth).attr('height', canvasHeight);

    var context = canvas.node().getContext('2d');

    var d3Projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var d3Path = d3.geo.path().projection(d3Projection);

    var pixelBounds = d3Path.bounds(features);
    var pixelBoundsWidth = pixelBounds[1][0] - pixelBounds[0][0];
    var pixelBoundsHeight = pixelBounds[1][1] - pixelBounds[0][1];

    var geoBounds = d3.geo.bounds(features);
    var geoBoundsLeftBottom = ol.proj.transform(
        geoBounds[0], 'EPSG:4326', projection);
    var geoBoundsRightTop = ol.proj.transform(
        geoBounds[1], 'EPSG:4326', projection);
    var geoBoundsWidth = geoBoundsRightTop[0] - geoBoundsLeftBottom[0];
    if (geoBoundsWidth < 0) {
      geoBoundsWidth += ol.extent.getWidth(projection.getExtent());
    }
    var geoBoundsHeight = geoBoundsRightTop[1] - geoBoundsLeftBottom[1];

    var widthResolution = geoBoundsWidth / pixelBoundsWidth;
    var heightResolution = geoBoundsHeight / pixelBoundsHeight;
    var r = Math.max(widthResolution, heightResolution);
    var scale = r / (resolution / pixelRatio);

    var center = ol.proj.transform(ol.extent.getCenter(extent),
        projection, 'EPSG:4326');
    d3Projection.scale(scale).center(center)
        .translate([canvasWidth / 2, canvasHeight / 2]);
    d3Path = d3Path.projection(d3Projection).context(context);
    d3Path(features);
    context.stroke();

    return canvas[0][0];
  };

  var layer = new ol.layer.Image({
    source: new ol.source.ImageCanvas({
      canvasFunction: canvasFunction,
      projection: 'EPSG:3857'
    })
  });
  map.addLayer(layer);
});
