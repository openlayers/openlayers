import LineString from '../../../src/ol/geom/LineString.js';
import Point from '../../../src/ol/geom/Point.js';
import Polygon from '../../../src/ol/geom/Polygon.js';
import {toContext} from '../../../src/ol/render.js';
import VectorContext from '../../../src/ol/render/VectorContext.js';
import CanvasImmediateRenderer from '../../../src/ol/render/canvas/Immediate.js';
import CircleStyle from '../../../src/ol/style/Circle.js';
import Fill from '../../../src/ol/style/Fill.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import Style from '../../../src/ol/style/Style.js';

function getContext() {
  return document.createElement('canvas').getContext('2d');
}

describe('ol.render', function() {

  describe('ol.render.toContext()', function() {

    it('creates a vector context from a Canvas 2d context', function() {
      const vectorContext = toContext(getContext(), {
        pixelRatio: 1,
        size: [100, 100]
      });
      expect(vectorContext).to.be.a(VectorContext);
      expect(vectorContext).to.be.a(CanvasImmediateRenderer);
    });

    it('can be used to render a point geometry', function(done) {
      const context = getContext();
      const vectorContext = toContext(context, {
        pixelRatio: 1,
        size: [100, 100]
      });

      const style = new Style({
        image: new CircleStyle({
          fill: new Fill({
            color: 'green'
          }),
          radius: 10
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new Point([50, 50]));

      resembleCanvas(context.canvas,
        'rendering/ol/expected/render-point.png', IMAGE_TOLERANCE, done);

    });

    it('can be used to render a linestring geometry', function(done) {
      const context = getContext();
      const vectorContext = toContext(context, {
        pixelRatio: 1,
        size: [100, 100]
      });

      const style = new Style({
        stroke: new Stroke({
          color: 'red',
          width: 14
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new LineString([
        [10, 60], [30, 40], [50, 60], [70, 40], [90, 60]
      ]));

      resembleCanvas(context.canvas,
        'rendering/ol/expected/render-linestring.png', IMAGE_TOLERANCE, done);

    });

    it('respects lineCap for linestring', function(done) {
      const context = getContext();
      const vectorContext = toContext(context, {
        pixelRatio: 1,
        size: [100, 100]
      });

      const style = new Style({
        stroke: new Stroke({
          lineCap: 'butt',
          color: 'red',
          width: 14
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new LineString([
        [10, 60], [30, 40], [50, 60], [70, 40], [90, 60]
      ]));

      resembleCanvas(context.canvas,
        'rendering/ol/expected/render-linestring-butt.png', IMAGE_TOLERANCE, done);

    });

    it('respects lineJoin for linestring', function(done) {
      const context = getContext();
      const vectorContext = toContext(context, {
        pixelRatio: 1,
        size: [100, 100]
      });

      const style = new Style({
        stroke: new Stroke({
          lineJoin: 'bevel',
          color: 'red',
          width: 14
        })
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(new LineString([
        [10, 60], [30, 40], [50, 60], [70, 40], [90, 60]
      ]));

      resembleCanvas(context.canvas,
        'rendering/ol/expected/render-linestring-bevel.png', IMAGE_TOLERANCE, done);

    });

    it('can be used to render a polygon geometry', function(done) {
      const context = getContext();
      const vectorContext = toContext(context, {
        pixelRatio: 1,
        size: [100, 100]
      });

      const style = new Style({
        stroke: new Stroke({
          color: 'blue',
          width: 8
        }),
        fill: new Fill({
          color: 'rgba(0,0,255,0.5)'
        })
      });

      vectorContext.setStyle(style);

      vectorContext.drawGeometry(new Polygon([
        [[25, 25], [75, 25], [75, 75], [25, 75], [25, 25]],
        [[40, 40], [40, 60], [60, 60], [60, 40], [40, 40]]
      ]));

      resembleCanvas(context.canvas,
        'rendering/ol/expected/render-polygon.png', IMAGE_TOLERANCE, done);

    });

    it('supports lineDash styles', function(done) {
      const context = getContext();
      const vectorContext = toContext(context, {
        pixelRatio: 1,
        size: [100, 100]
      });

      const style = new Style({
        stroke: new Stroke({
          lineDash: [10, 5]
        })
      });

      vectorContext.setStyle(style);

      vectorContext.drawGeometry(new Polygon([
        [[25, 25], [75, 25], [75, 75], [25, 75], [25, 25]],
        [[40, 40], [40, 60], [60, 60], [60, 40], [40, 40]]
      ]));

      resembleCanvas(context.canvas,
        'rendering/ol/expected/render-polygon-linedash.png', IMAGE_TOLERANCE, done);

    });

    it('supports lineDashOffset', function(done) {
      const context = getContext();
      const vectorContext = toContext(context, {
        pixelRatio: 1,
        size: [100, 100]
      });

      const style = new Style({
        stroke: new Stroke({
          lineDash: [10, 5],
          lineDashOffset: 5
        })
      });

      vectorContext.setStyle(style);

      vectorContext.drawGeometry(new Polygon([
        [[25, 25], [75, 25], [75, 75], [25, 75], [25, 25]],
        [[40, 40], [40, 60], [60, 60], [60, 40], [40, 40]]
      ]));

      resembleCanvas(context.canvas,
        'rendering/ol/expected/render-polygon-linedashoffset.png', IMAGE_TOLERANCE, done);

    });

  });

});
