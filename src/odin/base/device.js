if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        function Device() {
            var userAgent = navigator.userAgent.toLowerCase(),
                audio = new Audio,
                video = document.createElement("video");

            this.userAgent = userAgent;

            this.pixelRatio = window.devicePixelRatio || 1;
            this.invPixelRatio = 1 / this.pixelRatio;

            this.browser = userAgent.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i)[1];
            this.touch = "ontouchstart" in window;
            this.mobile = /android|webos|iphone|ipad|ipod|blackberry/i.test(userAgent);

            this.webgl = (function() {
                var canvas = document.createElement("canvas"),
                    names = ["3d", "moz-webgl", "experimental-webgl", "webkit-3d", "webgl"],
                    has, i;

                for (i = names.length; i--;) {
                    has = !! canvas.getContext(names[i]);
                    if (has) break;
                }

                return has;
            }());

            this.canvas = (function() {
                var canvas = document.createElement("canvas"),
                    has = !! canvas.getContext("2d");

                return has;
            }());

            this.gamepads = !! navigator.getGamepads || !! navigator.webkitGetGamepads || !! navigator.webkitGamepads;

            this.audioMpeg = !! audio.canPlayType("audio/mpeg");
            this.audioOgg = !! audio.canPlayType("audio/ogg");
            this.audioMp4 = !! audio.canPlayType("audio/mp4");

            this.videoWebm = !! video.canPlayType("video/webm");
            this.videoOgg = !! video.canPlayType("video/ogg");
            this.videoMp4 = !! video.canPlayType("video/mp4");
        }


        return new Device;
    }
);
