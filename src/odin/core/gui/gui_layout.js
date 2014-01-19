if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/game/log",
        "odin/math/mat32",
        "odin/math/vec2",
        "odin/math/rect",
        "odin/core/gui/gui_content"
    ],
    function(Class, Log, Mat32, Vec2, Rect, GUIContent) {
        "use strict";


        function GUILayout(opts) {
            opts || (opts = {});

            Class.call(this);

            this.root = this;
            this.depth = 0;

            this.gui = undefined;

            this.content = opts.content instanceof GUIContent ? opts.content : new GUIContent(opts.content);
            this.style = opts.style instanceof GUIStyle ? opts.style : new GUIStyle(opts.style);

            this.parent = undefined;
            this.children = [];

            this.position = opts.position != undefined ? opts.position : new Rect;
            this.rotation = opts.rotation != undefined ? opts.rotation : 0;
            this.scale = opts.scale != undefined ? opts.scale : new Vec2(1, 1);

            this.matrix = new Mat32;
            this.matrixWorld = new Mat32;
        }

        Class.extend(GUILayout);


        GUILayout.prototype.copy = function(other) {
            var children = other.children,
                i;

            this.position.copy(other.position);
            this.rotation.copy(other.rotation);
            this.scale.copy(other.scale);

            for (i = children.length; i--;) this.addChild(children[i].clone());
            if (other.parent) other.parent.add(this);

            return this;
        };


        GUILayout.prototype.clear = function() {
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


        GUILayout.prototype.addChild = function(child) {
            if (!(child instanceof GUILayout)) {
                Log.error("GUILayout.add: can\'t add passed argument, it is not an instance of GUILayout");
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
                Log.error("GUILayout.add: child is not a member of this GUILayout");
            }

            return this;
        };


        GUILayout.prototype.add = GUILayout.prototype.addChildren = function() {

            for (var i = arguments.length; i--;) this.addChild(arguments[i]);
            return this;
        };


        GUILayout.prototype.removeChild = function(child) {
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
                Log.error("GUILayout.remove: child is not a member of this GUILayout");
            }

            return this;
        };


        GUILayout.prototype.remove = GUILayout.prototype.removeChildren = function() {

            for (var i = arguments.length; i--;) this.removeChild(arguments[i]);
            return this;
        };


        var CENTER = new Vec2;
        GUILayout.prototype.update = function() {
            var matrix = this.matrix,
                parent = this.parent,
                position = this.position;

            CENTER.x = position._x + (position._width * 0.5);
            CENTER.y = position._y + (position._height * 0.5);
            matrix.compose(CENTER, this.scale, this.rotation);

            if (parent) {
                this.matrixWorld.mmul(parent.matrixWorld, matrix);
            } else {
                this.matrixWorld.copy(matrix);
            }
        };


        function updateDepth(layout, depth) {
            var children = layout.children,
                i;

            layout.depth = depth;
            for (i = children.length; i--;) updateDepth(children[i], depth + 1);
        }


        return GUILayout;
    }
);
