var projection = ol.proj.get('EPSG:900913');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(18);
var matrixIds = new Array(18);
for (var z = 0; z < 18; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      opacity: 0.7
    }),
    new ol.layer.Tile({
      opacity: 0.7,
      source: new ol.source.WMTS({
        url: 'http://demo-apollo.geospatial.intergraph.com/erdas-iws/ogc/wmts/',
        layer: 'sampleiws_images_geodetic_worldgeodemo.ecw',
        matrixSet: 'ogc:1.0:googlemapscompatible',
        format: 'image/jpeg',
        projection: projection,
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getTopLeft(projectionExtent),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
        style: 'default'
      })
    })
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 0,
    maxResolution: resolutions[1]
  })
});
