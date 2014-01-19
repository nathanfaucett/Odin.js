define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time,
            Input = Odin.Input;


        function CameraControl(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "CameraControl", !! opts.sync, opts.json);

            this.player = undefined;
            this.speed = 1;
            this.zoomSpeed = 1;
        }

        Odin.Component.extend(CameraControl);


        CameraControl.prototype.update = function() {
            var transform = this.transform2d,
                position = this.transform2d.position,
                camera2d = this.camera2d,
                player = this.player || (this.player = this.gameObject.scene.findByTagFirst("Player")),
                playerTransform = player.transform2d,
                dt = Time.delta,
                spd = this.speed;

            if (Input.mouseButton(0)) {
                position.x += -dt * spd * Input.axis("mouseX");
                position.y += dt * spd * Input.axis("mouseY");
            } else {
                transform.follow(playerTransform, dt * spd);
            }

            camera2d.setOrthographicSize(camera2d.orthographicSize + -dt * this.zoomSpeed * Input.axis("mouseWheel"));
        };


        return CameraControl;
    }
);
