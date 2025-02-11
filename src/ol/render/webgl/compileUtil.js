/**
 * Utilities for compiling expressions and turning them into WebGL concepts
 * @module ol/render/webgl/compileUtil
 */

import {asArray} from '../../color.js';
import {
  ColorType,
  NumberArrayType,
  SizeType,
  newParsingContext,
} from '../../expr/expression.js';
import {
  buildExpression,
  getStringNumberEquivalent,
  uniformNameForVariable,
} from '../../expr/gpu.js';

/**
 * Recursively parses a style expression and outputs a GLSL-compatible string. Takes in a compilation context that
 * will be read and modified during the parsing operation.
 * @param {import("../../expr/gpu.js").CompilationContext} compilationContext Compilation context
 * @param {import("../../expr/expression.js").EncodedExpression} value Value
 * @param {number} [expectedType] Expected final type (can be several types combined)
 * @return {string} GLSL-compatible output
 */
export function expressionToGlsl(compilationContext, value, expectedType) {
  const parsingContext = newParsingContext();
  return buildExpression(
    value,
    expectedType,
    parsingContext,
    compilationContext,
  );
}

/**
 * Packs all components of a color into a two-floats array
 * @param {import("../../color.js").Color|string} color Color as array of numbers or string
 * @return {Array<number>} Vec2 array containing the color in compressed form
 */
export function packColor(color) {
  const array = asArray(color);
  const r = array[0] * 256;
  const g = array[1];
  const b = array[2] * 256;
  const a = Math.round(array[3] * 255);
  return [r + g, b + a];
}

export const UNPACK_COLOR_FN = `vec4 unpackColor(vec2 packedColor) {
  return vec4(
    fract(floor(packedColor[0] / 256.0) / 256.0),
    fract(packedColor[0] / 256.0),
    fract(floor(packedColor[1] / 256.0) / 256.0),
    fract(packedColor[1] / 256.0)
  );
}`;

/**
 * @param {number} type Value type
 * @return {1|2|3|4} The amount of components for this value
 */
export function getGlslSizeFromType(type) {
  if (type === ColorType || type === SizeType) {
    return 2;
  }
  if (type === NumberArrayType) {
    return 4;
  }
  return 1;
}

/**
 * @param {number} type Value type
 * @return {'float'|'vec2'|'vec3'|'vec4'} The corresponding GLSL type for this value
 */
export function getGlslTypeFromType(type) {
  const size = getGlslSizeFromType(type);
  if (size > 1) {
    return /** @type {'vec2'|'vec3'|'vec4'} */ (`vec${size}`);
  }
  return 'float';
}

/**
 * Applies the properties and variables collected in a compilation context to a ShaderBuilder instance:
 * properties will show up as attributes in shaders, and variables will show up as uniforms.
 * @param {import("./ShaderBuilder.js").ShaderBuilder} builder Shader builder
 * @param {import("../../expr/gpu.js").CompilationContext} context Compilation context
 */
export function applyContextToBuilder(builder, context) {
  // define one uniform per variable
  for (const varName in context.variables) {
    const variable = context.variables[varName];
    const uniformName = uniformNameForVariable(variable.name);
    let glslType = getGlslTypeFromType(variable.type);
    if (variable.type === ColorType) {
      // we're not packing colors when they're passed as uniforms
      glslType = 'vec4';
    }
    builder.addUniform(`${glslType} ${uniformName}`);
  }

  // for each feature attribute used in the fragment shader, define a varying that will be used to pass data
  // from the vertex to the fragment shader, as well as an attribute in the vertex shader (if not already present)
  for (const propName in context.properties) {
    const property = context.properties[propName];
    const glslType = getGlslTypeFromType(property.type);
    const attributeName = `a_prop_${property.name}`;
    if (property.type === ColorType) {
      builder.addAttribute(
        attributeName,
        glslType,
        `unpackColor(${attributeName})`,
        'vec4',
      );
      builder.addVertexShaderFunction(UNPACK_COLOR_FN);
    } else {
      builder.addAttribute(attributeName, glslType);
    }
  }

  // add functions that were collected in the compilation contexts
  for (const functionName in context.functions) {
    builder.addVertexShaderFunction(context.functions[functionName]);
    builder.addFragmentShaderFunction(context.functions[functionName]);
  }
}

/**
 * Generates a set of uniforms from variables collected in a compilation context,
 * to be fed to a WebGLHelper instance
 * @param {import("../../expr/gpu.js").CompilationContext} context Compilation context
 * @param {import('../../style/flat.js').StyleVariables} [variables] Style variables.
 * @return {Object<string,import("../../webgl/Helper").UniformValue>} Uniforms
 */
export function generateUniformsFromContext(context, variables) {
  /** @type {Object<string,import("../../webgl/Helper").UniformValue>} */
  const uniforms = {};

  // define one uniform per variable
  for (const varName in context.variables) {
    const variable = context.variables[varName];
    const uniformName = uniformNameForVariable(variable.name);

    uniforms[uniformName] = () => {
      const value = variables[variable.name];
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      if (variable.type === ColorType) {
        return asArray(value || '#eee');
      }
      if (typeof value === 'string') {
        return getStringNumberEquivalent(value);
      }
      return value;
    };
  }

  return uniforms;
}

/**
 * Generates a set of attributes from properties collected in a compilation context,
 * to be fed to a WebGLHelper instance
 * @param {import("../../expr/gpu.js").CompilationContext} context Compilation context
 * @return {import('./VectorStyleRenderer.js').AttributeDefinitions} Attributes
 */
export function generateAttributesFromContext(context) {
  /**
   * @type {import('./VectorStyleRenderer.js').AttributeDefinitions}
   */
  const attributes = {};

  // Define attributes with their callback for each property used in the vertex shader
  for (const propName in context.properties) {
    const property = context.properties[propName];
    const callback = (feature) => {
      const value = feature.get(property.name);
      if (property.type === ColorType) {
        return packColor([...asArray(value || '#eee')]);
      }
      if (typeof value === 'string') {
        return getStringNumberEquivalent(value);
      }
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      return value;
    };

    attributes[`prop_${property.name}`] = {
      size: getGlslSizeFromType(property.type),
      callback,
    };
  }
  return attributes;
}
