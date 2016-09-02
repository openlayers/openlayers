goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.TopoJSON');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.tilegrid');


var key = 'vector-tiles-5eJz6JX';

var attribution = [new ol.Attribution({
  html: '&copy; OpenStreetMap contributors, Who’s On First, Natural Earth, and openstreetmapdata.com'
})];
var format = new ol.format.TopoJSON();
var tileGrid = ol.tilegrid.createXYZ({maxZoom: 19});
var roadStyleCache = {};
var roadColor = {
  'major_road': '#776',
  'minor_road': '#ccb',
  'highway': '#f39'
};
var buildingStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: '#666',
    opacity: 0.4
  }),
  stroke: new ol.style.Stroke({
    color: '#444',
    width: 1
  })
});

var map = new ol.Map({
  layers: [
    new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        attributions: attribution,
        format: format,
        tileGrid: tileGrid,
        url: 'https://vector.mapzen.com/osm/water/{z}/{x}/{y}.topojson?api_key=' + key
      }),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: '#9db9e8'
        })
      })
    }),
    new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        attributions: attribution,
        format: format,
        tileGrid: tileGrid,
        url: 'https://vector.mapzen.com/osm/roads/{z}/{x}/{y}.topojson?api_key=' + key
      }),
      style: function(feature) {
        var kind = feature.get('kind');
        var railway = feature.get('railway');
        var sort_key = feature.get('sort_key');
        var styleKey = kind + '/' + railway + '/' + sort_key;
        var style = roadStyleCache[styleKey];
        if (!style) {
          var color, width;
          if (railway) {
            color = '#7de';
            width = 1;
          } else {
            color = roadColor[kind];
            width = kind == 'highway' ? 1.5 : 1;
          }
          style = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: color,
              width: width
            }),
            zIndex: sort_key
          });
          roadStyleCache[styleKey] = style;
        }
        return style;
      }
    }),
    new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        attributions: attribution,
        format: format,
        tileGrid: tileGrid,
        url: 'https://vector.mapzen.com/osm/buildings/{z}/{x}/{y}.topojson?api_key=' + key
      }),
      style: function(f, resolution) {
        return (resolution < 10) ? buildingStyle : null;
      }
    })
  ],
  target: 'map',
  view: new ol.View({
    center: ol.proj.fromLonLat([-74.0064, 40.7142]),
    maxZoom: 19,
    zoom: 15
  })
});
