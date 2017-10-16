import * as d3 from "d3";

export const kRadiusExpand = 1.5;
export const kNodeTransDuration = 250;

const kLinkDistanceF = 0.05;
export let kNodeRadius = -1;

const kNodeRadiusF = 0.013;
export let kLinkDistance = -1;

export function InitSizes(width: number, height: number) {
    const min = width < height ? width : height;
    kNodeRadius = kNodeRadiusF * min;
    kLinkDistance = kLinkDistanceF * min;
}

const ordinal = d3.scaleOrdinal(d3.schemeCategory20);

export function Color(n: number) {
    return ordinal(String(n));
}
