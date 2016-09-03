goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Image');
goog.require('ol.source.OSM');
goog.require('ol.source.ImageVector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');
goog.require('ol.style.Text');

var markers = new ol.layer.Image({
  source: new ol.source.ImageVector({
    source: new ol.source.Vector(),
    style: createClusterIcon
  })
});

var map = new ol.Map({
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    markers
  ],
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

// Declare the worker
var worker = new Worker('supercluster-worker.js');
var ready = false;

// When message received from worker, update the vector data
worker.onmessage = function(e) {
  if (e.data.ready) {
    ready = true;
    update();
  } else {
    markers.getSource().getSource().clear();
    var geojsonObject = {
      'type': 'FeatureCollection',
      'features': e.data
    };
    var features = (new ol.format.GeoJSON()).readFeatures(
      geojsonObject, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      }
    );
    markers.getSource().getSource().addFeatures(features);
  }
};

function update() {
  if (!ready) return;
  var bounds = ol.proj.transformExtent(
    map.getView().calculateExtent(map.getSize()),
    'EPSG:3857',
    'EPSG:4326'
  );
  worker.postMessage({
    bbox: bounds,
    zoom: map.getView().getZoom()
  });
}

// Update cluster at each move by calling the worker
map.on('moveend', update);

var iconStyle = new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    src: 'http://openlayers.org/en/v3.18.2/examples/data/icon.png'
  }))
});

var textFill = new ol.style.Fill({
  color: '#000'
});

function createClusterIcon(feature) {
  // If unclustered, display as an icon
  if (!feature.get('cluster')) {
    return iconStyle;
  }
  // If clustered, display the number
  // of points within the cluster
  if (feature.get('point_count')) {
    return [
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 20,
          fill: new ol.style.Fill({
            color: 'rgba(181, 226, 140, 0.6)'
          })
        })
      }),
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 15,
          fill: new ol.style.Fill({
            color: 'rgba(110, 204, 57, 0.6)'
          })
        }),
        text: new ol.style.Text({
          font: '12px "Helvetica Neue", Arial, Helvetica, sans-serif',
          text: '' + feature.get('point_count'),
          fill: textFill
        })
      })
    ];
  }
}
