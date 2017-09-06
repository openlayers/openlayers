import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Group_ from '../src/ol/layer/group';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_TileJSON_ from '../src/ol/source/tilejson';

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }), new _ol_layer_Group_({
      layers: [
        new _ol_layer_Tile_({
          source: new _ol_source_TileJSON_({
            url: 'https://api.tiles.mapbox.com/v3/mapbox.20110804-hoa-foodinsecurity-3month.json?secure',
            crossOrigin: 'anonymous'
          })
        }),
        new _ol_layer_Tile_({
          source: new _ol_source_TileJSON_({
            url: 'https://api.tiles.mapbox.com/v3/mapbox.world-borders-light.json?secure',
            crossOrigin: 'anonymous'
          })
        })
      ]
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([37.40570, 8.81566]),
    zoom: 4
  })
});

function bindInputs(layerid, layer) {
  var visibilityInput = $(layerid + ' input.visible');
  visibilityInput.on('change', function() {
    layer.setVisible(this.checked);
  });
  visibilityInput.prop('checked', layer.getVisible());

  var opacityInput = $(layerid + ' input.opacity');
  opacityInput.on('input change', function() {
    layer.setOpacity(parseFloat(this.value));
  });
  opacityInput.val(String(layer.getOpacity()));
}
map.getLayers().forEach(function(layer, i) {
  bindInputs('#layer' + i, layer);
  if (layer instanceof _ol_layer_Group_) {
    layer.getLayers().forEach(function(sublayer, j) {
      bindInputs('#layer' + i + j, sublayer);
    });
  }
});

$('#layertree li > span').click(function() {
  $(this).siblings('fieldset').toggle();
}).siblings('fieldset').hide();
