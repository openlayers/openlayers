import _ol_Graticule_ from '../src/ol/graticule';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_style_Stroke_ from '../src/ol/style/stroke';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_({
        wrapX: false
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([4.8, 47.75]),
    extent: _ol_proj_.get('EPSG:3857').getExtent(),
    zoom: 5
  })
});

// Create the graticule component
var graticule = new _ol_Graticule_({
  // the style to use for the lines, optional.
  strokeStyle: new _ol_style_Stroke_({
    color: 'rgba(255,120,0,0.9)',
    width: 2,
    lineDash: [0.5, 4]
  }),
  showLabels: true
});

graticule.setMap(map);
