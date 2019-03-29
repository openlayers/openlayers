import WebGLHelper from '../../../../src/ol/webgl/Helper';


const VERTEX_SHADER = `
  precision mediump float;
  
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  
  attribute float a_test;
  uniform float u_test;
  
  void main(void) {
    gl_Position = vec4(u_test, a_test, 0.0, 1.0);
  }`;

const INVALID_VERTEX_SHADER = `
  precision mediump float;
  
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  
  bla
  uniform float u_test;
  
  void main(void) {
    gl_Position = vec4(u_test, a_test, 0.0, 1.0);
  }`;

const FRAGMENT_SHADER = `
  precision mediump float;
  
  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }`;

describe('ol.webgl.WebGLHelper', function() {

  describe('constructor', function() {

    describe('without an argument', function() {

      let h;
      beforeEach(function() {
        h = new WebGLHelper();
      });

      it('initialized WebGL context & canvas', function() {
        expect(h.getGL() instanceof WebGLRenderingContext).to.eql(true);
        expect(h.getCanvas() instanceof HTMLCanvasElement).to.eql(true);
      });

      it('has a default rendering pass', function() {
        expect(h.postProcessPasses_.length).to.eql(1);
      });
    });

    describe('with post process passes', function() {

      let h;
      beforeEach(function() {
        h = new WebGLHelper({
          postProcesses: [{
            scaleRatio: 0.5
          }, {
            uniforms: {
              u_test: 4
            }
          }]
        });
      });

      it('has instantiated post-processing passes', function() {
        expect(h.postProcessPasses_.length).to.eql(2);
        expect(h.postProcessPasses_[0].scaleRatio_).to.eql(0.5);
        expect(h.postProcessPasses_[0].uniforms_.length).to.eql(0);
        expect(h.postProcessPasses_[1].scaleRatio_).to.eql(1);
        expect(h.postProcessPasses_[1].uniforms_.length).to.eql(1);
        expect(h.postProcessPasses_[1].uniforms_[0].value).to.eql(4);
      });

    });

  });

  describe('operations', function() {

    describe('prepare draw', function() {

      let h;
      beforeEach(function() {
        h = new WebGLHelper({
          uniforms: {
            u_test1: 42,
            u_test2: [1, 3],
            u_test3: document.createElement('canvas')
          }
        });
        h.useProgram(h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER));
        h.prepareDraw({
          pixelRatio: 2,
          size: [50, 80],
          viewState: {
            rotation: 10,
            resolution: 10,
            center: [0, 0]
          }
        });
      });

      it('has resized the canvas', function() {
        expect(h.getCanvas().width).to.eql(100);
        expect(h.getCanvas().height).to.eql(160);
      });

      it('has processed uniforms', function() {
        expect(h.uniforms_.length).to.eql(3);
        expect(h.uniforms_[0].name).to.eql('u_test1');
        expect(h.uniforms_[1].name).to.eql('u_test2');
        expect(h.uniforms_[2].name).to.eql('u_test3');
        expect(h.uniforms_[0].location).to.not.eql(-1);
        expect(h.uniforms_[1].location).to.not.eql(-1);
        expect(h.uniforms_[2].location).to.not.eql(-1);
        expect(h.uniforms_[2].texture).to.not.eql(undefined);
      });
    });

    describe('valid shader compiling', function() {
      let h;
      let p;
      beforeEach(function() {
        h = new WebGLHelper();

        p = h.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
        h.useProgram(p);
      });

      it('has saved the program', function() {
        expect(h.currentProgram_).to.eql(p);
      });

      it('has no shader compilation error', function() {
        expect(h.shaderCompileErrors_).to.eql(null);
      });

      it('can find the uniform location', function() {
        expect(h.getUniformLocation('u_test')).to.not.eql(null);
      });

      it('can find the attribute location', function() {
        expect(h.getAttributeLocation('a_test')).to.not.eql(-1);
      });

      it('cannot find an unknown attribute location', function() {
        expect(h.getAttributeLocation('a_test_missing')).to.eql(-1);
      });
    });

    describe('invalid shader compiling', function() {
      let h;
      let p;
      beforeEach(function() {
        h = new WebGLHelper();

        p = h.getProgram(FRAGMENT_SHADER, INVALID_VERTEX_SHADER);
        h.useProgram(p);
      });

      it('has saved the program', function() {
        expect(h.currentProgram_).to.eql(p);
      });

      it('has shader compilation errors', function() {
        expect(h.shaderCompileErrors_).to.not.eql(null);
      });

      it('cannot find the uniform location', function() {
        expect(h.getUniformLocation('u_test')).to.eql(null);
      });
    });

  });
});
