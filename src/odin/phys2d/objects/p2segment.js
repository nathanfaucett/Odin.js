if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/vec2",
        "odin/phys2d/p2enums",
        "odin/phys2d/objects/p2shape"
    ],
    function(Class, Vec2, P2Enums, P2Shape) {
        "use strict";


        var ShapeType = P2Enums.ShapeType,

            abs = Math.abs,
            sqrt = Math.sqrt,
            PI = Math.PI;


        function P2Segment(opts) {
            opts || (opts = {});

            P2Shape.call(this, opts);

            this.type = ShapeType.Segment;

            this.a = opts.a != undefined ? opts.a : new Vec2(-0.5, 0.0);
            this.b = opts.b != undefined ? opts.b : new Vec2(0.5, 0.0);

            this._a = this.a.clone();
            this._b = this.b.clone();
            this._normal = new Vec2().vsub(this._b, this._a).perp().normalize();

            this.radius = opts.radius != undefined ? abs(opts.radius) : 0.5;
        }

        P2Shape.extend(P2Segment);


        P2Segment.prototype.copy = function(other) {
            P2Shape.prototype.copy.call(this, other);

            this.a.copy(other.a);
            this.b.copy(other.b);

            this.radius = other.radius;

            return this;
        };


        P2Segment.prototype.pointQuery = function(p) {
            if (!this.aabb.contains(p)) return false;
            var r = this.radius,
                a = this._a,
                b = this._b,
                n = this._normal,
                ax = a.x,
                ay = a.y,
                bx = b.x,
                by = b.y,
                nx = n.x,
                ny = n.y,
                px = p.x,
                py = p.y,

                dn = (nx * px + ny * py) - (ax * nx + ay * ny),
                dist = abs(dn),
                dt, dta, dtb, dx, dy;

            if (dist > r) return false;

            dt = px * ny - py * nx;
            dta = ax * ny - ay * nx;
            dtb = bx * ny - by * nx;

            if (dt <= dta) {
                if (dt < dta - r) return false;

                dx = px - ax;
                dy = py - ay;

                return (dx * dx + dy * dy) < (r * r);
            } else if (dt > dtb) {
                if (dt > dtb + r) return false;

                dx = px - bx;
                dy = py - by;

                return (dx * dx + dy * dy) < (r * r);
            }

            return true;
        };


        P2Segment.prototype.centroid = function(v) {
            var localPosition = this.localPosition,
                a = this.a,
                b = this.b;

            v.x = localPosition.x + (a.x + b.x) * 0.5;
            v.y = localPosition.y + (a.y + b.y) * 0.5;

            return v;
        };


        P2Segment.prototype.area = function() {
            var a = this.a,
                b = this.b,
                r = this.radius,
                abx = b.x - a.x,
                aby = b.y - a.y,
                l = abx * abx + aby * aby;

            l = l === 0.0 ? 0.0 : sqrt(l);

            return r * (PI * r + 2 * l);
        };


        var inv12 = 1.0 / 12.0;
        P2Segment.prototype.inertia = function(mass) {
            var localPosition = this.localPosition,
                lx = localPosition.x,
                ly = localPosition.y,
                a = this.a,
                b = this.b,
                ax = lx + a.x,
                ay = ly + a.y,
                bx = lx + b.x,
                by = ly + b.y,
                abx = bx - ax,
                aby = by - ay,
                lsq = abx * abx + aby * aby,
                x = (ax + bx) * 0.5,
                y = (ay + by) * 0.5;

            return mass * (lsq * inv12 + (x * x + y * y));
        };


        var VEC2_SCALE = new Vec2(1.0, 1.0);
        P2Segment.prototype.update = function(matrix) {
            var localMatrix = this.matrix,
                matrixWorld = this.matrixWorld,
                localPos = this.localPosition,
                pos = this.position,
                _a = this._a,
                _b = this._b,
                _normal = this._normal,
                a = this.a,
                b = this.b,
                radius = this.radius,
                aabb = this.aabb,
                min = aabb.min,
                max = aabb.max,
                l, r, b, t;

            localMatrix.compose(localPos, VEC2_SCALE, this.localRotation);
            matrixWorld.mmul(matrix, localMatrix);

            pos.x = localPos.x;
            pos.y = localPos.y;
            pos.transformMat32(matrix);

            _a.x = a.x;
            _a.y = a.y;
            _a.transformMat32(matrix);

            _b.x = b.x;
            _b.y = b.y;
            _b.transformMat32(matrix);

            _normal.x = -(_b.y - _a.y);
            _normal.y = _b.x - _a.x;
            _normal.normalize();

            if (_a.x < _b.x) {
                l = _a.x;
                r = _b.x;
            } else {
                l = _b.x;
                r = _a.x;
            }

            if (_a.y < _b.y) {
                b = _a.y;
                t = _b.y;
            } else {
                b = _b.y;
                t = _a.y;
            }

            min.x = l - radius;
            min.y = b - radius;
            max.x = r + radius;
            max.y = t + radius;
        };


        P2Segment.prototype.toJSON = function(json) {
            json = P2Shape.prototype.toJSON.call(this, json);

            json.a = this.a.toJSON(json.a);
            json.b = this.b.toJSON(json.b);

            json.radius = this.radius;

            return json;
        };


        P2Segment.prototype.fromJSON = function(json) {
            P2Shape.prototype.fromJSON.call(this, json);

            this.a.fromJSON(json.a);
            this.b.fromJSON(json.b);

            this.radius = json.radius;

            return this;
        };


        return P2Segment;
    }
);
