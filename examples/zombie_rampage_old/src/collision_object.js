define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time;


        function CollisionObject(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "CollisionObject", opts);

            this.active = true;

            this.offset = opts.offset != undefined ? opts.offset : new Odin.Vec2(0, -0.25);
            this.size = opts.size != undefined ? opts.size : new Odin.Vec2(0.75, 0.5);

            this.mass = opts.mass != undefined ? opts.mass : 1; // 0 for not moveable
            this.aabb = new Odin.AABB2;

            this.collide = 0;
        }

        Odin.Component.extend(CollisionObject);


        var VEC = new Odin.Vec2;
        CollisionObject.prototype.update = function() {
            if (!this.transform2d) return;
            var position = this.transform2d.position,
                offset = this.offset;

            VEC.x = position.x + offset.x;
            VEC.y = position.y + offset.y;
            this.aabb.fromCenterSize(VEC, this.size);

            this.collide--;
            if (this.collide < 0) this.collide = 0;
        };


        CollisionObject.prototype.toJSON = function(json) {
            json = Odin.Component.prototype.toJSON.call(this, json);

            json.offset = this.offset.toJSON(json.offset);
            json.size = this.size.toJSON(json.size);
            json.mass = this.mass;

            return json;
        };


        CollisionObject.prototype.fromJSON = function(json) {
            Odin.Component.prototype.fromJSON.call(this, json);

            this.offset.fromJSON(json.offset);
            this.size.fromJSON(json.size);
            this.mass = json.mass;

            return this;
        };


        return CollisionObject;
    }
);
