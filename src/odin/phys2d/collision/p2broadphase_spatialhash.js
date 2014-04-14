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


        function P2BroadphaseSpatialHash(opts) {
            opts || (opts = {});

            this._cellSize = 0;
            this._inverseCellSize = 0;

            this.cells = {};
            this.cellSize = opts.cellSize || 5;
        }


        defineProperty(P2BroadphaseSpatialHash.prototype, "cellSize", {
            get: function() {
                return this.cellSize;
            },
            set: function(value) {
                value = value >= 1 ? value : 1;

                this._cellSize = floor(value);
                this._inverseCellSize = 1 / this._cellSize;
            }
        });


        P2BroadphaseSpatialHash.prototype.clear = function() {
            var cells = this.cells,
                key;

            for (key in cells) cells[key].length = 0;
        };


        P2BroadphaseSpatialHash.prototype.add = function(body) {
            var shapes = body.shapes,
                i, key;

            if (shapes) {
                i = shapes.length;
                while (i--) this._addShape(shapes[i]);
            } else {
                this._addParticle(body);
            }
        };


        P2BroadphaseSpatialHash.prototype._addParticle = function(particle) {
            var position = particle.position,
                cellSize = this._cellSize,
                inverseCellSize = this._inverseCellSize,
                x = (position.x * inverseCellSize | 0) * cellSize,
                y = (position.y * inverseCellSize | 0) * cellSize,
                key = x + ":" + y;

            (cells[key] || (cells[key] = [])).push(particle);
        };


        P2BroadphaseSpatialHash.prototype._addShape = function(shape) {
            var cellSize = this._cellSize,
                inverseCellSize = this._inverseCellSize,
                cells = this.cells,
                aabb = shape.aabb,
                min = aabb.min,
                max = aabb.max,
                x = ((max.x - min.x) * inverseCellSize | 0) * cellSize,
                y = ((max.y - min.y) * inverseCellSize | 0) * cellSize,
                i, j, key;

            for (i = 0; i <= x; i += cellSize) {
                for (j = 0; j <= y; j += cellSize) {
                    key = i + ":" + j;
                    (cells[key] || (cells[key] = [])).push(shape);
                }
            }
        };


        P2BroadphaseSpatialHash.prototype.collisions = function(bodies, pairsi, pairsj) {
            var cells = this.cells,
                length = bodies.length,
                i = length,
                cell, key, bi, bj, j, k, l;

            this.clear();
            pairsi.length = pairsj.length = 0;

            while (i--) this.add(bodies[i]);

            for (key in cells) {
                cell = cells[key];
                i = cell.length;

                while (i--) {
                    j = 0;
                    while (j !== i) {
                        bi = cell[i];
                        bj = cell[j];
                        j++;

                        if (!(!(bi.motionState !== MotionState.Dynamic && bj.motionState !== MotionState.Dynamic) || !(bi.sleepState === SleepState.Sleeping && bj.sleepState === SleepState.Sleeping))) {
                            continue;
                        }
                        if ((bi.filterGroup & bj.filterMask) === 0 || (bj.filterGroup & bi.filterMask) === 0) {
                            continue;
                        }

                        pairsi.push(bi);
                        pairsj.push(bj);
                    }
                }
            }
        };


        return P2BroadphaseSpatialHash;
    }
);
