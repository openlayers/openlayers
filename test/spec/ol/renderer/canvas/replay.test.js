import _ol_ from '../../../../../src/ol.js';
import _ol_Feature_ from '../../../../../src/ol/Feature.js';
import _ol_geom_GeometryCollection_ from '../../../../../src/ol/geom/GeometryCollection.js';
import _ol_geom_LineString_ from '../../../../../src/ol/geom/LineString.js';
import _ol_geom_MultiLineString_ from '../../../../../src/ol/geom/MultiLineString.js';
import _ol_geom_MultiPoint_ from '../../../../../src/ol/geom/MultiPoint.js';
import _ol_geom_MultiPolygon_ from '../../../../../src/ol/geom/MultiPolygon.js';
import _ol_geom_Point_ from '../../../../../src/ol/geom/Point.js';
import _ol_geom_Polygon_ from '../../../../../src/ol/geom/Polygon.js';
import _ol_render_canvas_LineStringReplay_ from '../../../../../src/ol/render/canvas/LineStringReplay.js';
import _ol_render_canvas_PolygonReplay_ from '../../../../../src/ol/render/canvas/PolygonReplay.js';
import _ol_render_canvas_Replay_ from '../../../../../src/ol/render/canvas/Replay.js';
import _ol_render_canvas_ReplayGroup_ from '../../../../../src/ol/render/canvas/ReplayGroup.js';
import _ol_renderer_vector_ from '../../../../../src/ol/renderer/vector.js';
import _ol_style_Fill_ from '../../../../../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../../../../../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../../../../../src/ol/style/Style.js';
import _ol_transform_ from '../../../../../src/ol/transform.js';

describe('ol.render.canvas.ReplayGroup', function() {

  describe('#replay', function() {

    var context, replay, fillCount, transform;
    var strokeCount, beginPathCount, moveToCount, lineToCount;
    var feature0, feature1, feature2, feature3;
    var fill0, fill1, style1, style2;

    beforeEach(function() {
      transform = _ol_transform_.create();
      replay = new _ol_render_canvas_ReplayGroup_(1, [-180, -90, 180, 90], 1, 1, false);
      feature0 = new _ol_Feature_(new _ol_geom_Polygon_(
          [[[-90, 0], [-45, 45], [0, 0], [1, 1], [0, -45], [-90, 0]]]));
      feature1 = new _ol_Feature_(new _ol_geom_Polygon_(
          [[[-90, -45], [-90, 0], [0, 0], [0, -45], [-90, -45]]]));
      feature2 = new _ol_Feature_(new _ol_geom_Polygon_(
          [[[90, 45], [90, 0], [0, 0], [0, 45], [90, 45]]]));
      feature3 = new _ol_Feature_(new _ol_geom_Polygon_(
          [[[-90, -45], [-90, 45], [90, 45], [90, -45], [-90, -45]]]));
      fill0 = new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: 'black'})
      });
      fill1 = new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: 'red'})
      });
      style1 = new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: 'black'}),
        stroke: new _ol_style_Stroke_({color: 'white', width: 1})
      });
      style2 = new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: 'white'}),
        stroke: new _ol_style_Stroke_({color: 'black', width: 1, lineDash: [3, 6],
          lineDashOffset: 2})
      });
      fillCount = 0;
      strokeCount = 0;
      beginPathCount = 0;
      moveToCount = 0;
      lineToCount = 0;
      context = {
        fill: function() {
          fillCount++;
        },
        stroke: function() {
          strokeCount++;
        },
        beginPath: function() {
          beginPathCount++;
        },
        clip: function() {
          // remove beginPath, moveTo and lineTo counts for clipping
          beginPathCount--;
          moveToCount--;
          lineToCount -= 3;
        },
        moveTo: function() {
          moveToCount++;
        },
        lineTo: function() {
          lineToCount++;
        },
        closePath: function() {},
        setLineDash: function() {},
        save: function() {},
        restore: function() {}
      };

    });

    it('omits lineTo for repeated coordinates', function() {
      _ol_renderer_vector_.renderFeature(replay, feature0, fill0, 1);
      replay.replay(context, transform, 0, {});
      expect(lineToCount).to.be(4);
      lineToCount = 0;
      _ol_transform_.scale(transform, 0.25, 0.25);
      replay.replay(context, transform, 0, {});
      expect(lineToCount).to.be(3);
    });

    it('does not omit moveTo for repeated coordinates', function() {
      _ol_renderer_vector_.renderFeature(replay, feature0, fill0, 1);
      _ol_renderer_vector_.renderFeature(replay, feature1, fill1, 1);
      replay.replay(context, transform, 0, {});
      expect(moveToCount).to.be(2);
    });

    it('batches fill and stroke instructions for same style', function() {
      _ol_renderer_vector_.renderFeature(replay, feature1, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature3, style1, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for different styles', function() {
      _ol_renderer_vector_.renderFeature(replay, feature1, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature3, style2, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(2);
      expect(strokeCount).to.be(2);
      expect(beginPathCount).to.be(2);
    });

    it('batches fill and stroke instructions for changing styles', function() {
      _ol_renderer_vector_.renderFeature(replay, feature1, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style2, 1);
      _ol_renderer_vector_.renderFeature(replay, feature3, style1, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(3);
      expect(strokeCount).to.be(3);
      expect(beginPathCount).to.be(3);
    });

    it('batches fill and stroke instructions for skipped feature at the beginning', function() {
      _ol_renderer_vector_.renderFeature(replay, feature1, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style2, 1);
      _ol_renderer_vector_.renderFeature(replay, feature3, style2, 1);
      var skippedUids = {};
      skippedUids[_ol_.getUid(feature1)] = true;
      replay.replay(context, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for skipped feature at the end', function() {
      _ol_renderer_vector_.renderFeature(replay, feature1, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature3, style2, 1);
      var skippedUids = {};
      skippedUids[_ol_.getUid(feature3)] = true;
      replay.replay(context, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for skipped features', function() {
      _ol_renderer_vector_.renderFeature(replay, feature1, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature3, style2, 1);
      var skippedUids = {};
      skippedUids[_ol_.getUid(feature1)] = true;
      skippedUids[_ol_.getUid(feature2)] = true;
      replay.replay(context, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('does not batch when overlaps is set to true', function() {
      replay = new _ol_render_canvas_ReplayGroup_(1, [-180, -90, 180, 90], 1, 1, true);
      _ol_renderer_vector_.renderFeature(replay, feature1, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style1, 1);
      _ol_renderer_vector_.renderFeature(replay, feature3, style1, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(3);
      expect(strokeCount).to.be(3);
      expect(beginPathCount).to.be(3);
    });

    it('applies the pixelRatio to the linedash array and offset', function() {
      // replay with a pixelRatio of 2
      replay = new _ol_render_canvas_ReplayGroup_(1, [-180, -90, 180, 90], 1, 2, true);

      var lineDash, lineDashCount = 0,
          lineDashOffset, lineDashOffsetCount = 0;

      context.setLineDash = function(lineDash_) {
        lineDashCount++;
        lineDash = lineDash_.slice();
      };

      Object.defineProperty(context, 'lineDashOffset', {
        set: function(lineDashOffset_) {
          lineDashOffsetCount++;
          lineDashOffset = lineDashOffset_;
        }
      });

      _ol_renderer_vector_.renderFeature(replay, feature1, style2, 1);
      _ol_renderer_vector_.renderFeature(replay, feature2, style2, 1);
      replay.replay(context, transform, 0, {});

      expect(lineDashCount).to.be(1);
      expect(style2.getStroke().getLineDash()).to.eql([3, 6]);
      expect(lineDash).to.eql([6, 12]);

      expect(lineDashOffsetCount).to.be(1);
      expect(style2.getStroke().getLineDashOffset()).to.be(2);
      expect(lineDashOffset).to.be(4);
    });

    it('calls the renderer function configured for the style', function() {
      var calls = [];
      var style = new _ol_style_Style_({
        renderer: function(coords, state) {
          calls.push({
            coords: coords,
            geometry: state.geometry,
            feature: state.feature,
            context: state.context,
            pixelRatio: state.pixelRatio,
            rotation: state.rotation,
            resolution: state.resolution
          });
        }
      });
      var point = new _ol_Feature_(new _ol_geom_Point_([45, 90]));
      var multipoint = new _ol_Feature_(new _ol_geom_MultiPoint_(
          [[45, 90], [90, 45]]));
      var linestring = new _ol_Feature_(new _ol_geom_LineString_(
          [[45, 90], [45, 45], [90, 45]]));
      var multilinestring = new _ol_Feature_(new _ol_geom_MultiLineString_(
          [linestring.getGeometry().getCoordinates(), linestring.getGeometry().getCoordinates()]));
      var polygon = feature1;
      var multipolygon = new _ol_Feature_(new _ol_geom_MultiPolygon_(
          [polygon.getGeometry().getCoordinates(), polygon.getGeometry().getCoordinates()]));
      var geometrycollection = new _ol_Feature_(new _ol_geom_GeometryCollection_(
          [point.getGeometry(), linestring.getGeometry(), polygon.getGeometry()]));
      replay = new _ol_render_canvas_ReplayGroup_(1, [-180, -90, 180, 90], 1, 1, true);
      _ol_renderer_vector_.renderFeature(replay, point, style, 1);
      _ol_renderer_vector_.renderFeature(replay, multipoint, style, 1);
      _ol_renderer_vector_.renderFeature(replay, linestring, style, 1);
      _ol_renderer_vector_.renderFeature(replay, multilinestring, style, 1);
      _ol_renderer_vector_.renderFeature(replay, polygon, style, 1);
      _ol_renderer_vector_.renderFeature(replay, multipolygon, style, 1);
      _ol_renderer_vector_.renderFeature(replay, geometrycollection, style, 1);
      _ol_transform_.scale(transform, 0.1, 0.1);
      replay.replay(context, transform, 0, {});
      expect(calls.length).to.be(9);
      expect(calls[0].geometry).to.be(point.getGeometry());
      expect(calls[0].feature).to.be(point);
      expect(calls[0].context).to.be(context);
      expect(calls[0].pixelRatio).to.be(1);
      expect(calls[0].rotation).to.be(0);
      expect(calls[0].resolution).to.be(1);
      expect(calls[0].coords).to.eql([4.5, 9]);
      expect(calls[1].feature).to.be(multipoint);
      expect(calls[1].coords[0]).to.eql([4.5, 9]);
      expect(calls[2].feature).to.be(linestring);
      expect(calls[2].coords[0]).to.eql([4.5, 9]);
      expect(calls[3].feature).to.be(multilinestring);
      expect(calls[3].coords[0][0]).to.eql([4.5, 9]);
      expect(calls[4].feature).to.be(polygon);
      expect(calls[4].coords[0][0]).to.eql([-9, -4.5]);
      expect(calls[5].feature).to.be(multipolygon);
      expect(calls[5].coords[0][0][0]).to.eql([-9, -4.5]);
      expect(calls[6].feature).to.be(geometrycollection);
      expect(calls[6].geometry.getCoordinates()).to.eql([45, 90]);
      expect(calls[7].geometry.getCoordinates()[0]).to.eql([45, 90]);
      expect(calls[8].geometry.getCoordinates()[0][0]).to.eql([-90, -45]);
    });
  });

});

describe('ol.render.canvas.Replay', function() {

  describe('constructor', function() {

    it('creates a new replay batch', function() {
      var tolerance = 10;
      var extent = [-180, -90, 180, 90];
      var replay = new _ol_render_canvas_Replay_(tolerance, extent, 1, 1, true);
      expect(replay).to.be.a(_ol_render_canvas_Replay_);
    });

  });

  describe('#appendFlatCoordinates()', function() {

    var replay;
    beforeEach(function() {
      replay = new _ol_render_canvas_Replay_(1, [-180, -90, 180, 90], 1, 1, true);
    });

    it('appends coordinates that are within the max extent', function() {
      var flat = [-110, 45, 110, 45, 110, -45, -110, -45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends polygon coordinates that are within the max extent', function() {
      var flat = [-110, 45, 110, 45, 110, -45, -110, -45, -110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends polygon coordinates that are within the max extent (skipping first)', function() {
      var flat = [-110, 45, 110, 45, 110, -45, -110, -45, -110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([110, 45, 110, -45, -110, -45, -110, 45]);
    });

    it('works with a single coordinate (inside)', function() {
      var flat = [-110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends first point (even if outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first point
      var flat = [-110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends first polygon vertex (even if outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first point
      var flat = [-110, 145, -110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('skips first polygon vertex upon request (also when outside)', function() {
      var flat = [-110, 145, -110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([-110, 145]);
    });

    it('appends points when segments cross (top to bottom)', function() {
      // this means we get a few extra points when coordinates are not
      // part of a linestring or ring, but only a few extra
      var flat = [0, 200, 0, -200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends points when segments cross (top to inside)', function() {
      var flat = [0, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends the first segment (even when outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first segment
      var flat = [-10, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends the first polygon segment (even when outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first segment
      var flat = [-10, 200, 10, 200, -10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('skips first polygon segment upon request (also when outside)', function() {
      var flat = [-10, 200, 10, 200, -10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([10, 200, -10, 200]);
    });

    it('eliminates segments outside (and not changing rel)', function() {
      var flat = [0, 0, 0, 200, 5, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200]);
    });

    it('eliminates polygon segments outside (and not changing rel)', function() {
      var flat = [0, 0, 0, 200, 5, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200, 10, 200, 0, 0]);
    });

    it('eliminates polygon segments outside (skipping first and not changing rel)', function() {
      var flat = [0, 0, 0, 10, 0, 200, 5, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([0, 10, 0, 200, 10, 200, 0, 0]);
    });

    it('eliminates segments outside (and not changing rel)', function() {
      var flat = [0, 0, 0, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200]);
    });

    it('includes polygon segments outside (and not changing rel) when on last segment', function() {
      var flat = [0, 0, 0, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('includes polygon segments outside (skipping first and not changing rel) when on last segment', function() {
      var flat = [0, 0, 0, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([0, 200, 10, 200, 0, 0]);
    });

    it('includes outside segments that change relationship', function() {
      var flat = [0, 0, 0, 200, 200, 200, 250, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200, 200, 200]);
    });

    it('includes outside polygon segments that change relationship when on last segment', function() {
      var flat = [0, 0, 0, 200, 200, 200, 250, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('includes outside polygon segments that change relationship when on last segment (when skipping first)', function() {
      var flat = [0, 0, 0, 200, 200, 200, 250, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([0, 200, 200, 200, 250, 200, 0, 0]);
    });

  });

});

describe('ol.render.canvas.LineStringReplay', function() {

  describe('#getBufferedMaxExtent()', function() {

    it('buffers the max extent to accommodate stroke width', function() {
      var tolerance = 1;
      var extent = [-180, -90, 180, 90];
      var resolution = 10;
      var replay = new _ol_render_canvas_LineStringReplay_(tolerance, extent,
          resolution);
      var stroke = new _ol_style_Stroke_({
        width: 2
      });
      replay.setFillStrokeStyle(null, stroke);
      var buffered = replay.getBufferedMaxExtent();
      expect(buffered).to.eql([-195, -105, 195, 105]);
    });

  });

});

describe('ol.render.canvas.PolygonReplay', function() {

  var replay;

  beforeEach(function() {
    var tolerance = 1;
    var extent = [-180, -90, 180, 90];
    var resolution = 10;
    replay = new _ol_render_canvas_PolygonReplay_(tolerance, extent,
        resolution);
  });

  describe('#drawFlatCoordinatess_()', function() {
    it('returns correct offset', function() {
      var coords = [1, 2, 3, 4, 5, 6, 1, 2, 1, 2, 3, 4, 5, 6, 1, 2];
      var ends = [7, 14];
      var stroke = new _ol_style_Stroke_({
        width: 5
      });
      replay.setFillStrokeStyle(null, stroke);
      var offset = replay.drawFlatCoordinatess_(coords, 0, ends, 2);
      expect(offset).to.be(14);
      replay.setFillStrokeStyle(null, null);
      offset = replay.drawFlatCoordinatess_(coords, 0, ends, 2);
      expect(offset).to.be(14);
    });
  });

  describe('#getBufferedMaxExtent()', function() {

    it('buffers the max extent to accommodate stroke width', function() {
      var stroke = new _ol_style_Stroke_({
        width: 5
      });
      replay.setFillStrokeStyle(null, stroke);
      var buffered = replay.getBufferedMaxExtent();
      expect(buffered).to.eql([-210, -120, 210, 120]);
    });

  });

});
