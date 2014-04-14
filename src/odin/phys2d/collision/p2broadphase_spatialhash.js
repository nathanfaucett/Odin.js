if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/phys2d/p2enums"
    ],
    function(P2Enums) {
        "use strict";


        var floor = Math.floor,
            defineProperty = Object.defineProperty,
            MotionState = P2Enums.MotionState,
            SleepState = P2Enums.SleepState;


        function Cell(counter) {
            Array.call(this);
            this._counter = counter;
        }

        Cell.prototype = Object.create(Array.prototype);
        Cell.prototype.constructor = Cell;


        function P2BroadphaseSpatialHash(opts) {
            opts || (opts = {});

            this._cellSize = 0;
            this._inverseCellSize = 0;

            this.cells = {};
            this.cellDeathFrameCount = opts.cellDeathFrameCount != undefined ? opts.cellDeathFrameCount : 300;
            this.cellSize = opts.cellSize != undefined ? opts.cellSize : 1;
        }


        defineProperty(P2BroadphaseSpatialHash.prototype, "cellSize", {
            get: function() {
                return this._cellSize;
            },
            set: function(value) {
                value = value >= 1 ? value : 1;

                this._cellSize = floor(value);
                this._inverseCellSize = 1 / this._cellSize;
            }
        });


        P2BroadphaseSpatialHash.prototype.collisions = function(bodies, pairsi, pairsj) {
            var cells = this.cells,
                cellSize = this._cellSize,
                cellDeathFrameCount = this.cellDeathFrameCount,
                inverseCellSize = this._inverseCellSize,
                aabb, min, max, minx, miny, body, position, shapes, shape, x, y,
                cell, key, si, sj, bi, bj, i, j, k, l;

            for (key in cells) {
                cell = cells[key];
                if (cell.length === 0) {
                    if (cell._counter-- <= 0) delete cells[key];
                } else {
                    cell._counter = cellDeathFrameCount;
                }
                cell.length = 0;
            }
            pairsi.length = pairsj.length = 0;

            i = bodies.length;
            while (i--) {
                body = bodies[i];
                shapes = body.shapes;

                if (shapes) {
                    j = shapes.length;
                    while (j--) {
                        shape = shapes[j];
                        aabb = shape.aabb;
                        min = aabb.min;
                        max = aabb.max;
                        minx = (min.x * inverseCellSize | 0) * cellSize;
                        miny = (min.y * inverseCellSize | 0) * cellSize;

                        x = minx + ((max.x - min.x) * inverseCellSize | 0) * cellSize;
                        y = miny + ((max.y - min.y) * inverseCellSize | 0) * cellSize;

                        for (k = minx; k <= x; k += cellSize) {
                            for (l = miny; l <= y; l += cellSize) {
                                key = k + ":" + l;
                                (cells[key] || (cells[key] = new Cell(cellDeathFrameCount))).push(shape);
                            }
                        }
                    }
                } else {
                    position = body.position;
                    x = (position.x * inverseCellSize | 0) * cellSize;
                    y = (position.y * inverseCellSize | 0) * cellSize;
                    key = x + ":" + y;

                    (cells[key] || (cells[key] = new Cell(cellDeathFrameCount))).push(body);
                }
            }

            for (key in cells) {
                cell = cells[key];
                i = cell.length;

                while (i--) {
                    j = 0;
                    while (j !== i) {
                        si = cell[i];
                        sj = cell[j];
                        j++;

                        bi = si.body;
                        bj = sj.body;

                        if (bi && bj) {
                            if (!bi.aabb.intersects(bj.aabb)) continue;

                            if ((bi.motionState !== MotionState.Dynamic && bj.motionState !== MotionState.Dynamic) || (bi.sleepState === SleepState.Sleeping && bj.sleepState === SleepState.Sleeping)) {
                                continue;
                            }
                            if ((si.filterGroup & sj.filterMask) === 0 || (sj.filterGroup & si.filterMask) === 0) continue;
                        }

                        pairsi.push(si);
                        pairsj.push(sj);
                    }
                }
            }
        };


        P2BroadphaseSpatialHash.prototype.toJSON = function(json) {
            json || (json = {});

            json.cellSize = this.cellSize;
            json.cellDeathFrameCount = this.cellDeathFrameCount;

            return json;
        };


        P2BroadphaseSpatialHash.prototype.fromJSON = function(json) {

            this.cellSize = json.cellSize;
            this.cellDeathFrameCount = json.cellDeathFrameCount;

            return this;
        };


        return P2BroadphaseSpatialHash;
    }
);
