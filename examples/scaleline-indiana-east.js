goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.ScaleLine');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');

proj4.defs('Indiana-East', 'PROJCS["IN83-EF",GEOGCS["LL83",DATUM["NAD83",' +
    'SPHEROID["GRS1980",6378137.000,298.25722210]],PRIMEM["Greenwich",0],' +
    'UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],' +
    'PARAMETER["false_easting",328083.333],' +
    'PARAMETER["false_northing",820208.333],' +
    'PARAMETER["scale_factor",0.999966666667],' +
    'PARAMETER["central_meridian",-85.66666666666670],' +
    'PARAMETER["latitude_of_origin",37.50000000000000],' +
    'UNIT["Foot_US",0.30480060960122]]');

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
    projection: 'Indiana-East',
    center: ol.proj.fromLonLat([-85.685, 39.891], 'Indiana-East'),
    zoom: 7,
    extent: ol.proj.transformExtent([-172.54, 23.81, -47.74, 86.46],
        'EPSG:4326', 'Indiana-East'),
    minZoom: 6
  })
});

map.addControl(new ol.control.ScaleLine({units: 'us'}));
