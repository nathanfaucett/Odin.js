if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/asset",
        "odin/core/assets/bone",
        "odin/math/vec2",
        "odin/math/vec3",
        "odin/math/vec4",
        "odin/math/color"
    ],
    function(Asset, Bone, Vec2, Vec3, Vec4, Color) {
        "use strict";


        var EMPTY_ARRAY = [];


        function Mesh(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.vertices = opts.vertices != undefined ? opts.vertices : [];

            this.normals = opts.normals != undefined ? opts.normals : [];

            this.tangents = opts.tangents != undefined ? opts.tangents : [];

            this.faces = opts.faces != undefined ? opts.faces : [];

            this.colors = opts.colors != undefined ? opts.colors : [];

            this.uvs = opts.uvs != undefined ? opts.uvs : [];

            this.bones = opts.bones != undefined ? opts.bones : [];
            this.boneIndices = opts.boneIndices != undefined ? opts.boneIndices : [];
            this.boneWeights = opts.boneWeights != undefined ? opts.boneWeights : [];

            this.dynamic = opts.dynamic != undefined ? !! opts.dynamic : false;
            this.useBones = opts.useBones != undefined ? !! opts.useBones : false;

            this.aabb = new AABB3;
            if (opts.vertices) this.aabb.fromPoints(this.vertices);

            this._needsUpdate = true;

            if (opts.data) this.fromJSON(opts.data);
        }

        Asset.extend(Mesh);


        Mesh.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);
            var vertices = this.vertices,
                normals = this.normals,
                tangents = this.tangents,
                faces = this.faces,
                colors = this.colors,
                uvs = this.uvs,
                bones = this.bones,
                boneWeights = this.boneWeights,
                boneIndices = this.boneIndices,
                bone, items, item,
                i, il;

            vertices.length = normals.length = tangents.length = faces.length = colors.length = uvs.length = 0;
            bones.length = boneWeights.length = boneIndices.length = 0;

            items = raw.vertices || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) vertices.push(new Vec3(items[i], items[i + 1], items[i + 2]));

            items = raw.normals || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) normals.push(new Vec3(items[i], items[i + 1], items[i + 2]));

            items = raw.tangents || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 4) tangents.push(new Vec4(items[i], items[i + 1], items[i + 2], items[i + 3]));

            items = raw.faces || raw.indices || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) faces.push(items[i], items[i + 1], items[i + 2]);

            items = raw.colors || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) colors.push(new Color(items[i], items[i + 1], items[i + 2]));

            items = raw.uvs || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 2) uvs.push(new Vec2(items[i], items[i + 1]));

            items = raw.bones || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i++) {
                item = items[i];

                bone = new Bone(item.parent, item.name);

                bone.position.fromArray(item.position);
                bone.rotation.fromArray(item.rotation);
                bone.scale.fromArray(item.scale);

                bone.bindPose.fromArray(item.bindPose);

                bone.skinned = item.skinned;

                bone.inheritPoosition = item.inheritPoosition;
                bone.inheritRotation = item.inheritRotation;
                bone.inheritScale = item.inheritScale;

                bones.push(bone);
            }
            if (items.length) this.useBones = true;

            items = raw.boneWeights || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i++) boneWeights.push(items[i]);

            items = raw.boneIndices || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i++) boneIndices.push(items[i]);

            this.aabb.fromPoints(this.vertices);

            return this;
        };


        Mesh.prototype.calculateAABB = function() {

            this.aabb.fromPoints(this.vertices);
        };


        Mesh.prototype.calculateNormals = function() {
            var u = new Vec3,
                v = new Vec3,
                uv = new Vec3,
                faceNormal = new Vec3;

            return function() {
                var vertices = this.vertices,
                    normals = this.normals,
                    faces = this.faces,
                    a, b, c, va, vb, vc, i;

                for (i = vertices.length; i -= 3;) {
                    (normals[i] || (normals[i] = new Vec3)).set(0, 0, 0);
                }

                for (i = faces.length; i -= 3;) {
                    a = i;
                    b = i + 1;
                    c = i + 2;

                    va = vertices[a];
                    vb = vertices[b];
                    vc = vertices[c];

                    u.vsub(vc, vb);
                    v.vsub(va, vb);

                    uv.vcross(u, v);

                    faceNormal.copy(uv).normalize();

                    normals[a].add(faceNormal);
                    normals[b].add(faceNormal);
                    normals[c].add(faceNormal);
                }

                for (i = faces.length; i -= 3;) {
                    normals[i].normalize();
                    normals[i + 1].normalize();
                    normals[i + 2].normalize();
                }

                this._needsUpdate = true;

                return this;
            };
        }();


        Mesh.prototype.calculateTangents = function() {
            var tan1 = [],
                tan2 = [],
                sdir = new Vec3,
                tdir = new Vec3,
                n = new Vec3,
                t = new Vec3,
                tmp1 = new Vec3,
                tmp2 = new Vec3;

            return function() {
                var faces = this.faces,
                    vertices = this.vertices,
                    normals = this.normals,
                    tangents = this.tangents,
                    uvs = this.uvs,

                    v1, v2, v3,
                    w1, w2, w3,

                    x1, x2, y1, y2, z1, z2,
                    s1, s2, t1, t2,
                    a, b, c,

                    r, w, i;

                for (i = vertices.length; i--;) {
                    (tan1[i] || (tan1[i] = new Vec3)).set(0, 0, 0);
                    (tan2[i] || (tan2[i] = new Vec3)).set(0, 0, 0);
                    (tangents[i] || (tangents[i] = new Vec4)).set(0, 0, 0, 1);
                }

                for (i = vertices.length; i--;) {
                    uvs[i] = uvs[i] || (uvs[i] = new Vec2);
                }

                for (i = faces.length; i -= 3;) {
                    a = i;
                    b = i + 1;
                    c = i + 2;

                    v1 = vertices[a];
                    v2 = vertices[b];
                    v3 = vertices[c];

                    w1 = uvs[a];
                    w2 = uvs[b];
                    w3 = uvs[c];

                    x1 = v2.x - v1.x;
                    x2 = v3.x - v1.x;
                    y1 = v2.y - v1.y;
                    y2 = v3.y - v1.y;
                    z1 = v2.z - v1.z;
                    z2 = v3.z - v1.z;

                    s1 = w2.x - w1.x;
                    s2 = w3.x - w1.x;
                    t1 = w2.y - w1.y;
                    t2 = w3.y - w1.y;

                    r = s1 * t2 - s2 * t1;
                    r = r !== 0 ? 1 / r : 0;

                    sdir.set(
                        (t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r
                    );

                    tdir.set(
                        (s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r
                    );

                    tan1[a].add(sdir);
                    tan1[b].add(sdir);
                    tan1[c].add(sdir);

                    tan2[a].add(tdir);
                    tan2[b].add(tdir);
                    tan2[c].add(tdir);
                }

                for (i = vertices.length; i--;) {
                    t.copy(tan1[i]);
                    n.copy(normals[i]);

                    tmp1.copy(t);
                    tmp1.sub(n.smul(n.dot(t))).normalize();

                    n.copy(normals[i]);
                    tmp2.vcross(n, t);

                    w = (tmp2.dot(tan2[i]) < 0) ? -1 : 1;

                    tangents[i].set(tmp1.x, tmp1.y, tmp1.z, w);
                }

                this._needsUpdate = true;

                return this;
            };
        }();


        Mesh.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            this.vertices.length = this.normals.length = this.tangents.length = this.faces.length = this.colors.length = this.uvs.length = 0;
            this.bones.length = this.boneWeights.length = this.boneIndices.length = 0;

            return this;
        };


        Mesh.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);
            var vertices = this.vertices,
                jsonVertices = json.vertices || (json.vertices = []),
                normals = this.normals,
                jsonNormals = json.normals || (json.normals = []),
                tangents = this.tangents,
                jsonTangents = json.tangents || (json.tangents = []),
                faces = this.faces,
                jsonFaces = json.faces || (json.faces = []),
                colors = this.colors,
                jsonColors = json.colors || (json.colors = []),
                uvs = this.uvs,
                jsonUvs = json.uvs || (json.uvs = []),
                bones = this.bones,
                jsonBones = json.bones || (json.bones = []),
                boneIndices = this.boneIndices,
                jsonBoneIndices = json.boneIndices || (json.boneIndices = []),
                boneWeights = this.boneWeights,
                jsonBoneWeights = json.boneWeights || (json.boneWeights = []),
                i;

            jsonVertices.length = jsonNormals.length = jsonTangents.length = jsonFaces.length = jsonColors.length = jsonUvs.length = 0;
            jsonBones.length = jsonBoneWeights.length = jsonBoneIndices.length = 0;

            for (i = vertices.length; i--;) jsonVertices[i] = vertices[i].toJSON(jsonVertices[i]);
            for (i = normals.length; i--;) jsonNormals[i] = normals[i].toJSON(jsonNormals[i]);
            for (i = tangents.length; i--;) jsonTangents[i] = tangents[i].toJSON(jsonTangents[i]);
            for (i = faces.length; i--;) faces[i] = jsonFaces[i];
            for (i = colors.length; i--;) jsonColors[i] = colors[i].toJSON(jsonColors[i]);
            for (i = uvs.length; i--;) jsonUvs[i] = uvs[i].toJSON(jsonUvs[i]);
            for (i = bones.length; i--;) jsonBones[i] = bones[i].toJSON(jsonBones[i]);
            for (i = boneIndices.length; i--;) boneIndices[i] = jsonBoneIndices[i];
            for (i = boneWeights.length; i--;) boneWeights[i] = jsonBoneWeights[i];

            json.dynamic = this.dynamic;
            json.useBones = this.useBones;

            return json;
        };


        Mesh.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);
            var vertices = this.vertices,
                jsonVertices = json.vertices,
                normals = this.normals,
                jsonNormals = json.normals,
                tangents = this.tangents,
                jsonTangents = json.tangents,
                faces = this.faces,
                jsonFaces = json.faces,
                colors = this.colors,
                jsonColors = json.colors,
                uvs = this.uvs,
                jsonUvs = json.uvs,
                bones = this.bones,
                jsonBones = json.bones,
                boneIndices = this.boneIndices,
                jsonBoneIndices = json.boneIndices,
                boneWeights = this.boneWeights,
                jsonBoneWeights = json.boneWeights,
                i;

            vertices.length = normals.length = tangents.length = faces.length = colors.length = uvs.length = 0;
            bones.length = boneWeights.length = boneIndices.length = 0;

            for (i = jsonVertices.length; i--;) vertices[i] = new Vec3().fromJSON(jsonVertices[i]);
            for (i = jsonNormals.length; i--;) normals[i] = new Vec3().fromJSON(jsonNormals[i]);
            for (i = jsonTangents.length; i--;) tangents[i] = new Vec4().fromJSON(jsonTangents[i]);
            for (i = jsonFaces.length; i--;) faces[i] = jsonFaces[i];
            for (i = jsonColors.length; i--;) colors[i] = new Color().fromJSON(jsonColors[i]);
            for (i = jsonUvs.length; i--;) uvs[i] = new Vec2().fromJSON(jsonUvs[i]);
            for (i = jsonBones.length; i--;) bones[i] = new Bone().fromJSON(jsonBones[i]);
            for (i = jsonBoneIndices.length; i--;) boneIndices[i] = jsonBoneIndices[i];
            for (i = jsonBoneWeights.length; i--;) boneWeights[i] = jsonBoneWeights[i];

            this.dynamic = json.dynamic;
            this.useBones = json.useBones;

            this.aabb.fromPoints(this.vertices);
            this._needsUpdate = true;

            return this;
        };


        Mesh.Sphere = function(radius, segments, rings) {
            radius = radius !== undefined ? radius : 0.5;
            segments = (segments !== undefined ? floor(max(segments, 3)) : 16) + 1;
            rings = (rings !== undefined ? floor(max(rings, 3)) : 8) + 2;

            var R = 1 / (rings - 1),
                S = 1 / (segments - 1),
                r, s,
                x, y, z,
                a, b, c, d,

                mesh = new Mesh,
                vertices = mesh.vertices,
                normals = mesh.normals,
                uvs = mesh.uvs,
                colors = mesh.colors,
                faces = mesh.faces;

            for (r = 0; r < rings; r++) {
                for (s = 0; s < segments; s++) {
                    z = sin(-HALF_PI + PI * r * R);
                    x = cos(TWO_PI * s * S) * sin(PI * r * R);
                    y = sin(TWO_PI * s * S) * sin(PI * r * R);

                    vertices.push(new Vec3(x, y, z).smul(radius));
                    normals.push(new Vec3(x, y, z));
                    uvs.push(new Vec2(s * S, r * R));
                    colors.push(new Vec3(s * S, r * R, 0));
                }
            }

            for (r = 0; r < rings - 1; r++) {
                for (s = 0; s < segments - 1; s++) {
                    a = r * segments + s;
                    b = r * segments + (s + 1);
                    c = (r + 1) * segments + (s + 1);
                    d = (r + 1) * segments + s;

                    faces.push(a, b, c);
                    faces.push(a, c, d);
                }
            }

            mesh.calculateAABB();

            return mesh;
        };


        Mesh.Cube = function(width, height, depth) {
            var w = (width || 1) * 0.5,
                h = (height || 1) * 0.5,
                d = (depth || 1) * 0.5,
                mesh = new Mesh;

            mesh.addQuad(
                new Vec3(-w, h, -d),
                new Vec3(w, h, -d),
                new Vec3(w, -h, -d),
                new Vec3(-w, -h, -d)
            );

            addQuad(mesh,
                new Vec3(w, h, d),
                new Vec3(-w, h, d),
                new Vec3(-w, -h, d),
                new Vec3(w, -h, d)
            );

            addQuad(mesh,
                new Vec3(w, h, -d),
                new Vec3(w, h, d),
                new Vec3(w, -h, d),
                new Vec3(w, -h, -d)
            );

            addQuad(mesh,
                new Vec3(-w, h, d),
                new Vec3(-w, h, -d),
                new Vec3(-w, -h, -d),
                new Vec3(-w, -h, d)
            );

            addQuad(mesh,
                new Vec3(w, -h, d),
                new Vec3(-w, -h, d),
                new Vec3(-w, -h, -d),
                new Vec3(w, -h, -d)
            );

            addQuad(mesh,
                new Vec3(w, h, d),
                new Vec3(w, h, -d),
                new Vec3(-w, h, -d),
                new Vec3(-w, h, d)
            );

            mesh.calculateAABB();

            return mesh;
        };


        function addQuad(mesh, a, b, c, d, uvs) {
            var index = mesh.vertices.length;

            mesh.uvs.push(
                new Vec2(uvs[1], uvs[2]),
                new Vec2(uvs[0], uvs[2]),
                new Vec2(uvs[0], uvs[3]),
                new Vec2(uvs[1], uvs[3])
            );

            mesh.colors.push(
                new Vec3(uvs[1], uvs[2], 0),
                new Vec3(uvs[0], uvs[2], 0),
                new Vec3(uvs[0], uvs[3], 0),
                new Vec3(uvs[1], uvs[3], 0)
            );

            mesh.vertices.push(a, b, c, d);

            mesh.faces.push(
                index, index + 1, index + 2,
                index, index + 2, index + 3
            );
        };


        Mesh.Bone = Bone;


        return Mesh;
    }
);
