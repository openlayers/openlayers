goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.MultiPoint');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var styles = [
  /* We are using two different styles for the polygons:
   *  - The first style is for the polygons themselves.
   *  - The second style is to draw the vertices of the polygons.
   *    In a custom `geometry` function the vertices of a polygon are
   *    returned as `MultiPoint` geometry, which will be used to render
   *    the style.
   */
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'blue',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  }),
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5,
      fill: new ol.style.Fill({
        color: 'orange'
      })
    }),
    geometry: function(feature) {
      // return the coordinates of the first ring of the polygon
      var coordinates = feature.getGeometry().getCoordinates()[0];
      return new ol.geom.MultiPoint(coordinates);
    }
  })
];

var geojsonObject = {
  'type': 'FeatureCollection',
  'crs': {
    'type': 'name',
    'properties': {
      'name': 'EPSG:3857'
    }
  },
  'features': [{
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6],
          [-3e6, 6e6], [-5e6, 6e6]]]
    }
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[[-2e6, 6e6], [-2e6, 8e6], [0, 8e6],
          [0, 6e6], [-2e6, 6e6]]]
    }
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6],
          [3e6, 6e6], [1e6, 6e6]]]
    }
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[[-2e6, -1e6], [-1e6, 1e6],
          [0, -1e6], [-2e6, -1e6]]]
    }
  }]
};

var source = new ol.source.Vector({
  features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
});

var layer = new ol.layer.Vector({
  source: source,
  style: styles
});

var map = new ol.Map({
  layers: [layer],
  target: 'map',
  view: new ol.View({
    center: [0, 3000000],
    zoom: 2
  })
});
