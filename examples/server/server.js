var requirejs = require("requirejs");

requirejs(
    {
        baseUrl: "./src",
        nodeRequire: require
    },
	[
		"odin/odin_server"
	],
    function(Odin) {
		
		Odin.globalize();
		
		var game = new ServerGame({
			debug: true,
			host: "192.168.1.232",
			port: 3000
		});
		
		var scene = new Scene;
		
		Assets.add(
			new Texture({
				name: "img_player",
				src: "./content/images/player.png"
			}),
			new SpriteSheet({
				name: "ss_player",
				src: "./content/spritesheets/player.json"
			})
		);
		
		game.addScene(scene);
		
		game.on("connection", function(client){
			var player = new GameObject({
					components: [
						new Transform2D,
						new Sprite2D({
							texture: Assets.hash["img_player"],
							x: 0,
							y: 0,
							w: 64,
							h: 64,
							sync: false
						})
					]
				}),
				camera = new GameObject({
					components: [
						new Transform2D,
						new Camera2D
					]
				});
			
			scene.add(player, camera);
			
			client.setScene(scene);
			client.setCamera(camera);
			
			client.socket.emit("player", player._id);
			
			client.on("update", function(){
				var input = this.input,
					transform2d = player.transform2d,
					dt = 2 * Time.delta,
					touch = input.touches[0],
					w = this.camera.width * 0.25,
					h = this.camera.height * 0.25,
					x = dt * input.axis("horizontal"),
					y = dt * input.axis("vertical");
				
				if (touch) {
					transform2d.position.x += dt * (touch.delta.x / w);
					transform2d.position.y += dt * (touch.delta.y / h);
				} else {
					transform2d.position.x += x;
					transform2d.position.y += y;
				}
			});
			
			client.on("disconnect", function(){
				
				scene.remove(player, camera);
			});
		});
		
		game.init();
    }
);