import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import ScaleLine from '../src/ol/control/ScaleLine.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import {fromLonLat, transformExtent} from '../src/ol/proj.js';
import {register} from '../src/ol/proj/proj4.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import proj4 from 'proj4';

proj4.defs('Indiana-East', 'PROJCS["IN83-EF",GEOGCS["LL83",DATUM["NAD83",' +
    'SPHEROID["GRS1980",6378137.000,298.25722210]],PRIMEM["Greenwich",0],' +
    'UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],' +
    'PARAMETER["false_easting",328083.333],' +
    'PARAMETER["false_northing",820208.333],' +
    'PARAMETER["scale_factor",0.999966666667],' +
    'PARAMETER["central_meridian",-85.66666666666670],' +
    'PARAMETER["latitude_of_origin",37.50000000000000],' +
    'UNIT["Foot_US",0.30480060960122]]');
register(proj4);

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
    projection: 'Indiana-East',
    center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
    zoom: 7,
    extent: transformExtent([-172.54, 23.81, -47.74, 86.46],
        'EPSG:4326', 'Indiana-East'),
    minZoom: 6
  })
});

map.addControl(new ScaleLine({units: 'us'}));
