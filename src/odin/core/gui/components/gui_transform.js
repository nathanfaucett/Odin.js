if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/mathf",
        "odin/math/vec2",
        "odin/math/rect",
        "odin/math/mat32",
        "odin/math/mat4",
        "odin/core/gui/components/gui_component",
        "odin/core/game/config",
        "odin/core/game/log"
    ],
    function(Mathf, Vec2, Rect, Mat32, Mat4, GUIComponent, Config, Log) {
        "use strict";


        var EPSILON = Mathf.EPSILON;


        function GUITransform(opts) {
            opts || (opts = {});
            opts.sync = opts.sync != undefined ? opts.sync : true;

            GUIComponent.call(this, "GUITransform", opts);

            this.root = this;
            this.depth = 0;

            this.parent = undefined;
            this.children = [];

            this.position = opts.position != undefined ? opts.position : new Rect;
            this.rotation = opts.rotation != undefined ? opts.rotation : 0;
            this.scale = opts.scale != undefined ? opts.scale : new Vec2(1, 1);

            this.matrix = new Mat32;
            this.matrixWorld = new Mat32;

            this.modelView = new Mat4;
            this._matricesViewNeedsUpdate = false;
        }

        GUIComponent.extend(GUITransform);
        GUITransform.order = -1;


        GUITransform.prototype.copy = function(other) {
            var children = other.children,
                i;

            this.position.copy(other.position);
            this.scale.copy(other.scale);
            this.rotation = other.rotation;

            for (i = children.length; i--;) this.addChild(children[i].gameObject.clone().transform);
            if (other.parent) other.parent.addChild(this);

            return this;
        };


        GUITransform.prototype.clear = function() {
            GUIComponent.prototype.clear.call(this);
            var children = this.children,
                i;

            for (i = children.length; i--;) this.removeChild(children[i]);

            this.position.set(0, 0, 0, 0);
            this.scale.set(1, 1);
            this.rotation = 0;

            this.root = this;
            this.depth = 0;

            return this;
        };


        GUITransform.prototype.translate = function() {
            var vec = new Vec2;

            return function(translation, relativeTo) {
                vec.copy(translation);
                var position = this.position;

                if (relativeTo instanceof GUITransform) {
                    vec.transformAngle(relativeTo.rotation);
                } else if (relativeTo) {
                    vec.transformAngle(relativeTo);
                }

                position.x += vec.x;
                position.y += vec.y;

                return this;
            };
        }();


        GUITransform.prototype.rotate = function(rotation, relativeTo) {

            if (relativeTo instanceof GUITransform) {
                rotation += relativeTo.rotation;
            } else if (relativeTo) {
                rotation += relativeTo;
            }

            this.rotation += rotation;

            return this;
        };


        GUITransform.prototype.lookAt = function() {
            var mat = new Mat32,
                vec = new Vec2;

            return function(target) {

                if (target instanceof GUITransform) {
                    vec.set(0, 0).transformMat32(target.matrixWorld);
                } else {
                    vec.copy(target);
                }

                mat.lookAt(this.position, vec);
                this.rotation = mat.getRotation();

                return this;
            };
        }();


        GUITransform.prototype.follow = function() {
            var target = new Vec2,
                position = new Vec2,
                delta = new Vec2;

            return function(transform, speed) {
                position.set(0, 0).transformMat32(this.matrixWorld);
                target.set(0, 0).transformMat32(transform.matrixWorld);

                delta.vsub(target, position);

                if (delta.lengthSq() > EPSILON) this.position.add(delta.smul(speed));

                return this;
            };
        }();


        GUITransform.prototype.addChild = function(child) {
            if (!(child instanceof GUITransform)) {
                Log.error("GUITransform.add: can\'t add passed argument, it is not an instance of GUITransform");
                return this;
            }
            var children = this.children,
                index = children.indexOf(child),
                root, depth;

            if (index === -1) {
                if (child.parent) child.parent.remove(child);

                child.parent = this;
                children.push(child);

                root = this;
                depth = 0;

                while (root.parent) {
                    root = root.parent;
                    depth++;
                }
                child.root = root;
                this.root = root;

                updateDepth(this, depth);
            } else {
                Log.error("GUITransform.add: child is not a member of this GUITransform");
            }

            return this;
        };


        GUITransform.prototype.addChildren = function() {

            for (var i = arguments.length; i--;) this.addChild(arguments[i]);
            return this;
        };


        GUITransform.prototype.removeChild = function(child) {
            var children = this.children,
                index = children.indexOf(child),
                root, depth;

            if (index !== -1) {
                child.parent = undefined;
                children.splice(index, 1);

                root = this;
                depth = 0;

                while (root.parent) {
                    root = root.parent;
                    depth++;
                }
                child.root = child;
                this.root = root;

                updateDepth(this, depth);
            } else {
                Log.error("GUITransform.remove: child is not a member of this GUITransform");
            }

            return this;
        };


        GUITransform.prototype.removeChildren = function() {

            for (var i = arguments.length; i--;) this.removeChild(arguments[i]);
            return this;
        };


        GUITransform.prototype.detachChildren = function() {
            var children = this.children,
                i;

            for (i = children.length; i--;) this.removeChild(children[i]);
            return this;
        };


        GUITransform.prototype.toWorld = function(v) {

            return v.transformMat32(this.matrixWorld);
        };


        GUITransform.prototype.toLocal = function() {
            var mat = new Mat32;

            return function(v) {

                return v.transformMat32(mat.inverseMat(this.matrixWorld));
            };
        }();


        var CENTER = new Vec2;
        GUITransform.prototype.update = function() {
            var matrix = this.matrix,
                parent = this.parent,
                position = this.position;

            CENTER.x = position.x + (position.width * 0.5);
            CENTER.y = position.y + (position.height * 0.5);
            matrix.compose(CENTER, this.scale, this.rotation);

            if (parent) {
                this.matrixWorld.mmul(parent.matrixWorld, matrix);
            } else {
                this.matrixWorld.copy(matrix);
            }

            this._matricesViewNeedsUpdate = true;
        };


        var MAT4 = new Mat4;
        GUITransform.prototype.updateMatrices = function(projectionMatrix) {
            if (!this._matricesViewNeedsUpdate) return;

            this.modelView.mmul(projectionMatrix, MAT4.fromMat32(this.matrixWorld));
            this._matricesViewNeedsUpdate = false;
        };


        GUITransform.prototype.sort = function(a, b) {

            return b.depth - a.depth;
        };


        GUITransform.prototype.toJSON = function(json) {
            json = GUIComponent.prototype.toJSON.call(this, json);

            json.position = this.position.toJSON(json.position);
            json.scale = this.scale.toJSON(json.scale);
            json.rotation = this.rotation

            return json;
        };


        GUITransform.prototype.fromJSON = function(json) {
            GUIComponent.prototype.fromJSON.call(this, json);

            this.position.fromJSON(json.position);
            this.scale.fromJSON(json.scale);
            this.rotation = json.rotation;

            return this;
        };


        function updateDepth(transform, depth) {
            var children = transform.children,
                i;

            transform.depth = depth;
            for (i = children.length; i--;) updateDepth(children[i], depth + 1);
        }


        return GUITransform;
    }
);
