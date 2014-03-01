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


        function Mesh(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.vertices = opts.vertices != undefined ? opts.vertices : [];

            this.normals = opts.normals != undefined ? opts.normals : [];

            this.tangents = opts.tangents != undefined ? opts.tangents : [];

            this.indices = opts.indices != undefined ? opts.indices : [];

            this.colors = opts.colors != undefined ? opts.colors : [];

            this.uvs = opts.uvs != undefined ? opts.uvs : [];
            this.uvs2 = opts.uvs2 != undefined ? opts.uvs2 : [];

            this.bones = opts.bones != undefined ? opts.bones : [];
            this.boneIndices = opts.boneIndices != undefined ? opts.boneIndices : [];
            this.boneWeights = opts.boneWeights != undefined ? opts.boneWeights : [];

            this.dynamic = opts.dynamic != undefined ? !! opts.dynamic : false;
            this.useBones = opts.useBones != undefined ? !! opts.useBones : this.bones.length > 0 ? true : false;

            this.aabb = new AABB3;
            if (opts.vertices) this.aabb.fromPoints(this.vertices);

            this._webgl = {};

            this.verticesNeedUpdate = true;
            this.normalsNeedUpdate = true;
            this.tangentsNeedUpdate = true;
            this.indicesNeedUpdate = true;
            this.colorsNeedUpdate = true;
            this.uvsNeedUpdate = true;
            this.uvs2NeedUpdate = true;

            this.boneIndicesNeedUpdate = true;
            this.boneWeightsNeedUpdate = true;

            this._webglBuffersInitted = undefined;
            this._webglUsed = 0;

            this._webglVertexBuffer = undefined;
            this._webglNormalBuffer = undefined;
            this._webglTangentBuffer = undefined;
            this._webglColorBuffer = undefined;
            this._webglUvBuffer = undefined;
            this._webglUv2Buffer = undefined;

            this._webglBoneIndicesBuffer = undefined;
            this._webglBoneWeightsBuffer = undefined;

            this._webglIndexBuffer = undefined;
            this._webglLineBuffer = undefined;

            this._webglVertexArray = undefined;
            this._webglNormalArray = undefined;
            this._webglTangentArray = undefined;
            this._webglColorArray = undefined;
            this._webglUvArray = undefined;
            this._webglUv2Array = undefined;

            this._webglBoneIndicesArray = undefined;
            this._webglBoneWeightsArray = undefined;

            this._webglIndexArray = undefined;
            this._webglLineArray = undefined;

            this._webglVertexCount = undefined;
            this._webglLineCount = undefined;

            if (opts.json) this.fromJSON(opts.json);
        }

        Asset.extend(Mesh);


        Mesh.prototype.copy = function(other) {
            Asset.prototype.copy.call(this, other);
            var vertices = this.vertices,
                otherVertices = other.vertices,
                normals = this.normals,
                otherNormals = other.normals,
                tangents = this.tangents,
                otherTangents = other.tangents,
                indices = this.indices,
                otherIndices = other.indices,
                colors = this.colors,
                otherColors = other.colors,
                uvs = this.uvs,
                otherUvs = other.uvs,
                uvs2 = this.uvs2,
                otherUv2s = other.uvs2,
                bones = this.bones,
                otherBones = other.bones,
                boneIndices = this.boneIndices,
                otherBoneIndices = other.boneIndices,
                boneWeights = this.boneWeights,
                otherBoneWeights = other.boneWeights,
                i;

            vertices.length = otherVertices.length;
            normals.length = otherNormals.length;
            tangents.length = otherTangents.length;
            indices.length = otherIndices.length;
            colors.length = otherColors.length;
            uvs.length = otherUvs.length;
            uvs2.length = otherUv2s.length;

            bones.length = otherBones.length;
            boneIndices.length = otherBoneIndices.length;
            boneWeights.length = otherBoneWeights.length;

            for (i = otherVertices.length; i--;) vertices[i] = (vertices[i] || new Vec3).copy(otherVertices[i]);
            for (i = otherNormals.length; i--;) normals[i] = (normals[i] || new Vec3).copy(otherNormals[i]);
            for (i = otherTangents.length; i--;) tangents[i] = (tangents[i] || new Vec4).copy(otherTangents[i]);
            for (i = otherIndices.length; i--;) indices[i] = otherIndices[i];
            for (i = otherColors.length; i--;) colors[i] = (colors[i] || new Color).copy(otherColors[i]);
            for (i = otherUvs.length; i--;) uvs[i] = (uvs[i] || new Vec2).copy(otherUvs[i]);
            for (i = otherUv2s.length; i--;) uvs2[i] = (uvs2[i] || new Vec2).copy(otherUv2s[i]);
            for (i = otherBones.length; i--;) bones[i] = (bones[i] || new Bone).copy(otherBones[i]);
            for (i = otherBoneIndices.length; i--;) boneIndices[i] = otherBoneIndices[i];
            for (i = otherBoneWeights.length; i--;) boneWeights[i] = otherBoneWeights[i];

            this.dynamic = other.dynamic;
            this.useBones = other.useBones;

            this.aabb.fromPoints(this.vertices);

            this.verticesNeedUpdate = true;
            this.normalsNeedUpdate = true;
            this.tangentsNeedUpdate = true;
            this.indicesNeedUpdate = true;
            this.colorsNeedUpdate = true;
            this.uvsNeedUpdate = true;
            this.uvs2NeedUpdate = true;
            this.boneIndicesNeedUpdate = true;
            this.boneWeightsNeedUpdate = true;

            return this;
        };


        Mesh.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            this.vertices.length = 0;
            this.normals.length = 0;
            this.tangents.length = 0;
            this.indices.length = 0;
            this.colors.length = 0;
            this.uvs.length = 0;
            this.uvs2.length = 0;

            this.bones.length = 0;
            this.boneIndices.length = 0;
            this.boneWeights.length = 0;

            this.aabb.clear();

            this.verticesNeedUpdate = true;
            this.normalsNeedUpdate = true;
            this.tangentsNeedUpdate = true;
            this.indicesNeedUpdate = true;
            this.colorsNeedUpdate = true;
            this.uvsNeedUpdate = true;
            this.uvs2NeedUpdate = true;
            this.boneIndicesNeedUpdate = true;
            this.boneWeightsNeedUpdate = true;

            return this;
        };


        var EMPTY_ARRAY = [];

        Mesh.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);
            var vertices = this.vertices,
                normals = this.normals,
                tangents = this.tangents,
                indices = this.indices,
                colors = this.colors,
                uvs = this.uvs,
                uvs2 = this.uvs2,
                bones = this.bones,
                boneWeights = this.boneWeights,
                boneIndices = this.boneIndices,
                bone, items, item,
                i, il;

            vertices.length = normals.length = tangents.length = indices.length = colors.length = uvs.length = uvs2.length = 0;
            bones.length = boneWeights.length = boneIndices.length = 0;

            items = raw.vertices || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) vertices.push(new Vec3(items[i], items[i + 1], items[i + 2]));

            items = raw.normals || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) normals.push(new Vec3(items[i], items[i + 1], items[i + 2]));

            items = raw.tangents || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 4) tangents.push(new Vec4(items[i], items[i + 1], items[i + 2], items[i + 3]));

            items = raw.indices || raw.faces || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) indices.push(items[i], items[i + 1], items[i + 2]);

            items = raw.colors || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 3) colors.push(new Color(items[i], items[i + 1], items[i + 2]));

            items = raw.uvs || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 2) uvs.push(new Vec2(items[i], items[i + 1]));

            items = raw.uvs2 || EMPTY_ARRAY;
            for (i = 0, il = items.length; i < il; i += 2) uvs2.push(new Vec2(items[i], items[i + 1]));

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

            this.verticesNeedUpdate = true;
            this.normalsNeedUpdate = true;
            this.tangentsNeedUpdate = true;
            this.indicesNeedUpdate = true;
            this.colorsNeedUpdate = true;
            this.uvsNeedUpdate = true;
            this.uvs2NeedUpdate = true;
            this.boneIndicesNeedUpdate = true;
            this.boneWeightsNeedUpdate = true;

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
                    indices = this.indices,
                    a, b, c, va, vb, vc, i;

                for (i = vertices.length; i--;)(normals[i] || (normals[i] = new Vec3)).set(0, 0, 0);

                for (i = indices.length; i -= 3;) {
                    a = indices[i];
                    b = indices[i + 1];
                    c = indices[i + 2];

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

                for (i = indices.length; i -= 3;) {
                    normals[indices[i]].normalize();
                    normals[indices[i + 1]].normalize();
                    normals[indices[i + 2]].normalize();
                }

                this.normalsNeedUpdate = true;

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
                var indices = this.indices,
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

                for (i = vertices.length; i--;) uvs[i] = uvs[i] || (uvs[i] = new Vec2);

                for (i = indices.length; i -= 3;) {
                    a = indices[i];
                    b = indices[i + 1];
                    c = indices[i + 2];

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

                this.tangentsNeedUpdate = true;

                return this;
            };
        }();


        Mesh.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);
            var vertices = this.vertices,
                jsonVertices = json.vertices || (json.vertices = []),
                normals = this.normals,
                jsonNormals = json.normals || (json.normals = []),
                tangents = this.tangents,
                jsonTangents = json.tangents || (json.tangents = []),
                indices = this.indices,
                jsonIndices = json.indices || (json.indices = []),
                colors = this.colors,
                jsonColors = json.colors || (json.colors = []),
                uvs = this.uvs,
                jsonUvs = json.uvs || (json.uvs = []),
                uvs2 = this.uvs2,
                jsonUv2s = json.uvs2 || (json.uvs2 = []),
                bones = this.bones,
                jsonBones = json.bones || (json.bones = []),
                boneIndices = this.boneIndices,
                jsonBoneIndices = json.boneIndices || (json.boneIndices = []),
                boneWeights = this.boneWeights,
                jsonBoneWeights = json.boneWeights || (json.boneWeights = []),
                i;

            jsonVertices.length = vertices.length;
            jsonNormals.length = normals.length;
            jsonTangents.length = tangents.length;
            jsonIndices.length = indices.length;
            jsonColors.length = colors.length;
            jsonUvs.length = uvs.length;
            jsonUv2s.length = uvs2.length;

            jsonBones.length = bones.length;
            jsonBoneIndices.length = boneIndices.length;
            jsonBoneWeights.length = boneWeights.length;

            for (i = vertices.length; i--;) jsonVertices[i] = vertices[i].toJSON(jsonVertices[i]);
            for (i = normals.length; i--;) jsonNormals[i] = normals[i].toJSON(jsonNormals[i]);
            for (i = tangents.length; i--;) jsonTangents[i] = tangents[i].toJSON(jsonTangents[i]);
            for (i = indices.length; i--;) indices[i] = jsonIndices[i];
            for (i = colors.length; i--;) jsonColors[i] = colors[i].toJSON(jsonColors[i]);
            for (i = uvs.length; i--;) jsonUvs[i] = uvs[i].toJSON(jsonUvs[i]);
            for (i = uvs2.length; i--;) jsonUv2s[i] = uvs2[i].toJSON(jsonUv2s[i]);
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
                indices = this.indices,
                jsonIndices = json.indices,
                colors = this.colors,
                jsonColors = json.colors,
                uvs = this.uvs,
                jsonUvs = json.uvs,
                uvs2 = this.uvs2,
                jsonUv2s = json.uvs2,
                bones = this.bones,
                jsonBones = json.bones,
                boneIndices = this.boneIndices,
                jsonBoneIndices = json.boneIndices,
                boneWeights = this.boneWeights,
                jsonBoneWeights = json.boneWeights,
                i;

            vertices.length = jsonVertices.length;
            normals.length = jsonNormals.length;
            tangents.length = jsonTangents.length;
            indices.length = jsonIndices.length;
            colors.length = jsonColors.length;
            uvs.length = jsonUvs.length;
            uvs2.length = jsonUv2s.length;

            bones.length = jsonBones.length;
            boneIndices.length = jsonBoneIndices.length;
            boneWeights.length = jsonBoneWeights.length;

            for (i = jsonVertices.length; i--;) vertices[i] = (vertices[i] || new Vec3).copy(jsonVertices[i]);
            for (i = jsonNormals.length; i--;) normals[i] = (normals[i] || new Vec3).copy.fromJSON(jsonNormals[i]);
            for (i = jsonTangents.length; i--;) tangents[i] = (tangents[i] || new Vec4).fromJSON(jsonTangents[i]);
            for (i = jsonIndices.length; i--;) indices[i] = jsonIndices[i];
            for (i = jsonColors.length; i--;) colors[i] = (colors[i] || new Color).fromJSON(jsonColors[i]);
            for (i = jsonUvs.length; i--;) uvs[i] = (uvs[i] || new Vec2).fromJSON(jsonUvs[i]);
            for (i = jsonUv2s.length; i--;) uvs2[i] = (uvs2[i] || new Vec2).fromJSON(jsonUv2s[i]);
            for (i = jsonBones.length; i--;) bones[i] = (bones[i] || new Bone).fromJSON(jsonBones[i]);
            for (i = jsonBoneIndices.length; i--;) boneIndices[i] = jsonBoneIndices[i];
            for (i = jsonBoneWeights.length; i--;) boneWeights[i] = jsonBoneWeights[i];

            this.dynamic = json.dynamic;
            this.useBones = json.useBones;

            this.aabb.fromPoints(this.vertices);

            this.verticesNeedUpdate = true;
            this.normalsNeedUpdate = true;
            this.tangentsNeedUpdate = true;
            this.indicesNeedUpdate = true;
            this.colorsNeedUpdate = true;
            this.uvsNeedUpdate = true;
            this.uvs2NeedUpdate = true;
            this.boneIndicesNeedUpdate = true;
            this.boneWeightsNeedUpdate = true;

            return this;
        };


        var PI = Math.PI,
            HALF_PI = PI * 0.5,
            TWO_PI = PI * 2,
            sin = Math.sin,
            cos = Math.cos;
        Mesh.Sphere = function(opts) {
            opts || (opts = {});
            var radius = opts.radius != undefined ? opts.radius : 0.5,
                segments = (opts.segments != undefined ? floor(max(opts.segments, 3)) : 16) + 1,
                rings = (opts.rings != undefined ? floor(max(opts.rings, 3)) : 8) + 2,

                R = 1 / (rings - 1),
                S = 1 / (segments - 1),
                r, s,
                x, y, z,
                a, b, c, d,

                mesh = new Mesh(opts),
                vertices = mesh.vertices,
                normals = mesh.normals,
                uvs = mesh.uvs,
                colors = mesh.colors,
                indices = mesh.indices;

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

                    indices.push(a, b, c);
                    indices.push(a, c, d);
                }
            }

            mesh.calculateAABB();
            mesh.load = false;

            return mesh;
        };


        Mesh.Cube = function(opts) {
            opts || (opts = {});
            var w = opts.width || 1,
                h = opts.height || 1,
                d = opts.depth || 1,
                hw = w * 0.5,
                hh = h * 0.5,
                hd = d * 0.5,
                ws = (opts.widthSegments || 1),
                hs = (opts.heightSegments || 1),
                ds = (opts.depthSegments || 1),
                mesh = new Mesh(opts);

            buildPlane(mesh, "z", "y", -1, -1, d, ds, h, hs, hw, ws);
            buildPlane(mesh, "z", "y", 1, -1, d, ds, h, hs, -hw, ws);
            buildPlane(mesh, "x", "z", 1, 1, w, ws, d, ds, hh, hs);
            buildPlane(mesh, "x", "z", 1, -1, w, ws, d, ds, -hh, hs);
            buildPlane(mesh, "x", "y", 1, -1, w, ws, h, hs, hd, ds);
            buildPlane(mesh, "x", "y", -1, -1, w, ws, h, hs, -hd, ds);

            mesh.calculateAABB();
            mesh.load = false;

            return mesh;
        };


        Mesh.Plane = function(opts) {
            opts || (opts = {});
            var w = opts.width || 1,
                h = opts.height || 1,
                hw = w * 0.5,
                hh = h * 0.5,
                ws = (opts.widthSegments || 1),
                hs = (opts.heightSegments || 1),
                mesh = new Mesh(opts);

            buildPlane(mesh, "x", "y", 1, 1, w, ws, h, hs, 0, 0);

            mesh.calculateAABB();
            mesh.load = false;

            return mesh;
        };


        function buildPlane(mesh, u, v, udir, vdir, width, ws, height, hs, depth, ds) {
            var vertices = mesh.vertices,
                normals = mesh.normals,
                indices = mesh.indices,
                uvs = mesh.uvs,
                gridX = ws,
                gridY = hs,
                width_half = width / 2,
                height_half = height / 2,
                offset = vertices.length,
                w, ix, iy;

            if ((u === "x" && v === "y") || (u === "y" && v === "x")) {
                w = "z";
            } else if ((u === "x" && v === "z") || (u === "z" && v === "x")) {
                w = "y";
                gridY = ds;
            } else if ((u === "z" && v === "y") || (u === "y" && v === "z")) {
                w = "x";
                gridX = ds;
            }

            var gridX1 = gridX + 1,
                gridY1 = gridY + 1,
                segment_width = width / gridX,
                segment_height = height / gridY,
                normal = new Vec3();

            normal[w] = depth > 0 ? 1 : -1;

            for (iy = 0; iy < gridY1; iy++) {
                for (ix = 0; ix < gridX1; ix++) {
                    var vector = new Vec3();

                    vector[u] = (ix * segment_width - width_half) * udir;
                    vector[v] = (iy * segment_height - height_half) * vdir;
                    vector[w] = depth;

                    vertices.push(vector);
                }
            }

            for (iy = 0; iy < gridY; iy++) {
                for (ix = 0; ix < gridX; ix++) {
                    var a = offset + (ix + gridX1 * iy),
                        b = offset + (ix + gridX1 * (iy + 1)),
                        c = offset + ((ix + 1) + gridX1 * (iy + 1)),
                        d = offset + ((ix + 1) + gridX1 * iy),

                        uva = new Vec2(ix / gridX, 1 - iy / gridY),
                        uvb = new Vec2(ix / gridX, 1 - (iy + 1) / gridY),
                        uvc = new Vec2((ix + 1) / gridX, 1 - iy / gridY),
                        uvd = new Vec2((ix + 1) / gridX, 1 - (iy + 1) / gridY);

                    normals.push(normal.clone(), normal.clone(), normal.clone(), normal.clone());
                    uvs.push(uva, uvb, uvc, uvd);
                    indices.push(
                        a, b, c,
                        a, c, d
                    );
                }
            }
        }


        Mesh.Bone = Bone;


        return Mesh;
    }
);
