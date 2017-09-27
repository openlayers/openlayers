goog.require('ol.Feature');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
goog.require('ol.render.canvas.TextReplay');
goog.require('ol.style.Text');

describe('ol.render.canvas.TextReplay', function() {

  it('renders polygon labels only when they fit', function() {
    var replay = new ol.render.canvas.TextReplay(1, [-180, -90, 180, 90], 0.02, 1, true);
    var geometry = new ol.geom.Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
    var feature = new ol.Feature(geometry);

    replay.setTextStyle(new ol.style.Text({
      text: 'This is a long text'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(0);

    replay.setTextStyle(new ol.style.Text({
      text: 'short'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(3);
  });

  it('renders multipolygon labels only when they fit', function() {
    var replay = new ol.render.canvas.TextReplay(1, [-180, -90, 180, 90], 0.02, 1, true);
    var geometry = new ol.geom.MultiPolygon([
      [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
      [[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]
    ]);
    var feature = new ol.Feature(geometry);

    replay.setTextStyle(new ol.style.Text({
      text: 'This is a long text'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(0);

    replay.setTextStyle(new ol.style.Text({
      text: 'short'
    }));
    replay.drawText(geometry, feature);
    expect(replay.instructions.length).to.be(3);
  });

});
