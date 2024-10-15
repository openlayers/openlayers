const _tmp = new Float32Array(1);

/**
 * @param {number} v The input.
 * @return {number} The result value with float precision.
 */
export function float(v) {
  _tmp[0] = v;
  return _tmp[0];
}

/**
 * @param {number} v The input.
 * @return {Array<number>} The encoded float values.
 */
export function dfp(v) {
  const h = float(v);
  return [h, float(v - h)];
}

/**
 * @param {number} v The input.
 * @return {number} High part of encoded float value.
 */
export function hi(v) {
  return dfp(v)[0];
}

/**
 * @param {number} v The input.
 * @return {number} Low part of encoded float value.
 */
export function lo(v) {
  return dfp(v)[1];
}

const softDoubleShader = `
#define DFP vec2
#define DFP_ZERO DFP(0., 0.)
#define DFP_ONE DFP(1., 0.)
#define DFP_TWO DFP(2., 0.)

//#define DEBUG_ADD
//#define DEBUG_SUB
//#define DEBUG_MUL
//#define DEBUG_DIV
//#define DEBUG_SIN
//#define DEBUG_COS
//#define DEBUG_SQRT
//#define DEBUG_ASIN

float _(float v) {
  return sign(v)*sign(v)*v;
}

vec2 _sum(float a, float b) {
  float v = _(a + b);
  float t = (v - a);
  float e = a - (v - t) + (b - t);
  return vec2(v, e);
}

vec2 _mul(float a, float b) {
  float split = 4097.0;
  vec2 ra, rb;
  float t, e, v;

  v = _(a * b);

  t = (split * a);
  ra.x = t - (t - a);
  ra.y = a - ra.x;

  t = (split * b);
  rb.x = t - (t - b);
  rb.y = b - rb.x;

  e = (_(ra.x * rb.x - v) + ra.x * rb.y + ra.y * rb.x) + ra.y * rb.y;

  return vec2(v, e);
}

DFP dfp(int a) {
  return DFP(float(a), 0.);
}

DFP dfp(float a) {
  DFP r = DFP(a, 0.);
  return r;
}

float dfp_as_float(DFP a) {
  return a.x + a.y;
}

DFP dfp_neg(DFP a) {
  return -a;
}

bool dfp_le(DFP a, DFP b) {
  return dfp_as_float(a) <= dfp_as_float(b);
}

DFP dfp_add_internal(DFP a, float b) {
  vec2 r = _sum(a.x, b);
  return DFP(r.x, (a.y + r.y));
}

DFP dfp_add(DFP a, DFP b) {
#ifdef DEBUG_ADD
  return dfp(dfp_as_float(a) + dfp_as_float(b));
#endif
  DFP r;

  r = dfp_add_internal(a, b.x);
  r = dfp_add_internal(r, b.y);
  return r;
}
DFP dfp_add(DFP a, float b) {
  return dfp_add(a, dfp(b));
}

DFP dfp_add(DFP a, DFP b, DFP c) { return dfp_add(dfp_add(a, b), c); }
DFP dfp_add(DFP a, DFP b, DFP c, DFP d) { return dfp_add(dfp_add(a, b, c), d); }
DFP dfp_add(DFP a, DFP b, DFP c, DFP d, DFP e) { return dfp_add(dfp_add(a, b, c, d), e); }
DFP dfp_add(DFP a, DFP b, DFP c, DFP d, DFP e, DFP f) { return dfp_add(dfp_add(a, b, c, d, e), f); }

DFP dfp_sub(DFP a, DFP b) {
#ifdef DEBUG_SUB
  return dfp(dfp_as_float(a) - dfp_as_float(b));
#endif
  return dfp_add(a, dfp_neg(b));
}
DFP dfp_sub(DFP a, DFP b, DFP c) { return dfp_sub(dfp_sub(a, b), c); }
DFP dfp_sub(DFP a, DFP b, DFP c, DFP d) { return dfp_sub(dfp_sub(a, b, c), d); }

DFP dfp_mul_internal(DFP a, float b) {
  // multiplication
  vec2 p = _mul(a.x, b);
  vec2 q = _mul(a.y, b);

  DFP r = DFP(_sum(p.x, q.x)); // XXX: cast as DFP
  r = dfp_add_internal(r, p.y);
  r = dfp_add_internal(r, q.y);

  return r;
}

DFP dfp_mul(DFP a, DFP b) {
#ifdef DEBUG_MUL
  return dfp(dfp_as_float(a) * dfp_as_float(b));
#endif
  DFP p = dfp_mul_internal(a, b.x);
  DFP q = dfp_mul_internal(a, b.y);

  DFP r = DFP(_sum(p.x, q.x)); // XXX: cast as DFP
  r = dfp_add_internal(r, p.y);
  r = dfp_add_internal(r, q.y);

  return r;
}
DFP dfp_mul(DFP a, DFP b, DFP c) { return dfp_mul(dfp_mul(a, b), c); }
DFP dfp_mul(DFP a, DFP b, DFP c, DFP d) { return dfp_mul(dfp_mul(a, b, c), d); }

DFP dfp_inv(DFP a) {
  if (dfp_as_float(a) == 0.) return DFP_ZERO;
  const int N = 2;

  DFP x = dfp(1.0 / dfp_as_float(a));

  x = dfp_mul(x, dfp_sub(DFP_TWO, dfp_mul(a, x)));
  x = dfp_mul(x, dfp_sub(DFP_TWO, dfp_mul(a, x)));

  return x;
}

DFP dfp_div(DFP a, DFP b) {
#ifdef DEBUG_DIV
  return dfp(dfp_as_float(a) / dfp_as_float(b));
#endif
  return dfp_mul(a, dfp_inv(b));
}
DFP dfp_div(DFP a, DFP b, DFP c) { return dfp_div(dfp_div(a, b), c); }
DFP dfp_div(DFP a, DFP b, DFP c, DFP d) { return dfp_div(dfp_div(a, b, c), d); }

DFP dfp_sq(DFP a) {
  return dfp_mul(a, a);
}
DFP dfp_sin_rough(DFP a) {
  return dfp(sin(dfp_as_float(a)));
}
DFP dfp_sin(DFP a) {
#ifdef DEBUG_SIN
  return dfp(sin(dfp_as_float(a)));
#endif
  const int N = 6;
  DFP s = a;
  DFP p = a;
  DFP a2 = dfp_sq(a);
  for (int i = 1; i <= N; i++) {
    p = dfp_mul(p, a2, dfp(-1./float((2*i)*(2*i+1))));
    s = dfp_add(s, p);
  }
  return s;
}

DFP dfp_cos_rough(DFP a) {
  return dfp(cos(dfp_as_float(a)));
}

DFP dfp_cos(DFP a) {
#ifdef DEBUG_COS
  return dfp(cos(dfp_as_float(a)));
#endif
  const int N = 6;
  DFP s = DFP_ONE;
  DFP p = DFP_ONE;
  DFP a2 = dfp_sq(a);
  for (int i = 1; i <= N; i++) {
    p = dfp_mul(p, a2, dfp(-1./float((2*i-1)*(2*i))));
    s = dfp_add(s, p);
  }
  return s;
}

DFP dfp_sqrt(DFP a) {
#ifdef DEBUG_SQRT
  return dfp(sqrt(dfp_as_float(a)));
#endif
  const int N = 3;
  DFP x = dfp(sqrt(dfp_as_float(a)));
  for (int i = 0; i < N; i++) {
    x = dfp_mul(dfp_add(x, dfp_div(a, x)), dfp(0.5));
  }
  return x;
}

// calculates asin(a) - b
DFP dfp_asin_delta(DFP a, DFP b) {
#ifdef DEBUG_ASIN
  return dfp(asin(dfp_as_float(a)) - asin(dfp_as_float(b)));
#endif

  const int N = 1;
  DFP x = dfp(asin(dfp_as_float(a)) - dfp_as_float(b));
  DFP x_b;

  for (int i = 0; i < N; i++) {
    x_b = dfp_add(x, b);
    x = dfp_add(x, dfp_div(dfp_sub(a, dfp_sin(x_b)), dfp_cos(x_b)));
  }

  return x;
}

DFP dfp_asin(DFP a) {
  return dfp_asin_delta(a, DFP_ZERO);
}

`;

export const softDoubleFunctions = softDoubleShader;
