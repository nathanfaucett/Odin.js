if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/object_pool",
        "math/mathf",
        "math/aabb2",
        "phys2d/dynamic/particle",
        "phys2d/collision/shape",
        "phys2d/solver/contact"
    ],
    function(ObjectPool, Mathf, AABB2, Particle, Shape, Contact) {
        "use strict";


        var min = Math.min,
            sqrt = Math.sqrt,

            EPSILON = Mathf.EPSILON,

            PARTICLE = Particle.PARTICLE,

            CIRCLE = Shape.CIRCLE,
            CONVEX = Shape.CONVEX,

            contactPool = new ObjectPool(Contact);

        function createContact(px, py, nx, ny, s, bi, bj, e, u, contacts) {
            var c = contactPool.create(),
                p = c.p,
                n = c.n;

            p.x = px;
            p.y = py;

            n.x = nx;
            n.y = ny;

            c.s = s;

            c.bi = bi;
            c.bj = bj;

            c.e = e;
            c.u = u;

            contacts.push(c);
        }

        /**
         * @class Phys2D.Nearphase
         * @brief space near phase
         */
        function Nearphase() {

        }

        /**
         * @method collisions
         * @memberof Phys2D.Nearphase
         * @param Array pairsi
         * @param Array pairsj
         * @param Array contacts
         */
        Nearphase.prototype.collisions = function(pairsi, pairsj, contacts) {
            var si, sj,
                i;

            contacts.length = 0;
            contactPool.clear();

            for (i = pairsi.length; i--;) {
                si = pairsi[i];
                sj = pairsj[i];

                collisionType(si, sj, contacts);
            }
        };


        Nearphase.CONTACT_POOL = contactPool;


        function circleCircleQuery(si, sj, xix, xiy, xjx, xjy, ri, rj, contacts) {
            var r = ri + rj,
                dx = xjx - xix,
                dy = xjy - xiy,
                d = dx * dx + dy * dy,
                invD, nx, ny, s;

            if (d > r * r) return;

            if (d < EPSILON) {
                nx = 0;
                ny = 1;
                s = -r;
            } else {
                d = sqrt(d);
                invD = 1 / d;

                nx = dx * invD;
                ny = dy * invD;
                s = d - r;
            }

            createContact(
                xjx - rj * nx,
                xjy - rj * ny,
                nx,
                ny,
                s,
                si.body,
                sj.body,
                min(si.elasticity, sj.elasticity),
                min(si.friction, sj.friction),
                contacts
            );
        }


        function circleCircle(si, sj, contacts) {
            var xi = si.position,
                xj = sj.position;

            circleCircleQuery(si, sj, xi.x, xi.y, xj.x, xj.y, si.radius, sj.radius, contacts);
        }


        function convexCircle(si, sj, contacts) {
            var vertices = si._vertices,
                normals = si._normals,
                len = vertices.length,
                xj = sj.position,
                xjx = xj.x,
                xjy = xj.y,
                radius = sj.radius,

                vertex, normal, s, d = -Infinity,
                index = 0,
                v1, v2, v1x, v1y, v2x, v2y, ex, ey, dx, dy, u, d, invD,
                c, n, nx, ny, p,
                i;

            for (i = len; i--;) {
                vertex = vertices[i];
                normal = normals[i];
                s = normal.x * (xjx - vertex.x) + normal.y * (xjy - vertex.y);

                if (s > radius) return;

                if (s > d) {
                    d = s;
                    index = i;
                }
            }

            normal = normals[index];
            nx = normal.x;
            ny = normal.y;

            v1 = vertices[index];
            v1x = v1.x;
            v1y = v1.y;

            v2 = vertices[(index + 1) % len];
            v2x = v2.x;
            v2y = v2.y;

            ex = v2x - v1x;
            ey = v2y - v1y;

            dx = xjx - v1x;
            dy = xjy - v1y;

            u = (ex * dx + ey * dy) / (ex * ex + ey * ey);

            if (u < 0) {
                circleCircleQuery(si, sj, v1x, v1y, xjx, xjy, 0, radius, contacts);
                return;
            } else if (u > 1) {
                circleCircleQuery(si, sj, v2x, v2y, xjx, xjy, 0, radius, contacts);
                return;
            }

            createContact(
                xjx - radius * nx,
                xjy - radius * ny,
                nx,
                ny,
                d - radius,
                si.body,
                sj.body,
                min(si.elasticity, sj.elasticity),
                min(si.friction, sj.friction),
                contacts
            );
        }


        function convexConvex(si, sj, contacts) {
            var indexi, mini, indexj, minj;

            indexi = findMSA(si, sj);
            if (indexi < 0) return;
            mini = lastMinMSA;

            indexj = findMSA(sj, si);
            if (indexj < 0) return;
            minj = lastMinMSA;

            if (mini > minj) {
                findContacts(si, sj, si._normals[indexi], mini, contacts);
            } else {
                findContacts(sj, si, sj._normals[indexj], minj, contacts);
            }
        }


        function findContacts(si, sj, n, d, contacts) {
            var verticesi = si._vertices,
                normalsi = si._normals,
                verticesj = sj._vertices,
                normalsj = sj._normals,
                nx = n.x,
                ny = n.y,
                v, vx, vy,
                bi = si.body,
                bj = sj.body,
                e = min(si.elasticity, sj.elasticity),
                u = min(si.friction, sj.friction),
                i;

            for (i = verticesi.length; i--;) {
                v = verticesi[i];
                vx = v.x;
                vy = v.y;

                if (contains(verticesj, normalsj, vx, vy)) createContact(vx, vy, nx, ny, d, bi, bj, e, u, contacts);
            }

            for (i = verticesj.length; i--;) {
                v = verticesj[i];
                vx = v.x;
                vy = v.y;

                if (contains(verticesi, normalsi, vx, vy)) createContact(vx, vy, nx, ny, d, bi, bj, e, u, contacts);
            }
        }


        function contains(vertices, normals, px, py) {
            var n, nx, ny, v, vx, vy,
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


        var lastMinMSA = 0;

        function findMSA(si, sj) {
            var verticesi = si._vertices,
                normalsi = si._normals,
                counti = normalsi.length,
                verticesj = sj._vertices,
                n, v, dist, min = -Infinity,
                index = -1,
                i;

            for (i = counti; i--;) {
                n = normalsi[i];
                v = verticesi[i];

                dist = valueOnAxis(verticesj, n, (n.x * v.x + n.y * v.y));

                if (dist > 0) return -1;

                if (dist > min) {
                    min = dist;
                    index = i;
                }
            }

            lastMinMSA = min;
            return index;
        }


        function valueOnAxis(vertices, n, d) {
            var nx = n.x,
                ny = n.y,
                v, m = Infinity,
                i;

            for (i = vertices.length; i--;) {
                v = vertices[i];
                m = min(m, nx * v.x + ny * v.y);
            }

            return m - d;
        }


        function collisionType(si, sj, contacts) {
            if (si._type === PARTICLE && sj._type === PARTICLE) return;


            if (si._type === PARTICLE && sj._type !== PARTICLE) {

            } else if (sj._type === PARTICLE && si._type !== PARTICLE) {

            } else {
                if (si._type === CIRCLE) {

                    switch (sj._type) {

                        case CIRCLE:
                            circleCircle(si, sj, contacts);
                            break;

                        case CONVEX:
                            convexCircle(sj, si, contacts);
                            break;
                    }
                } else if (si._type === CONVEX) {

                    switch (sj._type) {

                        case CIRCLE:
                            convexCircle(si, sj, contacts);
                            break;

                        case CONVEX:
                            convexConvex(si, sj, contacts);
                            break;
                    }
                }
            }
        }


        return Nearphase;
    }
);
