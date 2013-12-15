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
		var lastInput;
		
		game.addScene(scene);
		
		game.on("connection", function(client){
			var player = new GameObject({
					components: [
						new Transform2D,
						new Sprite2D({
							x: 0,
							y: 0,
							w: 1,
							h: 1
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
			
			client.userData.player = player;
			client.userData.camera = camera;
			
			client.socket.emit("player_id", player._id);
			
			client.on("update", function(){
				var input = this.input,
					transform2d = player.transform2d,
					dt = 2 * Time.delta;
					x = dt * input.axis("horizontal"),
					y = dt * input.axis("vertical");
				
				transform2d.position.x += x;
				transform2d.position.y += y;
			});
			
			client.on("disconnect", function(){
				
				scene.remove(player, camera);
			});
		});
		
		game.init();
    }
);