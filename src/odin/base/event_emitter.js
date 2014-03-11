if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var shift = Array.prototype.shift;


        /**
         * @class Odin.EventEmitter
         */
        function EventEmitter() {

            this._events = {};
        }

        /**
         * attaches function to an event
         * @memberof Odin.EventEmitter
         * @param {string} type
         * @param {function} listener
         * @param {object} ctx
         * @return this
         */
        EventEmitter.prototype.on = function(type, listener, ctx) {
            var events = this._events;

            (events[type] || (events[type] = [])).push({
                listener: listener,
                ctx: ctx || this
            });

            return this;
        };

        /**
         * attaches function to an event, on the first call its removed
         * @memberof Odin.EventEmitter
         * @param {string} type
         * @param {function} listener
         * @param {object} ctx
         * @return this
         */
        EventEmitter.prototype.once = function(type, listener, ctx) {
            var self = this;
            ctx = ctx || this;

            function once() {
                self.off(type, once, ctx);
                listener.apply(ctx, arguments);
            }

            return this.on(type, once, ctx);
        };

        /**
         * attaches function to an event on another object
         * @memberof Odin.EventEmitter
         * @param {object} obj
         * @param {string} type
         * @param {function} listener
         * @param {object} ctx
         * @return this
         */
        EventEmitter.prototype.listenTo = function(obj, type, listener, ctx) {
            if (!(obj instanceof EventEmitter)) throw "Can't listen to Object, it's not a instance of EventEmitter";

            obj.on(type, listener, ctx || this);

            return this;
        };

        /**
         * removes function from an event
         * @memberof Odin.EventEmitter
         * @param {string} type
         * @param {function} listener
         * @param {object} ctx
         * @return this
         */
        EventEmitter.prototype.off = function(type, listener, ctx) {
            var thisEvents = this._events,
                events, event,
                i;

            if (!type) {
                for (i in thisEvents)
                    if ((events = thisEvents[i])) events.length = 0;
                return this;
            }

            events = thisEvents[type];
            if (!events) return this;

            if (!listener) {
                events.length = 0;
            } else {
                ctx = ctx || this;
                i = events.length;

                while (i--) {
                    event = events[i];

                    if (event.listener === listener && event.ctx === ctx) {
                        events.splice(i, 1);
                        break;
                    }
                }
            }

            return this;
        };

        /**
         * emits event type
         * @memberof Odin.EventEmitter
         * @param {string} type
         * @return this
         */
        EventEmitter.prototype.emit = function(type) {
            var events = this._events[type],
                a1, a2, a3, a4,
                length, event,
                i;

            if (!events || !events.length) return this;
            length = arguments.length;

            if (length === 1) {
                i = events.length;
                while (i--) {
                    if ((event = events[i])) event.listener.call(event.ctx);
                }
            } else if (length === 2) {
                a1 = arguments[1];
                i = events.length;
                while (i--) {
                    if ((event = events[i])) event.listener.call(event.ctx, a1);
                }
            } else if (length === 3) {
                a1 = arguments[1];
                a2 = arguments[2];
                i = events.length;
                while (i--) {
                    if ((event = events[i])) event.listener.call(event.ctx, a1, a2);
                }
            } else if (length === 4) {
                a1 = arguments[1];
                a2 = arguments[2];
                a3 = arguments[3];
                i = events.length;
                while (i--) {
                    if ((event = events[i])) event.listener.call(event.ctx, a1, a2, a3);
                }
            } else if (length === 5) {
                a1 = arguments[1];
                a2 = arguments[2];
                a3 = arguments[3];
                a4 = arguments[4];
                i = events.length;
                while (i--) {
                    if ((event = events[i])) event.listener.call(event.ctx, a1, a2, a3, a4);
                }
            } else {
                shift.apply(arguments);
                i = events.length;
                while (i--) {
                    if ((event = events[i])) event.listener.apply(event.ctx, arguments);
                }
            }

            return this;
        };

        /**
         * @memberof Odin.EventEmitter
         * @param {constructor} child
         * @param {constructor} parent
         * @return child
         */
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
