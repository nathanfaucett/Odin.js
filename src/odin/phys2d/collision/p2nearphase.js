if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/base/object_pool",
        "odin/math/mathf",
        "odin/math/vec2",
        "odin/phys2d/p2enums",
        "odin/phys2d/constraints/p2contact"
    ],
    function(Class, ObjectPool, Mathf, Vec2, P2Enums, P2Contact) {
        "use strict";


        var min = Math.min,
            sqrt = Math.sqrt,

            EPSILON = Mathf.EPSILON,

            BodyType = P2Enums.BodyType,
            ShapeType = P2Enums.ShapeType,

            CONTACT_POOL = new ObjectPool(P2Contact);


        function clearContact(contact) {

            contact.bi = contact.bj = undefined;
        };


        function P2Nearphase() {

            Class.call(this);
        }

        Class.extend(P2Nearphase);


        P2Nearphase.CONTACT_POOL = CONTACT_POOL;


        P2Nearphase.prototype.collisions = function(pairsi, pairsj, contacts) {
            var si, sj,
                i;

            contacts.length = 0;
            CONTACT_POOL.clearForEach(clearContact);

            for (i = pairsi.length; i--;) {
                si = pairsi[i];
                sj = pairsj[i];

                collisionType(si, sj, contacts);
            }
        };


        function collide(si, sj) {
            var bi = si.body,
                bj = sj.body,
                i = bi._index,
                j = bj._index,
                space = bi.space;

            space.collisionMatrixSet(i, j, 1, true);

            if (space.collisionMatrixGet(i, j, true) !== space.collisionMatrixGet(i, j, false)) {
                bi.wake();
                bj.wake();

                bi.emit("collide", bj, si, sj);
                bj.emit("collide", bi, sj, si);
            } else {
                bi.emit("colliding", bj, si, sj);
                bj.emit("colliding", bi, sj, si);
            }

            if (si.isTrigger || sj.isTrigger) return false;

            return true;
        }


        function circleCircle(si, sj, contacts) {
            if (!collide(si, sj)) return;
            var xi = si.position,
                xj = sj.position,
                xjx = xj.x,
                xjy = xj.y,
                dx = xjx - xi.x,
                dy = xjy - xi.y,
                dist = dx * dx + dy * dy,
                invDist, separation = 0,

                ri = si.radius,
                rj = sj.radius,
                r = ri + rj,

                c, n, nx, ny, p;

            if (dist > r * r) return;

            c = CONTACT_POOL.create();
            n = c.n;
            p = c.p;

            c.bi = si.body;
            c.bj = sj.body;

            c.e = 1 + min(si.elasticity, sj.elasticity);
            c.u = min(si.friction, sj.friction);

            if (dist < EPSILON) {
                nx = 0;
                ny = 1;
                invDist = 0;
                separation = -r;
            } else {
                dist = sqrt(dist);
                invDist = 1 / dist;

                nx = dx * invDist;
                ny = dy * invDist;

                separation = dist - r;
            }

            n.x = nx;
            n.y = ny;

            p.x = xjx - rj * nx;
            p.y = xjy - rj * ny;

            c.s = separation;

            contacts.push(c);
        }


        function circleParticle(si, sj, contacts) {
            var xi = si.position,
                xj = sj.position,
                xjx = xj.x,
                xjy = xj.y,
                dx = xjx - xi.x,
                dy = xjy - xi.y,
                dist = dx * dx + dy * dy,
                invDist, separation = 0,

                r = si.radius,

                c, n, nx, ny, p;

            if (dist > r * r) return;

            c = CONTACT_POOL.create();
            n = c.n;
            p = c.p;

            c.bi = si.body;
            c.bj = sj.body;

            c.e = 1 + si.elasticity;
            c.u = si.friction;

            if (dist < EPSILON) {
                nx = 0;
                ny = 1;
                invDist = 0;
                separation = -r;
            } else {
                dist = sqrt(dist);
                invDist = 1 / dist;

                nx = dx * invDist;
                ny = dy * invDist;

                separation = dist - r;
            }

            n.x = nx;
            n.y = ny;

            p.x = xjx;
            p.y = xjy;

            c.s = separation;

            contacts.push(c);
        }


        function convexParticle(si, sj, contacts) {
            var vertices = si._vertices,
                normals = si._normals,
                xj = sj.position,
                xjx = xj.x,
                xjy = xj.y,

                vertex, normal, s, separation = -Infinity,
                index = -1,
                v1, v2, v1x, v1y, v2x, v2y, ex, ey, dx, dy, u, dist, invDist,

                c, n, nx, ny, p,
                i;

            for (i = vertices.length; i--;) {
                vertex = vertices[i];
                normal = normals[i];
                s = normal.x * (xjx - vertex.x) + normal.y * (xjy - vertex.y);

                if (s > EPSILON) return;

                if (s > separation) {
                    separation = s;
                    index = i;
                }
            }

            if (index < 0) return;

            normal = normals[index];
            nx = normal.x;
            ny = normal.y;

            v1 = vertices[index];
            v1x = v1.x;
            v1y = v1.y;
            v2 = vertices[index + 1] || vertices[0];
            v2x = v2.x;
            v2y = v2.y;

            ex = v2x - v1x;
            ey = v2y - v1y;

            dx = xjx - v1x;
            dy = xjy - v1y;

            u = (ex * dx + ey * dy) / (ex * ex + ey * ey);

            if (u < 0) {
                dx = xjx - v1x;
                dy = xjy - v1y;

                dist = dx * dx + dy * dy;
                if (dist > EPSILON) return;

                dist = sqrt(dist);
                invDist = dist > 0 ? 1 / dist : 0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (u > 1) {
                dx = xjx - v2x;
                dy = xjy - v2y;

                dist = dx * dx + dy * dy;
                if (dist > EPSILON) return;

                dist = sqrt(dist);
                invDist = dist > 0 ? 1 / dist : 0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else {
                normal = normals[index];
                nx = normal.x;
                ny = normal.y;

                dist = separation;
            }

            c = CONTACT_POOL.create();
            n = c.n;
            p = c.p;

            c.bi = si.body;
            c.bj = sj.body;

            c.e = 1 + si.elasticity;
            c.u = si.friction;

            n.x = nx;
            n.y = ny;

            p.x = xjx;
            p.y = xjy;

            c.s = dist;

            contacts.push(c);
        }


        function convexCircle(si, sj, contacts) {
            if (!collide(si, sj)) return;
            var vertices = si._vertices,
                normals = si._normals,
                xj = sj.position,
                xjx = xj.x,
                xjy = xj.y,
                radius = sj.radius,

                vertex, normal, s, separation = -Infinity,
                index = -1,
                v1, v2, v1x, v1y, v2x, v2y, ex, ey, dx, dy, u, dist, invDist,

                c, n, nx, ny, p,
                i;

            for (i = vertices.length; i--;) {
                vertex = vertices[i];
                normal = normals[i];
                s = normal.x * (xjx - vertex.x) + normal.y * (xjy - vertex.y);

                if (s > radius) return;

                if (s > separation) {
                    separation = s;
                    index = i;
                }
            }

            if (index < 0) return;

            normal = normals[index];
            nx = normal.x;
            ny = normal.y;

            v1 = vertices[index];
            v1x = v1.x;
            v1y = v1.y;
            v2 = vertices[index + 1] || vertices[0];
            v2x = v2.x;
            v2y = v2.y;

            ex = v2x - v1x;
            ey = v2y - v1y;

            dx = xjx - v1x;
            dy = xjy - v1y;

            u = (ex * dx + ey * dy) / (ex * ex + ey * ey);

            if (u < 0) {
                dx = xjx - v1x;
                dy = xjy - v1y;

                dist = dx * dx + dy * dy;
                if (dist > radius * radius) return;

                dist = sqrt(dist);
                invDist = dist > 0 ? 1 / dist : 0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (u > 1) {
                dx = xjx - v2x;
                dy = xjy - v2y;

                dist = dx * dx + dy * dy;
                if (dist > radius * radius) return;

                dist = sqrt(dist);
                invDist = dist > 0 ? 1 / dist : 0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else {
                normal = normals[index];
                nx = normal.x;
                ny = normal.y;

                dist = separation;
            }

            c = CONTACT_POOL.create();
            n = c.n;
            p = c.p;

            c.bi = si.body;
            c.bj = sj.body;

            c.e = 1 + min(si.elasticity, sj.elasticity);
            c.u = min(si.friction, sj.friction);

            n.x = nx;
            n.y = ny;

            p.x = xjx - radius * nx;
            p.y = xjy - radius * ny;

            c.s = dist - radius;

            contacts.push(c);
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


        function findContacts(si, sj, normal, dist, contacts) {
            var verticesi = si._vertices,
                normalsi = si._normals,
                verticesj = sj._vertices,
                normalsj = sj._normals,
                v, vx, vy,
                c, n, nx = normal.x,
                ny = normal.y,
                p,

                e = 1 + min(si.elasticity, sj.elasticity),
                u = min(si.friction, sj.friction),

                i;

            for (i = verticesi.length; i--;) {
                v = verticesi[i];
                vx = v.x;
                vy = v.y;

                if (contains(verticesj, normalsj, vx, vy)) {
                    c = CONTACT_POOL.create();
                    n = c.n;
                    p = c.p;

                    c.bi = si.body;
                    c.bj = sj.body;

                    c.e = e;
                    c.u = u;

                    n.x = nx;
                    n.y = ny;

                    p.x = vx;
                    p.y = vy;

                    c.s = dist;

                    contacts.push(c);
                }
            }

            for (i = verticesj.length; i--;) {
                v = verticesj[i];
                vx = v.x;
                vy = v.y;

                if (contains(verticesi, normalsi, vx, vy)) {
                    c = CONTACT_POOL.create();
                    n = c.n;
                    p = c.p;

                    c.bi = si.body;
                    c.bj = sj.body;

                    c.e = e;
                    c.u = u;

                    n.x = nx;
                    n.y = ny;

                    p.x = vx;
                    p.y = vy;

                    c.s = dist;

                    contacts.push(c);
                }
            }
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


        function convexConvex(si, sj, contacts) {
            if (!collide(si, sj)) return;
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


        function collisionType(si, sj, contacts) {
            if (si.type === BodyType.Particle && sj.type === BodyType.Particle) return;

            if (si.type === BodyType.Particle && sj.type !== BodyType.Particle) {

                switch (sj.type) {
                    case ShapeType.Circle:
                        circleParticle(sj, si, contacts);
                        break;

                    case ShapeType.Convex:
                        convexParticle(sj, si, contacts);
                        break;
                }
            } else if (sj.type === BodyType.Particle && si.type !== BodyType.Particle) {

                switch (si.type) {
                    case ShapeType.Circle:
                        circleParticle(si, sj, contacts);
                        break;

                    case ShapeType.Convex:
                        convexParticle(si, sj, contacts);
                        break;
                }
            } else {
                if (si.type === ShapeType.Circle) {

                    switch (sj.type) {
                        case ShapeType.Circle:
                            circleCircle(si, sj, contacts);
                            break;

                        case ShapeType.Convex:
                            convexCircle(sj, si, contacts);
                            break;
                    }
                } else if (si.type === ShapeType.Convex) {

                    switch (sj.type) {
                        case ShapeType.Circle:
                            convexCircle(si, sj, contacts);
                            break;

                        case ShapeType.Convex:
                            convexConvex(si, sj, contacts);
                            break;
                    }
                }
            }
        }


        return P2Nearphase;
    }
);
