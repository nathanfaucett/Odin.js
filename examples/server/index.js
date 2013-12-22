require({
        baseUrl: "./src/"
    }, [
        "odin/odin"
    ],
    function(Odin) {
		
		Odin.globalize();
		
		game = new ClientGame({
			debug: true,
			forceCanvas: false
		});
		
		game.on("init", function() {
			
			game.connect(function(socket) {
				
				socket.on("player", function(player_id) {
					var player = window.player = game.scene.findByServerId(player_id),
						camera = game.camera.gameObject;
					
					camera.on("update", function() {
						var transform2d = this.transform2d,
							camera2d = this.camera2d,
							dt = Time.delta,
							x = 0, y = 0;
						
						if (Device.mobile) {
							x = player.transform2d.position.x;
							y = player.transform2d.position.y;
							x -= transform2d.position.x;
							y -= transform2d.position.y;
							
							x *= dt;
							y *= dt;
						} else {
							if (Input.mouseButton(0)) {
								x = -dt * Input.axis("mouseX");
								y = dt * Input.axis("mouseY");
							}
							camera2d.setOrthographicSize(camera2d.orthographicSize + -dt*Input.axis("mouseWheel"));
						}
						
						transform2d.position.x += x;
						transform2d.position.y += y;
					});
					
					player.on("update", function() {
						var transform2d = this.transform2d,
							dt = Time.delta,
							x, y;
						
						if (Device.mobile) {
							x = dt * Input.axis("touchX");
							y = dt * Input.axis("touchY");
						} else {
							x = 2 * dt * Input.axis("horizontal");
							y = 2 * dt * Input.axis("vertical");
						}
						
						transform2d.position.x += x;
						transform2d.position.y += y;
					});
				});
			});
		});
		
		game.init();
    }
);