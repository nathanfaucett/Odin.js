if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/gui/gui_object",
        "odin/core/gui/component_managers/gui_component_manager",
        "odin/core/game/log"
    ],
    function(Class, GUIObject, GUIComponentManager, World, Log) {
        "use strict";


        /**
         * GUIs manage GUIObjects and their GUIComponents
         * @class Odin.GUI
         * @extends Odin.Class
         * @param Object options
         */
        function GUI(opts) {
            opts || (opts = {});

            Class.call(this);

            this.game = undefined;

            this.name = opts.name != undefined ? opts.name : "GUI_" + this._id;

            this.width = 960;
            this.height = 640;
            this.aspect = this.width / this.height;
            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.guiObjects = [];
            this._guiObjectHash = {};
            this._guiObjectJSONHash = {};

            this.componentManagers = {};
            this._componentManagerTypes = [];
            this._componentHash = {};
            this._componentJSONHash = {};

            if (opts.guiObjects) this.addGUIObjects.apply(this, opts.guiObjects);
        }

        Class.extend(GUI);


        GUI.prototype.copy = function(other) {
            var otherGUIObjects = other.guiObjects,
                i = otherGUIObjects.length;

            this.clear();
            this.name = other.name + "." + this._id;

            while (i--) this.addGUIObject(otherGUIObjects[i].clone());

            return this;
        };


        GUI.prototype.init = function() {
            var guiObjects = this.guiObjects,
                i, il;

            for (i = 0, il = guiObjects.length; i < il; i++) guiObjects[i].emit("init");
        };


        GUI.prototype.start = function() {
            var componentManagerTypes = this._componentManagerTypes,
                guiObjects = this.guiObjects,
                i, il;

            for (i = 0, il = componentManagerTypes.length; i < il; i++) componentManagerTypes[i].start();
            for (i = 0, il = guiObjects.length; i < il; i++) guiObjects[i].emit("start");
        };


        GUI.prototype.update = function() {
            var componentManagerTypes = this._componentManagerTypes,
                guiObjects = this.guiObjects,
                i, il;

            for (i = 0, il = componentManagerTypes.length; i < il; i++) componentManagerTypes[i].update();
            for (i = 0, il = guiObjects.length; i < il; i++) guiObjects[i].emit("update");
        };


        GUI.prototype.clear = function() {
            var guiObjects = this.guiObjects,
                i = guiObjects.length;

            while (i--) this.removeGUIObject(guiObjects[i], true);

            this.off();

            return this;
        };


        GUI.prototype.destroy = function() {

            this.emit("destroy");
            this.clear();

            return this;
        };


        GUI.prototype.addGUIObject = function(guiObject) {
            if (!(guiObject instanceof GUIObject)) {
                Log.error("GUI.addGUIObject: can't add argument to GUI, it's not an instance of GUIObject");
                return this;
            }
            var guiObjects = this.guiObjects,
                index = guiObjects.indexOf(guiObject),
                components, transform, children, child,
                i;

            if (index === -1) {
                if (guiObject.gui) guiObject.gui.removeGUIObject(guiObject);

                guiObjects.push(guiObject);
                this._guiObjectHash[guiObject._id] = guiObject;
                if (guiObject._jsonId !== -1) this._guiObjectJSONHash[guiObject._jsonId] = guiObject;

                guiObject.gui = this;

                components = guiObject.components;
                i = components.length;
                while (i--) this._addGUIComponent(components[i]);

                if ((transform = guiObject.transform || guiObject.transform2d)) {
                    i = (children = transform.children).length;

                    while (i--) {
                        if ((child = children[i].guiObject) && !this.hasGUIObject(child)) {
                            this.addGUIObject(child);
                        }
                    }
                }

                if (this.game) guiObject.emit("init");
                this.emit("addGUIObject", guiObject);
            } else {
                Log.error("GUI.addGUIObject: GUIObject is already a member of GUI");
            }

            return this;
        };


        GUI.prototype.addGUIObjects = function() {
            var i = 0,
                il = arguments.length;

            for (; i < il; i++) this.addGUIObject(arguments[i]);
            return this;
        };


        GUI.prototype._addGUIComponent = function(component) {
            if (!component) return;
            var type = component._type,
                componentManagers = this.componentManagers,
                componentManager = componentManagers[type],
                componentManagerTypes = this._componentManagerTypes,
                isNew = !componentManager;

            if (isNew) {
                componentManager = componentManagers[type] = new(Class._classes[type + "GUIComponentManager"] || GUIComponentManager);
                componentManagerTypes.push(componentManager);
                componentManagerTypes.sort(sortGUIComponentManagerTypes);
                componentManager.gui = this;
            }

            componentManager.add(component);
            componentManager.sort();

            this._componentHash[component._id] = component;
            if (component._jsonId !== -1) this._componentJSONHash[component._jsonId] = component;

            this.emit("add" + type, component);
            this.emit("addGUIComponent", component);

            if (this.game) {
                component.start();
                component.emit("start");
            }
        };


        function sortGUIComponentManagerTypes(a, b) {

            return a.order - b.order;
        }


        GUI.prototype.removeGUIObject = function(guiObject, clear) {
            if (!(guiObject instanceof GUIObject)) {
                Log.error("GUI.removeGUIObject: can't remove argument from GUI, it's not an instance of GUIObject");
                return this;
            }
            var guiObjects = this.guiObjects,
                index = guiObjects.indexOf(guiObject),
                components, transform, children, child,
                i;

            if (index !== -1) {

                guiObjects.splice(index, 1);
                this._guiObjectHash[guiObject._id] = undefined;
                if (guiObject._jsonId !== -1) this._guiObjectJSONHash[guiObject._jsonId] = undefined;

                guiObject.gui = undefined;

                components = guiObject.components;
                i = components.length;
                while (i--) this._removeGUIComponent(components[i], clear);

                if ((transform = guiObject.transform || guiObject.transform2d)) {
                    i = (children = transform.children).length;

                    while (i--) {
                        if ((child = children[i].guiObject) && this.hasGUIObject(child)) {
                            this.removeGUIObject(child);
                        }
                    }
                }

                this.emit("removeGUIObject", guiObject);
                guiObject.emit("remove", guiObject);
                if (clear) guiObject.clear();
            } else {
                Log.error("GUI.removeGUIObject: GUIObject is not a member of GUI");
            }

            return this;
        };


        GUI.prototype.removeGUIObjects = function() {
            var i = 0,
                il = arguments.length;

            for (; i < il; i++) this.removeGUIObject(arguments[i]);
            return this;
        };


        GUI.prototype._removeGUIComponent = function(component, clear) {
            if (!component) return;
            var type = component._type,
                componentManagers = this.componentManagers,
                componentManager = componentManagers[type],
                componentManagerTypes = this._componentManagerTypes;

            componentManager.remove(component);
            this._componentHash[component._id] = undefined;
            if (component._jsonId !== -1) this._componentJSONHash[component._jsonId] = undefined;

            if (componentManager.empty()) {
                componentManagers[type] = undefined;
                componentManagerTypes.splice(componentManagerTypes.indexOf(componentManager), 1);
                componentManager.gui = undefined;
            }

            this.emit("remove" + type, component);
            this.emit("removeGUIComponent", component);

            if (clear) component.clear();
        };


        GUI.prototype.hasGUIObject = function(guiObject) {

            return !!~this.guiObjects.indexOf(guiObject);
        };


        GUI.prototype.findByTag = function(tag, out) {
            out || (out = []);
            var guiObjects = this.guiObjects,
                guiObject, i = guiObjects.length;

            while (i--) {
                if ((guiObject = guiObjects[i]).hasTag(tag)) out.push(guiObject);
            }

            return out;
        };


        GUI.prototype.findByTagFirst = function(tag) {
            var guiObjects = this.guiObjects,
                guiObject, i = guiObjects.length;

            while (i--) {
                if ((guiObject = guiObjects[i]).hasTag(tag)) return guiObject;
            }

            return undefined;
        };


        GUI.prototype.findById = function(id) {

            return this._guiObjectHash[id];
        };


        GUI.prototype.findByJSONId = function(id) {

            return this._guiObjectJSONHash[id];
        };


        GUI.prototype.findGUIComponentById = function(id) {

            return this._componentHash[id];
        };


        GUI.prototype.findGUIComponentByJSONId = function(id) {

            return this._componentJSONHash[id];
        };


        GUI.prototype.find = function(name) {
            var guiObjects = this.guiObjects,
                child, i = guiObjects.length;

            while (i--) {
                child = guiObjects[i];

                if (child.name === name) return child;
                if ((child = child.find(name))) return child;
            }

            return undefined;
        };


        GUI.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var guiObjects = this.guiObjects,
                jsonGUIObjects = json.guiObjects || (json.guiObjects = []),
                guiObject,
                i = guiObjects.length;

            json.name = this.name;

            while (i--) {
                if ((guiObject = guiObjects[i])) jsonGUIObjects[i] = guiObject.toJSON(jsonGUIObjects[i]);
            }

            return json;
        };


        GUI.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonGUIObjects = json.guiObjects,
                guiObject, jsonGUIObject,
                i = jsonGUIObjects.length;

            this.name = json.name;

            while (i--) {
                if (!(jsonGUIObject = jsonGUIObjects[i])) continue;

                if ((guiObject = this._guiObjectJSONHash[jsonGUIObject._id])) {
                    guiObject.fromJSON(jsonGUIObject);
                } else {
                    this.addGUIObject(Class.fromJSON(jsonGUIObject));
                }
            }

            return this;
        };


        return GUI;
    }
);
