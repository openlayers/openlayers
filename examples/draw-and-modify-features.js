import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_interaction_Draw_ from '../src/ol/interaction/draw';
import _ol_interaction_Modify_ from '../src/ol/interaction/modify';
import _ol_interaction_Snap_ from '../src/ol/interaction/snap';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';

var raster = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var source = new _ol_source_Vector_();
var vector = new _ol_layer_Vector_({
  source: source,
  style: new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#ffcc33',
      width: 2
    }),
    image: new _ol_style_Circle_({
      radius: 7,
      fill: new _ol_style_Fill_({
        color: '#ffcc33'
      })
    })
  })
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: 'map',
  view: new _ol_View_({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

var modify = new _ol_interaction_Modify_({source: source});
map.addInteraction(modify);

var draw, snap; // global so we can remove them later
var typeSelect = document.getElementById('type');

function addInteractions() {
  draw = new _ol_interaction_Draw_({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ (typeSelect.value)
  });
  map.addInteraction(draw);
  snap = new _ol_interaction_Snap_({source: source});
  map.addInteraction(snap);

}

/**
 * Handle change event.
 */
typeSelect.onchange = function() {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  addInteractions();
};

addInteractions();
