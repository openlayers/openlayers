import {getUid} from '../../../../../src/ol/util.js';
import Feature from '../../../../../src/ol/Feature.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import CanvasLineStringReplay from '../../../../../src/ol/render/canvas/LineStringReplay.js';
import CanvasPolygonReplay from '../../../../../src/ol/render/canvas/PolygonReplay.js';
import CanvasReplay from '../../../../../src/ol/render/canvas/Replay.js';
import CanvasReplayGroup from '../../../../../src/ol/render/canvas/ReplayGroup.js';
import {renderFeature} from '../../../../../src/ol/renderer/vector.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';
import {create as createTransform, scale as scaleTransform} from '../../../../../src/ol/transform.js';

describe('ol.render.canvas.ReplayGroup', function() {

  describe('#replay', function() {

    let context, replay, fillCount, transform;
    let strokeCount, beginPathCount, moveToCount, lineToCount;
    let feature0, feature1, feature2, feature3;
    let fill0, fill1, style1, style2;

    beforeEach(function() {
      transform = createTransform();
      replay = new CanvasReplayGroup(1, [-180, -90, 180, 90], 1, 1, false);
      feature0 = new Feature(new Polygon(
        [[[-90, 0], [-45, 45], [0, 0], [1, 1], [0, -45], [-90, 0]]]));
      feature1 = new Feature(new Polygon(
        [[[-90, -45], [-90, 0], [0, 0], [0, -45], [-90, -45]]]));
      feature2 = new Feature(new Polygon(
        [[[90, 45], [90, 0], [0, 0], [0, 45], [90, 45]]]));
      feature3 = new Feature(new Polygon(
        [[[-90, -45], [-90, 45], [90, 45], [90, -45], [-90, -45]]]));
      fill0 = new Style({
        fill: new Fill({color: 'black'})
      });
      fill1 = new Style({
        fill: new Fill({color: 'red'})
      });
      style1 = new Style({
        fill: new Fill({color: 'black'}),
        stroke: new Stroke({color: 'white', width: 1})
      });
      style2 = new Style({
        fill: new Fill({color: 'white'}),
        stroke: new Stroke({color: 'black', width: 1, lineDash: [3, 6],
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
      renderFeature(replay, feature0, fill0, 1);
      replay.replay(context, transform, 0, {});
      expect(lineToCount).to.be(4);
      lineToCount = 0;
      scaleTransform(transform, 0.25, 0.25);
      replay.replay(context, transform, 0, {});
      expect(lineToCount).to.be(3);
    });

    it('does not omit moveTo for repeated coordinates', function() {
      renderFeature(replay, feature0, fill0, 1);
      renderFeature(replay, feature1, fill1, 1);
      replay.replay(context, transform, 0, {});
      expect(moveToCount).to.be(2);
    });

    it('batches fill and stroke instructions for same style', function() {
      renderFeature(replay, feature1, style1, 1);
      renderFeature(replay, feature2, style1, 1);
      renderFeature(replay, feature3, style1, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for different styles', function() {
      renderFeature(replay, feature1, style1, 1);
      renderFeature(replay, feature2, style1, 1);
      renderFeature(replay, feature3, style2, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(2);
      expect(strokeCount).to.be(2);
      expect(beginPathCount).to.be(2);
    });

    it('batches fill and stroke instructions for changing styles', function() {
      renderFeature(replay, feature1, style1, 1);
      renderFeature(replay, feature2, style2, 1);
      renderFeature(replay, feature3, style1, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(3);
      expect(strokeCount).to.be(3);
      expect(beginPathCount).to.be(3);
    });

    it('batches fill and stroke instructions for skipped feature at the beginning', function() {
      renderFeature(replay, feature1, style1, 1);
      renderFeature(replay, feature2, style2, 1);
      renderFeature(replay, feature3, style2, 1);
      const skippedUids = {};
      skippedUids[getUid(feature1)] = true;
      replay.replay(context, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for skipped feature at the end', function() {
      renderFeature(replay, feature1, style1, 1);
      renderFeature(replay, feature2, style1, 1);
      renderFeature(replay, feature3, style2, 1);
      const skippedUids = {};
      skippedUids[getUid(feature3)] = true;
      replay.replay(context, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('batches fill and stroke instructions for skipped features', function() {
      renderFeature(replay, feature1, style1, 1);
      renderFeature(replay, feature2, style1, 1);
      renderFeature(replay, feature3, style2, 1);
      const skippedUids = {};
      skippedUids[getUid(feature1)] = true;
      skippedUids[getUid(feature2)] = true;
      replay.replay(context, transform, 0, skippedUids);
      expect(fillCount).to.be(1);
      expect(strokeCount).to.be(1);
      expect(beginPathCount).to.be(1);
    });

    it('does not batch when overlaps is set to true', function() {
      replay = new CanvasReplayGroup(1, [-180, -90, 180, 90], 1, 1, true);
      renderFeature(replay, feature1, style1, 1);
      renderFeature(replay, feature2, style1, 1);
      renderFeature(replay, feature3, style1, 1);
      replay.replay(context, transform, 0, {});
      expect(fillCount).to.be(3);
      expect(strokeCount).to.be(3);
      expect(beginPathCount).to.be(3);
    });

    it('applies the pixelRatio to the linedash array and offset', function() {
      // replay with a pixelRatio of 2
      replay = new CanvasReplayGroup(1, [-180, -90, 180, 90], 1, 2, true);

      let lineDash, lineDashCount = 0,
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

      renderFeature(replay, feature1, style2, 1);
      renderFeature(replay, feature2, style2, 1);
      replay.replay(context, transform, 0, {});

      expect(lineDashCount).to.be(1);
      expect(style2.getStroke().getLineDash()).to.eql([3, 6]);
      expect(lineDash).to.eql([6, 12]);

      expect(lineDashOffsetCount).to.be(1);
      expect(style2.getStroke().getLineDashOffset()).to.be(2);
      expect(lineDashOffset).to.be(4);
    });

    it('calls the renderer function configured for the style', function() {
      const calls = [];
      const style = new Style({
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
      const point = new Feature(new Point([45, 90]));
      const multipoint = new Feature(new MultiPoint(
        [[45, 90], [90, 45]]));
      const linestring = new Feature(new LineString(
        [[45, 90], [45, 45], [90, 45]]));
      const multilinestring = new Feature(new MultiLineString(
        [linestring.getGeometry().getCoordinates(), linestring.getGeometry().getCoordinates()]));
      const polygon = feature1;
      const multipolygon = new Feature(new MultiPolygon(
        [polygon.getGeometry().getCoordinates(), polygon.getGeometry().getCoordinates()]));
      const geometrycollection = new Feature(new GeometryCollection(
        [point.getGeometry(), linestring.getGeometry(), polygon.getGeometry()]));
      replay = new CanvasReplayGroup(1, [-180, -90, 180, 90], 1, 1, true);
      renderFeature(replay, point, style, 1);
      renderFeature(replay, multipoint, style, 1);
      renderFeature(replay, linestring, style, 1);
      renderFeature(replay, multilinestring, style, 1);
      renderFeature(replay, polygon, style, 1);
      renderFeature(replay, multipolygon, style, 1);
      renderFeature(replay, geometrycollection, style, 1);
      scaleTransform(transform, 0.1, 0.1);
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
      const tolerance = 10;
      const extent = [-180, -90, 180, 90];
      const replay = new CanvasReplay(tolerance, extent, 1, 1, true);
      expect(replay).to.be.a(CanvasReplay);
    });

  });

  describe('#appendFlatCoordinates()', function() {

    let replay;
    beforeEach(function() {
      replay = new CanvasReplay(1, [-180, -90, 180, 90], 1, 1, true);
    });

    it('appends coordinates that are within the max extent', function() {
      const flat = [-110, 45, 110, 45, 110, -45, -110, -45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends polygon coordinates that are within the max extent', function() {
      const flat = [-110, 45, 110, 45, 110, -45, -110, -45, -110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends polygon coordinates that are within the max extent (skipping first)', function() {
      const flat = [-110, 45, 110, 45, 110, -45, -110, -45, -110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([110, 45, 110, -45, -110, -45, -110, 45]);
    });

    it('works with a single coordinate (inside)', function() {
      const flat = [-110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends first point (even if outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first point
      const flat = [-110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends first polygon vertex (even if outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first point
      const flat = [-110, 145, -110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('skips first polygon vertex upon request (also when outside)', function() {
      const flat = [-110, 145, -110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([-110, 145]);
    });

    it('appends points when segments cross (top to bottom)', function() {
      // this means we get a few extra points when coordinates are not
      // part of a linestring or ring, but only a few extra
      const flat = [0, 200, 0, -200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('appends points when segments cross (top to inside)', function() {
      const flat = [0, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends the first segment (even when outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first segment
      const flat = [-10, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('always appends the first polygon segment (even when outside)', function() {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first segment
      const flat = [-10, 200, 10, 200, -10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('skips first polygon segment upon request (also when outside)', function() {
      const flat = [-10, 200, 10, 200, -10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([10, 200, -10, 200]);
    });

    it('eliminates segments outside (and not changing rel)', function() {
      const flat = [0, 0, 0, 200, 5, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200]);
    });

    it('eliminates polygon segments outside (and not changing rel)', function() {
      const flat = [0, 0, 0, 200, 5, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200, 10, 200, 0, 0]);
    });

    it('eliminates polygon segments outside (skipping first and not changing rel)', function() {
      const flat = [0, 0, 0, 10, 0, 200, 5, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([0, 10, 0, 200, 10, 200, 0, 0]);
    });

    it('eliminates segments outside (and not changing rel)', function() {
      const flat = [0, 0, 0, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200]);
    });

    it('includes polygon segments outside (and not changing rel) when on last segment', function() {
      const flat = [0, 0, 0, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('includes polygon segments outside (skipping first and not changing rel) when on last segment', function() {
      const flat = [0, 0, 0, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([0, 200, 10, 200, 0, 0]);
    });

    it('includes outside segments that change relationship', function() {
      const flat = [0, 0, 0, 200, 200, 200, 250, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).to.eql([0, 0, 0, 200, 200, 200]);
    });

    it('includes outside polygon segments that change relationship when on last segment', function() {
      const flat = [0, 0, 0, 200, 200, 200, 250, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).to.eql(flat);
    });

    it('includes outside polygon segments that change relationship when on last segment (when skipping first)', function() {
      const flat = [0, 0, 0, 200, 200, 200, 250, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
      expect(replay.coordinates).to.eql([0, 200, 200, 200, 250, 200, 0, 0]);
    });

  });

});

describe('ol.render.canvas.LineStringReplay', function() {

  describe('#getBufferedMaxExtent()', function() {

    it('buffers the max extent to accommodate stroke width', function() {
      const tolerance = 1;
      const extent = [-180, -90, 180, 90];
      const resolution = 10;
      const replay = new CanvasLineStringReplay(tolerance, extent,
        resolution);
      const stroke = new Stroke({
        width: 2
      });
      replay.setFillStrokeStyle(null, stroke);
      const buffered = replay.getBufferedMaxExtent();
      expect(buffered).to.eql([-195, -105, 195, 105]);
    });

  });

});

describe('ol.render.canvas.PolygonReplay', function() {

  let replay;

  beforeEach(function() {
    const tolerance = 1;
    const extent = [-180, -90, 180, 90];
    const resolution = 10;
    replay = new CanvasPolygonReplay(tolerance, extent,
      resolution);
  });

  describe('#drawFlatCoordinatess_()', function() {
    it('returns correct offset', function() {
      const coords = [1, 2, 3, 4, 5, 6, 1, 2, 1, 2, 3, 4, 5, 6, 1, 2];
      const ends = [7, 14];
      const stroke = new Stroke({
        width: 5
      });
      replay.setFillStrokeStyle(null, stroke);
      let offset = replay.drawFlatCoordinatess_(coords, 0, ends, 2);
      expect(offset).to.be(14);
      replay.setFillStrokeStyle(null, null);
      offset = replay.drawFlatCoordinatess_(coords, 0, ends, 2);
      expect(offset).to.be(14);
    });
  });

  describe('#getBufferedMaxExtent()', function() {

    it('buffers the max extent to accommodate stroke width', function() {
      const stroke = new Stroke({
        width: 5
      });
      replay.setFillStrokeStyle(null, stroke);
      const buffered = replay.getBufferedMaxExtent();
      expect(buffered).to.eql([-210, -120, 210, 120]);
    });

  });

});
