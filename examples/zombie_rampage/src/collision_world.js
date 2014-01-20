define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time,
            sqrt = Math.sqrt,
            abs = Math.abs;


        function CollisionWorld(opts) {
            opts || (opts = {});

            Odin.World.call(this, opts);

            this.objects = [];

            this._pairsi = [];
            this._pairsj = [];
        }

        Odin.World.extend(CollisionWorld);


        CollisionWorld.prototype.init = function() {
            var objects = this.objects,
                scene = this.scene,
                CollisionObjects = scene.components.CollisionObject,
                i = CollisionObjects.length;

            for (; i--;) objects[i] = CollisionObjects[i];

            this.scene.on("addCollisionObject", function(collisionObject) {

                objects.push(collisionObject);
            });
            this.scene.on("removeCollisionObject", function(collisionObject) {

                objects.splice(objects.indexOf(collisionObject), 1);
            });
        };


        CollisionWorld.prototype.update = function() {
            var objects = this.objects,
                pairsi = this._pairsi,
                pairsj = this._pairsj,
                dt = Time.delta,
                bi, bj;

            pairs(objects, pairsi, pairsj);
            for (i = pairsi.length; i--;) {
                bi = pairsi[i];
                bj = pairsj[i];

                if (bi.collide > 1 || bj.collide > 1) {
                    bi.gameObject.emit("collisionStart", bj.gameObject);
                    bj.gameObject.emit("collisionStart", bi.gameObject);
                }
                bi.gameObject.emit("collision", bj.gameObject);
                bj.gameObject.emit("collision", bi.gameObject);

                bi.collide = bj.collide = 2;
                collision(dt, bi, bj);
            }
        };


        function collision(dt, bi, bj) {
            var aabbi = bi.aabb,
                aabbj = bj.aabb,
                xi = bi.transform2d.position,
                xj = bj.transform2d.position,

                mi = bi.mass,
                mj = bj.mass,

                left = aabbj.min.x - aabbi.max.x,
                right = aabbj.max.x - aabbi.min.x,
                top = aabbj.min.y - aabbi.max.y,
                bottom = aabbj.max.y - aabbi.min.y,

                ox = 0,
                oy = 0;

            if (abs(left) < right) {
                ox = left;
            } else {
                ox = right;
            }
            if (abs(top) < bottom) {
                oy = top;
            } else {
                oy = bottom;
            }

            if (abs(ox) <= abs(oy)) {
                oy = 0;
            } else {
                ox = 0;
            }
            bi.collide = bj.collide = 2;

            if (mi !== 0 && mj !== 0) {
                mi *= dt * 5;
                mj *= dt * 5;
            }

            xi.x += ox * mi;
            xi.y += oy * mi;

            xj.x -= ox * mj;
            xj.y -= oy * mj;
        }


        function pairs(objects, pairsi, pairsj) {
            var len = objects.length,
                bi, bj, i, j;

            pairsi.length = pairsj.length = 0;

            for (i = 0; i < len; i++) {
                for (j = 0; j !== i; j++) {
                    bi = objects[i];
                    bj = objects[j];

                    if (bi.aabb.intersects(bj.aabb)) {
                        pairsi.push(bi);
                        pairsj.push(bj);
                    }
                }
            }
        }


        return CollisionWorld;
    }
);
