/* tslint:disable: no-namespace */

namespace Const {
    const kLinkDistanceF = 0.05;
    const kNodeRadiusF = 0.013;

    export class Params {
        public nodeRadius: number;
        public linkDistance: number;
        public nodeTransDuration: number = 250;
        public radiusExpand: number = 1.5;
        constructor([width, height]: [number, number]) {
            const min = width < height ? width : height;
            this.nodeRadius = kNodeRadiusF * min;
            this.linkDistance = kLinkDistanceF * min;
        }
    }

    const ordinal = d3.scaleOrdinal(d3.schemeCategory20);

    export function Color(n: number) {
        return ordinal(String(n));
    }
}
