import Feature from '../../../../../src/ol/Feature.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import _ol_render_canvas_TextReplay_ from '../../../../../src/ol/render/canvas/TextReplay.js';
import Text from '../../../../../src/ol/style/Text.js';

describe('ol.render.canvas.TextReplay', function() {

  it('renders polygon labels only when they fit', function() {
    var replay = new _ol_render_canvas_TextReplay_(1, [-180, -90, 180, 90], 0.02, 1, true);
    var geometry = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
    var feature = new Feature(geometry);

    replay.setTextStyle(new Text({
      text: 'This is a long text'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(0);

    replay.setTextStyle(new Text({
      text: 'short'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(3);
  });

  it('renders multipolygon labels only when they fit', function() {
    var replay = new _ol_render_canvas_TextReplay_(1, [-180, -90, 180, 90], 0.02, 1, true);
    var geometry = new MultiPolygon([
      [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
      [[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]
    ]);
    var feature = new Feature(geometry);

    replay.setTextStyle(new Text({
      text: 'This is a long text'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(0);

    replay.setTextStyle(new Text({
      text: 'short'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(3);
  });

});
