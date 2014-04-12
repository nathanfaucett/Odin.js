if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/mathf",
        "odin/math/rect",
        "odin/math/vec2",
        "odin/math/mat32",
        "odin/math/mat3",
        "odin/math/mat4",
        "odin/core/gui/components/gui_component",
        "odin/core/game/log"
    ],
    function(Mathf, Rect, Vec2, Mat32, Mat3, Mat4, GUIComponent, Log) {
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
            this._matricesNeedsUpdate = false;
        }

        GUIComponent.extend(GUITransform);


        GUITransform.prototype.copy = function(other) {
            var children = other.children,
                i = children.length;

            this.position.copy(other.position);
            this.scale.copy(other.scale);
            this.rotation = other.rotation;

            while (i--) this.addChild(children[i].guiObject.clone().transform);
            if (other.parent) other.parent.addChild(this);

            this._matricesNeedsUpdate = true;

            return this;
        };


        GUITransform.prototype.clear = function() {
            GUIComponent.prototype.clear.call(this);
            var children = this.children,
                i = children.length;

            while (i--) this.removeChild(children[i]);

            this.position.set(0, 0, 0, 0);
            this.scale.set(1, 1);
            this.rotation = 0;

            this.root = this;
            this.depth = 0;

            this._matricesNeedsUpdate = true;

            return this;
        };


        GUITransform.prototype.translate = function() {
            var vec = new Vec2;

            return function(translation, relativeTo) {
                var position = this.position;

                vec.copy(translation);

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
                vec = new Vec2,
                vec_2 = new Vec2;

            return function(target) {

                if (target instanceof GUITransform) {
                    vec.copy(target.position);
                } else {
                    vec.copy(target);
                }

                mat.lookAt(this.position.center(vec_2), vec);
                this.rotation = mat.getRotation();

                return this;
            };
        }();


        GUITransform.prototype.follow = function() {
            var target = new Vec2,
                pos = new Vec2,
                delta = new Vec2;

            return function(transform, speed) {
                var position = this.position;

                pos.set(0, 0).transformMat32(this.matrixWorld);
                target.set(0, 0).transformMat32(transform.matrixWorld);

                delta.vsub(target, pos);

                if (delta.lengthSq() > EPSILON) {
                    position.x += delta.x * speed;
                    position.y += delta.y * speed;
                }

                return this;
            };
        }();


        GUITransform.prototype.addChild = function(child, others) {
            if (!(child instanceof GUITransform)) {
                Log.error("GUITransform.add: can\'t add passed argument, it is not an instance of GUITransform");
                return this;
            }
            var children = this.children,
                index = children.indexOf(child),
                root, depth, gui;

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
                if (!others) {
                    if (this.guiObject && (gui = this.guiObject.gui)) {
                        gui.componentManagers.GUITransform.sort(this.sort);
                    }
                }
            } else {
                Log.error("GUITransform.add: child is not a member of this GUITransform");
            }

            return this;
        };


        GUITransform.prototype.addChildren = function() {
            var i, il, gui;

            for (i = 0, il = arguments.length; i < il; i++) this.addChild(arguments[i], true);
            if (this.guiObject && (gui = this.guiObject.gui)) {
                gui.componentManagers.GUITransform.sort(this.sort);
            }
            return this;
        };


        GUITransform.prototype.removeChild = function(child, others) {
            var children = this.children,
                index = children.indexOf(child),
                root, depth, gui;

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
                if (!others) {
                    if (this.guiObject && (gui = this.guiObject.gui)) {
                        gui.componentManagers.GUITransform.sort(this.sort);
                    }
                }
            } else {
                Log.error("GUITransform.remove: child is not a member of this GUITransform");
            }

            return this;
        };


        GUITransform.prototype.removeChildren = function() {
            var i, il, gui;

            for (i = 0, il = arguments.length; i < il; i++) this.removeChild(arguments[i], true);
            if (this.guiObject && (gui = this.guiObject.gui)) {
                gui.componentManagers.GUITransform.sort(this.sort);
            }
            return this;
        };


        GUITransform.prototype.detachChildren = function() {
            var i = arguments.length;

            while (i--) this.removeChild(children[i]);
            return this;
        };


        GUITransform.prototype.hasChild = function(child) {

            return !!~this.children.indexOf(child);
        };


        GUITransform.prototype.find = function(name) {
            var children = this.children,
                child,
                i = children.length;

            while (i--) {
                child = children[i];

                if (child.guiObject.name === name) return child;
                if ((child = child.find(name))) return child;
            }

            return undefined;
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


        GUITransform.prototype.update = function() {
            var matrix = this.matrix,
                parent = this.parent;

            matrix.compose(this.position, this.scale, this.rotation);

            if (parent) {
                this.matrixWorld.mmul(parent.matrixWorld, matrix);
            } else {
                this.matrixWorld.copy(matrix);
            }

            this._matricesNeedsUpdate = true;
        };


        GUITransform.prototype.updateMatrices = function() {
            var mat = new Mat4;

            return function(viewMatrix) {
                if (!this._matricesNeedsUpdate) return;

                this.modelView.mmul(viewMatrix, mat.fromMat32(this.matrixWorld));
                this._matricesNeedsUpdate = false;
            };
        }();


        GUITransform.prototype.toJSON = function(json) {
            json = GUIComponent.prototype.toJSON.call(this, json);
            var children = this.children,
                jsonChildren = json.children || (json.children = []),
                i = children.length;

            while (i--) jsonChildren[i] = children[i]._id;

            json.position = this.position.toJSON(json.position);
            json.scale = this.scale.toJSON(json.scale);
            json.rotation = this.rotation

            return json;
        };


        GUITransform.prototype.fromJSON = function(json) {
            GUIComponent.prototype.fromJSON.call(this, json);
            var children = json.children,
                i = children.length,
                child, gui;

            if (this.guiObject && (gui = this.guiObject.gui)) {
                while (i--) {
                    child = gui.findGUIComponentByJSONId(children[i]);

                    if (!this.hasChild(child)) {
                        this.addChild(child);
                    }
                }
            } else {
                this.once("start", function() {
                    var gui = this.guiObject.gui;

                    while (i--) {
                        child = gui.findGUIComponentByJSONId(children[i]);

                        if (!this.hasChild(child)) {
                            this.addChild(child);
                        }
                    }
                });
            }

            this.position.fromJSON(json.position);
            this.scale.fromJSON(json.scale);
            this.rotation = json.rotation;

            this._matricesNeedsUpdate = true;

            return this;
        };


        function updateDepth(transform, depth) {
            var children = transform.children,
                i = children.length;

            transform.depth = depth;
            while (i--) updateDepth(children[i], depth + 1);
        }


        return GUITransform;
    }
);
