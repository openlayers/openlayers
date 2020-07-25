import {forEach as forEachSegment} from '../../../../../src/ol/geom/flat/segments.js';

describe('ol.geom.flat.segments', function () {
  describe('ol.geom.flat.segments.forEach', function () {
    let flatCoordinates, offset, end, stride;
    beforeEach(function () {
      flatCoordinates = [0, 0, 1, 1, 2, 2, 3, 3];
      offset = 0;
      end = 8;
      stride = 2;
    });
    describe('callback returns undefined', function () {
      it('executes the callback for each segment', function () {
        const args = [];
        const spy = sinon.spy(function (point1, point2) {
          args.push([point1[0], point1[1], point2[0], point2[1]]);
        });
        const ret = forEachSegment(flatCoordinates, offset, end, stride, spy);
        expect(spy.callCount).to.be(3);
        expect(args[0][0]).to.be(0);
        expect(args[0][1]).to.be(0);
        expect(args[0][2]).to.be(1);
        expect(args[0][3]).to.be(1);
        expect(args[1][0]).to.be(1);
        expect(args[1][1]).to.be(1);
        expect(args[1][2]).to.be(2);
        expect(args[1][3]).to.be(2);
        expect(args[2][0]).to.be(2);
        expect(args[2][1]).to.be(2);
        expect(args[2][2]).to.be(3);
        expect(args[2][3]).to.be(3);
        expect(ret).to.be(false);
      });
    });
    describe('callback returns true', function () {
      it('executes the callback for the first segment', function () {
        const args = [];
        const spy = sinon.spy(function (point1, point2) {
          args.push([point1[0], point1[1], point2[0], point2[1]]);
          return true;
        });
        const ret = forEachSegment(flatCoordinates, offset, end, stride, spy);
        expect(spy.callCount).to.be(1);
        expect(args[0][0]).to.be(0);
        expect(args[0][1]).to.be(0);
        expect(args[0][2]).to.be(1);
        expect(args[0][3]).to.be(1);
        expect(ret).to.be(true);
      });
    });
  });
});
