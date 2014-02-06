// NOCOMPILE
// This example uses the GMapx v3 API, which we do not have an exports file for.
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.interaction');
goog.require('ol.interaction.DragPan');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.GeoJSON');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var gmap = new google.maps.Map(document.getElementById('map'), {
  center: new google.maps.LatLng(0, 0),
  zoom: 1,
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: false,
  streetViewControl: false
});

var olmap = document.createElement('div');
olmap.style['width'] = '100%';
olmap.style['height'] = '100%';
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olmap);

google.maps.event.addListenerOnce(gmap, 'tilesloaded', function() {
  var vector = new ol.layer.Vector({
    source: new ol.source.GeoJSON({
      url: 'data/geojson/countries.geojson',
      projection: 'EPSG:3857'
    }),
    styleFunction: (function() {
      var styleArray = [new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.6)'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          width: 1
        })
      })];
      return function(feature, resolution) {
        return styleArray;
      };
    }())
  });

  var center = gmap.getCenter();
  var map = new ol.Map({
    layers: [vector],
    interactions: ol.interaction.defaults({dragPan: false})
        .extend([new ol.interaction.DragPan({kinetic: false})]),
    renderer: ol.RendererHint.CANVAS,
    target: olmap,
    view: new ol.View2D({
      center: ol.proj.transform([center.lng(), center.lat()],
          'EPSG:4326', 'EPSG:3857'),
      zoom: gmap.getZoom()
    })
  });

  var view = map.getView().getView2D();
  view.on('change:center', function() {
    var center = ol.proj.transform(view.getCenter(),
        'EPSG:3857', 'EPSG:4326');
    gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
  });
  view.on('change:resolution', function() {
    gmap.setZoom(view.getZoom());
  });
});
