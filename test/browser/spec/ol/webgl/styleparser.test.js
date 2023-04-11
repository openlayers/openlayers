import {parseLiteralStyle} from '../../../../../src/ol/webgl/styleparser.js';
import {uniformNameForVariable} from '../../../../../src/ol/style/expressions.js';

describe('ol.webgl.styleparser', function () {
  describe('parseLiteralStyle', function () {
    it('parses a style with variables', function () {
      const result = parseLiteralStyle({
        variables: {
          lower: 100,
          higher: 400,
        },
        symbol: {
          symbolType: 'square',
          size: [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            ['var', 'lower'],
            4,
            ['var', 'higher'],
            8,
          ],
          color: '#336699',
          opacity: 0.5,
        },
      });

      const lowerUniformName = uniformNameForVariable('lower');
      const higherUniformName = uniformNameForVariable('higher');
      expect(result.builder.uniforms).to.eql([
        `float ${lowerUniformName}`,
        `float ${higherUniformName}`,
      ]);
      expect(result.builder.attributes).to.eql(['float a_population']);
      expect(result.builder.varyings).to.eql([
        {
          name: 'v_population',
          type: 'float',
          expression: 'a_population',
        },
      ]);
      expect(result.builder.symbolColorExpression).to.eql(
        'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 0.5 * 1.0)'
      );
      expect(result.builder.symbolSizeExpression).to.eql(
        `vec2(mix(4.0, 8.0, pow(clamp((a_population - ${lowerUniformName}) / (${higherUniformName} - ${lowerUniformName}), 0.0, 1.0), 1.0)))`
      );
      expect(result.builder.symbolOffsetExpression).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression).to.eql(
        'vec4(0.0, 0.0, 1.0, 1.0)'
      );
      expect(result.builder.symbolRotateWithView).to.eql(false);
      expect(result.attributes.length).to.eql(1);
      expect(result.attributes[0].name).to.eql('population');
      expect(result.uniforms).to.have.property(lowerUniformName);
      expect(result.uniforms).to.have.property(higherUniformName);
    });

    it('parses a style with a filter', function () {
      const result = parseLiteralStyle({
        filter: ['between', ['get', 'attr0'], 0, 10],
        symbol: {
          symbolType: 'square',
          size: 6,
          color: '#336699',
        },
      });

      expect(result.builder.attributes).to.eql(['float a_attr0']);
      expect(result.builder.varyings).to.eql([
        {
          name: 'v_attr0',
          type: 'float',
          expression: 'a_attr0',
        },
      ]);
      expect(result.builder.symbolColorExpression).to.eql(
        'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 1.0 * 1.0)'
      );
      expect(result.builder.symbolSizeExpression).to.eql('vec2(6.0)');
      expect(result.builder.symbolOffsetExpression).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression).to.eql(
        'vec4(0.0, 0.0, 1.0, 1.0)'
      );
      expect(result.builder.discardExpression).to.eql(
        '!(v_attr0 >= 0.0 && v_attr0 <= 10.0)'
      );
      expect(result.builder.symbolRotateWithView).to.eql(false);
      expect(result.attributes.length).to.eql(1);
      expect(result.attributes[0].name).to.eql('attr0');
    });

    it('correctly adds string variables to the string literals mapping', function () {
      const varName = 'mySize';
      const uniformName = uniformNameForVariable(varName);

      const result = parseLiteralStyle({
        variables: {
          mySize: 'abcdef',
        },
        symbol: {
          symbolType: 'square',
          size: ['match', ['var', varName], 'abc', 10, 'def', 20, 30],
          color: 'red',
        },
      });

      expect(result.uniforms[uniformName]()).to.be.greaterThan(0);
    });

    it('throws when a variable is requested but not present in the style', function (done) {
      const varName = 'mySize';
      const uniformName = uniformNameForVariable(varName);

      const result = parseLiteralStyle({
        variables: {},
        symbol: {
          symbolType: 'square',
          size: ['var', varName],
          color: 'red',
        },
      });

      try {
        result.uniforms[uniformName]();
      } catch (e) {
        done();
      }
      done(true);
    });

    it('throws when a variable is requested but the style does not have a variables dict', function (done) {
      const variableName = 'mySize';
      const uniformName = uniformNameForVariable(variableName);
      const result = parseLiteralStyle({
        symbol: {
          symbolType: 'square',
          size: ['var', variableName],
          color: 'red',
        },
      });

      try {
        result.uniforms[uniformName]();
      } catch (e) {
        done();
      }
      done(true);
    });

    it('reads when symbol, stroke or fill styles are present', function () {
      const result = parseLiteralStyle({
        variables: {
          mySize: 'abcdef',
        },
        symbol: {
          symbolType: 'square',
          size: 1,
          color: 'red',
        },
        ['stroke-width']: 1,
        ['fill-color']: 'blue',
      });

      expect(result.hasSymbol).to.be(true);
      expect(result.hasStroke).to.be(true);
      expect(result.hasFill).to.be(true);
    });

    it('reads when symbol, stroke or fill styles are absent', function () {
      const result = parseLiteralStyle({
        variables: {
          mySize: 'abcdef',
        },
      });

      expect(result.hasSymbol).to.be(false);
      expect(result.hasStroke).to.be(false);
      expect(result.hasFill).to.be(false);
    });

    describe('symbol style', function () {
      it('without expressions', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'square',
            size: [4, 8],
            color: '#ff0000',
            rotateWithView: true,
          },
        });

        expect(result.builder.uniforms).to.eql([]);
        expect(result.builder.attributes).to.eql([]);
        expect(result.builder.varyings).to.eql([]);
        expect(result.builder.symbolColorExpression).to.eql(
          'vec4(vec4(1.0, 0.0, 0.0, 1.0).rgb, vec4(1.0, 0.0, 0.0, 1.0).a * 1.0 * 1.0)'
        );
        expect(result.builder.symbolSizeExpression).to.eql(
          'vec2(vec2(4.0, 8.0))'
        );
        expect(result.builder.symbolOffsetExpression).to.eql('vec2(0.0, 0.0)');
        expect(result.builder.texCoordExpression).to.eql(
          'vec4(0.0, 0.0, 1.0, 1.0)'
        );
        expect(result.builder.symbolRotateWithView).to.eql(true);
        expect(result.attributes).to.eql([]);
        expect(result.uniforms).to.eql({});
      });

      it('with expressions', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'square',
            size: ['get', 'attr1'],
            color: [255, 127.5, 63.75, 0.25],
            textureCoord: [0.5, 0.5, 0.5, 1],
            offset: [
              'match',
              ['get', 'attr3'],
              'red',
              [6, 0],
              'green',
              [3, 0],
              [0, 0],
            ],
          },
        });

        expect(result.builder.uniforms).to.eql([]);
        expect(result.builder.attributes).to.eql([
          'float a_attr1',
          'float a_attr3',
        ]);
        expect(result.builder.varyings).to.eql([
          {
            name: 'v_attr1',
            type: 'float',
            expression: 'a_attr1',
          },
        ]);
        expect(result.builder.symbolColorExpression).to.eql(
          'vec4(vec4(1.0, 0.5, 0.25, 0.25).rgb, vec4(1.0, 0.5, 0.25, 0.25).a * 1.0 * 1.0)'
        );
        expect(result.builder.symbolSizeExpression).to.eql('vec2(a_attr1)');
        expect(result.builder.symbolOffsetExpression).to.eql(
          '(a_attr3 == 1.0 ? vec2(6.0, 0.0) : (a_attr3 == 0.0 ? vec2(3.0, 0.0) : vec2(0.0, 0.0)))'
        );
        expect(result.builder.texCoordExpression).to.eql(
          'vec4(0.5, 0.5, 0.5, 1.0)'
        );
        expect(result.builder.symbolRotateWithView).to.eql(false);
        expect(result.attributes.length).to.eql(2);
        expect(result.attributes[0].name).to.eql('attr1');
        expect(result.attributes[1].name).to.eql('attr3');
        expect(result.uniforms).to.eql({});
      });

      it('with a uniform (texture)', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'image',
            src: '../data/image.png',
            size: 6,
            color: '#336699',
            opacity: 0.5,
          },
        });

        expect(result.builder.uniforms).to.eql(['sampler2D u_texture']);
        expect(result.builder.attributes).to.eql([]);
        expect(result.builder.varyings).to.eql([]);
        expect(result.builder.symbolColorExpression).to.eql(
          'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 0.5 * 1.0) * texture2D(u_texture, v_texCoord)'
        );
        expect(result.builder.symbolSizeExpression).to.eql('vec2(6.0)');
        expect(result.builder.symbolOffsetExpression).to.eql('vec2(0.0, 0.0)');
        expect(result.builder.texCoordExpression).to.eql(
          'vec4(0.0, 0.0, 1.0, 1.0)'
        );
        expect(result.builder.symbolRotateWithView).to.eql(false);
        expect(result.attributes).to.eql([]);
        expect(result.uniforms).to.have.property('u_texture');
      });

      it('with a color interpolation', function () {
        const varName = 'ratio';
        const uniformName = uniformNameForVariable(varName);
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'square',
            size: 6,
            color: [
              'interpolate',
              ['linear'],
              ['var', varName],
              0,
              [255, 255, 0],
              1,
              'red',
            ],
          },
        });

        expect(result.builder.attributes).to.eql([]);
        expect(result.builder.varyings).to.eql([]);
        expect(result.builder.symbolColorExpression).to.eql(
          `vec4(mix(vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp((${uniformName} - 0.0) / (1.0 - 0.0), 0.0, 1.0), 1.0)).rgb, mix(vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp((${uniformName} - 0.0) / (1.0 - 0.0), 0.0, 1.0), 1.0)).a * 1.0 * 1.0)`
        );
        expect(result.builder.symbolSizeExpression).to.eql('vec2(6.0)');
        expect(result.builder.symbolOffsetExpression).to.eql('vec2(0.0, 0.0)');
        expect(result.builder.texCoordExpression).to.eql(
          'vec4(0.0, 0.0, 1.0, 1.0)'
        );
        expect(result.builder.symbolRotateWithView).to.eql(false);
        expect(result.attributes).to.eql([]);
        expect(result.uniforms).to.have.property(uniformName);
      });

      it('with a rotation expression using an attribute', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'square',
            size: 6,
            rotation: ['get', 'heading'],
          },
        });

        expect(result.builder.attributes).to.eql(['float a_heading']);
        expect(result.builder.varyings).to.eql([]);
        expect(result.builder.symbolRotationExpression).to.eql('a_heading');
      });
    });

    describe('stroke style', function () {
      it('parses style', function () {
        const result = parseLiteralStyle({
          variables: {
            width: 1,
          },
          ['stroke-color']: [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0,
            'blue',
            1,
            'red',
          ],
          ['stroke-width']: ['*', ['var', 'width'], 3],
        });

        expect(result.builder.uniforms).to.eql(['float u_var_width']);
        expect(result.builder.attributes).to.eql(['float a_intensity']);
        expect(result.builder.varyings).to.eql([
          {
            name: 'v_intensity',
            type: 'float',
            expression: 'a_intensity',
          },
        ]);
        expect(result.builder.strokeColorExpression).to.eql(
          'mix(vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp((v_intensity - 0.0) / (1.0 - 0.0), 0.0, 1.0), 1.0))'
        );
        expect(result.builder.strokeWidthExpression).to.eql(
          '(u_var_width * 3.0)'
        );
        expect(result.attributes.length).to.eql(1);
        expect(result.attributes[0].name).to.eql('intensity');
        expect(result.uniforms).to.have.property('u_var_width');
      });
    });

    describe('fill style', function () {
      it('parses style', function () {
        const result = parseLiteralStyle({
          variables: {
            scale: 10,
          },
          ['fill-color']: [
            'interpolate',
            ['linear'],
            ['*', ['get', 'intensity'], ['var', 'scale']],
            0,
            'blue',
            10,
            'red',
          ],
        });

        expect(result.builder.uniforms).to.eql(['float u_var_scale']);
        expect(result.builder.attributes).to.eql(['float a_intensity']);
        expect(result.builder.varyings).to.eql([
          {
            name: 'v_intensity',
            type: 'float',
            expression: 'a_intensity',
          },
        ]);
        expect(result.builder.fillColorExpression).to.eql(
          'mix(vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp(((v_intensity * u_var_scale) - 0.0) / (10.0 - 0.0), 0.0, 1.0), 1.0))'
        );
        expect(result.attributes.length).to.eql(1);
        expect(result.attributes[0].name).to.eql('intensity');
        expect(result.uniforms).to.have.property('u_var_scale');
      });
    });
  });
});
