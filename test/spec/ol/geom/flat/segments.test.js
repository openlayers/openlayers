import {forEach as forEachSegment} from '../../../../../src/ol/geom/flat/segments.js';


describe('ol.geom.flat.segments', () => {

  describe('ol.geom.flat.segments.forEach', () => {
    let flatCoordinates, offset, end, stride;
    beforeEach(() => {
      flatCoordinates = [0, 0, 1, 1, 2, 2, 3, 3];
      offset = 0;
      end = 8;
      stride = 2;
    });
    describe('callback returns undefined', () => {
      test('executes the callback for each segment', () => {
        const args = [];
        const spy = sinon.spy(function(point1, point2) {
          args.push([point1[0], point1[1], point2[0], point2[1]]);
        });
        const ret = forEachSegment(flatCoordinates, offset, end, stride, spy);
        expect(spy.callCount).toBe(3);
        expect(args[0][0]).toBe(0);
        expect(args[0][1]).toBe(0);
        expect(args[0][2]).toBe(1);
        expect(args[0][3]).toBe(1);
        expect(args[1][0]).toBe(1);
        expect(args[1][1]).toBe(1);
        expect(args[1][2]).toBe(2);
        expect(args[1][3]).toBe(2);
        expect(args[2][0]).toBe(2);
        expect(args[2][1]).toBe(2);
        expect(args[2][2]).toBe(3);
        expect(args[2][3]).toBe(3);
        expect(ret).toBe(false);
      });
    });
    describe('callback returns true', () => {
      test('executes the callback for the first segment', () => {
        const args = [];
        const spy = sinon.spy(function(point1, point2) {
          args.push([point1[0], point1[1], point2[0], point2[1]]);
          return true;
        });
        const ret = forEachSegment(flatCoordinates, offset, end, stride, spy);
        expect(spy.callCount).toBe(1);
        expect(args[0][0]).toBe(0);
        expect(args[0][1]).toBe(0);
        expect(args[0][2]).toBe(1);
        expect(args[0][3]).toBe(1);
        expect(ret).toBe(true);
      });
    });
  });
});
