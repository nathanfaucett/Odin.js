define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time,
            Input = Odin.Input;


        function CameraControl(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "CameraControl", opts);

            this.player = undefined;
            this.speed = 1;
            this.zoomSpeed = 8;
        }

        Odin.Component.extend(CameraControl);


        CameraControl.prototype.update = function() {
            var transform = this.transform2d,
                position = this.transform2d.position,
                camera2d = this.camera2d,
                player = this.player || (this.player = this.gameObject.scene.findByTagFirst("Player")),
                playerTransform,
                dt = Time.delta,
                spd = this.speed;

            if (player && !player.character.dead) {
                playerTransform = player.transform2d;

                transform.follow(playerTransform, dt * spd);
            } else {
                if (Input.mouseButton(0)) {
                    position.x += -dt * spd * Input.axis("mouseX");
                    position.y += dt * spd * Input.axis("mouseY");
                }
                camera2d.setOrthographicSize(camera2d.orthographicSize + -dt * this.zoomSpeed * Input.axis("mouseWheel"));
            }
        };


        return CameraControl;
    }
);
