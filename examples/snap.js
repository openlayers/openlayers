import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_interaction_Draw_ from '../src/ol/interaction/draw';
import _ol_interaction_Modify_ from '../src/ol/interaction/modify';
import _ol_interaction_Select_ from '../src/ol/interaction/select';
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

var vector = new _ol_layer_Vector_({
  source: new _ol_source_Vector_(),
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

var Modify = {
  init: function() {
    this.select = new _ol_interaction_Select_();
    map.addInteraction(this.select);

    this.modify = new _ol_interaction_Modify_({
      features: this.select.getFeatures()
    });
    map.addInteraction(this.modify);

    this.setEvents();
  },
  setEvents: function() {
    var selectedFeatures = this.select.getFeatures();

    this.select.on('change:active', function() {
      selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
    });
  },
  setActive: function(active) {
    this.select.setActive(active);
    this.modify.setActive(active);
  }
};
Modify.init();

var optionsForm = document.getElementById('options-form');

var Draw = {
  init: function() {
    map.addInteraction(this.Point);
    this.Point.setActive(false);
    map.addInteraction(this.LineString);
    this.LineString.setActive(false);
    map.addInteraction(this.Polygon);
    this.Polygon.setActive(false);
    map.addInteraction(this.Circle);
    this.Circle.setActive(false);
  },
  Point: new _ol_interaction_Draw_({
    source: vector.getSource(),
    type: /** @type {ol.geom.GeometryType} */ ('Point')
  }),
  LineString: new _ol_interaction_Draw_({
    source: vector.getSource(),
    type: /** @type {ol.geom.GeometryType} */ ('LineString')
  }),
  Polygon: new _ol_interaction_Draw_({
    source: vector.getSource(),
    type: /** @type {ol.geom.GeometryType} */ ('Polygon')
  }),
  Circle: new _ol_interaction_Draw_({
    source: vector.getSource(),
    type: /** @type {ol.geom.GeometryType} */ ('Circle')
  }),
  getActive: function() {
    return this.activeType ? this[this.activeType].getActive() : false;
  },
  setActive: function(active) {
    var type = optionsForm.elements['draw-type'].value;
    if (active) {
      this.activeType && this[this.activeType].setActive(false);
      this[type].setActive(true);
      this.activeType = type;
    } else {
      this.activeType && this[this.activeType].setActive(false);
      this.activeType = null;
    }
  }
};
Draw.init();


/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */
optionsForm.onchange = function(e) {
  var type = e.target.getAttribute('name');
  var value = e.target.value;
  if (type == 'draw-type') {
    Draw.getActive() && Draw.setActive(true);
  } else if (type == 'interaction') {
    if (value == 'modify') {
      Draw.setActive(false);
      Modify.setActive(true);
    } else if (value == 'draw') {
      Draw.setActive(true);
      Modify.setActive(false);
    }
  }
};

Draw.setActive(true);
Modify.setActive(false);

// The snap interaction must be added after the Modify and Draw interactions
// in order for its map browser event handlers to be fired first. Its handlers
// are responsible of doing the snapping.
var snap = new _ol_interaction_Snap_({
  source: vector.getSource()
});
map.addInteraction(snap);
