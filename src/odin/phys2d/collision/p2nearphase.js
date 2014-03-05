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
        }

        function createContact(bi, bj, e, u, nx, ny, px, py, s, contacts) {
            var c = CONTACT_POOL.create(),
                n = c.n,
                p = c.p;

            c.bi = bi;
            c.bj = bj;

            c.e = e;
            c.u = u;

            n.x = nx;
            n.y = ny;

            p.x = px;
            p.y = py;

            c.s = s;

            contacts.push(c);
        }

        function circle2Circle(si, sj, bi, bj, xix, xiy, ri, xjx, xjy, rj, e, u, contacts) {
            var dx = xjx - xix,
                dy = xjy - xiy,
                dist = dx * dx + dy * dy,
                invDist, separation = 0,
                r = ri + rj,
                nx, ny;

            if (dist > r * r) return;
            if (!collide(si, sj)) return;

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

            createContact(
                bi,
                bj,
                e,
                u,
                nx,
                ny,
                xjx - rj * nx,
                xjy - rj * ny,
                separation,
                contacts
            );
        }

        function circle2CircleParticle(si, sj, bi, bj, xix, xiy, ri, xjx, xjy, rj, e, u, contacts) {
            var dx = xjx - xix,
                dy = xjy - xiy,
                dist = dx * dx + dy * dy,
                invDist, separation = 0,
                r = ri + rj,
                nx, ny;

            if (dist > r * r) return;
            if (!collideParticle(si, sj)) return;

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

            createContact(
                bi,
                bj,
                e,
                u,
                nx,
                ny,
                xjx - rj * nx,
                xjy - rj * ny,
                separation,
                contacts
            );
        }

        function P2Nearphase() {

            Class.call(this);
        }

        Class.extend(P2Nearphase);


        P2Nearphase.CONTACT_POOL = CONTACT_POOL;


        P2Nearphase.prototype.collisions = function(pairsi, pairsj, contacts) {
            var si, sj,
                i = pairsi.length;

            contacts.length = 0;
            CONTACT_POOL.clearForEach(clearContact);

            while (i--) {
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

            if (!space) return false;
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


        function collideParticle(si, bj) {
            var bi = si.body,
                i = bi._index,
                j = bj._index,
                space = bi.space;

            if (!space) return false;
            space.collisionMatrixSet(i, j, 1, true);

            if (space.collisionMatrixGet(i, j, true) !== space.collisionMatrixGet(i, j, false)) {
                bi.wake();
                bj.wake();

                bi.emit("collide", bj, si);
                bj.emit("collide", bi, si);
            } else {
                bi.emit("colliding", bj, si);
                bj.emit("colliding", bi, si);
            }

            if (si.isTrigger) return false;

            return true;
        }


        function circleCircle(si, sj, contacts) {
            var xi = si.position,
                xj = sj.position;

            circle2Circle(
                si, sj, si.body, sj.body,
                xi.x, xi.y, si.radius, xj.x, xj.y, sj.radius,
                1 + min(si.elasticity, sj.elasticity), min(si.friction, sj.friction),
                contacts
            );
        }


        function circleParticle(si, sj, contacts) {
            var xi = si.position,
                xj = sj.position;

            circle2CircleParticle(
                si, sj, si.body, sj,
                xi.x, xi.y, si.radius, xj.x, xj.y, sj.radius,
                1 + min(si.elasticity, sj.elasticity), min(si.friction, sj.friction),
                contacts
            );
        }


        function segmentParticle(si, sj, contacts) {
            if (!collideParticle(si, sj)) return;

        }


        function segmentSegment(si, sj, contacts) {
            if (!collide(si, sj)) return;

        }


        function segmentCircle(si, sj, contacts) {
            if (!collide(si, sj)) return;

        }


        function convexSegment(si, sj, contacts) {
            if (!collide(si, sj)) return;

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
                i = vertices.length;

            while (i--) {
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
                invDist = dist > 0.0 ? 1.0 / dist : 0.0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (u > 1) {
                dx = xjx - v2x;
                dy = xjy - v2y;

                dist = dx * dx + dy * dy;
                if (dist > EPSILON) return;

                dist = sqrt(dist);
                invDist = dist > 0.0 ? 1.0 / dist : 0.0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else {
                normal = normals[index];
                nx = normal.x;
                ny = normal.y;

                dist = separation;
            }
            if (!collideParticle(si, sj)) return;

            createContact(
                si.body,
                sj,
                1 + si.elasticity,
                si.friction,
                nx,
                ny,
                xjx,
                xjy,
                dist,
                contacts
            );
        }


        function convexCircle(si, sj, contacts) {
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
                i = vertices.length;

            while (i--) {
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
                invDist = dist > 0.0 ? 1.0 / dist : 0.0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (u > 1) {
                dx = xjx - v2x;
                dy = xjy - v2y;

                dist = dx * dx + dy * dy;
                if (dist > radius * radius) return;

                dist = sqrt(dist);
                invDist = dist > 0.0 ? 1.0 / dist : 0.0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else {
                normal = normals[index];
                nx = normal.x;
                ny = normal.y;

                dist = separation;
            }
            if (!collide(si, sj)) return;

            createContact(
                si.body,
                sj.body,
                1 + min(si.elasticity, sj.elasticity),
                min(si.friction, sj.friction),
                nx,
                ny,
                xjx - radius * nx,
                xjy - radius * ny,
                dist - radius,
                contacts
            );
        }


        function contains(vertices, normals, px, py) {
            var n, nx, ny, v, vx, vy,
                i = vertices.length;

            while (i--) {
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
            if (!collide(si, sj)) return;
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

            i = verticesi.length;
            while (i--) {
                v = verticesi[i];
                vx = v.x;
                vy = v.y;

                if (contains(verticesj, normalsj, vx, vy)) {
                    createContact(
                        si.body,
                        sj.body,
                        e,
                        u,
                        nx,
                        ny,
                        vx,
                        vy,
                        dist,
                        contacts
                    );
                }
            }

            i = verticesj.length;
            while (i--) {
                v = verticesj[i];
                vx = v.x;
                vy = v.y;

                if (contains(verticesi, normalsi, vx, vy)) {
                    createContact(
                        si.body,
                        sj.body,
                        e,
                        u,
                        nx,
                        ny,
                        vx,
                        vy,
                        dist,
                        contacts
                    );
                }
            }
        }


        function valueOnAxis(vertices, n, d) {
            var nx = n.x,
                ny = n.y,
                v, m = Infinity,
                i = vertices.length;

            while (i--) {
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
                i = counti;

            while (i--) {
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
            var siType = si.type,
                sjType = sj.type;

            if (siType === BodyType.Particle && sjType === BodyType.Particle) return;

            if (siType === BodyType.Particle && sjType !== BodyType.Particle) {

                if (sjType === ShapeType.Circle) {
                    circleParticle(sj, si, contacts);
                } else if (sjType === ShapeType.Segment) {
                    segmentParticle(sj, si, contacts);
                } else if (sjType === ShapeType.Convex) {
                    convexParticle(sj, si, contacts);
                }
            } else if (sjType === BodyType.Particle && siType !== BodyType.Particle) {

                if (siType === ShapeType.Circle) {
                    circleParticle(si, sj, contacts);
                } else if (siType === ShapeType.Segment) {
                    segmentParticle(si, sj, contacts);
                } else if (siType === ShapeType.Convex) {
                    convexParticle(si, sj, contacts);
                }
            } else {
                if (siType === ShapeType.Circle) {

                    if (sjType === ShapeType.Circle) {
                        circleCircle(si, sj, contacts);
                    } else if (sjType === ShapeType.Segment) {
                        segmentCircle(sj, si, contacts);
                    } else if (sjType === ShapeType.Convex) {
                        convexCircle(sj, si, contacts);
                    }
                } else if (siType === ShapeType.Convex) {

                    if (sjType === ShapeType.Circle) {
                        convexCircle(si, sj, contacts);
                    } else if (sjType === ShapeType.Segment) {
                        convexSegment(si, sj, contacts);
                    } else if (sjType === ShapeType.Convex) {
                        convexConvex(si, sj, contacts);
                    }
                } else if (siType === ShapeType.Segment) {

                    if (sjType === ShapeType.Circle) {
                        segmentCircle(si, sj, contacts);
                    } else if (sjType === ShapeType.Segment) {
                        segmentSegment(si, sj, contacts);
                    } else if (sjType === ShapeType.Convex) {
                        convexSegment(si, sj, contacts);
                    }
                }
            }
        }


        return P2Nearphase;
    }
);
