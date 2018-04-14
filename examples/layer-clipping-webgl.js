import Map from '../src/ol/WebGLMap.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import {WEBGL} from '../src/ol/has.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

if (!WEBGL) {
  const info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
} else {

  const osm = new TileLayer({
    source: new OSM()
  });

  const map = new Map({
    layers: [osm],
    target: 'map',
    controls: defaultControls({
      attributionOptions: {
        collapsible: false
      }
    }),
    view: new View({
      center: [0, 0],
      zoom: 2
    })
  });

  const fragmentShaderSource = [
    'precision mediump float;',
    'void main() {',
    '}'
  ].join('');

  const vertexShaderSource = [
    'attribute vec2 a_position;',
    'void main() {',
    '  gl_Position = vec4(a_position, 0, 1);',
    '}'
  ].join('');

  osm.on('precompose', function(event) {
    const context = event.glContext;

    const gl = context.getGL();
    const program = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    gl.attachShader(program, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    context.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');

    gl.enable(gl.STENCIL_TEST);
    gl.colorMask(false, false, false, false);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      // first band
      -1.0, -1.0, -0.75, -1.0, -1.0, 1.0,
      -1.0, 1.0, -0.75, -1.0, -0.75, 1.0,
      // second band
      -0.5, -1.0, -0.25, -1.0, -0.5, 1.0,
      -0.5, 1.0, -0.25, -1.0, -0.25, 1.0,
      // third band
      0.0, -1.0, 0.25, -1.0, 0.0, 1.0,
      0.0, 1.0, 0.25, -1.0, 0.25, 1.0,
      // forth band
      0.5, -1.0, 0.75, -1.0, 0.5, 1.0,
      0.5, 1.0, 0.75, -1.0, 0.75, 1.0
    ]), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 24);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(buffer);

    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.NOTEQUAL, 0, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
  });

  osm.on('postcompose', function(event) {
    const context = event.glContext;
    const gl = context.getGL();
    gl.disable(gl.STENCIL_TEST);
  });
}
