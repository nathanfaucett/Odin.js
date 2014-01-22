if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/vec2",
        "odin/core/game/log",
        "odin/phys2d/p2enums",
        "odin/phys2d/objects/p2shape"
    ],
    function(Vec2, Log, P2Enums, P2Shape) {
        "use strict";


        var ShapeType = P2Enums.ShapeType;


        function P2Convex(opts) {
            opts || (opts = {});

            P2Shape.call(this, opts);

            this.type = ShapeType.Convex;

            this.vertices = opts.vertices != undefined ? opts.vertices : [
                new Vec2(0.5, 0.5),
                new Vec2(-0.5, 0.5),
                new Vec2(-0.5, -0.5),
                new Vec2(0.5, -0.5)
            ];

            if (!P2Convex.validateVertices(this.vertices)) {
                log.warn("P2Convex.constructor: passed vertices are invalid, creating convex hull from vertices with gift wrapping algorithm");
                this.vertices = P2Convex.createConvexHull(this.vertices);
            }

            this.normals = [];

            this._vertices = [];
            this._normals = [];

            var vertices = this.vertices,
                wverts = this._vertices,
                normals = this.normals,
                wnorms = this._normals,
                v1, v2,
                i;


            for (i = vertices.length; i--;) {
                v1 = vertices[i];
                v2 = vertices[i + 1] || vertices[0];

                normals[i] = new Vec2(v2.y - v1.y, -(v2.x - v1.x)).normalize();

                wverts[i] = new Vec2(v1);
                wnorms[i] = new Vec2(normals[i]);
            }
        }

        P2Shape.extend(P2Convex);


        P2Convex.prototype.copy = function(other) {
            P2Shape.prototype.copy.call(this, other);
            var vertices = other.vertices,
                normals = other.normals,
                i;

            this.vertices.length = this.normals.length = this._vertices.length = this._normals.length = 0;

            for (i = vertices.length; i--;) this.vertices[i] = vertices[i].clone();
            for (i = normals.length; i--;) this.normals[i] = normals[i].clone();

            return this;
        };


        P2Convex.prototype.pointQuery = function(p) {
            if (!this.aabb.contains(p)) return false;
            var vertices = this._vertices,
                normals = this._normals,
                px = p.x,
                py = p.y,
                n, nx, ny, v, vx, vy,
                i;

            for (i = vertices.length; i--;) {
                n = normals[i];
                nx = n.x;
                ny = n.y;
                v = vertices[i];
                vx = v.x;
                vy = v.y;

                if ((nx * px + ny * py) - (nx * vx + ny * vy) > 0) return false;
            }

            return true;
        }


        P2Convex.prototype.centroid = function() {
            var v1 = new Vec2,
                v2 = new Vec2,
                vsum = new Vec2;

            return function(v) {
                var localPosition = this.localPosition,
                    vertices = this.vertices,
                    len = vertices.length,
                    v1x, v1y, v2x, v2y, area = 0,
                    cross,
                    i;

                vsum.x = vsum.y = 0;

                for (i = len; i--;) {
                    v1.vadd(localPosition, vertices[i]);
                    v2.vadd(localPosition, vertices[(i + 1) % len]);

                    v1x = v1.x;
                    v1y = v1.y;
                    v2x = v2.x;
                    v2y = v2.y;

                    cross = v1x * v2y - v1y * v2x;
                    area += cross;

                    vsum.x += (v1x + v2x) * cross;
                    vsum.y += (v1y + v2y) * cross;
                }

                return v.copy(vsum).smul(1 / (3 * area));
            };
        }();


        P2Convex.prototype.area = function() {
            var vertices = this.vertices,
                len = vertices.length,
                v1, v2, area = 0,
                i;

            for (i = len; i--;) {
                v1 = vertices[i];
                v2 = vertices[(i + 1) % len];

                area += v1.x * v2.y - v1.y * v2.x;
            }

            return area * 0.5;
        };


        P2Convex.prototype.inertia = function() {
            var v1 = new Vec2,
                v2 = new Vec2;

            return function(mass) {
                var localPosition = this.localPosition,
                    vertices = this.vertices,
                    len = vertices.length,
                    v1x, v1y, v2x, v2y, a = 0,
                    b = 0,
                    sum1 = 0,
                    sum2 = 0,
                    i;

                for (i = len; i--;) {
                    v1.vadd(localPosition, vertices[i]);
                    v2.vadd(localPosition, vertices[(i + 1) % len]);

                    v1x = v1.x;
                    v1y = v1.y;
                    v2x = v2.x;
                    v2y = v2.y;

                    a = v2x * v1y - v2y * v1x;
                    b = (v1x * v1x + v1y * v1y) + (v1x * v2x + v1y * v2y) + (v2x * v2x + v2y * v2y);

                    sum1 += a * b;
                    sum2 += a;
                }

                return (mass * sum1) / (6 * sum2);
            };
        }();


        P2Convex.prototype.update = function(matrix) {
            var localMatrix = this.matrix,
                matrixWorld = this.matrixWorld,
                localPos = this.localPosition,

                vertices = this.vertices,
                normals = this.normals,
                pos = this.position,

                aabb = this.aabb,
                min = aabb.min,
                max = aabb.max,
                minx = Infinity,
                miny = Infinity,
                maxx = -Infinity,
                maxy = -Infinity,

                wnorms = this._normals,
                wnorm, wverts = this._vertices,
                wvert, x, y,
                i;

            localMatrix.setRotation(this.localRotation);
            localMatrix.setPosition(localPos);
            matrixWorld.mmul(matrix, localMatrix);

            pos.x = localPos.x;
            pos.y = localPos.y;
            pos.transformMat32(matrix);

            for (i = vertices.length; i--;) {
                wvert = wverts[i] || (wverts[i] = new Vec2);
                wnorm = wnorms[i] || (wnorms[i] = new Vec2);

                wnorm.copy(normals[i]).transformMat2(matrixWorld);
                wvert.copy(vertices[i]).transformMat32(matrixWorld);
                x = wvert.x;
                y = wvert.y;

                minx = x < minx ? x : minx;
                miny = y < miny ? y : miny;

                maxx = x > maxx ? x : maxx;
                maxy = y > maxy ? y : maxy;
            }

            min.x = minx;
            min.y = miny;
            max.x = maxx;
            max.y = maxy;
        };


        P2Convex.prototype.toJSON = function(json) {
            json = P2Shape.prototype.toJSON.call(this, json);
            var vertices = this.vertices,
                normals = this.normals,
                jsonVertices = json.vertices || (json.vertices = []),
                jsonNormals = json.normals || (json.normals = []),
                i;

            for (i = vertices.length; i--;) jsonVertices[i] = vertices[i].toJSON(jsonVertices[i]);
            for (i = normals.length; i--;) jsonNormals[i] = normals[i].toJSON(jsonNormals[i]);

            return json;
        };


        P2Convex.prototype.fromJSON = function(json) {
            P2Shape.prototype.fromJSON.call(this, json);
            var vertices = this.vertices,
                normals = this.normals,
                jsonVertices = json.vertices,
                jsonNormals = json.normals,
                i;

            vertices.length = normals.length = this._vertices.length = this._normals.length = 0;

            for (i = jsonVertices.length; i--;) vertices[i] = new Vec2().fromJSON(jsonVertices[i]);
            for (i = jsonNormals.length; i--;) normals[i] = new Vec2().fromJSON(jsonNormals[i]);

            return this;
        };


        P2Convex.validateVertices = P2Convex.prototype.validateVertices = function(vertices) {
            var len = vertices.length,
                a, b, bx, by, c, abx, aby, bcx, bcy,
                i;

            for (i = 0; i < len; i++) {
                a = vertices[i];
                b = vertices[(i + 1) % len];
                bx = b.x;
                by = b.y;
                c = vertices[(i + 2) % len];

                abx = bx - a.x;
                aby = by - a.y;
                bcx = c.x - bx;
                bcy = c.y - by;

                if ((bcx * aby - bcy * abx) > 0) return false;
            }

            return true;
        };


        P2Convex.createConvexHull = P2Convex.prototype.createConvexHull = function() {
            var hull = [],
                r = new Vec2;

            return function(points) {
                var rmi = 0,
                    rmx = -Infinity,
                    n = points.length,
                    v, vx, vy,
                    ih, ie, m = 0,
                    c, newPoints = [],
                    failed = false,
                    i;

                for (i = n; i--;) {
                    v = points[i];
                    vx = v.x;
                    vy = v.y;

                    if (vx > rmx || (vx == rmx && vy < points[rmi].y)) {
                        rmi = i;
                        rmx = vx;
                    }
                }

                hull.length = 0;
                ih = rmi;

                while (true) {
                    hull[m] = ih;

                    ie = 0;
                    for (i = 1; i < n; i++) {
                        if (ie === ih) {
                            ie = i;
                            continue;
                        }

                        r.vsub(points[ie], points[hull[m]]);
                        v.vsub(points[i], points[hull[m]]);
                        c = v.cross(r);

                        if (c < 0) ie = i;

                        if (c === 0 && v.lenSq() > r.lenSq()) {
                            ie = i;
                        }
                    }

                    m++;
                    ih = ie;

                    if (m > n) {
                        failed = true;
                        break;
                    }
                    if (ie === rmi) break;
                }

                if (failed) {
                    Log.warn("P2Convex.constructor: gift wrapping algorithm failed");
                    return [
                        new Vec2(0.5, 0.5),
                        new Vec2(-0.5, 0.5),
                        new Vec2(-0.5, -0.5),
                        new Vec2(0.5, -0.5)
                    ];
                }

                for (i = m; i--;) {
                    newPoints.push(points[hull[i]]);
                }

                if (!P2Convex.validateVertices(newPoints)) {
                    Log.warn("P2Convex.constructor: gift wrapping algorithm failed");
                    return [
                        new Vec2(0.5, 0.5),
                        new Vec2(-0.5, 0.5),
                        new Vec2(-0.5, -0.5),
                        new Vec2(0.5, -0.5)
                    ];
                }

                return newPoints;
            };
        }();


        return P2Convex;
    }
);
