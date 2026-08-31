import {assert} from 'chai';
import {
  ColorType,
  NumberType,
  newParsingContext,
} from '../../../../src/ol/expr/expression.js';
import {
  arrayToWgsl,
  compileTileColorPipeline,
  expressionToWgsl,
  newCompilationContext,
  numberToWgsl,
} from '../../../../src/ol/expr/wgsl.js';
import {
  TILE_SHADER,
  withTileColorPipeline,
  withUnfilterableTileSampling,
} from '../../../../src/ol/webgpu/shaders.js';

describe('ol/expr/wgsl', () => {
  describe('numberToWgsl()', () => {
    it('adds a fraction when missing', () => {
      assert.strictEqual(numberToWgsl(1), '1.0');
      assert.strictEqual(numberToWgsl(1.5), '1.5');
    });
  });

  describe('arrayToWgsl()', () => {
    it('outputs typed vec constructors', () => {
      assert.strictEqual(arrayToWgsl([1, 0]), 'vec2<f32>(1.0, 0.0)');
    });
  });

  describe('expressionToWgsl()', () => {
    it('compiles arithmetic', () => {
      const context = newCompilationContext();
      const wgsl = expressionToWgsl(
        context,
        ['+', 1, ['*', 2, 3]],
        NumberType,
        newParsingContext(),
      );
      assert.strictEqual(wgsl, '(1.0 + (2.0 * 3.0))');
    });

    it('compiles a color literal', () => {
      const context = newCompilationContext();
      const wgsl = expressionToWgsl(
        context,
        [255, 0, 0, 1],
        ColorType,
        newParsingContext(),
      );
      assert.include(wgsl, 'vec4<f32>');
    });
  });

  describe('compileTileColorPipeline()', () => {
    it('emits a brightness adjustment', () => {
      const {fragmentBody} = compileTileColorPipeline({brightness: 0.2});
      assert.include(fragmentBody, '0.2');
    });

    it('reads style variables from the uniform struct', () => {
      const {fragmentBody} = compileTileColorPipeline({
        variables: {level: 0},
        color: [
          'case',
          ['>', ['band', 1], ['var', 'level']],
          [0, 0, 255],
          [0, 0, 0, 0],
        ],
      });
      assert.include(fragmentBody, 'uniforms.u_var_level');
    });

    it('compiles palette to a nearest-color function', () => {
      const {fragmentBody, functions} = compileTileColorPipeline({
        color: ['palette', 1, ['#000000', '#ffffff']],
      });
      assert.include(fragmentBody, 'ol_palette_');
      assert.include(functions, 'floor(index + 0.5)');
      assert.include(functions, 'vec4<f32>');
    });
  });

  describe('tile color shader injection', () => {
    it('appends style variable fields after time', () => {
      const shader = withTileColorPipeline(TILE_SHADER, '', '', ['level']);
      assert.include(shader, 'time: f32,\n  u_var_level: f32,\n}');
      assert.include(shader, 'resolution: f32,');
    });

    it('samples float tiles with textureLoad', () => {
      const shader = withUnfilterableTileSampling(TILE_SHADER);
      assert.include(shader, 'textureLoad(tileTexture');
      assert.notInclude(shader, 'textureSample(tileTexture');
      assert.notInclude(shader, 'var tileSampler');
    });
  });
});
