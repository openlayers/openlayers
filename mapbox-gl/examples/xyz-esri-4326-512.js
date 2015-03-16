var attribution = new ol.Attribution({
  html: 'Copyright:&copy; 2013 ESRI, i-cubed, GeoEye'
});

var projection = ol.proj.get('EPSG:4326');
var projectionExtent = projection.getExtent();

// The tile size supported by the ArcGIS tile service.
var tileSize = 512;

// Calculate the resolutions supported by the ArcGIS tile service.
// There are 16 resolutions, with a factor of 2 between successive
// resolutions. The max resolution is such that the world (360°)
// fits into two (512x512 px) tiles.
var maxResolution = ol.extent.getWidth(projectionExtent) / (tileSize * 2);
var resolutions = new Array(16);
var z;
for (z = 0; z < 16; ++z) {
  resolutions[z] = maxResolution / Math.pow(2, z);
}

var urlTemplate = 'http://services.arcgisonline.com/arcgis/rest/services/' +
    'ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}';

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      /* ol.source.XYZ and ol.tilegrid.XYZ have no resolutions config */
      source: new ol.source.TileImage({
        attributions: [attribution],
        tileUrlFunction: function(tileCoord, pixelRatio, projection) {
          var z = tileCoord[0];
          var x = tileCoord[1];
          var y = -tileCoord[2] - 1;
          // wrap the world on the X axis
          var n = Math.pow(2, z + 1); // 2 tiles at z=0
          x = x % n;
          if (x * n < 0) {
            // x and n differ in sign so add n to wrap the result
            // to the correct sign
            x = x + n;
          }
          return urlTemplate.replace('{z}', z.toString())
              .replace('{y}', y.toString())
              .replace('{x}', x.toString());
        },
        projection: projection,
        tileGrid: new ol.tilegrid.TileGrid({
          origin: ol.extent.getTopLeft(projectionExtent),
          resolutions: resolutions,
          tileSize: 512
        })
      })
    })
  ],
  view: new ol.View({
    center: [0, 0],
    projection: projection,
    zoom: 2,
    minZoom: 2
  })
});
