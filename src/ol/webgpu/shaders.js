/**
 * @module ol/webgpu/shaders
 */

export const TILE_SHADER = `
struct TileUniforms {
  tileTransform: mat4x4<f32>,
  renderExtent: vec4<f32>,
  depth: f32,
  transitionAlpha: f32,
  texturePixelWidth: f32,
  texturePixelHeight: f32,
  textureResolution: f32,
  globalAlpha: f32,
  resolution: f32,
  zoom: f32,
  time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: TileUniforms;
@group(0) @binding(1) var tileSampler: sampler;
@group(0) @binding(2) var tileTexture: texture_2d<f32>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) localMapCoord: vec2<f32>,
}

@vertex
fn vs_main(@location(0) texCoord: vec2<f32>) -> VertexOut {
  var out: VertexOut;
  out.texCoord = texCoord;
  out.localMapCoord = vec2(
    uniforms.texturePixelWidth * uniforms.textureResolution * texCoord.x,
    -uniforms.texturePixelHeight * uniforms.textureResolution * texCoord.y
  );
  out.position = uniforms.tileTransform * vec4(texCoord, uniforms.depth, 1.0);
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  if (
    in.localMapCoord.x < uniforms.renderExtent[0] ||
    in.localMapCoord.y < uniforms.renderExtent[1] ||
    in.localMapCoord.x > uniforms.renderExtent[2] ||
    in.localMapCoord.y > uniforms.renderExtent[3]
  ) {
    discard;
  }
  var color = textureSample(tileTexture, tileSampler, in.texCoord);
  let alpha = color.a * uniforms.transitionAlpha * uniforms.globalAlpha;
  return vec4(color.rgb * alpha, alpha);
}
`;

export const REPROJ_TILE_SHADER = `
struct ReprojUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  depth: f32,
  transitionAlpha: f32,
  globalAlpha: f32,
  texturePixelWidth: f32,
  texturePixelHeight: f32,
  resolution: f32,
  zoom: f32,
  time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: ReprojUniforms;
@group(0) @binding(1) var tileSampler: sampler;
@group(0) @binding(2) var tileTexture: texture_2d<f32>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) worldPos: vec2<f32>,
}

@vertex
fn vs_main(@location(0) targetPos: vec2<f32>, @location(1) texCoord: vec2<f32>) -> VertexOut {
  var out: VertexOut;
  out.texCoord = texCoord;
  out.worldPos = targetPos;
  out.position = uniforms.projectionMatrix * vec4(targetPos, uniforms.depth, 1.0);
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  if (
    in.worldPos.x < uniforms.renderExtent[0] ||
    in.worldPos.y < uniforms.renderExtent[1] ||
    in.worldPos.x > uniforms.renderExtent[2] ||
    in.worldPos.y > uniforms.renderExtent[3]
  ) {
    discard;
  }
  var color = textureSample(tileTexture, tileSampler, in.texCoord);
  let alpha = color.a * uniforms.transitionAlpha * uniforms.globalAlpha;
  return vec4(color.rgb * alpha, alpha);
}
`;

export const VECTOR_FILL_SHADER = `
struct FrameUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  viewportSizePx: vec2<f32>,
  globalAlpha: f32,
  hitDetection: f32,
  time: f32,
  fadeDuration: f32,
  // CSS pixels per map unit, for measuring dashes along a line.
  pixelsPerUnit: f32,
}

struct Style {
  color: vec4<f32>,
  hitColor: vec4<f32>,
  dashA: vec4<f32>,
  dashB: vec4<f32>,
  // Dash offset, pattern length, dash count, padding; all lengths in CSS pixels.
  dashParams: vec4<f32>,
}

// Positions arrive in the batch's local grid; projectionMatrix maps that grid
// straight to clip space.
@group(0) @binding(0) var<uniform> uniforms: FrameUniforms;
@group(0) @binding(1) var<storage, read> styles: array<Style>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) hitColor: vec4<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec2<i32>,
  @location(1) styleIndex: u32,
) -> VertexOut {
  var out: VertexOut;
  out.position = uniforms.projectionMatrix * vec4(vec2<f32>(position), 0.0, 1.0);
  let style = styles[styleIndex];
  out.color = style.color;
  out.hitColor = style.hitColor;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  if (uniforms.hitDetection > 0.5) {
    return in.hitColor;
  }
  var color = in.color;
  color.a = color.a * uniforms.globalAlpha;
  return vec4(color.rgb * color.a, color.a);
}
`;

/**
 * Warps geometry from a source projection into the view projection by
 * interpolating a coarse grid of proj4 samples, so no proj4 call happens per
 * vertex. Runs once per batch per projection, not once per frame.
 */
export const VECTOR_WARP_SHADER = `
struct WarpUniforms {
  cells: u32,
  vertexCount: u32,
  strokeMode: u32,
  pad0: u32,
  cellSize: f32,
  maxEdge: f32,
  // Source map units spanned by one cell on each axis. The local grid is
  // normalized per axis, so these differ whenever the batch is not square.
  unitsPerCell: vec2<f32>,
}

@group(0) @binding(0) var<uniform> warp: WarpUniforms;
@group(0) @binding(1) var<storage, read> nodes: array<vec4<f32>>;
// Two int16 grid coordinates packed into each u32, as uploaded for drawing.
@group(0) @binding(2) var<storage, read> localPositions: array<u32>;
@group(0) @binding(3) var<storage, read_write> outPositions: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read> inAttributes: array<f32>;
@group(0) @binding(5) var<storage, read_write> outAttributes: array<f32>;

fn nodeAt(ix: u32, iy: u32) -> vec4<f32> {
  let stride = warp.cells + 1u;
  return nodes[iy * stride + ix];
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  if (index >= warp.vertexCount) {
    return;
  }

  let packed = localPositions[index];
  let localX = f32(i32(packed << 16u) >> 16u);
  let localY = f32(i32(packed) >> 16u);

  let maxCell = f32(warp.cells);
  let gx = clamp(localX / warp.cellSize, 0.0, maxCell - 0.0001);
  let gy = clamp(localY / warp.cellSize, 0.0, maxCell - 0.0001);
  let ix = u32(floor(gx));
  let iy = u32(floor(gy));
  let fx = gx - f32(ix);
  let fy = gy - f32(iy);

  let n00 = nodeAt(ix, iy);
  let n10 = nodeAt(ix + 1u, iy);
  let n01 = nodeAt(ix, iy + 1u);
  let n11 = nodeAt(ix + 1u, iy + 1u);

  // A cell is unusable when a corner failed to project, or when it stretches
  // across a projection cut such as the antimeridian.
  var ok = n00.z * n10.z * n01.z * n11.z > 0.5;
  if (ok && warp.maxEdge > 0.0) {
    let spread = max(
      max(distance(n00.xy, n10.xy), distance(n01.xy, n11.xy)),
      max(distance(n00.xy, n01.xy), distance(n10.xy, n11.xy))
    );
    ok = spread <= warp.maxEdge;
  }

  let bottom = mix(n00.xy, n10.xy, fx);
  let top = mix(n01.xy, n11.xy, fx);
  let projected = mix(bottom, top, fy);
  outPositions[index] = vec4(projected, select(0.0, 1.0, ok), 0.0);

  if (warp.strokeMode == 1u) {
    // Rotate the normal by the local Jacobian so the stroke stays
    // perpendicular to the warped line. Normals arrive in source map units, so
    // the derivatives have to be per source unit as well, not per grid step.
    let dx = (mix(n10.xy, n11.xy, fy) - mix(n00.xy, n01.xy, fy)) / warp.unitsPerCell.x;
    let dy = (top - bottom) / warp.unitsPerCell.y;
    let base = index * 4u;
    let normal = vec2(inAttributes[base], inAttributes[base + 1u]);
    let warped = dx * normal.x + dy * normal.y;
    let scale = max(length(warped), 1e-12);
    outAttributes[base] = warped.x / scale;
    outAttributes[base + 1u] = warped.y / scale;
    outAttributes[base + 2u] = inAttributes[base + 2u];
    outAttributes[base + 3u] = inAttributes[base + 3u];
  }
}
`;

export const VECTOR_FILL_WARPED_SHADER = `
struct FrameUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  viewportSizePx: vec2<f32>,
  globalAlpha: f32,
  hitDetection: f32,
  time: f32,
  fadeDuration: f32,
  // CSS pixels per map unit, for measuring dashes along a line.
  pixelsPerUnit: f32,
}

struct Style {
  color: vec4<f32>,
  hitColor: vec4<f32>,
  dashA: vec4<f32>,
  dashB: vec4<f32>,
  // Dash offset, pattern length, dash count, padding; all lengths in CSS pixels.
  dashParams: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: FrameUniforms;
@group(0) @binding(1) var<storage, read> styles: array<Style>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) hitColor: vec4<f32>,
}

@vertex
fn vs_main(
  @location(0) warped: vec3<f32>,
  @location(1) styleIndex: u32,
) -> VertexOut {
  var out: VertexOut;
  if (warped.z < 0.5) {
    // Behind the near plane, so the whole triangle is clipped away.
    out.position = vec4(0.0, 0.0, 2.0, 1.0);
    out.color = vec4(0.0);
    out.hitColor = vec4(0.0);
    return out;
  }
  out.position = uniforms.projectionMatrix * vec4(warped.xy, 0.0, 1.0);
  let style = styles[styleIndex];
  out.color = style.color;
  out.hitColor = style.hitColor;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  if (uniforms.hitDetection > 0.5) {
    return in.hitColor;
  }
  var color = in.color;
  color.a = color.a * uniforms.globalAlpha;
  return vec4(color.rgb * color.a, color.a);
}
`;

export const VECTOR_STROKE_WARPED_SHADER = `
struct FrameUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  viewportSizePx: vec2<f32>,
  globalAlpha: f32,
  hitDetection: f32,
  time: f32,
  fadeDuration: f32,
  // CSS pixels per map unit, for measuring dashes along a line.
  pixelsPerUnit: f32,
}

struct Style {
  color: vec4<f32>,
  hitColor: vec4<f32>,
  dashA: vec4<f32>,
  dashB: vec4<f32>,
  // Dash offset, pattern length, dash count, padding; all lengths in CSS pixels.
  dashParams: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: FrameUniforms;
@group(0) @binding(1) var<storage, read> styles: array<Style>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) hitColor: vec4<f32>,
  @location(2) distance: f32,
  @location(3) @interpolate(flat) styleIndex: u32,
}

// Coverage of the dash pattern at a distance along the line, in CSS pixels:
// zero in a gap, one inside a dash, and a ramp over the last pixel of a dash.
// The pattern repeats as Canvas repeats it, shifted by the dash offset.
fn dashCoverage(style: Style, distancePx: f32) -> f32 {
  // Derivatives have to be taken before any branch on the style.
  let aa = max(fwidth(distancePx), 0.0001);
  let count = u32(style.dashParams.z);
  let total = style.dashParams.y;
  if (count == 0u || total <= 0.0) {
    return 1.0;
  }
  let shifted = distancePx + style.dashParams.x;
  var pos = shifted - total * floor(shifted / total);
  for (var i = 0u; i < count; i = i + 1u) {
    let lengths = select(style.dashB, style.dashA, i < 4u);
    let len = lengths[i % 4u];
    if (pos < len) {
      if (i % 2u == 1u) {
        return 0.0;
      }
      return clamp(min(pos, len - pos) / aa + 0.5, 0.0, 1.0);
    }
    pos = pos - len;
  }
  return 0.0;
}

// Coverage for a stroke of the given width in device pixels.
//
// A ribbon thinner than a pixel lands only on the pixel centres it happens to
// cross, so a hairline draws as a dotted line. Those strokes are widened to a
// whole pixel and the width they lost is taken back out of the alpha, which is
// the coverage a rasteriser with subpixel precision would have given them.
fn hairlineFade(width: f32) -> f32 {
  return clamp(width, 0.0, 1.0);
}

@vertex
fn vs_main(
  @location(0) warped: vec3<f32>,
  @location(1) normalWidth: vec4<f32>,
  @location(2) styleIndex: u32,
) -> VertexOut {
  var out: VertexOut;
  if (warped.z < 0.5) {
    out.position = vec4(0.0, 0.0, 2.0, 1.0);
    out.color = vec4(0.0);
    out.hitColor = vec4(0.0);
    out.distance = 0.0;
    out.styleIndex = styleIndex;
    return out;
  }
  var clip = uniforms.projectionMatrix * vec4(warped.xy, 0.0, 1.0);
  let width = max(normalWidth.z, 1.0);
  // The centerline is rotated by projectionMatrix, so its normal must be
  // rotated as well. Normalize after converting clip coordinates to pixels:
  // clip-space x/y have different scales on a non-square viewport.
  let clipNormal = uniforms.projectionMatrix * vec4(normalWidth.xy, 0.0, 0.0);
  let screenNormal = normalize(clipNormal.xy * uniforms.viewportSizePx);
  var offset = screenNormal * (width * 0.5);
  clip = vec4(
    clip.xy + offset / (uniforms.viewportSizePx * 0.5) * clip.w,
    clip.z,
    clip.w
  );
  out.position = clip;
  let style = styles[styleIndex];
  out.color = vec4(style.color.rgb, style.color.a * hairlineFade(normalWidth.z));
  out.hitColor = style.hitColor;
  out.distance = normalWidth.w;
  out.styleIndex = styleIndex;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  let dash = dashCoverage(
    styles[in.styleIndex],
    in.distance * uniforms.pixelsPerUnit
  );
  if (dash <= 0.0) {
    discard;
  }
  if (uniforms.hitDetection > 0.5) {
    return in.hitColor;
  }
  var color = in.color;
  color.a = color.a * uniforms.globalAlpha * dash;
  return vec4(color.rgb * color.a, color.a);
}
`;

export const VECTOR_STROKE_SHADER = `
struct FrameUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  viewportSizePx: vec2<f32>,
  globalAlpha: f32,
  hitDetection: f32,
  time: f32,
  fadeDuration: f32,
  // CSS pixels per map unit, for measuring dashes along a line.
  pixelsPerUnit: f32,
}

struct Style {
  color: vec4<f32>,
  hitColor: vec4<f32>,
  dashA: vec4<f32>,
  dashB: vec4<f32>,
  // Dash offset, pattern length, dash count, padding; all lengths in CSS pixels.
  dashParams: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: FrameUniforms;
@group(0) @binding(1) var<storage, read> styles: array<Style>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) hitColor: vec4<f32>,
  @location(2) distance: f32,
  @location(3) @interpolate(flat) styleIndex: u32,
}

// Coverage of the dash pattern at a distance along the line, in CSS pixels:
// zero in a gap, one inside a dash, and a ramp over the last pixel of a dash.
// The pattern repeats as Canvas repeats it, shifted by the dash offset.
fn dashCoverage(style: Style, distancePx: f32) -> f32 {
  // Derivatives have to be taken before any branch on the style.
  let aa = max(fwidth(distancePx), 0.0001);
  let count = u32(style.dashParams.z);
  let total = style.dashParams.y;
  if (count == 0u || total <= 0.0) {
    return 1.0;
  }
  let shifted = distancePx + style.dashParams.x;
  var pos = shifted - total * floor(shifted / total);
  for (var i = 0u; i < count; i = i + 1u) {
    let lengths = select(style.dashB, style.dashA, i < 4u);
    let len = lengths[i % 4u];
    if (pos < len) {
      if (i % 2u == 1u) {
        return 0.0;
      }
      return clamp(min(pos, len - pos) / aa + 0.5, 0.0, 1.0);
    }
    pos = pos - len;
  }
  return 0.0;
}

// Coverage for a stroke of the given width in device pixels.
//
// A ribbon thinner than a pixel lands only on the pixel centres it happens to
// cross, so a hairline draws as a dotted line. Those strokes are widened to a
// whole pixel and the width they lost is taken back out of the alpha, which is
// the coverage a rasteriser with subpixel precision would have given them.
fn hairlineFade(width: f32) -> f32 {
  return clamp(width, 0.0, 1.0);
}

@vertex
fn vs_main(
  @location(0) position: vec2<i32>,
  @location(1) normalWidth: vec4<f32>,
  @location(2) styleIndex: u32,
) -> VertexOut {
  var out: VertexOut;
  var clip = uniforms.projectionMatrix * vec4(vec2<f32>(position), 0.0, 1.0);
  let width = max(normalWidth.z, 1.0);
  // The centerline is rotated by projectionMatrix, so its normal must be
  // rotated as well. Normalize after converting clip coordinates to pixels:
  // clip-space x/y have different scales on a non-square viewport.
  let clipNormal = uniforms.projectionMatrix * vec4(normalWidth.xy, 0.0, 0.0);
  let screenNormal = normalize(clipNormal.xy * uniforms.viewportSizePx);
  var offset = screenNormal * (width * 0.5);
  clip = vec4(
    clip.xy + offset / (uniforms.viewportSizePx * 0.5) * clip.w,
    clip.z,
    clip.w
  );
  out.position = clip;
  let style = styles[styleIndex];
  out.color = vec4(style.color.rgb, style.color.a * hairlineFade(normalWidth.z));
  out.hitColor = style.hitColor;
  out.distance = normalWidth.w;
  out.styleIndex = styleIndex;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  let dash = dashCoverage(
    styles[in.styleIndex],
    in.distance * uniforms.pixelsPerUnit
  );
  if (dash <= 0.0) {
    discard;
  }
  if (uniforms.hitDetection > 0.5) {
    return in.hitColor;
  }
  var color = in.color;
  color.a = color.a * uniforms.globalAlpha * dash;
  return vec4(color.rgb * color.a, color.a);
}
`;

export const SYMBOL_SHADER = `
struct FrameUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  viewportSizePx: vec2<f32>,
  globalAlpha: f32,
  hitDetection: f32,
  time: f32,
  fadeDuration: f32,
  // CSS pixels per map unit, for measuring dashes along a line.
  pixelsPerUnit: f32,
}

@group(0) @binding(0) var<uniform> uniforms: FrameUniforms;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) fillColor: vec4<f32>,
  @location(1) hitColor: vec4<f32>,
  @location(2) localPx: vec2<f32>,
  @location(3) strokeColor: vec4<f32>,
  @location(4) @interpolate(flat) strokeRadius: vec2<f32>,
  @location(5) @interpolate(flat) opacity: f32,
}

// A circle: the fill covers the disc inside the stroke, and the stroke is
// centred on the radius, as Canvas draws an ol/style/Circle.
@vertex
fn vs_main(
  @location(0) position: vec2<f32>,
  @location(1) offsetPx: vec2<f32>,
  @location(2) sizePx: vec2<f32>,
  @location(3) fillColor: vec4<f32>,
  @location(4) hitColor: vec4<f32>,
  @location(5) corner: vec2<f32>,
  @location(6) opacityTransition: vec3<f32>,
  @location(7) strokeColor: vec4<f32>,
  @location(8) strokeRadius: vec2<f32>,
) -> VertexOut {
  var out: VertexOut;
  let fadeProgress = clamp(
    (uniforms.time - opacityTransition.z) / max(uniforms.fadeDuration, 0.0001),
    0.0,
    1.0
  );
  let opacity = mix(opacityTransition.x, opacityTransition.y, fadeProgress);
  if (opacity <= 0.0) {
    // Decluttered away this frame: collapse the quad instead of re-uploading
    // the instance buffer without it.
    out.position = vec4(0.0, 0.0, 2.0, 1.0);
    out.fillColor = vec4(0.0);
    out.hitColor = vec4(0.0);
    out.localPx = vec2(0.0);
    out.strokeColor = vec4(0.0);
    out.strokeRadius = vec2(0.0);
    out.opacity = 0.0;
    return out;
  }
  var clip = uniforms.projectionMatrix * vec4(position, 0.0, 1.0);
  // One pixel of room on each side for the antialiased edge.
  let quadPx = sizePx + vec2(2.0, 2.0);
  let localPx = (corner - vec2(0.5, 0.5)) * quadPx;
  let px = offsetPx + localPx;
  // CSS pixels are Y-down; clip space is Y-up.
  clip = vec4(
    clip.x + px.x / (uniforms.viewportSizePx.x * 0.5) * clip.w,
    clip.y - px.y / (uniforms.viewportSizePx.y * 0.5) * clip.w,
    clip.z,
    clip.w
  );
  out.position = clip;
  out.fillColor = fillColor;
  out.hitColor = hitColor;
  out.localPx = localPx;
  out.strokeColor = strokeColor;
  out.strokeRadius = strokeRadius;
  out.opacity = opacity;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  let dist = length(in.localPx);
  let aa = max(fwidth(dist), 0.0001);
  let halfStroke = in.strokeRadius.x * 0.5;
  let outer = in.strokeRadius.y + halfStroke;
  let coverage = clamp((outer - dist) / aa + 0.5, 0.0, 1.0);
  if (coverage <= 0.0) {
    discard;
  }
  if (uniforms.hitDetection > 0.5) {
    return in.hitColor;
  }
  let fill = vec4(in.fillColor.rgb * in.fillColor.a, in.fillColor.a);
  var color = fill;
  if (halfStroke > 0.0) {
    let inner = in.strokeRadius.y - halfStroke;
    let fillCoverage = clamp((inner - dist) / aa + 0.5, 0.0, 1.0);
    let stroke = vec4(in.strokeColor.rgb * in.strokeColor.a, in.strokeColor.a);
    color = mix(stroke, fill, fillCoverage);
  }
  color = color * (coverage * in.opacity * uniforms.globalAlpha);
  if (color.a <= 0.0) {
    discard;
  }
  return color;
}
`;

export const ICON_SHADER = `
struct FrameUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  viewportSizePx: vec2<f32>,
  globalAlpha: f32,
  hitDetection: f32,
  time: f32,
  fadeDuration: f32,
  pixelsPerUnit: f32,
  viewRotation: f32,
}

@group(0) @binding(0) var<uniform> uniforms: FrameUniforms;
@group(0) @binding(1) var atlasSampler: sampler;
@group(0) @binding(2) var atlasTexture: texture_2d<f32>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) hitColor: vec4<f32>,
  @location(2) @interpolate(flat) opacity: f32,
}

@vertex
fn vs_main(
  @location(0) position: vec2<f32>,
  @location(1) offsetPx: vec2<f32>,
  @location(2) sizePx: vec2<f32>,
  @location(3) atlasPx: vec4<f32>,
  @location(4) hitColor: vec4<f32>,
  @location(5) styleOpacity: f32,
  @location(6) angle: f32,
  @location(7) rotateWithView: f32,
  @location(8) corner: vec2<f32>,
  @location(9) opacityTransition: vec3<f32>,
) -> VertexOut {
  var out: VertexOut;
  let fadeProgress = clamp(
    (uniforms.time - opacityTransition.z) / max(uniforms.fadeDuration, 0.0001),
    0.0,
    1.0
  );
  let opacity = mix(opacityTransition.x, opacityTransition.y, fadeProgress);
  if (opacity <= 0.0 || styleOpacity <= 0.0) {
    out.position = vec4(0.0, 0.0, 2.0, 1.0);
    out.texCoord = vec2(0.0);
    out.hitColor = vec4(0.0);
    out.opacity = 0.0;
    return out;
  }
  var clip = uniforms.projectionMatrix * vec4(position, 0.0, 1.0);
  let local = corner * sizePx + offsetPx;
  let rotation = angle + rotateWithView * uniforms.viewRotation;
  let c = cos(rotation);
  let s = sin(rotation);
  let rotated = vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  clip = vec4(
    clip.x + rotated.x / (uniforms.viewportSizePx.x * 0.5) * clip.w,
    clip.y - rotated.y / (uniforms.viewportSizePx.y * 0.5) * clip.w,
    clip.z,
    clip.w
  );
  out.position = clip;
  out.texCoord = mix(atlasPx.xy, atlasPx.zw, corner);
  out.hitColor = hitColor;
  out.opacity = opacity * styleOpacity;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  let atlasSize = vec2<f32>(textureDimensions(atlasTexture));
  let sample = textureSample(
    atlasTexture,
    atlasSampler,
    in.texCoord / atlasSize
  );
  if (sample.a < 0.01) {
    discard;
  }
  if (uniforms.hitDetection > 0.5) {
    return in.hitColor;
  }
  let alpha = sample.a * in.opacity * uniforms.globalAlpha;
  if (alpha < 0.01) {
    discard;
  }
  return vec4(sample.rgb * alpha, alpha);
}
`;

export const GLYPH_SHADER = `
struct FrameUniforms {
  projectionMatrix: mat4x4<f32>,
  renderExtent: vec4<f32>,
  viewportSizePx: vec2<f32>,
  globalAlpha: f32,
  hitDetection: f32,
  time: f32,
  fadeDuration: f32,
  // CSS pixels per map unit, for measuring dashes along a line.
  pixelsPerUnit: f32,
  viewRotation: f32,
}

@group(0) @binding(0) var<uniform> uniforms: FrameUniforms;
@group(0) @binding(1) var atlasSampler: sampler;
@group(0) @binding(2) var atlasTexture: texture_2d<f32>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) fillColor: vec4<f32>,
  @location(1) strokeColor: vec4<f32>,
  @location(2) hitColor: vec4<f32>,
  @location(3) texCoord: vec2<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec2<f32>,
  @location(1) offsetPx: vec2<f32>,
  @location(2) sizePx: vec2<f32>,
  @location(3) atlasPx: vec4<f32>,
  @location(4) fillColor: vec4<f32>,
  @location(5) strokeColor: vec4<f32>,
  @location(6) hitColor: vec4<f32>,
  @location(7) angle: f32,
  @location(8) corner: vec2<f32>,
  @location(9) opacityTransition: vec3<f32>,
  @location(10) rotateWithView: f32,
  @location(11) upright: vec2<f32>,
) -> VertexOut {
  var out: VertexOut;
  let fadeProgress = clamp(
    (uniforms.time - opacityTransition.z) / max(uniforms.fadeDuration, 0.0001),
    0.0,
    1.0
  );
  let opacity = mix(opacityTransition.x, opacityTransition.y, fadeProgress);
  let viewC = cos(uniforms.viewRotation);
  let viewS = sin(uniforms.viewRotation);
  // Same rule as isGlyphDrawn(): of a kept-upright line label's two reading
  // directions, only the one reading left to right on screen is drawn.
  let readingX = viewC * upright.x - viewS * upright.y;
  let readingY = viewS * upright.x + viewC * upright.y;
  let upsideDown = (upright.x != 0.0 || upright.y != 0.0) &&
    (readingX < 0.0 || (readingX == 0.0 && readingY < 0.0));
  if (opacity <= 0.0 || upsideDown) {
    // Decluttered away this frame: collapse the quad instead of re-uploading
    // the instance buffer without it.
    out.position = vec4(0.0, 0.0, 2.0, 1.0);
    out.fillColor = vec4(0.0);
    out.strokeColor = vec4(0.0);
    out.hitColor = vec4(0.0);
    out.texCoord = vec2(0.0);
    return out;
  }
  var clip = uniforms.projectionMatrix * vec4(position, 0.0, 1.0);
  var local = corner * sizePx + offsetPx;
  let rotation = angle + rotateWithView * uniforms.viewRotation;
  let c = cos(rotation);
  let s = sin(rotation);
  let rotated = vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  // CSS pixels are Y-down; clip space is Y-up.
  clip = vec4(
    clip.x + rotated.x / (uniforms.viewportSizePx.x * 0.5) * clip.w,
    clip.y - rotated.y / (uniforms.viewportSizePx.y * 0.5) * clip.w,
    clip.z,
    clip.w
  );
  out.position = clip;
  out.fillColor = vec4(fillColor.rgb, fillColor.a * opacity);
  out.strokeColor = vec4(strokeColor.rgb, strokeColor.a * opacity);
  out.hitColor = hitColor;
  // Atlas pixels; vertex and fragment stage must not both use the texture, so
  // defer normalizing by the atlas size to the fragment stage.
  out.texCoord = mix(atlasPx.xy, atlasPx.zw, corner);
  return out;
}

@fragment
fn fs_halo(in: VertexOut) -> @location(0) vec4<f32> {
  let atlasSize = vec2<f32>(textureDimensions(atlasTexture));
  let atlas = textureSample(atlasTexture, atlasSampler, in.texCoord / atlasSize);
  if (atlas.a < 0.01) {
    discard;
  }
  if (uniforms.hitDetection > 0.5) {
    discard;
  }
  // Atlas red stores unpremultiplied halo coverage.
  var color = in.strokeColor;
  color.a = color.a * atlas.r * atlas.a * uniforms.globalAlpha;
  if (color.a < 0.01) {
    discard;
  }
  return vec4(color.rgb * color.a, color.a);
}

@fragment
fn fs_fill(in: VertexOut) -> @location(0) vec4<f32> {
  let atlasSize = vec2<f32>(textureDimensions(atlasTexture));
  let atlas = textureSample(atlasTexture, atlasSampler, in.texCoord / atlasSize);
  if (atlas.a < 0.01) {
    discard;
  }
  if (uniforms.hitDetection > 0.5) {
    return in.hitColor;
  }
  // Atlas green stores unpremultiplied fill coverage.
  var color = in.fillColor;
  color.a = color.a * atlas.g * atlas.a * uniforms.globalAlpha;
  if (color.a < 0.01) {
    discard;
  }
  return vec4(color.rgb * color.a, color.a);
}
`;

export const DECLUTTER_SHADER = `
struct Label {
  aabb: vec4<f32>,
  priority: u32,
  mode: u32,
  pairId: u32,
  _pad: u32,
}

struct Params {
  count: u32,
  gridWidth: u32,
  gridHeight: u32,
  cellSize: f32,
}

@group(0) @binding(0) var<storage, read> labels: array<Label>;
@group(0) @binding(1) var<storage, read_write> occupancy: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> visibility: array<u32>;
@group(0) @binding(3) var<uniform> params: Params;

const MODE_DECLUTTER: u32 = 0u;
const MODE_OBSTACLE: u32 = 1u;
const MODE_NONE: u32 = 2u;

fn cellIndex(x: i32, y: i32) -> u32 {
  let gx = clamp(x, 0, i32(params.gridWidth) - 1);
  let gy = clamp(y, 0, i32(params.gridHeight) - 1);
  return u32(gy) * params.gridWidth + u32(gx);
}

@compute @workgroup_size(1)
fn cs_main() {
  for (var i = 0u; i < params.count; i = i + 1u) {
    let label = labels[i];
    if (label.mode == MODE_NONE) {
      visibility[i] = 1u;
      continue;
    }
    let minX = i32(floor(label.aabb[0] / params.cellSize));
    let minY = i32(floor(label.aabb[1] / params.cellSize));
    let maxX = i32(floor(label.aabb[2] / params.cellSize));
    let maxY = i32(floor(label.aabb[3] / params.cellSize));
    var blocked = false;
    if (label.mode == MODE_DECLUTTER) {
      for (var y = minY; y <= maxY; y = y + 1) {
        for (var x = minX; x <= maxX; x = x + 1) {
          let idx = cellIndex(x, y);
          if (atomicLoad(&occupancy[idx]) != 0u) {
            blocked = true;
          }
        }
      }
    }
    if (blocked) {
      visibility[i] = 0u;
      continue;
    }
    visibility[i] = 1u;
    for (var y = minY; y <= maxY; y = y + 1) {
      for (var x = minX; x <= maxX; x = x + 1) {
        atomicStore(&occupancy[cellIndex(x, y)], 1u);
      }
    }
  }
}
`;

/**
 * Inject a compiled color pipeline after the texture sample.
 *
 * Style variables are appended to the uniform struct. Both tile shaders name
 * the last fixed field `time`, so the same insertion applies to each.
 *
 * @param {string} shader Base shader.
 * @param {string} [fragmentBody] WGSL statements.
 * @param {string} [functions] Helper functions.
 * @param {Array<string>} [variableNames] Style variable names, in uniform order.
 * @return {string} Shader.
 */
export function withTileColorPipeline(
  shader,
  fragmentBody,
  functions,
  variableNames,
) {
  let result = shader;
  if (variableNames && variableNames.length) {
    const fields = variableNames
      .map((name) => `  u_var_${name}: f32,`)
      .join('\n');
    result = result.replace('time: f32,\n}', `time: f32,\n${fields}\n}`);
  }
  if (!fragmentBody) {
    return result;
  }
  const prefix = functions ? functions + '\n' : '';
  return (
    prefix +
    result.replace(
      'var color = textureSample(tileTexture, tileSampler, in.texCoord);',
      `var color = textureSample(tileTexture, tileSampler, in.texCoord);\n  ${fragmentBody}`,
    )
  );
}

/**
 * Sample unfilterable float tiles with textureLoad. `textureSample` is only
 * valid for filterable formats, and raw COG values are stored as rgba32float.
 *
 * @param {string} shader Shader that samples `tileTexture`.
 * @return {string} Shader.
 */
export function withUnfilterableTileSampling(shader) {
  return (
    `fn sampleTileUnfilterable(uv: vec2<f32>) -> vec4<f32> {
  let size = vec2<f32>(textureDimensions(tileTexture, 0));
  let coord = vec2<i32>(clamp(uv * size, vec2<f32>(0.0), size - vec2<f32>(1.0)));
  return textureLoad(tileTexture, coord, 0);
}
` +
    shader
      .replace('@group(0) @binding(1) var tileSampler: sampler;\n', '')
      .replaceAll(
        'textureSample(tileTexture, tileSampler, ',
        'sampleTileUnfilterable(',
      )
  );
}
