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
            abs = Math.abs,
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

        function circle2Circle(si, sj, xix, xiy, ri, xjx, xjy, rj, contacts) {
            var dx = xjx - xix,
                dy = xjy - xiy,
                dist = dx * dx + dy * dy,
                invDist, separation = 0.0,
                r = ri + rj,
                nx, ny;

            if (dist > r * r) return;
            if (!collide(si, sj)) return;

            if (dist < EPSILON) {
                nx = 0.0;
                ny = 1.0;
                invDist = 0.0;
                separation = -r;
            } else {
                dist = sqrt(dist);
                invDist = 1.0 / dist;

                nx = dx * invDist;
                ny = dy * invDist;

                separation = dist - r;
            }

            createContact(
                si.body,
                sj.body,
                1.0 + min(si.elasticity, sj.elasticity),
                min(si.friction, sj.friction),
                nx,
                ny,
                xjx - rj * nx,
                xjy - rj * ny,
                separation,
                contacts
            );
        }

        function circle2CircleParticle(si, sj, xix, xiy, ri, xjx, xjy, rj, contacts) {
            var dx = xjx - xix,
                dy = xjy - xiy,
                dist = dx * dx + dy * dy,
                invDist, separation = 0.0,
                r = ri + rj,
                nx, ny;

            if (dist > r * r) return;
            if (!collideParticle(si, sj)) return;

            if (dist < EPSILON) {
                nx = 0.0;
                ny = 1.0;
                invDist = 0.0;
                separation = -r;
            } else {
                dist = sqrt(dist);
                invDist = 1 / dist;

                nx = dx * invDist;
                ny = dy * invDist;

                separation = dist - r;
            }

            createContact(
                si.body,
                sj,
                1.0 + si.elasticity,
                si.friction,
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

                bi.emit("collideParticle", bj, si);
                bj.emit("collideParticle", bi, si);
            } else {
                bi.emit("collidingParticle", bj, si);
                bj.emit("collidingParticle", bi, si);
            }

            if (si.isTrigger) return false;

            return true;
        }


        function circleCircle(si, sj, contacts) {
            var xi = si.position,
                xj = sj.position;

            circle2Circle(
                si,
                sj,
                xi.x, xi.y, si.radius,
                xj.x, xj.y, sj.radius,
                contacts
            );
        }


        function circleParticle(si, sj, contacts) {
            var xi = si.position,
                xj = sj.position;

            circle2CircleParticle(
                si,
                sj,
                xi.x, xi.y, si.radius,
                xj.x, xj.y, 0.0,
                contacts
            );
        }


        function segmentParticle(si, sj, contacts) {
            var r = si.radius,
                a = si._a,
                b = si._b,
                n = si._normal,
                ax = a.x,
                ay = a.y,
                bx = b.x,
                by = b.y,
                nx = n.x,
                ny = n.y,

                xj = sj.position,
                xjx = xj.x,
                xjy = xj.y,

                dn = (nx * xjx + ny * xjy) - (ax * nx + ay * ny),
                dist = abs(dn),
                dt, dta, dtb, dx, dy, invDist;

            if (dist > r) return;

            dt = xjx * ny - xjy * nx;
            dta = ax * ny - ay * nx;
            dtb = bx * ny - by * nx;

            if (dt <= dta) {
                if (dt < dta - r) return;

                dx = xjx - ax;
                dy = xjy - ay;

                dist = dx * dx + dy * dy;
                if (dist > r * r) return;

                dist = dist === 0.0 ? 0.0 : sqrt(dist);
                invDist = dist === 0.0 ? 0.0 : 1.0 / dist;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (dt > dtb) {
                if (dt > dtb + r) return;

                dx = xjx - bx;
                dy = xjy - by;

                dist = dx * dx + dy * dy;
                if (dist > r * r) return;

                dist = dist === 0.0 ? 0.0 : sqrt(dist);
                invDist = dist === 0.0 ? 0.0 : 1.0 / dist;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (dn < 0.0) {
                nx = -nx;
                ny = -ny;
            }
            if (!collideParticle(si, sj)) return;

            createContact(
                si.body,
                sj.body,
                1 + si.elasticity,
                si.friction,
                nx,
                ny,
                xjx - r * nx,
                xjy - r * ny,
                dist - r,
                contacts
            );
        }


        function segmentCircle(si, sj, contacts) {
            var ri = si.radius,
                a = si._a,
                b = si._b,
                n = si._normal,
                ax = a.x,
                ay = a.y,
                bx = b.x,
                by = b.y,
                nx = n.x,
                ny = n.y,

                xj = sj.position,
                xjx = xj.x,
                xjy = xj.y,
                rj = sj.radius,
                r = ri + rj,

                dn = (nx * xjx + ny * xjy) - (ax * nx + ay * ny),
                dist = abs(dn),
                dt, dta, dtb, dx, dy, invDist;

            if (dist > r) return;

            dt = xjx * ny - xjy * nx;
            dta = ax * ny - ay * nx;
            dtb = bx * ny - by * nx;

            if (dt <= dta) {
                if (dt < dta - r) return;

                dx = xjx - ax;
                dy = xjy - ay;

                dist = dx * dx + dy * dy;
                if (dist > r * r) return;

                dist = dist === 0.0 ? 0.0 : sqrt(dist);
                invDist = dist === 0.0 ? 0.0 : 1.0 / dist;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (dt > dtb) {
                if (dt > dtb + r) return;

                dx = xjx - bx;
                dy = xjy - by;

                dist = dx * dx + dy * dy;
                if (dist > r * r) return;

                dist = dist === 0.0 ? 0.0 : sqrt(dist);
                invDist = dist === 0.0 ? 0.0 : 1.0 / dist;

                nx = dx * invDist;
                ny = dy * invDist;
            } else {
                if (dn < 0.0) {
                    nx = -nx;
                    ny = -ny;
                }
            }
            if (!collide(si, sj)) return;

            createContact(
                si.body,
                sj.body,
                1.0 + min(si.elasticity, sj.elasticity),
                min(si.friction, sj.friction),
                nx,
                ny,
                xjx - r * nx,
                xjy - r * ny,
                dist - r,
                contacts
            );
        }


        function segmentSegment(si, sj, contacts) {
            var ai = si._a,
                aix = ai.x,
                aiy = ai.y,
                bi = si._b,
                bix = bi.x,
                biy = bi.y,
                ni = sj._normal,
                nix = ni.x,
                niy = ni.y,
                ri = si.radius,

                aj = sj._a,
                ajx = aj.x,
                ajy = aj.y,
                bj = sj._b,
                bjx = bj.x,
                bjy = bj.y,
                nj = sj._normal,
                njx = nj.x,
                njy = nj.y,
                rj = sj.radius,
                d0, d1, d2, d3, mi, mj, m, s, t, ux, uy, vx, vy, amx, amy, bmx, bmy;

            segmentSegmentArray[0] = d0 = segmentPointDistanceSq(aix, aiy, bix, biy, ajx, ajy);
            segmentSegmentArray[1] = d1 = segmentPointDistanceSq(aix, aiy, bix, biy, bjx, bjy);
            segmentSegmentArray[2] = d2 = segmentPointDistanceSq(ajx, ajy, bjx, bjy, aix, aiy);
            segmentSegmentArray[3] = d3 = segmentPointDistanceSq(ajx, ajy, bjx, bjy, bix, biy);

            mi = d0 < d1 ? 0 : 1;
            mj = d2 < d3 ? 2 : 3;
            m = segmentSegmentArray[mi] < segmentSegmentArray[mj] ? mi : mj;

            ux = bix - aix;
            uy = biy - aiy;
            vx = bjx - ajx;
            vy = bjy - ajy;

            if (m === 0) {
                s = ((ajx - aix) * ux + (ajy - aiy) * uy) / (ux * ux + uy * uy);
                s = s < 0 ? 0 : (s > 1 ? 1 : s);
                t = 0;
            } else if (m === 1) {
                s = ((bjx - aix) * ux + (bjy - aiy) * uy) / (ux * ux + uy * uy);
                s = s < 0 ? 0 : (s > 1 ? 1 : s);
                t = 1;
            } else if (m === 2) {
                s = 0;
                t = ((aix - ajx) * vx + (aiy - ajy) * vy) / (vx * vx + vy * vy);
                t = t < 0 ? 0 : (t > 1 ? 1 : t);
            } else if (m === 3) {
                s = 1;
                t = ((bix - ajx) * vx + (biy - ajy) * vy) / (vx * vx + vy * vy);
                t = t < 0 ? 0 : (t > 1 ? 1 : t);
            }

            amx = aix + (ux * s);
            amy = aiy + (uy * s);
            bmx = ajx + (vx * t);
            bmy = ajy + (vy * t);

            circle2Circle(
                si,
                sj,
                amx, amy, ri,
                bmx, bmy, rj,
                contacts
            );
        }


        function convexSegment(si, sj, contacts) {
            var vertices = si._vertices,
                normals = si._normals,

                a = sj._a,
                ax = a.x,
                ay = a.y,
                b = sj._b,
                bx = b.x,
                by = b.y,
                nj = sj._normal,
                radius = sj.radius,
                njx = nj.x,
                njy = nj.y,

                segD = njx * ax + njy * ay,
                minNorm = valueOnAxis(vertices, njx, njy, segD) - radius,
                minNeg = valueOnAxis(vertices, -njx, -njy, -segD) - radius,
                index = -1,
                polyMin = -Infinity,
                v, n, dist, i, vax, vay, vbx, vby, u, e, nx, ny, count = 0;

            if (minNeg > 0 || minNorm > 0) return;

            i = vertices.length;
            while (i--) {
                v = vertices[i];
                n = normals[i];
                nx = n.x;
                ny = n.y;
                dist = segmentValueOnAxis(ax, ay, bx, by, radius, nx, ny, (nx * v.x + ny * v.y));

                if (dist > 0.0) {
                    return;
                } else if (dist > polyMin) {
                    polyMin = dist;
                    index = i;
                }
            }

            if (index === -1) return;
            if (!collide(si, sj)) return;

            e = 1.0 + min(si.elasticity, sj.elasticity);
            u = min(si.friction, sj.friction);

            n = normals[index];
            nx = n.x;
            ny = n.y;

            vax = ax + (-nx * radius);
            vay = ay + (-ny * radius);

            vbx = bx + (-nx * radius);
            vby = by + (-ny * radius);

            if (contains(vertices, normals, vax, vay)) {
                createContact(
                    si.body,
                    sj.body,
                    e,
                    u,
                    nx,
                    ny,
                    vax,
                    vay,
                    polyMin,
                    contacts
                );
                count++;
            }
            if (contains(vertices, normals, vbx, vby)) {
                createContact(
                    si.body,
                    sj.body,
                    e,
                    u,
                    nx,
                    ny,
                    vbx,
                    vby,
                    polyMin,
                    contacts
                );
                count++;
            }

            if (minNorm >= polyMin || minNeg >= polyMin) {
                if (minNorm > minNeg) {
                    count += pointsBehindSegment(si, sj, e, u, ax, ay, bx, by, radius, nx, ny, minNorm, 1, contacts);
                } else {
                    count += pointsBehindSegment(si, sj, e, u, ax, ay, bx, by, radius, nx, ny, minNeg, -1, contacts);
                }
            }
        }

        var segmentSegmentArray = [0.0, 0.0, 0.0, 0.0];

        function pointsBehindSegment(si, sj, e, u, ax, ay, bx, by, radius, nx, ny, dist, coef, contacts) {
            var dta = nx * ay - ny * ax,
                dtb = nx * by - ny * bx,
                vertices = si._vertices,
                i = vertices.length,
                v, vx, vy, dt,
                count = 0;

            nx *= coef;
            ny *= coef;

            while (i--) {
                v = vertices[i]
                vx = v.x;
                vy = v.y;

                if ((vx * nx + vy * ny) < (nx * ax + ny * ay) * coef + radius) {
                    dt = nx * vy - ny * vx;
                    if (dta >= dt && dt >= dtb) {
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
                        count++;
                    }
                }
            }

            return count;
        }

        function segmentPointDistanceSq(ax, ay, bx, by, px, py) {
            var wx = px - ax,
                wy = py - ay,
                dx = bx - ax,
                dy = by - ay,

                proj = wx * dx + wy * dy,
                vsq;

            if (proj <= 0.0) return wx * wx + wy * wy;

            vsq = dx * dx + dy * dy;
            if (proj >= vsq) return (wx * wx + wy * wy) - 2 * proj + vsq;


            return (wx * wx + wy * wy) - proj * proj / vsq;
        }

        function segmentValueOnAxis(ax, ay, bx, by, r, nx, ny, d) {
            var a = (nx * ax + ny * ay) - r,
                b = (nx * bx + ny * by) - r;

            return min(a, b) - d;
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

                nx, ny,
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

            if (index === -1) return;

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

            if (u < 0.0) {
                dx = xjx - v1x;
                dy = xjy - v1y;

                dist = dx * dx + dy * dy;
                if (dist > EPSILON) return;

                dist = sqrt(dist);
                invDist = dist > 0.0 ? 1.0 / dist : 0.0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (u > 1.0) {
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
                1.0 + si.elasticity,
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

                nx, ny,
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

            if (index === -1) return;

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

            if (u < 0.0) {
                dx = xjx - v1x;
                dy = xjy - v1y;

                dist = dx * dx + dy * dy;
                if (dist > radius * radius) return;

                dist = sqrt(dist);
                invDist = dist > 0.0 ? 1.0 / dist : 0.0;

                nx = dx * invDist;
                ny = dy * invDist;
            } else if (u > 1.0) {
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
                1.0 + min(si.elasticity, sj.elasticity),
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
                nx = normal.x,
                ny = normal.y,

                e = 1.0 + min(si.elasticity, sj.elasticity),
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


        function valueOnAxis(vertices, nx, ny, d) {
            var v, m = Infinity,
                i = vertices.length;

            while (i--) {
                v = vertices[i];
                m = min(m, nx * v.x + ny * v.y);
            }

            return m - d;
        }


        var lastMinMSA = 0.0;

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

                dist = valueOnAxis(verticesj, n.x, n.y, (n.x * v.x + n.y * v.y));

                if (dist > 0.0) return -1;

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
                        convexSegment(sj, si, contacts);
                    }
                }
            }
        }


        return P2Nearphase;
    }
);
