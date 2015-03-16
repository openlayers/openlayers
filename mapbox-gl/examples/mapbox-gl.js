(function() {
  var match = location.search.match(/access_token=([^&\/]*)/);
  var accessToken = match && match[1];
  mapboxgl.accessToken = accessToken;
})();

var glMap = new mapboxgl.Map({
  style: 'https://www.mapbox.com/mapbox-gl-styles/styles/bright-v7.json',
  container: document.createElement('div'),
  interactive: false,
  attributionControl: false
});

var mapboxLayer = new ol.layer.Image();

glMap.on('render', function() {
  mapboxLayer.changed();
});

var map = new ol.Map({
  target: 'map',
  layers: [mapboxLayer],
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var mapboxSource = new ol.source.ImageCanvas({
  ratio: 1,
  projection: 'EPSG:3857',
  canvasFunction: function(extent, resolution, pixelRatio,
      size, projection) {
    var glTransform = glMap.transform;
    var width = size[0];
    var height = size[1];
    if (glTransform.width !== width || glTransform.height !== height) {
      glMap.canvas.resize(width, height);
      glMap.painter.resize(width, height);
      glTransform.width = width;
      glTransform.height = height;
    }
    var glCenter = ol.proj.transform(ol.extent.getCenter(extent),
        projection, 'EPSG:4326').reverse();
    var glZoom = map.getView().getZoom() - (pixelRatio >= 2 ? 0 : 1);
    glMap.setView(glCenter, glZoom, 0);
    glMap.render();
    // constrain center of ol map, because mapbox map constrains it
    var newGlCenter = glMap.getCenter();
    if (newGlCenter.lat != glCenter[0]) {
      map.getView().setCenter(ol.proj.transform(
          [newGlCenter.lng, newGlCenter.lat], 'EPSG:4326', 'EPSG:3857'));
    }
    return glMap.canvas.canvas;
  }
});

mapboxLayer.setSource(mapboxSource);
