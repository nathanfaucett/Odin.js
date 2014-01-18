if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var shift = Array.prototype.shift,
            SPLITER = /[ ,]+/;


        function EventEmitter() {

            this._events = {};
        }


        EventEmitter.prototype.on = function(type, listener, ctx) {
            var types = type.split(SPLITER),
                events = this._events,
                i;

            for (i = types.length; i--;) {
                type = types[i];
                (events[type] || (events[type] = [])).push({
                    listener: listener,
                    ctx: ctx || this
                });
            }

            return this;
        };


        EventEmitter.prototype.once = function(type, listener, ctx) {
            var self = this;
            ctx = ctx || this;

            function once() {
                self.off(type, once);
                listener.apply(ctx, arguments);
            }

            return this.on(type, once, ctx);
        };


        EventEmitter.prototype.listenTo = function(obj, type, listener, ctx) {
            if (!obj.on || !obj.addEventListenerTo) throw "Can't listen to Object, it's not a instance of EventEmitter";

            obj.on(type, listener, ctx || this);

            return this;
        };


        EventEmitter.prototype.off = function(type, listener, ctx) {
            var types = type.split(SPLITER),
                thisEvents = this._events,
                events, event,
                i, j;

            for (i = types.length; i--;) {
                type = types[i];

                if (!type) {
                    for (i in thisEvents) thisEvents[i].length = 0;
                    return this;
                }

                events = thisEvents[type];
                if (!events) return this;

                if (!listener) {
                    events.length = 0;
                } else {
                    ctx = ctx || this;

                    for (j = events.length; j--;) {
                        event = events[j];

                        if (event.listener === listener && event.ctx === ctx) {
                            events.splice(j, 1);
                            break;
                        }
                    }
                }
            }

            return this;
        };


        EventEmitter.prototype.emit = function(type) {
            var events = this._events[type],
                a1, a2, a3, a4,
                event,
                i;

            if (!events || !events.length) return this;

            switch (arguments.length) {
                case 1:
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx);
                    break;

                case 2:
                    a1 = arguments[1];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1);
                    break;

                case 3:
                    a1 = arguments[1];
                    a2 = arguments[2];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1, a2);
                    break;

                case 4:
                    a1 = arguments[1];
                    a2 = arguments[2];
                    a3 = arguments[3];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1, a2, a3);
                    break;

                case 5:
                    a1 = arguments[1];
                    a2 = arguments[2];
                    a3 = arguments[3];
                    a4 = arguments[4];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1, a2, a3, a4);
                    break;

                default:
                    shift.apply(arguments);
                    for (i = events.length; i--;)(event = events[i]).listener.apply(event.ctx, arguments);
            }

            return this;
        };


        EventEmitter.extend = function(child, parent) {
            if (!parent) parent = this;

            child.prototype = Object.create(parent.prototype);
            child.prototype.constructor = child;

            child.extend = parent.extend || this.extend;

            if (parent.onExtend) {
                if (!child.onExtend) child.onExtend = parent.onExtend;
                parent.onExtend(child);
            }

            return child;
        };


        return EventEmitter;
    }
);
