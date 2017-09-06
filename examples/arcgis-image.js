import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_ImageArcGISRest_ from '../src/ol/source/imagearcgisrest';

var url = 'https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/' +
    'Specialty/ESRI_StateCityHighway_USA/MapServer';

var layers = [
  new _ol_layer_Tile_({
    source: new _ol_source_OSM_()
  }),
  new _ol_layer_Image_({
    source: new _ol_source_ImageArcGISRest_({
      ratio: 1,
      params: {},
      url: url
    })
  })
];
var map = new _ol_Map_({
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
