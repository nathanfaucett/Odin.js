require({
        baseUrl: "src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();


        function CameraControl(opts) {
            opts || (opts = {});

            Component.call(this, "CameraControl", opts);

            this.speed = 2;
            this.zoomSpeed = 6;
        }

        Component.extend(CameraControl);


        var ZERO = new Vec3;
        CameraControl.prototype.update = function() {
            var transform = this.transform,
                position = transform.position,
                camera = this.camera,
                dt = Time.delta,
                spd = this.speed;

            if (Input.mouseButton(0)) {
                position.x += -dt * spd * Input.axis("mouseX");
                position.z += dt * spd * Input.axis("mouseY");
            }

            transform.lookAt(ZERO);
        };
		
		var marine_dif =new Texture({
			name: "img_marine_dif",
			src: "../content/images/marine_dif.jpg"
		});
		

        Assets.add(
            marine_dif,
            new Mesh({
                name: "mesh_box",
                src: "../content/geometry/box.json"
            }),
			new Material({
				load: false,
				name: "mat_default",
				
				color: new Color("white"),
				mainTexture: marine_dif,
				
				vertex: [
					"uniform mat4 matrix;",
					"uniform vec2 mainTextureOffset;",
					"uniform vec2 mainTextureScale;",
					
					"attribute vec3 aVertexPosition;",
					"attribute vec2 aVertexUv;",
	
					"varying vec2 vVertexUv;",
					
					"void main() {",
					
					"	vVertexUv = mainTextureOffset + aVertexUv / mainTextureScale;",
					"	gl_Position = matrix * vec4(aVertexPosition, 1.0);",
					"}"
				].join("\n"),
				fragment: [
					"uniform vec3 color;",
					"uniform float alpha;",
					"uniform sampler2D mainTexture;",
					
					"varying vec2 vVertexUv;",
					
					"void main() {",
					 "	vec4 finalColor = texture2D(mainTexture, vVertexUv);",
					"	finalColor.xyz *= color;",
					"	finalColor.w *= alpha;",
	
					"	gl_FragColor = finalColor;",
					"}"
				].join("\n")
			})
        );

        game = new Game({
            debug: true
        });

        var scene = new Scene({
            name: "PlayGround"
        });

        var camera = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 10, 10)
                }),
                new Camera,
                new CameraControl
            ],
            tag: "Camera"
        });
        mesh = new GameObject({
            components: [
                new Transform,
                new MeshFilter({
                    mesh: Assets.hash["mesh_box"],
					material: Assets.hash["mat_default"]
                })
            ],
            tag: "Mesh"
        });

        scene.add(camera, mesh);
        game.addScene(scene);


        start = function() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));
        }

        restart = function() {
            start();
        }


        game.on("init", function() {
            start();
        });


        AssetLoader.load(function() {

            game.init();
        });
    }
);
