import Graticule from '../src/ol/Graticule.js';
import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';


var map = new _ol_Map_({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_({
        wrapX: false
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: fromLonLat([4.8, 47.75]),
    zoom: 5
  })
});

// Create the graticule component
var graticule = new Graticule({
  // the style to use for the lines, optional.
  strokeStyle: new _ol_style_Stroke_({
    color: 'rgba(255,120,0,0.9)',
    width: 2,
    lineDash: [0.5, 4]
  }),
  showLabels: true
});

graticule.setMap(map);
