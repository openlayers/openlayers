declare module 'color-space/xyz.js' {
    export function lchuv(color: Array<number>): [number, number, number];
    export function rgb(color: Array<number>): [number, number, number];
};
