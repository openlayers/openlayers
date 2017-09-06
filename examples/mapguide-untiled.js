import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_source_ImageMapGuide_ from '../src/ol/source/imagemapguide';

var mdf = 'Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition';
var agentUrl =
    'http://data.mapguide.com/mapguide/mapagent/mapagent.fcgi?USERNAME=Anonymous';
var bounds = [
  -87.865114442365922,
  43.665065564837931,
  -87.595394059497067,
  43.823852564430069
];
var map = new _ol_Map_({
  layers: [
    new _ol_layer_Image_({
      extent: bounds,
      source: new _ol_source_ImageMapGuide_({
        projection: 'EPSG:4326',
        url: agentUrl,
        useOverlay: false,
        metersPerUnit: 111319.4908, //value returned from mapguide
        params: {
          MAPDEFINITION: mdf,
          FORMAT: 'PNG'
        },
        ratio: 2
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [-87.7302542509315, 43.744459064634],
    projection: 'EPSG:4326',
    zoom: 12
  })
});
