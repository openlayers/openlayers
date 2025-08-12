import Feature from '../../../../../../src/ol/Feature.js';
import {asArray} from '../../../../../../src/ol/color.js';
import {
  stringToGlsl,
  uniformNameForVariable,
} from '../../../../../../src/ol/expr/gpu.js';
import MultiPolygon from '../../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import {packColor} from '../../../../../../src/ol/render/webgl/compileUtil.js';
import {
  computeHash,
  parseLiteralStyle,
} from '../../../../../../src/ol/render/webgl/style.js';

describe('ol/render/webgl/style', () => {
  describe('parseLiteralStyle', () => {
    it('parses a style with variables', () => {
      const result = parseLiteralStyle(
        {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            ['var', 'lower'],
            4,
            ['var', 'higher'],
            8,
          ],
          'circle-fill-color': '#336699',
          'circle-opacity': 0.5,
        },
        {
          lower: 100,
          higher: 400,
        },
      );

      const lowerUniformName = uniformNameForVariable('lower');
      const higherUniformName = uniformNameForVariable('higher');
      expect(result.builder.uniforms_).to.eql([
        {name: lowerUniformName, type: 'float'},
        {name: higherUniformName, type: 'float'},
      ]);
      expect(result.builder.attributes_).to.eql([
        {
          'name': 'a_prop_population',
          'type': 'float',
          'varyingExpression': 'a_prop_population',
          'varyingName': 'v_prop_population',
          'varyingType': 'float',
        },
      ]);
      expect(result.builder.symbolColorExpression_).to.eql(
        'vec4(0.2, 0.4, 0.6, 1.0) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, circleDistanceField(coordsPx, mix(4.0, 8.0, clamp((a_prop_population - u_var_lower) / (u_var_higher - u_var_lower), 0.0, 1.0)))))) * vec4(1.0, 1.0, 1.0, 0.5)',
      );
      expect(result.builder.symbolSizeExpression_).to.eql(
        `vec2(mix(4.0, 8.0, clamp((a_prop_population - u_var_lower) / (u_var_higher - u_var_lower), 0.0, 1.0)) * 2. + 0.5)`,
      );
      expect(Object.keys(result.attributes).length).to.eql(1);
      expect(result.attributes).to.have.property('prop_population');
      expect(result.uniforms).to.have.property(lowerUniformName);
      expect(result.uniforms).to.have.property(higherUniformName);
    });

    it('parses a style with a filter', () => {
      const result = parseLiteralStyle(
        {
          'circle-radius': 6,
          'circle-fill-color': '#336699',
        },
        undefined,
        ['between', ['get', 'attr0'], 0, 10],
      );

      expect(result.builder.attributes_).to.eql([
        {
          'name': 'a_prop_attr0',
          'type': 'float',
          'varyingExpression': 'a_prop_attr0',
          'varyingName': 'v_prop_attr0',
          'varyingType': 'float',
        },
      ]);
      expect(result.builder.symbolColorExpression_).to.eql(
        'vec4(0.2, 0.4, 0.6, 1.0) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, circleDistanceField(coordsPx, 6.0))))',
      );
      expect(result.builder.symbolSizeExpression_).to.eql(
        'vec2(6.0 * 2. + 0.5)',
      );
      expect(result.builder.discardExpression_).to.eql(
        '!(a_prop_attr0 >= 0.0 && a_prop_attr0 <= 10.0)',
      );
      expect(Object.keys(result.attributes).length).to.eql(1);
      expect(result.attributes).to.have.property('prop_attr0');
    });

    it('correctly adds string variables to the string literals mapping', () => {
      const varName = 'mySize';
      const uniformName = uniformNameForVariable(varName);

      const result = parseLiteralStyle(
        {
          'circle-radius': [
            'match',
            ['var', varName],
            'abc',
            10,
            'def',
            20,
            30,
          ],
          'circle-fill-color': 'red',
        },
        {
          mySize: 'abcdef',
        },
      );

      expect(result.uniforms[uniformName]()).to.be.greaterThan(0);
    });

    describe('circle style', () => {
      let result;
      describe('contains all properties and expressions', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'circle-radius': ['get', 'attr1'],
            'circle-fill-color': ['get', 'color1'],
            'circle-stroke-color': ['get', 'color2'],
            'circle-stroke-width': ['+', 3, 4],
            'circle-displacement': ['array', -2, 1],
            'circle-scale': ['array', 1.5, 1.7],
            'circle-opacity': ['*', 0.5, 0.75],
            'circle-rotation': ['get', 'heading'],
            'circle-rotate-with-view': true,
          });
        });
        it('sets up builder accordingly', () => {
          expect(result.builder.uniforms_).to.eql([]);
          expect(result.builder.attributes_).to.eql([
            {
              name: 'a_prop_attr1',
              type: 'float',
              varyingName: 'v_prop_attr1',
              varyingType: 'float',
              varyingExpression: 'a_prop_attr1',
            },
            {
              name: 'a_prop_heading',
              type: 'float',
              varyingName: 'v_prop_heading',
              varyingType: 'float',
              varyingExpression: 'a_prop_heading',
            },
            {
              name: 'a_prop_color1',
              type: 'vec2',
              varyingName: 'v_prop_color1',
              varyingType: 'vec4',
              varyingExpression: 'unpackColor(a_prop_color1)',
            },
            {
              name: 'a_prop_color2',
              type: 'vec2',
              varyingName: 'v_prop_color2',
              varyingType: 'vec4',
              varyingExpression: 'unpackColor(a_prop_color2)',
            },
          ]);
          expect(result.builder.symbolColorExpression_).to.eql(
            'mix(a_prop_color2, a_prop_color1, smoothstep(-(3.0 + 4.0) + 0.63, -(3.0 + 4.0) - 0.58, circleDistanceField(coordsPx / vec2(1.5, 1.7), (a_prop_attr1 + (3.0 + 4.0) * 0.5)))) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, circleDistanceField(coordsPx / vec2(1.5, 1.7), (a_prop_attr1 + (3.0 + 4.0) * 0.5))))) * vec4(1.0, 1.0, 1.0, (0.5 * 0.75))',
          );
          expect(result.builder.symbolSizeExpression_).to.eql(
            'vec2((a_prop_attr1 + (3.0 + 4.0) * 0.5) * 2. + 0.5) * vec2(1.5, 1.7)',
          );
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(-2.0, 1.0)',
          );
          expect(result.builder.symbolRotateWithView_).to.eql(true);
          expect(Object.keys(result.attributes).length).to.eql(4);
          expect(result.attributes).to.have.property('prop_attr1');
          expect(result.attributes).to.have.property('prop_heading');
          expect(result.attributes).to.have.property('prop_color1');
          expect(result.attributes).to.have.property('prop_color2');
          expect(result.uniforms).to.eql({});
        });
      });
      describe('contains no stroke', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'circle-radius': 10,
            'circle-fill-color': 'rgba(255, 255, 255, 0.5)',
          });
        });
        it('uses a simplified color expression', () => {
          expect(result.builder.symbolColorExpression_).to.eql(
            'vec4(1.0, 1.0, 1.0, 0.5) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, circleDistanceField(coordsPx, 10.0))))',
          );
        });
      });
      describe('contains no fill', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'circle-radius': 10,
            'circle-stroke-color': 'red',
            'circle-stroke-width': 4,
          });
        });
        it('uses a transparent fill color', () => {
          expect(result.builder.symbolColorExpression_).to.eql(
            'mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.), smoothstep(-4.0 + 0.63, -4.0 - 0.58, circleDistanceField(coordsPx, (10.0 + 4.0 * 0.5)))) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, circleDistanceField(coordsPx, (10.0 + 4.0 * 0.5)))))',
          );
        });
      });
      describe('contains no circle radius', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'circle-fill-color': ['get', 'color1'],
            'circle-stroke-color': ['get', 'color2'],
            'circle-stroke-width': ['+', 3, 4],
            'circle-rotation': ['get', 'heading'],
          });
        });
        it('does not register the circle style', () => {
          expect(result.builder.hasSymbol_).to.eql(false);
        });
      });
    });

    describe('shape style', () => {
      let result;
      describe('contains all properties and expressions', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'shape-points': ['-', 10, 3],
            'shape-radius': ['get', 'attr1'],
            'shape-radius2': ['*', 2, 5],
            'shape-fill-color': ['get', 'color1'],
            'shape-stroke-color': ['get', 'color2'],
            'shape-stroke-width': ['+', 3, 4],
            'shape-displacement': ['array', -2, 1],
            'shape-scale': ['array', 1.5, 1.7],
            'shape-opacity': ['*', 0.5, 0.75],
            'shape-rotation': ['get', 'heading'],
            'shape-rotate-with-view': true,
            'shape-angle': ['*', 0.5, Math.PI],
          });
        });
        it('sets up builder accordingly', () => {
          expect(result.builder.uniforms_).to.eql([]);
          expect(result.builder.attributes_).to.eql([
            {
              name: 'a_prop_attr1',
              type: 'float',
              varyingName: 'v_prop_attr1',
              varyingType: 'float',
              varyingExpression: 'a_prop_attr1',
            },
            {
              name: 'a_prop_heading',
              type: 'float',
              varyingName: 'v_prop_heading',
              varyingType: 'float',
              varyingExpression: 'a_prop_heading',
            },
            {
              name: 'a_prop_color1',
              type: 'vec2',
              varyingName: 'v_prop_color1',
              varyingType: 'vec4',
              varyingExpression: 'unpackColor(a_prop_color1)',
            },
            {
              name: 'a_prop_color2',
              type: 'vec2',
              varyingName: 'v_prop_color2',
              varyingType: 'vec4',
              varyingExpression: 'unpackColor(a_prop_color2)',
            },
          ]);
          expect(result.builder.symbolColorExpression_).to.eql(
            'mix(a_prop_color2, a_prop_color1, smoothstep(-(3.0 + 4.0) + 0.63, -(3.0 + 4.0) - 0.58, starDistanceField(coordsPx / vec2(1.5, 1.7), (10.0 - 3.0), a_prop_attr1 + (3.0 + 4.0) * 0.5, (2.0 * 5.0) + (3.0 + 4.0) * 0.5, (0.5 * 3.141592653589793)))) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, starDistanceField(coordsPx / vec2(1.5, 1.7), (10.0 - 3.0), a_prop_attr1 + (3.0 + 4.0) * 0.5, (2.0 * 5.0) + (3.0 + 4.0) * 0.5, (0.5 * 3.141592653589793))))) * vec4(1.0, 1.0, 1.0, (0.5 * 0.75))',
          );
          expect(result.builder.symbolSizeExpression_).to.eql(
            'vec2((max(a_prop_attr1, (2.0 * 5.0)) + (3.0 + 4.0) * 0.5) * 2. + 0.5) * vec2(1.5, 1.7)',
          );
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(-2.0, 1.0)',
          );
          expect(result.builder.symbolRotateWithView_).to.eql(true);
          expect(Object.keys(result.attributes).length).to.eql(4);
          expect(result.attributes).to.have.property('prop_attr1');
          expect(result.attributes).to.have.property('prop_heading');
          expect(result.attributes).to.have.property('prop_color1');
          expect(result.attributes).to.have.property('prop_color2');
          expect(result.uniforms).to.eql({});
        });
      });
      describe('contains no stroke', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'shape-points': 5,
            'shape-radius': 10,
            'shape-fill-color': 'rgba(255, 255, 255, 0.5)',
          });
        });
        it('uses a simplified color expression', () => {
          expect(result.builder.symbolColorExpression_).to.eql(
            'vec4(1.0, 1.0, 1.0, 0.5) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, regularDistanceField(coordsPx, 5.0, 10.0, 0.))))',
          );
        });
      });
      describe('contains no fill', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'shape-points': 5,
            'shape-radius': 10,
            'shape-stroke-color': 'red',
            'shape-stroke-width': 4,
          });
        });
        it('uses a transparent fill color', () => {
          expect(result.builder.symbolColorExpression_).to.eql(
            'mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.), smoothstep(-4.0 + 0.63, -4.0 - 0.58, regularDistanceField(coordsPx, 5.0, 10.0 + 4.0 * 0.5, 0.))) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, regularDistanceField(coordsPx, 5.0, 10.0 + 4.0 * 0.5, 0.))))',
          );
        });
      });
      describe('contains no points count', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'shape-fill-color': ['get', 'color1'],
            'shape-stroke-color': ['get', 'color2'],
            'shape-stroke-width': ['+', 3, 4],
            'shape-rotation': ['get', 'heading'],
          });
        });
        it('does not register the shape style', () => {
          expect(result.builder.hasSymbol_).to.eql(false);
        });
      });
    });

    describe('icon style', () => {
      let result, uid;
      describe('contains main properties and expressions, icon specified as data url', () => {
        beforeEach(() => {
          const style = {
            'icon-src':
              'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            'icon-opacity': ['*', 0.5, 0.75],
            'icon-color': ['get', 'color1'],
            'icon-displacement': ['array', -2, 1],
            'icon-scale': ['array', 1.5, 1.7],
            'icon-rotation': ['get', 'heading'],
            'icon-rotate-with-view': true,
            'icon-offset': ['array', ['get', 'attr1'], 20],
            'icon-size': ['array', 30, 40],
          };
          uid = computeHash(style['icon-src']);
          result = parseLiteralStyle(style);
        });
        it('sets up builder accordingly', () => {
          expect(result.builder.uniforms_).to.eql([
            {name: `u_texture${uid}_size`, type: 'vec2'},
            {name: `u_texture${uid}`, type: 'sampler2D'},
          ]);
          expect(result.builder.attributes_).to.eql([
            {
              name: 'a_prop_color1',
              type: 'vec2',
              varyingName: 'v_prop_color1',
              varyingType: 'vec4',
              varyingExpression: 'unpackColor(a_prop_color1)',
            },
            {
              name: 'a_prop_attr1',
              type: 'float',
              varyingName: 'v_prop_attr1',
              varyingType: 'float',
              varyingExpression: 'a_prop_attr1',
            },
            {
              name: 'a_prop_heading',
              type: 'float',
              varyingName: 'v_prop_heading',
              varyingType: 'float',
              varyingExpression: 'a_prop_heading',
            },
          ]);
          expect(result.builder.symbolColorExpression_).to.eql(
            `a_prop_color1 * vec4(1.0, 1.0, 1.0, (0.5 * 0.75)) * texture2D(u_texture${uid}, v_texCoord)`,
          );
          expect(result.builder.symbolSizeExpression_).to.eql(
            'vec2(30.0, 40.0) * vec2(1.5, 1.7)',
          );
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(-2.0, 1.0)',
          );
          expect(result.builder.texCoordExpression_).to.eql(
            `(vec4((vec2(a_prop_attr1, 20.0)).xyxy) + vec4(0., 0., vec2(30.0, 40.0))) / (u_texture${uid}_size).xyxy`,
          );
          expect(result.builder.symbolRotateWithView_).to.eql(true);
          expect(Object.keys(result.attributes).length).to.eql(3);
          expect(result.attributes).to.have.property('prop_attr1');
          expect(result.attributes).to.have.property('prop_heading');
          expect(result.attributes).to.have.property('prop_color1');
          expect(Object.keys(result.uniforms).length).to.eql(2);
          expect(result.uniforms).to.have.property(`u_texture${uid}_size`);
          expect(result.uniforms).to.have.property(`u_texture${uid}`);
        });
        it('uses the provided Image', () => {
          const image = /** @type {Image} */ (
            result.uniforms[`u_texture${uid}`]
          );
          expect(image).to.be.an(Image);
        });
      });
      describe('icon specified as a path', () => {
        beforeEach(() => {
          const style = {
            'icon-src': '../data/icon.png',
          };
          uid = computeHash(style['icon-src']);
          result = parseLiteralStyle(style);
        });
        it('registers a uniform for the icon size, which is set asynchronously', () => {
          expect(result.builder.symbolSizeExpression_).to.eql(
            `u_texture${uid}_size`,
          );
          expect(Object.keys(result.uniforms).length).to.eql(2);
          expect(result.uniforms).to.have.property(`u_texture${uid}`);
          expect(result.uniforms).to.have.property(`u_texture${uid}_size`);
        });
        it('creates an Image with the given path and crossOrigin set to anonymous', () => {
          const image = /** @type {Image} */ (
            result.uniforms[`u_texture${uid}`]
          );
          expect(image).to.be.an(Image);
          expect(new URL(image.src).pathname).to.eql('/data/icon.png');
          expect(image.crossOrigin).to.eql('anonymous');
        });
      });
      describe('icon-width and icon-height properties', () => {
        beforeEach(() => {
          result = parseLiteralStyle({
            'icon-src': '../data/icon.png',
            'icon-width': ['*', 10, 1.5],
            'icon-height': ['*', 20, 0.5],
          });
        });
        it('overrides the size expression inferred from the icon', () => {
          expect(result.builder.symbolSizeExpression_).to.eql(
            'vec2((10.0 * 1.5), (20.0 * 0.5))',
          );
        });
      });
      describe('icon-cross-origin', () => {
        beforeEach(() => {
          const style = {
            'icon-src': '../data/icon.png',
            'icon-cross-origin': 'use-credentials',
          };
          uid = computeHash(style['icon-src']);
          result = parseLiteralStyle(style);
        });
        it('sets the crossOrigin attribute on the image', () => {
          const image = /** @type {Image} */ (
            result.uniforms[`u_texture${uid}`]
          );
          expect(image.crossOrigin).to.eql('use-credentials');
        });
      });
      describe('icon-offset-origin values', () => {
        let style;
        beforeEach(() => {
          style = {
            'icon-src': '../data/icon.png',
            'icon-width': 40,
            'icon-height': 80,
            'icon-offset': [5, 10],
            'icon-size': [20, 40],
          };
        });
        it('top-left (default)', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-offset-origin': 'top-left',
          });
          expect(result.builder.texCoordExpression_).to.eql(
            '(vec4((vec2(5.0, 10.0)).xyxy) + vec4(0., 0., vec2(20.0, 40.0))) / (vec2(40.0, 80.0)).xyxy',
          );
        });
        it('bottom-left', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-offset-origin': 'bottom-left',
          });
          expect(result.builder.texCoordExpression_).to.eql(
            '(vec4((vec2(0., v_quadSizePx.y) + vec2(20.0, 40.0) * vec2(0., -1.) + vec2(5.0, 10.0) * vec2(1., -1.)).xyxy) + vec4(0., 0., vec2(20.0, 40.0))) / (vec2(40.0, 80.0)).xyxy',
          );
        });
        it('top-right', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-offset-origin': 'top-right',
          });
          expect(result.builder.texCoordExpression_).to.eql(
            '(vec4((vec2(v_quadSizePx.x, 0.) + vec2(20.0, 40.0) * vec2(-1., 0.) + vec2(5.0, 10.0) * vec2(-1., 1.)).xyxy) + vec4(0., 0., vec2(20.0, 40.0))) / (vec2(40.0, 80.0)).xyxy',
          );
        });
        it('bottom-right', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-offset-origin': 'bottom-right',
          });
          expect(result.builder.texCoordExpression_).to.eql(
            '(vec4((v_quadSizePx - vec2(20.0, 40.0) - vec2(5.0, 10.0)).xyxy) + vec4(0., 0., vec2(20.0, 40.0))) / (vec2(40.0, 80.0)).xyxy',
          );
        });
      });
      describe('icon-anchor', () => {
        let style;
        beforeEach(() => {
          style = {
            'icon-src': '../data/icon.png',
            'icon-width': 40,
            'icon-height': 80,
            'icon-displacement': [10, 15],
          };
        });
        it('only fractions', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor': [0.2, 0.4],
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * vec2(0.5, -0.5) + vec2(0.2, 0.4) * v_quadSizePx * vec2(-1., 1.)',
          );
        });
        it('using pixels on X', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor': [20, 0.4],
            'icon-anchor-x-units': 'pixels',
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * vec2(0.5, -0.5) + vec2(20.0, 0.4) * vec2(vec2(1.0).x, v_quadSizePx.y) * vec2(-1., 1.)',
          );
        });
        it('using pixels on Y', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor': [0.2, 12],
            'icon-anchor-y-units': 'pixels',
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * vec2(0.5, -0.5) + vec2(0.2, 12.0) * vec2(v_quadSizePx.x, vec2(1.0).x) * vec2(-1., 1.)',
          );
        });
        it('using pixels on X and Y', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor': [20, 12],
            'icon-anchor-x-units': 'pixels',
            'icon-anchor-y-units': 'pixels',
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * vec2(0.5, -0.5) + vec2(20.0, 12.0) * 1.0 * vec2(-1., 1.)',
          );
        });
        it('using pixels on X and Y with scale', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor': [20, 12],
            'icon-anchor-x-units': 'pixels',
            'icon-anchor-y-units': 'pixels',
            'icon-scale': [2, 3],
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * vec2(0.5, -0.5) + vec2(20.0, 12.0) * vec2(2.0, 3.0) * vec2(-1., 1.)',
          );
        });
      });
      describe('icon-anchor-origin values', () => {
        let style;
        beforeEach(() => {
          style = {
            'icon-src': '../data/icon.png',
            'icon-width': 40,
            'icon-height': 80,
            'icon-displacement': [10, 15],
            'icon-anchor': [20, 0.4],
            'icon-anchor-x-units': 'pixels',
          };
        });
        it('top-left (default)', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor-origin': 'top-left',
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * vec2(0.5, -0.5) + vec2(20.0, 0.4) * vec2(vec2(1.0).x, v_quadSizePx.y) * vec2(-1., 1.)',
          );
        });
        it('bottom-left', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor-origin': 'bottom-left',
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * 0.5 - vec2(20.0, 0.4) * vec2(vec2(1.0).x, v_quadSizePx.y)',
          );
        });
        it('top-right', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor-origin': 'top-right',
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * -0.5 + vec2(20.0, 0.4) * vec2(vec2(1.0).x, v_quadSizePx.y)',
          );
        });
        it('bottom-right', () => {
          result = parseLiteralStyle({
            ...style,
            'icon-anchor-origin': 'bottom-right',
          });
          expect(result.builder.symbolOffsetExpression_).to.eql(
            'vec2(10.0, 15.0) + v_quadSizePx * vec2(-0.5, 0.5) + vec2(20.0, 0.4) * vec2(vec2(1.0).x, v_quadSizePx.y) * vec2(1., -1.)',
          );
        });
      });
    });

    describe('stroke style', () => {
      let result, uid;
      describe('simple style', () => {
        beforeEach(() => {
          const style = {
            'stroke-color': '#ff0000',
            'stroke-width': 4,
          };
          result = parseLiteralStyle(style);
        });
        it('parses style', () => {
          expect(result.builder.uniforms_).to.eql([]);
          expect(result.builder.attributes_).to.eql([]);
          expect(result.builder.strokeColorExpression_).to.eql(
            'vec4(1.0, 0.0, 0.0, 1.0)',
          );
          expect(result.builder.strokeWidthExpression_).to.eql('4.0');
          expect(result.builder.strokeCapExpression_).to.eql(
            stringToGlsl('round'),
          );
          expect(result.builder.strokeJoinExpression_).to.eql(
            stringToGlsl('round'),
          );
          expect(result.builder.strokeOffsetExpression_).to.eql('0.');
          expect(result.builder.strokeMiterLimitExpression_).to.eql('10.');
          expect(result.builder.strokeDistanceFieldExpression_).to.eql(
            '-1000.',
          );
          expect(Object.keys(result.attributes).length).to.eql(0);
        });
      });
      describe('dynamic properties, color, width joins, caps, offset', () => {
        beforeEach(() => {
          const style = {
            'stroke-color': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              0,
              'blue',
              1,
              'red',
            ],
            'stroke-width': ['*', ['var', 'width'], 3],
            'stroke-line-join': ['var', 'joinType'],
            'stroke-line-cap': ['var', 'capType'],
            'stroke-offset': ['+', ['get', 'offset'], 4],
            'stroke-miter-limit': ['-', ['var', 'miterLimit'], 10],
            'stroke-line-dash': [
              ['*', ['get', 'size'], 10],
              ['*', ['get', 'size'], 20],
              5,
              ['*', ['get', 'size'], 20],
            ],
            'stroke-line-dash-offset': ['*', ['time'], 5],
            'circle-radius': 1,
            'circle-fill-color': 'white',
            'fill-color': 'white',
          };
          const variables = {
            width: 1,
            capType: 'butt',
            joinType: 'bevel',
            miterLimit: 20,
          };
          result = parseLiteralStyle(style, variables);
        });
        it('parses style', () => {
          expect(result.builder.uniforms_).to.eql([
            {name: 'u_var_width', type: 'float'},
            {name: 'u_var_capType', type: 'float'},
            {name: 'u_var_joinType', type: 'float'},
            {name: 'u_var_miterLimit', type: 'float'},
          ]);
          expect(result.builder.attributes_).to.eql([
            {
              name: 'a_prop_intensity',
              type: 'float',
              varyingName: 'v_prop_intensity',
              varyingType: 'float',
              varyingExpression: 'a_prop_intensity',
            },
            {
              name: 'a_prop_offset',
              type: 'float',
              varyingName: 'v_prop_offset',
              varyingType: 'float',
              varyingExpression: 'a_prop_offset',
            },
            {
              name: 'a_prop_size',
              type: 'float',
              varyingName: 'v_prop_size',
              varyingType: 'float',
              varyingExpression: 'a_prop_size',
            },
          ]);
          expect(result.builder.strokeColorExpression_).to.eql(
            'mix(vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), clamp((a_prop_intensity - 0.0) / (1.0 - 0.0), 0.0, 1.0))',
          );
          expect(result.builder.strokeWidthExpression_).to.eql(
            '(u_var_width * 3.0)',
          );
          expect(result.builder.strokeCapExpression_).to.eql('u_var_capType');
          expect(result.builder.strokeJoinExpression_).to.eql('u_var_joinType');
          expect(result.builder.strokeOffsetExpression_).to.eql(
            '(a_prop_offset + 4.0)',
          );
          expect(result.builder.strokeMiterLimitExpression_).to.eql(
            '(u_var_miterLimit - 10.0)',
          );
          expect(result.builder.strokeDistanceFieldExpression_).to.eql(
            'dashDistanceField_450289113(currentLengthPx + (u_time * 5.0), currentRadiusPx, capType, v_width, (a_prop_size * 10.0), (a_prop_size * 20.0), 5.0, (a_prop_size * 20.0))',
          );
          expect(Object.keys(result.attributes).length).to.eql(3);
          expect(result.attributes).to.have.property('prop_intensity');
          expect(result.attributes).to.have.property('prop_offset');
          expect(result.attributes).to.have.property('prop_size');
          expect(result.uniforms).to.have.property('u_var_width');
          expect(result.uniforms).to.have.property('u_var_capType');
          expect(result.uniforms).to.have.property('u_var_joinType');
          expect(result.uniforms).to.have.property('u_var_miterLimit');

          expect(result.builder.fragmentShaderFunctions_[1]).to.contain(
            'float getSingleDashDistance',
          );
          expect(result.builder.fragmentShaderFunctions_).to
            .contain(`float dashDistanceField_450289113(float distance, float radius, float capType, float lineWidth, float dashLength0, float dashLength1, float dashLength2, float dashLength3) {
  float totalDashLength = dashLength0 + dashLength1 + dashLength2 + dashLength3;
  return min(getSingleDashDistance(distance, radius, 0., dashLength0, totalDashLength, capType, lineWidth), getSingleDashDistance(distance, radius, 0. + dashLength0 + dashLength1, dashLength2, totalDashLength, capType, lineWidth));
}`);
        });
        it('does not use v_width in the point or fill shaders', () => {
          expect(result.builder.getSymbolFragmentShader()).not.to.contain(
            'v_width',
          );
          expect(result.builder.getFillFragmentShader()).not.to.contain(
            'v_width',
          );
        });
      });
      describe('stroke pattern, image as path', () => {
        beforeEach(() => {
          const style = {
            'stroke-pattern-src': '../data/icon.png',
          };
          uid = computeHash(style['stroke-pattern-src']);
          result = parseLiteralStyle(style);
        });
        it('registers a uniform for the icon size, which is set asynchronously', () => {
          expect(Object.keys(result.uniforms).length).to.eql(2);
          expect(result.uniforms).to.have.property(`u_texture${uid}`);
          expect(result.uniforms).to.have.property(`u_texture${uid}_size`);
        });
        it('creates an Image with the given path and crossOrigin set to anonymous', () => {
          const image = /** @type {Image} */ (
            result.uniforms[`u_texture${uid}`]
          );
          expect(image).to.be.an(Image);
          expect(new URL(image.src).pathname).to.eql('/data/icon.png');
          expect(image.crossOrigin).to.eql('anonymous');
        });
        it('sets the color expression', () => {
          expect(result.builder.fragmentShaderFunctions_[0]).to.contain(
            'vec4 sampleStrokePattern',
          );
          expect(result.builder.strokeColorExpression_).to.eql(
            `1. * sampleStrokePattern(u_texture${uid}, u_texture${uid}_size, vec2(0.), u_texture${uid}_size, 0., 0., currentLengthPx, currentRadiusRatio, v_width)`,
          );
        });
      });
      describe('stroke pattern, tint, spacing, offset and size', () => {
        beforeEach(() => {
          const style = {
            'stroke-color': 'red',
            'stroke-pattern-src':
              'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            'stroke-pattern-offset': [5, 10],
            'stroke-pattern-offset-origin': 'bottom-left',
            'stroke-pattern-size': [5, 5],
            'stroke-pattern-spacing': ['*', 2, 10],
            'stroke-pattern-start-offset': ['+', 5, 5],
          };
          uid = computeHash(style['stroke-pattern-src']);
          result = parseLiteralStyle(style);
        });
        it('sets the color expression', () => {
          expect(result.builder.fragmentShaderFunctions_[0]).to.contain(
            'vec4 sampleStrokePattern',
          );
          expect(result.builder.strokeColorExpression_).to.eql(
            `vec4(1.0, 0.0, 0.0, 1.0) * sampleStrokePattern(u_texture${uid}, u_texture${uid}_size, vec2(0., u_texture${uid}_size.y) + vec2(5.0, 5.0) * vec2(0., -1.) + vec2(5.0, 10.0) * vec2(1., -1.), vec2(5.0, 5.0), (2.0 * 10.0), (5.0 + 5.0), currentLengthPx, currentRadiusRatio, v_width)`,
          );
        });
        it('sets a pattern length on the builder to avoid visual artifacts', () => {
          expect(result.builder.fragmentShaderFunctions_[1]).to.contain(
            'float computeStrokePatternLength',
          );
          expect(result.builder.strokePatternLengthExpression_).to.eql(
            'computeStrokePatternLength(vec2(5.0, 5.0), (2.0 * 10.0), v_width)',
          );
        });
      });

      describe('stroke style with all dynamic dash length expressions', () => {
        let result;

        beforeEach(() => {
          // Create a style where ALL dash lengths come from expressions
          const style = {
            'stroke-color': 'red',
            'stroke-width': 3,
            'stroke-line-dash': [
              ['get', 'dashLength0'],
              ['get', 'dashLength1'],
              ['get', 'dashLength2'],
              ['get', 'dashLength3'],
            ],
            'stroke-line-dash-offset': ['get', 'dashOffset'],
          };
          result = parseLiteralStyle(style);
        });

        it('includes dash distance functions in the shader', () => {
          expect(
            result.builder.fragmentShaderFunctions_.some((fn) =>
              fn.includes('getSingleDashDistance'),
            ),
          ).to.be(true);

          const dashFunctionName = result.builder.fragmentShaderFunctions_
            .find((fn) => fn.startsWith('float dashDistanceField_'))
            .split('(')[0]
            .split(' ')[1];

          expect(dashFunctionName).to.contain('dashDistanceField_');
        });

        it('defines dash lengths as function parameters instead of inside function body', () => {
          // Get the dashDistanceField function definition
          const dashFunctionDef = result.builder.fragmentShaderFunctions_.find(
            (fn) => fn.startsWith('float dashDistanceField_'),
          );

          // The function signature should include parameters for all dash lengths
          const functionSignature = dashFunctionDef.split('{')[0];
          expect(functionSignature).to.contain('float distance');
          expect(functionSignature).to.contain('float radius');
          expect(functionSignature).to.contain('float capType');
          expect(functionSignature).to.contain('float lineWidth');
          expect(functionSignature).to.contain('float dashLength0');
          expect(functionSignature).to.contain('float dashLength1');
          expect(functionSignature).to.contain('float dashLength2');
          expect(functionSignature).to.contain('float dashLength3');
        });

        it('passes all dynamic dash length expressions to the function as parameters', () => {
          expect(result.builder.strokeDistanceFieldExpression_).to.contain(
            'dashDistanceField_',
          );
          expect(result.builder.strokeDistanceFieldExpression_).to.contain(
            'a_prop_dashLength0',
          );
          expect(result.builder.strokeDistanceFieldExpression_).to.contain(
            'a_prop_dashLength1',
          );
          expect(result.builder.strokeDistanceFieldExpression_).to.contain(
            'a_prop_dashLength2',
          );
          expect(result.builder.strokeDistanceFieldExpression_).to.contain(
            'a_prop_dashLength3',
          );
        });

        it('correctly extracts all dash length values from features', () => {
          const feature = new Feature({
            dashLength0: 10,
            dashLength1: 5,
            dashLength2: 15,
            dashLength3: 12,
            dashOffset: 2,
          });

          expect(
            result.attributes['prop_dashLength0'].callback(feature),
          ).to.eql(10);
          expect(
            result.attributes['prop_dashLength1'].callback(feature),
          ).to.eql(5);
          expect(
            result.attributes['prop_dashLength2'].callback(feature),
          ).to.eql(15);
          expect(
            result.attributes['prop_dashLength3'].callback(feature),
          ).to.eql(12);
        });

        it('sets a pattern length on the builder to avoid visual artifacts', () => {
          expect(result.builder.strokePatternLengthExpression_).to.eql(
            'a_prop_dashLength0 + a_prop_dashLength1 + a_prop_dashLength2 + a_prop_dashLength3',
          );
        });
      });

      describe('stroke style with both pattern and array dash', () => {
        let result;

        beforeEach(() => {
          // Create a style where ALL dash lengths come from expressions
          const style = {
            'stroke-color': 'red',
            'stroke-width': 3,
            'stroke-line-dash': [
              ['var', 'dashLength'],
              ['var', 'dashLength'],
            ],
            'stroke-pattern-src':
              'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            'stroke-pattern-size': [5, 10],
            'stroke-pattern-spacing': ['var', 'dashLength'],
          };
          result = parseLiteralStyle(style);
        });

        it('correctly combines the pattern length of both (using functions)', () => {
          expect(
            result.builder.fragmentShaderFunctions_.some((fn) =>
              fn.includes('computeStrokePatternLength'),
            ),
          ).to.be(true);
          expect(
            result.builder.fragmentShaderFunctions_.some((fn) =>
              fn.includes('combinePatternLengths'),
            ),
          ).to.be(true);

          expect(result.builder.strokePatternLengthExpression_).to.eql(
            'combinePatternLengths(computeStrokePatternLength(u_texture980902294_size, u_var_dashLength, v_width), u_var_dashLength + u_var_dashLength)',
          );
        });
      });
    });

    describe('fill style', () => {
      let result, uid;
      describe('color expression', () => {
        beforeEach(() => {
          const style = {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['*', ['get', 'intensity'], ['var', 'scale']],
              0,
              'blue',
              10,
              'red',
            ],
          };
          const variables = {
            scale: 10,
          };
          result = parseLiteralStyle(style, variables);
        });
        it('parses style', () => {
          const result = parseLiteralStyle(
            {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['*', ['get', 'intensity'], ['var', 'scale']],
                0,
                'blue',
                10,
                'red',
              ],
            },
            {
              scale: 10,
            },
          );

          expect(result.builder.uniforms_).to.eql([
            {name: 'u_var_scale', type: 'float'},
          ]);
          expect(result.builder.attributes_).to.eql([
            {
              name: 'a_prop_intensity',
              type: 'float',
              varyingName: 'v_prop_intensity',
              varyingType: 'float',
              varyingExpression: 'a_prop_intensity',
            },
          ]);
          expect(result.builder.fillColorExpression_).to.eql(
            'mix(vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), clamp(((a_prop_intensity * u_var_scale) - 0.0) / (10.0 - 0.0), 0.0, 1.0))',
          );
          expect(Object.keys(result.attributes).length).to.eql(1);
          expect(result.attributes).to.have.property('prop_intensity');
          expect(result.uniforms).to.have.property('u_var_scale');
        });
      });
      describe('fill pattern, image as path', () => {
        beforeEach(() => {
          const style = {
            'fill-pattern-src': '../data/icon.png',
          };
          uid = computeHash(style['fill-pattern-src']); // unique hash based on style
          result = parseLiteralStyle(style);
        });
        it('registers a uniform for the icon size, which is set asynchronously', () => {
          expect(Object.keys(result.uniforms).length).to.eql(2);
          expect(result.uniforms).to.have.property(`u_texture${uid}`);
          expect(result.uniforms).to.have.property(`u_texture${uid}_size`);
        });
        it('creates an Image with the given path and crossOrigin set to anonymous', () => {
          const image = /** @type {Image} */ (
            result.uniforms[`u_texture${uid}`]
          );
          expect(image).to.be.an(Image);
          expect(new URL(image.src).pathname).to.eql('/data/icon.png');
          expect(image.crossOrigin).to.eql('anonymous');
        });
        it('sets the color expression', () => {
          expect(result.builder.fragmentShaderFunctions_[0]).to.contain(
            'vec4 sampleFillPattern',
          );
          expect(result.builder.fillColorExpression_).to.eql(
            `1. * sampleFillPattern(u_texture${uid}, u_texture${uid}_size, vec2(0.), u_texture${uid}_size, pxOrigin, pxPos)`,
          );
        });
      });
      describe('fill pattern, tint, offset and size', () => {
        beforeEach(() => {
          const style = {
            'fill-color': 'red',
            'fill-pattern-src':
              'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            'fill-pattern-offset': [5, 10],
            'fill-pattern-offset-origin': 'bottom-left',
            'fill-pattern-size': [5, 5],
          };
          uid = computeHash(style['fill-pattern-src']);
          result = parseLiteralStyle(style);
        });
        it('sets the color expression', () => {
          expect(result.builder.fragmentShaderFunctions_[0]).to.contain(
            'vec4 sampleFillPattern',
          );
          expect(result.builder.fillColorExpression_).to.eql(
            `vec4(1.0, 0.0, 0.0, 1.0) * sampleFillPattern(u_texture${uid}, u_texture${uid}_size, vec2(0., u_texture${uid}_size.y) + vec2(5.0, 5.0) * vec2(0., -1.) + vec2(5.0, 10.0) * vec2(1., -1.), vec2(5.0, 5.0), pxOrigin, pxPos)`,
          );
        });
      });

      describe('fill pattern, dynamic offset', () => {
        let result;

        beforeEach(() => {
          const style = {
            'fill-color': 'red',
            'fill-pattern-src':
              'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            'fill-pattern-offset': ['get', 'patternOffset'],
            'fill-pattern-size': [5, 5],
          };
          result = parseLiteralStyle(style);
        });

        it('includes pattern sampling function in the shader', () => {
          expect(result.builder.fragmentShaderFunctions_[0]).to.contain(
            'vec4 sampleFillPattern',
          );
        });

        it('registers a vec2 pattern offset attribute', () => {
          const patternOffsetAttr = result.builder.attributes_.find(
            (attr) => attr.name === 'a_prop_patternOffset',
          );

          expect(patternOffsetAttr).not.to.be(undefined);
          expect(patternOffsetAttr.type).to.be('vec2');
          expect(patternOffsetAttr.varyingName).to.be('v_prop_patternOffset');
          expect(patternOffsetAttr.varyingType).to.be('vec2');
          expect(patternOffsetAttr.varyingExpression).to.be(
            'a_prop_patternOffset',
          );
        });

        it('applies pattern offset in the fill color expression', () => {
          expect(result.builder.fillColorExpression_).to.contain(
            'a_prop_patternOffset',
          );
        });

        it('registers pattern offset as a size-2 attribute', () => {
          expect(Object.keys(result.attributes)).to.contain(
            'prop_patternOffset',
          );
          expect(result.attributes['prop_patternOffset'].size).to.eql(2);
        });

        it('extracts pattern offset values correctly from features', () => {
          const callback = result.attributes['prop_patternOffset'].callback;
          const feature = new Feature({
            patternOffset: [15, 25],
          });
          expect(callback(feature)).to.eql([15, 25]);
        });

        it('handles missing pattern offset gracefully', () => {
          const callback = result.attributes['prop_patternOffset'].callback;
          const feature = new Feature({});
          expect(callback(feature)).to.eql(undefined);
        });
      });
    });

    describe('filter', () => {
      let result;
      beforeEach(() => {
        result = parseLiteralStyle({}, undefined, [
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['in', ['get', 'type'], ['literal', ['road', 'path', 'street']]],
        ]);
      });
      it('adds the filter expression and attributes to the shader builder', () => {
        expect(result.builder.fragmentShaderFunctions_[0]).to.contain(
          'bool operator_in_0',
        );
        expect(result.builder.getFragmentDiscardExpression()).to.be(
          `!((a_geometryType == ${stringToGlsl('LineString')}) && operator_in_0(a_prop_type))`,
        );
        expect(result.attributes).to.eql({
          geometryType: {size: 1, callback: {}},
          prop_type: {size: 1, callback: {}},
        });
      });
    });

    describe('handle attributes of types other that number', () => {
      let parseResult;
      beforeEach(() => {
        parseResult = parseLiteralStyle({
          'fill-color': [
            'case',
            ['get', 'transparent'],
            'transparent',
            ['get', 'fillColor'],
          ],
          'stroke-width': [
            'match',
            ['get', 'lineType'],
            'low',
            ['get', 'lineWidth'],
            'high',
            ['*', ['get', 'lineWidth'], 2],
            1.5,
          ],
          'circle-radius': 8,
          'circle-fill-color': ['get', 'color'],
          'circle-scale': ['get', 'iconSize'],
          'stroke-color': 'red',
        });
      });
      it('adds attributes to the shader builder', () => {
        expect(parseResult.builder.attributes_).to.eql([
          {
            name: 'a_prop_iconSize',
            type: 'vec2',
            varyingName: 'v_prop_iconSize',
            varyingType: 'vec2',
            varyingExpression: 'a_prop_iconSize',
          },
          {
            name: 'a_prop_color',
            type: 'vec2',
            varyingName: 'v_prop_color',
            varyingType: 'vec4',
            varyingExpression: 'unpackColor(a_prop_color)',
          },
          {
            name: 'a_prop_lineType',
            type: 'float',
            varyingName: 'v_prop_lineType',
            varyingType: 'float',
            varyingExpression: 'a_prop_lineType',
          },
          {
            name: 'a_prop_lineWidth',
            type: 'float',
            varyingName: 'v_prop_lineWidth',
            varyingType: 'float',
            varyingExpression: 'a_prop_lineWidth',
          },
          {
            name: 'a_prop_transparent',
            type: 'float',
            varyingName: 'v_prop_transparent',
            varyingType: 'float',
            varyingExpression: 'a_prop_transparent',
          },
          {
            name: 'a_prop_fillColor',
            type: 'vec2',
            varyingName: 'v_prop_fillColor',
            varyingType: 'vec4',
            varyingExpression: 'unpackColor(a_prop_fillColor)',
          },
        ]);
      });
      it('returns attributes with their callbacks in the result', () => {
        expect(parseResult.attributes).to.eql({
          prop_iconSize: {size: 2, callback: {}},
          prop_color: {size: 2, callback: {}},
          prop_lineType: {size: 1, callback: {}},
          prop_lineWidth: {size: 1, callback: {}},
          prop_transparent: {size: 1, callback: {}},
          prop_fillColor: {size: 2, callback: {}},
        });
      });
      it('processes the feature attributes according to their types', () => {
        const feature = new Feature({
          iconSize: [12, 18],
          color: 'pink',
          lineType: 'low',
          lineWidth: 0.5,
          fillColor: 'rgba(123, 240, 100, 0.3)',
          transparent: true,
          geometry: new Point([0, 0]),
        });
        expect(
          parseResult.attributes['prop_iconSize'].callback(feature),
        ).to.eql([12, 18]);
        expect(parseResult.attributes['prop_color'].callback(feature)).to.eql(
          packColor(asArray('pink')),
        );
        expect(
          parseResult.attributes['prop_lineType'].callback(feature),
        ).to.be.a('number');
        expect(
          parseResult.attributes['prop_lineWidth'].callback(feature),
        ).to.eql(0.5);
        expect(
          parseResult.attributes['prop_fillColor'].callback(feature),
        ).to.eql(packColor(asArray('rgba(123, 240, 100, 0.3)')));
        expect(
          parseResult.attributes['prop_transparent'].callback(feature),
        ).to.eql(1);
      });
    });

    describe('handle uniforms of types other that number', () => {
      let parseResult;
      beforeEach(() => {
        parseResult = parseLiteralStyle(
          {
            'fill-color': [
              'case',
              ['var', 'transparent'],
              'transparent',
              ['var', 'fillColor'],
            ],
            'stroke-width': [
              'match',
              ['var', 'lineType'],
              'low',
              ['var', 'lineWidth'],
              'high',
              ['*', ['var', 'lineWidth'], 2],
              1.5,
            ],
            'circle-radius': 8,
            'circle-fill-color': ['var', 'color'],
            'circle-scale': ['var', 'iconSize'],
          },
          {
            iconSize: [12, 18],
            color: 'pink',
            lineType: 'low',
            lineWidth: 0.5,
            fillColor: 'rgba(51, 153, 102, 0.3)',
            transparent: true,
          },
        );
      });
      it('adds uniforms to the shader builder', () => {
        expect(parseResult.builder.uniforms_).to.eql([
          {name: 'u_var_iconSize', type: 'vec2'},
          {name: 'u_var_color', type: 'vec4'},
          {name: 'u_var_lineType', type: 'float'},
          {name: 'u_var_lineWidth', type: 'float'},
          {name: 'u_var_transparent', type: 'float'},
          {name: 'u_var_fillColor', type: 'vec4'},
        ]);
      });
      it('returns uniforms in the result', () => {
        expect(Object.keys(parseResult.uniforms)).to.eql([
          'u_var_iconSize',
          'u_var_color',
          'u_var_lineType',
          'u_var_lineWidth',
          'u_var_transparent',
          'u_var_fillColor',
        ]);
      });
      it('processes uniforms according to their types', () => {
        expect(parseResult.uniforms['u_var_iconSize']()).to.eql([12, 18]);
        expect(parseResult.uniforms['u_var_color']()).to.eql([
          1, 0.7529411764705882, 0.796078431372549, 1,
        ]);
        expect(parseResult.uniforms['u_var_lineType']()).to.be.a('number');
        expect(parseResult.uniforms['u_var_lineWidth']()).to.eql(0.5);
        expect(parseResult.uniforms['u_var_fillColor']()).to.eql([
          0.2, 0.6, 0.4, 0.3,
        ]);
        expect(parseResult.uniforms['u_var_transparent']()).to.eql(1);
      });
    });

    describe('handle special context values (geometry type, feature id)', () => {
      let parseResult;
      beforeEach(() => {
        parseResult = parseLiteralStyle(
          {
            'stroke-color': [
              'match',
              ['geometry-type'],
              'Polygon',
              'red',
              'blue',
            ],
          },
          undefined,
          ['==', ['id'], 101],
        );
      });
      it('adds attributes to the shader builder', () => {
        expect(parseResult.builder.attributes_).to.eql([
          {
            name: 'a_geometryType',
            type: 'float',
            varyingName: 'v_geometryType',
            varyingType: 'float',
            varyingExpression: 'a_geometryType',
          },
          {
            name: 'a_featureId',
            type: 'float',
            varyingName: 'v_featureId',
            varyingType: 'float',
            varyingExpression: 'a_featureId',
          },
        ]);
      });
      it('returns attributes with their callbacks in the result', () => {
        expect(parseResult.attributes).to.eql({
          featureId: {size: 1, callback: {}},
          geometryType: {size: 1, callback: {}},
        });
      });
      it('processes the feature geometry properly', () => {
        const callback = parseResult.attributes['geometryType'].callback;
        let feature = new Feature({
          geometry: new Point([0, 0]),
        });
        expect(callback(feature)).to.eql(stringToGlsl('Point'));
        feature = new Feature({
          geometry: new MultiPolygon([]),
        });
        expect(callback(feature)).to.eql(stringToGlsl('Polygon'));
      });
      it('reads the feature id properly', () => {
        const callback = parseResult.attributes['featureId'].callback;
        const feature = new Feature();
        feature.setId('1234');
        expect(callback(feature)).to.eql(stringToGlsl('1234'));
        feature.setId(101);
        expect(callback(feature)).to.eql(101);
      });
    });
  });

  describe('computeHash', () => {
    it('produces stable hashes for primitive types', () => {
      const path = '../../path/img';
      expect(computeHash(path)).to.eql(computeHash(path));
      const array = [{hello: 'world'}, [1, 2, 3]];
      expect(computeHash(array)).to.eql(computeHash(array));
    });
    it('produces unique hashes for primitive types', () => {
      const path1 = '../../path/img1';
      const path2 = '../../path/img2';
      const array1 = [{hello: 'world'}, [1, 2, 3]];
      const array2 = [[1, 2, 3], {'hello world': true}];
      expect(computeHash(path1)).not.to.eql(computeHash(path2));
      expect(computeHash(array1)).not.to.eql(computeHash(array2));
      expect(computeHash(path1)).not.to.eql(computeHash(array1));
    });
  });

  describe('handle ambiguous match input', () => {
    it('parses a match', () => {
      const result = parseLiteralStyle({
        'icon-src':
          'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        'icon-color': [
          'match',
          ['get', 'foo'],
          'green',
          [251, 173, 21, 0.5],
          'red',
          [251, 173, 21, 0.5],
          [251, 173, 21, 0.5],
        ],
      });

      expect(result.attributes.prop_foo.callback({get: () => 'green'})).to.be.a(
        'number',
      );
    });
  });

  describe('shader functions', () => {
    it('adds shader functions for both vertex and fragment shaders', () => {
      const result = parseLiteralStyle(
        {
          'stroke-width': 2,
        },
        undefined,
        ['in', ['get', 'type'], ['literal', ['road', 'path', 'street']]],
      );

      expect(result.builder.vertexShaderFunctions_).to.eql(
        result.builder.vertexShaderFunctions_,
      );
      expect(result.builder.fragmentShaderFunctions_).to.contain(
        `bool operator_in_0(float inputValue) {
  if (inputValue == ${stringToGlsl('road')}) { return true; }
  if (inputValue == ${stringToGlsl('path')}) { return true; }
  if (inputValue == ${stringToGlsl('street')}) { return true; }
  return false;
}`,
      );
    });
  });
});
