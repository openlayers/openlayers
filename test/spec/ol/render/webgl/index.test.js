

goog.require('ol.render.webgl.Replay');

describe('ol.render.Replay', function() {
  var replay;
  beforeEach(function() {
    replay = new ol.render.webgl.Replay(5, [-180, -90, 180, 90]);
  });


  describe('constructor', function() {
    it('stores view related data', function() {
      expect(replay.tolerance).to.be(5);
      expect(replay.maxExtent).to.eql([-180, -90, 180, 90]);
      expect(replay.origin).to.eql([0, 0]);
    });

    it ('sets up the required matrices', function() {
      var mat3 = [1, 0, 0, 1, 0, 0];
      var mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      expect(replay.projectionMatrix_).to.eql(mat3);
      expect(replay.offsetRotateMatrix_).to.eql(mat3);
      expect(replay.offsetScaleMatrix_).to.eql(mat3);
      expect(replay.tmpMat4_).to.eql(mat4);
    });
  });

  describe('#replay', function() {
    var gl = {
      uniformMatrix4fv: function() {},
      uniform1f: function() {}
    };
    var context = {
      bindBuffer: function() {},
      getGL: function() {
        return gl;
      }
    };
    beforeEach(function() {
      replay.setUpProgram = function() {
        return {
          u_projectionMatrix: true,
          u_offsetScaleMatrix: true,
          u_offsetRotateMatrix: true,
          u_opacity: true
        };
      };
    });

    it('calculates the correct matrices', function() {
      var sin = Math.sin(Math.PI);
      replay.replay(context, [0, 0], 10, Math.PI, [10, 10], 1, 0, {}, undefined,
          false, undefined);

      expect(replay.projectionMatrix_).to.eql([-0.02, -sin * 0.02, sin * 0.02,
        -0.02, 0, 0]);
      expect(replay.offsetRotateMatrix_).to.eql([-1, -sin, sin, -1, 0, 0]);
      expect(replay.offsetScaleMatrix_).to.eql([0.2, 0, 0, 0.2, 0, 0]);
    });
  });
});
