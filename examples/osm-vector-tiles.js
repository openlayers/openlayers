goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.TopoJSON');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var format = new ol.format.TopoJSON();
var tileGrid = ol.tilegrid.createXYZ({maxZoom: 19});
var roadStyleCache = {};
var roadColor = {
  'major_road': '#776',
  'minor_road': '#ccb',
  'highway': '#f39'
};
var landuseStyleCache = {};
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
        format: format,
        tileGrid: tileGrid,
        url: 'http://{a-c}.tile.openstreetmap.us/' +
            'vectiles-water-areas/{z}/{x}/{y}.topojson'
      }),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: '#9db9e8'
        })
      })
    }),
    new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        format: format,
        tileGrid: tileGrid,
        url: 'http://{a-c}.tile.openstreetmap.us/' +
            'vectiles-highroad/{z}/{x}/{y}.topojson'
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
        format: format,
        tileGrid: tileGrid,
        url: 'http://{a-c}.tile.openstreetmap.us/' +
            'vectiles-buildings/{z}/{x}/{y}.topojson'
      }),
      style: function(f, resolution) {
        return (resolution < 10) ? buildingStyle : null;
      }
    }),
    new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        format: format,
        tileGrid: tileGrid,
        url: 'http://{a-c}.tile.openstreetmap.us/' +
            'vectiles-land-usages/{z}/{x}/{y}.topojson'
      }),
      visible: false,
      style: function(feature) {
        var kind = feature.get('kind');
        var styleKey = kind;
        var style = landuseStyleCache[styleKey];
        if (!style) {
          var color, width;
          color = {
            'parking': '#ddd',
            'industrial': '#aaa',
            'urban area': '#aaa',
            'park': '#76C759',
            'school': '#DA10E7',
            'garden': '#76C759',
            'pitch': '#D58F8D',
            'scrub': '#3E7D28',
            'residential': '#4C9ED9'
          }[kind];
          width = kind == 'highway' ? 1.5 : 1;
          style = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: color,
              width: width
            }),
            fill: new ol.style.Fill({
              color: color,
              opacity: 0.5
            })
          });
          landuseStyleCache[styleKey] = style;
        }
        return style;
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
