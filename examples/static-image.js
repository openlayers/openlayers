goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.proj.Projection');
goog.require('ol.source.ImageStatic');


// Maps always need a projection, but the static image is not geo-referenced,
// and are only measured in pixels.  So, we create a fake projection that the
// map can use to properly display the layer.
var pixelProjection = new ol.proj.Projection({
  code: 'pixel',
  units: 'pixels',
  extent: [0, 0, 1024, 968]
});

var map = new ol.Map({
  layers: [
    new ol.layer.Image({
      source: new ol.source.ImageStatic({
        attributions: [
          new ol.Attribution({
            html: '&copy; <a href="http://xkcd.com/license.html">xkcd</a>'
          })
        ],
        url: 'http://imgs.xkcd.com/comics/online_communities.png',
        imageSize: [1024, 968],
        projection: pixelProjection,
        imageExtent: pixelProjection.getExtent()
      })
    })
  ],
  target: 'map',
  view: new ol.View({
    projection: pixelProjection,
    center: ol.extent.getCenter(pixelProjection.getExtent()),
    zoom: 2
  })
});
