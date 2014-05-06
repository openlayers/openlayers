var waterLayer = new ol.layer.Vector({
  source: new ol.source.TileVector({
    format: new ol.format.TopoJSON({
      defaultProjection: 'EPSG:4326'
    }),
    projection: 'EPSG:3857',
    tileGrid: new ol.tilegrid.XYZ({
      maxZoom: 19
    }),
    url: 'http://{a-c}.tile.openstreetmap.us/' +
        'vectiles-water-areas/{z}/{x}/{y}.topojson'
  }),
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: '#9db9e8'
    })
  })
});

var roadStyleCache = {};
var roadLayer = new ol.layer.Vector({
  source: new ol.source.TileVector({
    format: new ol.format.TopoJSON({
      defaultProjection: 'EPSG:4326'
    }),
    projection: 'EPSG:3857',
    tileGrid: new ol.tilegrid.XYZ({
      maxZoom: 19
    }),
    url: 'http://{a-c}.tile.openstreetmap.us/' +
        'vectiles-highroad/{z}/{x}/{y}.topojson'
  }),
  style: function(feature, resolution) {
    var kind = feature.get('kind');
    var railway = feature.get('railway');
    var sort_key = feature.get('sort_key');
    var styleKey = kind + '/' + railway + '/' + sort_key;
    var styleArray = roadStyleCache[styleKey];
    if (!styleArray) {
      var color, width;
      if (railway) {
        color = '#7de';
        width = 1;
      } else {
        color = {
          'major_road': '#776',
          'minor_road': '#ccb',
          'highway': '#f39'
        }[kind];
        width = kind == 'highway' ? 1.5 : 1;
      }
      styleArray = [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: color,
          width: width
        }),
        zIndex: sort_key
      })];
      roadStyleCache[styleKey] = styleArray;
    }
    return styleArray;
  }
});

var map = new ol.Map({
  layers: [waterLayer, roadLayer],
  renderer: 'canvas',
  target: document.getElementById('map'),
  view: new ol.View2D({
    center: ol.proj.transform([-74.0064, 40.7142], 'EPSG:4326', 'EPSG:3857'),
    maxZoom: 19,
    zoom: 14
  })
});
