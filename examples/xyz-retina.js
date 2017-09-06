import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_XYZ_ from '../src/ol/source/xyz';

var mapMinZoom = 1;
var mapMaxZoom = 15;
var mapExtent = [-112.261791, 35.983744, -112.113981, 36.132062];

var map = new _ol_Map_({
  target: 'map',
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    new _ol_layer_Tile_({
      extent: _ol_proj_.transformExtent(mapExtent, 'EPSG:4326', 'EPSG:3857'),
      source: new _ol_source_XYZ_({
        attributions: 'Tiles © USGS, rendered with ' +
            '<a href="http://www.maptiler.com/">MapTiler</a>',
        url: 'https://tileserver.maptiler.com/grandcanyon@2x/{z}/{x}/{y}.png',
        tilePixelRatio: 2, // THIS IS IMPORTANT
        minZoom: mapMinZoom,
        maxZoom: mapMaxZoom
      })
    })
  ],
  view: new _ol_View_({
    projection: 'EPSG:3857',
    center: _ol_proj_.transform([-112.18688965, 36.057944835],
        'EPSG:4326', 'EPSG:3857'),
    zoom: 12
  })
});
