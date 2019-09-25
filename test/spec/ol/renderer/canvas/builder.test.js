import Feature from '../../../../../src/ol/Feature.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import CanvasLineStringBuilder from '../../../../../src/ol/render/canvas/LineStringBuilder.js';
import CanvasPolygonBuilder from '../../../../../src/ol/render/canvas/PolygonBuilder.js';
import CanvasBuilder from '../../../../../src/ol/render/canvas/Builder.js';
import BuilderGroup from '../../../../../src/ol/render/canvas/BuilderGroup.js';
import ExecutorGroup from '../../../../../src/ol/render/canvas/ExecutorGroup.js';
import {renderFeature} from '../../../../../src/ol/renderer/vector.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';
import {create as createTransform, scale as scaleTransform} from '../../../../../src/ol/transform.js';

describe('ol.render.canvas.BuilderGroup', () => {

  describe('#replay', () => {

    let context, builder, fillCount, transform;
    let strokeCount, beginPathCount, moveToCount, lineToCount;
    let feature0, feature1, feature2, feature3;
    let fill0, fill1, style1, style2;

    /**
     * @param {BuilderGroup} builder The builder to get instructions from.
     * @param {number=} pixelRatio The pixel ratio.
     * @param {boolean=} overlaps Whether there is overlaps.
     */
    function execute(builder, pixelRatio, overlaps) {
      const executor = new ExecutorGroup([-180, -90, 180, 90], 1,
        pixelRatio || 1, !!overlaps, builder.finish());
      executor.execute(context, transform, 0, false);
    }

    beforeEach(() => {
      transform = createTransform();
      builder = new BuilderGroup(1, [-180, -90, 180, 90], 1, 1, false);
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

    test('omits lineTo for repeated coordinates', () => {
      renderFeature(builder, feature0, fill0, 1);
      execute(builder);
      expect(lineToCount).toBe(4);
      lineToCount = 0;
      scaleTransform(transform, 0.25, 0.25);
      execute(builder);
      expect(lineToCount).toBe(3);
    });

    test('does not omit moveTo for repeated coordinates', () => {
      renderFeature(builder, feature0, fill0, 1);
      renderFeature(builder, feature1, fill1, 1);
      execute(builder);
      expect(moveToCount).toBe(2);
    });

    test('batches fill and stroke instructions for same style', () => {
      renderFeature(builder, feature1, style1, 1);
      renderFeature(builder, feature2, style1, 1);
      renderFeature(builder, feature3, style1, 1);
      execute(builder);
      expect(fillCount).toBe(1);
      expect(strokeCount).toBe(1);
      expect(beginPathCount).toBe(1);
    });

    test('batches fill and stroke instructions for different styles', () => {
      renderFeature(builder, feature1, style1, 1);
      renderFeature(builder, feature2, style1, 1);
      renderFeature(builder, feature3, style2, 1);
      execute(builder);
      expect(fillCount).toBe(2);
      expect(strokeCount).toBe(2);
      expect(beginPathCount).toBe(2);
    });

    test('batches fill and stroke instructions for changing styles', () => {
      renderFeature(builder, feature1, style1, 1);
      renderFeature(builder, feature2, style2, 1);
      renderFeature(builder, feature3, style1, 1);
      execute(builder);
      expect(fillCount).toBe(3);
      expect(strokeCount).toBe(3);
      expect(beginPathCount).toBe(3);
    });

    test('does not batch when overlaps is set to true', () => {
      builder = new BuilderGroup(1, [-180, -90, 180, 90], 1, 1, true);
      renderFeature(builder, feature1, style1, 1);
      renderFeature(builder, feature2, style1, 1);
      renderFeature(builder, feature3, style1, 1);
      execute(builder, {}, 1, true);
      expect(fillCount).toBe(3);
      expect(strokeCount).toBe(3);
      expect(beginPathCount).toBe(3);
    });

    test('applies the pixelRatio to the linedash array and offset', () => {
      // replay with a pixelRatio of 2
      builder = new BuilderGroup(1, [-180, -90, 180, 90], 1, 2, true);

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

      renderFeature(builder, feature1, style2, 1);
      renderFeature(builder, feature2, style2, 1);
      execute(builder, {}, 2, true);

      expect(lineDashCount).toBe(1);
      expect(style2.getStroke().getLineDash()).toEqual([3, 6]);
      expect(lineDash).toEqual([6, 12]);

      expect(lineDashOffsetCount).toBe(1);
      expect(style2.getStroke().getLineDashOffset()).toBe(2);
      expect(lineDashOffset).toBe(4);
    });

    test('calls the renderer function configured for the style', () => {
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
      builder = new BuilderGroup(1, [-180, -90, 180, 90], 1, 1, true);
      renderFeature(builder, point, style, 1);
      renderFeature(builder, multipoint, style, 1);
      renderFeature(builder, linestring, style, 1);
      renderFeature(builder, multilinestring, style, 1);
      renderFeature(builder, polygon, style, 1);
      renderFeature(builder, multipolygon, style, 1);
      renderFeature(builder, geometrycollection, style, 1);
      scaleTransform(transform, 0.1, 0.1);
      execute(builder, 1, true);
      expect(calls.length).toBe(9);
      expect(calls[0].geometry).toBe(point.getGeometry());
      expect(calls[0].feature).toBe(point);
      expect(calls[0].context).toBe(context);
      expect(calls[0].pixelRatio).toBe(1);
      expect(calls[0].rotation).toBe(0);
      expect(calls[0].resolution).toBe(1);
      expect(calls[0].coords).toEqual([4.5, 9]);
      expect(calls[1].feature).toBe(multipoint);
      expect(calls[1].coords[0]).toEqual([4.5, 9]);
      expect(calls[2].feature).toBe(linestring);
      expect(calls[2].coords[0]).toEqual([4.5, 9]);
      expect(calls[3].feature).toBe(multilinestring);
      expect(calls[3].coords[0][0]).toEqual([4.5, 9]);
      expect(calls[4].feature).toBe(polygon);
      expect(calls[4].coords[0][0]).toEqual([-9, -4.5]);
      expect(calls[5].feature).toBe(multipolygon);
      expect(calls[5].coords[0][0][0]).toEqual([-9, -4.5]);
      expect(calls[6].feature).toBe(geometrycollection);
      expect(calls[6].geometry.getCoordinates()).toEqual([45, 90]);
      expect(calls[7].geometry.getCoordinates()[0]).toEqual([45, 90]);
      expect(calls[8].geometry.getCoordinates()[0][0]).toEqual([-90, -45]);
    });
  });

});

describe('ol.render.canvas.Builder', () => {

  describe('constructor', () => {

    test('creates a new replay batch', () => {
      const tolerance = 10;
      const extent = [-180, -90, 180, 90];
      const replay = new CanvasBuilder(tolerance, extent, 1, 1, true);
      expect(replay).toBeInstanceOf(CanvasBuilder);
    });

  });

  describe('#appendFlatCoordinates()', () => {

    let replay;
    beforeEach(() => {
      replay = new CanvasBuilder(1, [-180, -90, 180, 90], 1, 1, true);
    });

    test('appends coordinates that are within the max extent', () => {
      const flat = [-110, 45, 110, 45, 110, -45, -110, -45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test('appends polygon coordinates that are within the max extent', () => {
      const flat = [-110, 45, 110, 45, 110, -45, -110, -45, -110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test(
      'appends polygon coordinates that are within the max extent (skipping first)',
      () => {
        const flat = [-110, 45, 110, 45, 110, -45, -110, -45, -110, 45];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
        expect(replay.coordinates).toEqual([110, 45, 110, -45, -110, -45, -110, 45]);
      }
    );

    test('works with a single coordinate (inside)', () => {
      const flat = [-110, 45];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test('always appends first point (even if outside)', () => {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first point
      const flat = [-110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test('always appends first polygon vertex (even if outside)', () => {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first point
      const flat = [-110, 145, -110, 145];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test(
      'skips first polygon vertex upon request (also when outside)',
      () => {
        const flat = [-110, 145, -110, 145];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
        expect(replay.coordinates).toEqual([-110, 145]);
      }
    );

    test('appends points when segments cross (top to bottom)', () => {
      // this means we get a few extra points when coordinates are not
      // part of a linestring or ring, but only a few extra
      const flat = [0, 200, 0, -200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test('appends points when segments cross (top to inside)', () => {
      const flat = [0, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test('always appends the first segment (even when outside)', () => {
      // this could be changed, but to make the code simpler for properly
      // closing rings, we always add the first segment
      const flat = [-10, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual(flat);
    });

    test(
      'always appends the first polygon segment (even when outside)',
      () => {
        // this could be changed, but to make the code simpler for properly
        // closing rings, we always add the first segment
        const flat = [-10, 200, 10, 200, -10, 200];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
        expect(replay.coordinates).toEqual(flat);
      }
    );

    test(
      'skips first polygon segment upon request (also when outside)',
      () => {
        const flat = [-10, 200, 10, 200, -10, 200];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
        expect(replay.coordinates).toEqual([10, 200, -10, 200]);
      }
    );

    test('eliminates segments outside (and not changing rel)', () => {
      const flat = [0, 0, 0, 200, 5, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual([0, 0, 0, 200]);
    });

    test('eliminates polygon segments outside (and not changing rel)', () => {
      const flat = [0, 0, 0, 200, 5, 200, 10, 200, 0, 0];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
      expect(replay.coordinates).toEqual([0, 0, 0, 200, 10, 200, 0, 0]);
    });

    test(
      'eliminates polygon segments outside (skipping first and not changing rel)',
      () => {
        const flat = [0, 0, 0, 10, 0, 200, 5, 200, 10, 200, 0, 0];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
        expect(replay.coordinates).toEqual([0, 10, 0, 200, 10, 200, 0, 0]);
      }
    );

    test('eliminates segments outside (and not changing rel)', () => {
      const flat = [0, 0, 0, 200, 10, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual([0, 0, 0, 200]);
    });

    test(
      'includes polygon segments outside (and not changing rel) when on last segment',
      () => {
        const flat = [0, 0, 0, 200, 10, 200, 0, 0];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
        expect(replay.coordinates).toEqual(flat);
      }
    );

    test(
      'includes polygon segments outside (skipping first and not changing rel) when on last segment',
      () => {
        const flat = [0, 0, 0, 200, 10, 200, 0, 0];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
        expect(replay.coordinates).toEqual([0, 200, 10, 200, 0, 0]);
      }
    );

    test('includes outside segments that change relationship', () => {
      const flat = [0, 0, 0, 200, 200, 200, 250, 200];
      replay.appendFlatCoordinates(flat, 0, flat.length, 2, false, false);
      expect(replay.coordinates).toEqual([0, 0, 0, 200, 200, 200]);
    });

    test(
      'includes outside polygon segments that change relationship when on last segment',
      () => {
        const flat = [0, 0, 0, 200, 200, 200, 250, 200, 0, 0];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, false);
        expect(replay.coordinates).toEqual(flat);
      }
    );

    test(
      'includes outside polygon segments that change relationship when on last segment (when skipping first)',
      () => {
        const flat = [0, 0, 0, 200, 200, 200, 250, 200, 0, 0];
        replay.appendFlatCoordinates(flat, 0, flat.length, 2, true, true);
        expect(replay.coordinates).toEqual([0, 200, 200, 200, 250, 200, 0, 0]);
      }
    );

  });

});

describe('ol.render.canvas.LineStringBuilder', () => {

  describe('#getBufferedMaxExtent()', () => {

    test('buffers the max extent to accommodate stroke width', () => {
      const tolerance = 1;
      const extent = [-180, -90, 180, 90];
      const resolution = 10;
      const replay = new CanvasLineStringBuilder(tolerance, extent,
        resolution);
      const stroke = new Stroke({
        width: 2
      });
      replay.setFillStrokeStyle(null, stroke);
      const buffered = replay.getBufferedMaxExtent();
      expect(buffered).toEqual([-195, -105, 195, 105]);
    });

  });

});

describe('ol.render.canvas.PolygonBuilder', () => {

  let replay;

  beforeEach(() => {
    const tolerance = 1;
    const extent = [-180, -90, 180, 90];
    const resolution = 10;
    replay = new CanvasPolygonBuilder(tolerance, extent,
      resolution);
  });

  describe('#drawFlatCoordinatess_()', () => {
    test('returns correct offset', () => {
      const coords = [1, 2, 3, 4, 5, 6, 1, 2, 1, 2, 3, 4, 5, 6, 1, 2];
      const ends = [7, 14];
      const stroke = new Stroke({
        width: 5
      });
      replay.setFillStrokeStyle(null, stroke);
      let offset = replay.drawFlatCoordinatess_(coords, 0, ends, 2);
      expect(offset).toBe(14);
      replay.setFillStrokeStyle(null, null);
      offset = replay.drawFlatCoordinatess_(coords, 0, ends, 2);
      expect(offset).toBe(14);
    });
  });

  describe('#getBufferedMaxExtent()', () => {

    test('buffers the max extent to accommodate stroke width', () => {
      const stroke = new Stroke({
        width: 5
      });
      replay.setFillStrokeStyle(null, stroke);
      const buffered = replay.getBufferedMaxExtent();
      expect(buffered).toEqual([-210, -120, 210, 120]);
    });

  });

});
