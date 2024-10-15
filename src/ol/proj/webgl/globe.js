/**
 * @module ol/proj/webgl/globe
 */

import {RADIUS} from '../globe.js';
import {dfp, softDoubleFunctions} from '../../webgl/softfloat.js';
import {toRadians} from '../../math.js';

// XXX:
const globeRadiusPx = 100; // in px

const paramsFn = (
  /** @type {import('../../Map.js').FrameState} */ frameState,
) => {
  const zoomFactor = 1 / Math.pow(2, frameState.viewState.zoom);
  const center = frameState.viewState.center;
  const tilt = frameState.viewState.tilt || 0;
  const FOV = frameState.viewState.fov || 20; // 0 to disable perspective

  return {
    n: tilt, // already in radians
    f: FOV < 1 ? 1 : zoomFactor / Math.tan(((FOV / 2) * Math.PI) / 180),
    zoomFactor,
    center,
    m: toRadians(center[1]) - tilt,
    phi0: toRadians(center[1]),
  };
};

/**
 * @param {Object} [options] Options
 * @return {Array<import('../../webgl/Helper.js').PostProcessesOptions>} Post processors for the projection.
 */
export function createPostProcessors(options = {}) {
  const r = 1 + (options.h || 0) / RADIUS;
  return [
    {
      vertexShader: `
        precision mediump float;

        attribute vec2 a_position;
        varying vec3 v_position;
        varying vec2 v_texCoord;
        varying vec2 v_screenCoord;

        uniform vec2 u_viewportSizePx;
        uniform mat4 u_screenToWorldMatrix;
        uniform float u_resolution;

        const float globeRadiusPx = ${globeRadiusPx.toFixed(1)}; // in px

        void main() {
          v_position = vec3(a_position * u_viewportSizePx / 2.0 / globeRadiusPx, 0);

          v_texCoord = a_position * 0.5 + 0.5;
          v_screenCoord = v_texCoord * u_viewportSizePx;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `,

      uniforms: {
        'u_dfp_zoom_factor': (frameState) => {
          const {zoomFactor} = paramsFn(frameState);
          return dfp(zoomFactor);
        },
        'u_dfp_f': (frameState) => {
          const {f} = paramsFn(frameState);
          return dfp(f);
        },
        'u_dfp_f2': (frameState) => {
          const {f} = paramsFn(frameState);
          return dfp(f * f);
        },

        /*
         * Transformd:
         *   Q = (x^2 + y^2) (r^2 - 1 - 2 f cos(n) - f^2)
         *     + y^2         sin^2(n)
         *     + y           (- 2 f^2 sin(n) - f sin(2n))
         *     +             f^2 (cos^2(n) + r^2 - 1)
         */
        'u_dfp_Q_termX2_Y2': (frameState) => {
          const {f, n} = paramsFn(frameState);
          return dfp(r ** 2 - 1 - 2 * f * Math.cos(n) - f ** 2);
        },
        'u_dfp_Q_termY2': (frameState) => {
          const {n} = paramsFn(frameState);
          return dfp(Math.sin(n) ** 2);
        },
        'u_dfp_Q_termY': (frameState) => {
          const {f, n} = paramsFn(frameState);
          return dfp(-2 * f ** 2 * Math.sin(n) - f * Math.sin(2 * n));
        },
        'u_dfp_Q_bias': (frameState) => {
          const {f, n} = paramsFn(frameState);
          return dfp(f ** 2 * (Math.cos(n) ** 2 + r ** 2 - 1));
        },

        /*
         *   N =
         *     + (x^2 + y^2)
         *     + sqrt(Q)
         *     + y           sin(n)
         *     +             (- f cos(n))
         */
        'u_dfp_N_termY': (frameState) => {
          const {n} = paramsFn(frameState);
          return dfp(Math.sin(n));
        },
        'u_dfp_N_bias': (frameState) => {
          const {f, n} = paramsFn(frameState);
          return dfp(-f * Math.cos(n));
        },

        'u_dfp_cos_m': (frameState) => {
          const {m} = paramsFn(frameState);
          return dfp(Math.cos(m));
        },
        'u_dfp_sin_m': (frameState) => {
          const {m} = paramsFn(frameState);
          return dfp(Math.sin(m));
        },
        'u_dfp_sin_phi0': (frameState) => {
          const {phi0} = paramsFn(frameState);
          return dfp(Math.sin(phi0));
        },
        'u_dfp_cos_phi0': (frameState) => {
          const {phi0} = paramsFn(frameState);
          return dfp(Math.cos(phi0));
        },
        'u_dfp_phi0': (frameState) => {
          const {phi0} = paramsFn(frameState);
          return dfp(phi0);
        },
      },

      fragmentShader: `
        precision mediump float;

        uniform sampler2D u_image;
        uniform float u_opacity;
        uniform vec2 u_center;
        uniform vec2 u_viewportSizePx;
        uniform float u_zoom;
        uniform vec4 u_extent;
        uniform float u_resolution;

        varying vec3 v_position;
        varying vec2 v_texCoord;
        varying vec2 v_screenCoord;

        ${softDoubleFunctions}

        uniform vec2 u_dfp_zoom_factor;
        uniform vec2 u_dfp_f;
        uniform vec2 u_dfp_f2;
        uniform vec2 u_dfp_Q_termX2_Y2;
        uniform vec2 u_dfp_Q_termY2;
        uniform vec2 u_dfp_Q_termY;
        uniform vec2 u_dfp_Q_bias;
        uniform vec2 u_dfp_N_termY;
        uniform vec2 u_dfp_N_bias;
        uniform vec2 u_dfp_sin_m;
        uniform vec2 u_dfp_cos_m;
        uniform vec2 u_dfp_sin_phi0;
        uniform vec2 u_dfp_cos_phi0;
        uniform vec2 u_dfp_phi0;

        float findLatDelta(DFP a, DFP b) {
          const int N = 1;
          DFP x = dfp(asin(dfp_as_float(a)) - dfp_as_float(b));
          DFP x_b;

          for (int i = 0; i < N; i++) {
            x_b = dfp_add(x, b);
            x = dfp_add(x, dfp_div(dfp_sub(a, dfp_sin(x_b)), dfp_cos_rough(x_b)));
          }

          return dfp_as_float(x);
        }

        vec3 findLngLatDelta(vec2 screen) {
          DFP x = dfp_mul(dfp(screen.x), u_dfp_zoom_factor);
          DFP y = dfp_mul(dfp(screen.y), u_dfp_zoom_factor);
          DFP f = u_dfp_f;

          /*
           * Solve (x(1-s))^2 + ((y(1-s)+sin(n))cos(m)+(sf+cos(n))sin(m))^2 + (-(y(1-s)+sin(n))sin(m)+(sf+cos(n))cos(m))^2 = r^2 for s
           *
           * Result:
           *
           *   Q = (x^2 + y^2) (r^2 - 1 - 2 f cos(n) - f^2)
           *     + y^2         sin^2(n)
           *     + y           (- 2 f^2 sin(n) - f sin(2n))
           *     +             f^2 (cos^2(n) + r^2 - 1)
           *
           *   S = (
           *     + (x^2 + y^2)
           *     + sqrt(Q)
           *     + y           sin(n)
           *     +             (- f cos(n))
           *   ) / (f^2 + x^2 + y^2)
           */
          DFP f2 = u_dfp_f2;
          DFP x2 = dfp_mul(x, x);
          DFP y2 = dfp_mul(y, y);
          DFP x2_y2 = dfp_add(x2, y2);

          DFP Q = dfp_add(
            dfp_mul(x2_y2, u_dfp_Q_termX2_Y2),
            dfp_mul(y2, u_dfp_Q_termY2),
            dfp_mul(y, u_dfp_Q_termY),
            u_dfp_Q_bias
          );

          // Not on the earth
          if (dfp_as_float(Q) < 0.) {
            //gl_FragColor = vec4(0.0, 0.0, 0.0, -Q.x * 10.);
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return vec3(0., 0., -1.);
          }

          DFP N = dfp_add(
            x2_y2,
            dfp_sqrt(Q),
            dfp_mul(y, u_dfp_N_termY),
            u_dfp_N_bias
          );

          DFP S = dfp_div(N, dfp_add(f2, x2_y2));
          DFP z = dfp_mul(f, S);

          if (dfp_as_float(S) >= 1.) {
            discard;
          }

          // unperspective by: xy *= (1 - S)
          x = dfp_sub(x, dfp_mul(x, S));
          y = dfp_sub(y, dfp_mul(y, S));

          // tilt back
          DFP xt =  x;
          DFP yt = dfp_add(dfp_mul(y,  u_dfp_cos_m), dfp_mul(z, u_dfp_sin_m), u_dfp_sin_phi0);
          DFP zt = dfp_add(dfp_mul(y, -u_dfp_sin_m), dfp_mul(z, u_dfp_cos_m), u_dfp_cos_phi0);

          float lng = atan(dfp_as_float(xt), dfp_as_float(zt));
          float lat = dfp_as_float(dfp_asin_delta(yt, u_dfp_phi0));

          return vec3(degrees(vec2(lng, lat)), 1.);
        }

        void main() {
          vec3 surface = v_position;

          vec3 lnglatDelta = findLngLatDelta(surface.xy);
          if (lnglatDelta.z < 0.) {
            return;
          }

          vec2 texCoord = lnglatDelta.xy / u_resolution / u_viewportSizePx + 0.5;

          if (texCoord.x < 0. || texCoord.y < 0. || texCoord.x > 1. || texCoord.y > 1.) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            return;
          }

          //gl_FragColor = texture2D(u_image, texCoord) * u_opacity * (1. - length(texCoord - 0.5) * 2.);// * 0.5 + texture2D(u_image, v_texCoord) * u_opacity * 0.2;
          gl_FragColor = texture2D(u_image, texCoord) * u_opacity;// * (1. - length(texCoord - 0.5) * 2.);
        }
      `,
    },
  ];
}
