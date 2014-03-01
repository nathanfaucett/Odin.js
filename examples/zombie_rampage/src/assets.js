define([
        "odin/odin"
    ],
    function(Odin) {


        Odin.Assets.addAssets(
            new Odin.Texture({
                name: "img_smoke",
                src: "content/smoke.png",
                filter: Odin.Enums.FilterMode.None
            }),
            new Odin.Texture({
                src: "content/blood.png",
                name: "img_blood",
                filter: Odin.Enums.FilterMode.None
            }),
            new Odin.Texture({
                name: "img_objects",
                src: "content/objects.png",
                filter: Odin.Enums.FilterMode.None
            }),
            new Odin.Texture({
                name: "img_player",
                src: "content/player.png",
                filter: Odin.Enums.FilterMode.None
            }),
            new Odin.Texture({
                name: "img_zombie",
                src: "content/zombie.png",
                filter: Odin.Enums.FilterMode.None
            }),
            new Odin.Texture({
                name: "img_zombie_big",
                src: "content/zombie_big.png",
                filter: Odin.Enums.FilterMode.None
            }),
            new Odin.Texture({
                name: "img_zombie_red",
                src: "content/zombie_red.png",
                filter: Odin.Enums.FilterMode.None
            }),

            new Odin.AudioClip({
                name: "snd_fire",
                src: "content/audio/fire.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_rocket",
                src: "content/audio/rocket.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_shot_short",
                src: "content/audio/shot_short.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_shot_mid",
                src: "content/audio/shot_mid.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_shot_long",
                src: "content/audio/shot_long.ogg"
            }),

            new Odin.AudioClip({
                name: "snd_player_moan1",
                src: "content/audio/player_moan1.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_player_moan2",
                src: "content/audio/player_moan2.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_player_moan3",
                src: "content/audio/player_moan3.ogg"
            }),

            new Odin.AudioClip({
                name: "snd_zombie_moan1",
                src: "content/audio/zombie_moan1.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_zombie_moan2",
                src: "content/audio/zombie_moan2.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_zombie_moan3",
                src: "content/audio/zombie_moan3.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_zombie_moan4",
                src: "content/audio/zombie_moan4.ogg"
            }),

            new Odin.SpriteSheet({
                name: "ss_mid",
                src: "content/32x32.json"
            }),
            new Odin.SpriteSheet({
                name: "ss_small",
                src: "content/16x16.json"
            }),
            new Odin.SpriteSheet({
                name: "ss_fire",
                src: "content/fire.json"
            })
        );
    }
);
