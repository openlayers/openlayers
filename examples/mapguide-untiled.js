import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ImageLayer from '../src/ol/layer/Image.js';
import ImageMapGuide from '../src/ol/source/ImageMapGuide.js';

const mdf = 'Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition';
const agentUrl =
    'http://138.197.230.93:8008/mapguide/mapagent/mapagent.fcgi?';
const bounds = [
  -87.865114442365922,
  43.665065564837931,
  -87.595394059497067,
  43.823852564430069
];
const map = new Map({
  layers: [
    new ImageLayer({
      extent: bounds,
      source: new ImageMapGuide({
        projection: 'EPSG:4326',
        url: agentUrl,
        useOverlay: false,
        metersPerUnit: 111319.4908, //value returned from mapguide
        params: {
          MAPDEFINITION: mdf,
          FORMAT: 'PNG',
          VERSION: '3.0.0',
          USERNAME: 'OLGuest',
          PASSWORD: 'olguest'
        },
        ratio: 2
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [-87.7302542509315, 43.744459064634],
    projection: 'EPSG:4326',
    zoom: 12
  })
});
