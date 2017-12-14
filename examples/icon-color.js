import _ol_Feature_ from '../src/ol/Feature.js';
import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_TileJSON_ from '../src/ol/source/TileJSON.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Icon_ from '../src/ol/style/Icon.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var rome = new _ol_Feature_({
  geometry: new Point(fromLonLat([12.5, 41.9]))
});

var london = new _ol_Feature_({
  geometry: new Point(fromLonLat([-0.12755, 51.507222]))
});

var madrid = new _ol_Feature_({
  geometry: new Point(fromLonLat([-3.683333, 40.4]))
});

rome.setStyle(new _ol_style_Style_({
  image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
    color: '#8959A8',
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));

london.setStyle(new _ol_style_Style_({
  image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
    color: '#4271AE',
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));

madrid.setStyle(new _ol_style_Style_({
  image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
    color: [113, 140, 0],
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));


var vectorSource = new _ol_source_Vector_({
  features: [rome, london, madrid]
});

var vectorLayer = new _ol_layer_Vector_({
  source: vectorSource
});

var rasterLayer = new _ol_layer_Tile_({
  source: new _ol_source_TileJSON_({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
    crossOrigin: ''
  })
});

var map = new _ol_Map_({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: fromLonLat([2.896372, 44.60240]),
    zoom: 3
  })
});
