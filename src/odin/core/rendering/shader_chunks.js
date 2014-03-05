if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var ShaderChunks = {
            dHdxy_fwd: [
                "vec2 dHdxy_fwd(sampler2D map, vec2 uv, float scale) {",

                "	vec2 dSTdx = dFdx(uv);",
                "	vec2 dSTdy = dFdy(uv);",

                "	float Hll = scale * texture2D(map, uv).x;",
                "	float dBx = scale * texture2D(map, uv + dSTdx).x - Hll;",
                "	float dBy = scale * texture2D(map, uv + dSTdy).x - Hll;",

                "	return vec2(dBx, dBy);",
                "}",
                ""
            ].join("\n"),

            perturbNormalArb: [
                "vec3 perturbNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy) {",

                "	vec3 vSigmaX = dFdx(surf_pos);",
                "	vec3 vSigmaY = dFdy(surf_pos);",
                "	vec3 vN = surf_norm;",

                "	vec3 R1 = cross(vSigmaY, vN);",
                "	vec3 R2 = cross(vN, vSigmaX);",

                "	float fDet = dot(vSigmaX, R1);",
                "	vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);",

                "	return normalize(abs(fDet) * surf_norm - vGrad);",
                "}",
                ""
            ].join("\n"),

            perturbNormal2Arb: [
                "vec3 perturbNormal2Arb(sampler2D map, vec2 uv, vec3 eye_pos, vec3 surf_norm, float scale) {",

                "	vec3 q0 = dFdx(eye_pos.xyz);",
                "	vec3 q1 = dFdy(eye_pos.xyz);",
                "	vec2 st0 = dFdx(uv.st);",
                "	vec2 st1 = dFdy(uv.st);",

                "	vec3 S = normalize(q0 * st1.t - q1 * st0.t);",
                "	vec3 T = normalize(-q0 * st1.s + q1 * st0.s);",
                "	vec3 N = normalize(surf_norm);",

                "	vec3 mapN = texture2D(map, uv).xyz * 2.0 - 1.0;",
                "	mapN.xy = scale * mapN.xy;",
                "	mat3 tsn = mat3(S, T, N);",

                "	return normalize(tsn * mapN);",
                "}",
                ""
            ].join("\n"),

            getBoneMatrix: [
                "#ifdef USE_SKINNING",
                "mat4 getBoneMatrix(){",
                "	mat4 result = boneWeight.x * bones[ int( boneIndex.x ) ];",
                "	result = result + boneWeight.y * bones[ int( boneIndex.y ) ];",
                "	result = result + boneWeight.z * bones[ int( boneIndex.z ) ];",
                "	return result;",
                "}",
                "#endif",
                ""
            ].join("\n"),

            bone: [
                "	#ifdef USE_SKINNING",
                "		mat4 boneMatrix = getBoneMatrix();",

                "		#ifdef USE_MORPHTARGETS",
                "			vec4 boneVertex = vec4( morphed, 1.0 );",
                "		#else",
                "			vec4 boneVertex = vec4( position, 1.0 );",
                "		#endif",

                "		vec4 bone = boneMatrix * boneVertex;",
                "	#endif",
                ""
            ].join("\n"),

            boneNormal: [
                "	#ifdef USE_SKINNING",
                "		#ifdef USE_MORPHNORMALS",
                "			vec4 boneNormal = boneMatrix * vec4( morphedNormal, 0.0 );",
                "		#else",
                "			vec4 boneNormal = boneMatrix * vec4( normal, 0.0 );",
                "		#endif",
                "	#endif",
                ""
            ].join("\n"),

            transformedNormal: [
                "	vec3 objectNormal;",

                "	#ifdef USE_SKINNING",
                "	objectNormal = boneNormal.xyz;",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && defined( USE_MORPHNORMALS )",
                "	objectNormal = morphedNormal;",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && ! defined( USE_MORPHNORMALS )",
                "	objectNormal = normal;",
                "	#endif",

                "	vec3 transformedNormal = normalMatrix * objectNormal;",
                ""
            ].join("\n"),

            worldPosition: [
                "	#ifdef USE_SKINNING",
                "	vec4 worldPosition = modelMatrix * bone;",
                "	#endif",

                "	#if defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING ) && !defined( IS_SPRITE )",
                "	vec4 worldPosition = modelMatrix * vec4( morphed, 1.0 );",
                "	#endif",

                "	#if ! defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING ) && !defined( IS_SPRITE )",
                "	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS ) && defined( IS_SPRITE )",
                "	vec4 worldPosition = modelMatrix * vec4( morphed.xy * size, morphed.z, 1.0 );",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS ) && defined( IS_SPRITE )",
                "	vec4 worldPosition = modelMatrix * vec4( position.xy * size, position.z, 1.0 );",
                "	#endif",
                ""
            ].join("\n"),

            mvPosition: [
                "	vec4 mvPosition;",

                "	#ifdef USE_SKINNING",
                "	mvPosition = modelViewMatrix * bone;",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS ) && !defined( IS_SPRITE )",
                "	mvPosition = modelViewMatrix * vec4( morphed, 1.0 );",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS ) && !defined( IS_SPRITE )",
                "	mvPosition = modelViewMatrix * vec4( position, 1.0 );",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS ) && defined( IS_SPRITE )",
                "	mvPosition = modelViewMatrix * vec4( morphed.xy * size, morphed.z, 1.0 );",
                "	#endif",

                "	#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS ) && defined( IS_SPRITE )",
                "	mvPosition = modelViewMatrix * vec4( position.xy * size, position.z, 1.0 );",
                "	#endif",
                ""
            ].join("\n"),

            particle_header_vertex: [
                "attribute vec3 particleColor;",
                "uniform float particleSizeRatio;",
                ""
            ].join("\n"),

            particle_header: [
                "varying float vAngle;",
                "varying float vAlpha;",
                "varying float vSize;",
                "varying vec3 vParticleColor;",
                ""
            ].join("\n"),

            particle_vertex: [
                "	vAngle = data.x;",
                "	vAlpha = data.z;",
                "	vSize = data.y;",
                "	vParticleColor = particleColor;",
                ""
            ].join("\n"),

            particle_vertex_size: [
                "	gl_PointSize = vSize * (particleSizeRatio / length(mvPosition.xyz));\n",
                ""
            ].join("\n"),

            particle_vertex_size_2d: [
                "	gl_PointSize = vSize * particleSizeRatio;\n",
                ""
            ].join("\n"),

            sprite_header: [
                "uniform vec2 size;",
                "uniform vec4 crop;",
                ""
            ].join("\n"),

            sprite_vertex_after: [
                "	vUv.x = vUv.x * crop.z + crop.x;",
                "	vUv.y = vUv.y * crop.w + crop.y;",
                ""
            ].join("\n"),

            lights: [
                "uniform vec3 ambient;",

                "#if MAX_DIR_LIGHTS > 0",

                "uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
                "uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",

                "#endif",

                "#if MAX_HEMI_LIGHTS > 0",

                "uniform vec3 hemiLightColor[ MAX_HEMI_LIGHTS ];",
                "uniform vec3 hemiLightDirection[ MAX_HEMI_LIGHTS ];",

                "#endif",

                "#if MAX_POINT_LIGHTS > 0",

                "uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];",
                "uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];",
                "uniform float pointLightDistance[ MAX_POINT_LIGHTS ];",

                "#endif",

                "#if MAX_SPOT_LIGHTS > 0",

                "uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];",
                "uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];",
                "uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];",
                "uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];",
                "uniform float spotLightAngleCos[ MAX_SPOT_LIGHTS ];",
                "uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];",

                "#endif",
                ""
            ].join("\n"),

            VertexLight: [
                "void VertexLight(vec3 normal, vec3 worldPosition, vec3 viewPosition, inout vec3 diffuseLight) {",

                "	#if MAX_DIR_LIGHTS > 0",
                "		for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {",

                "			vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
                "			vec3 dirVector = normalize( lDirection.xyz );",

                "			float dotProduct = dot( normal, dirVector );",
                "			vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "			diffuseLight += directionalLightColor[ i ] * directionalLightWeighting;",
                "		}",
                "	#endif",

                "	#if MAX_POINT_LIGHTS > 0",
                "		for( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",

                "			vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
                "			vec3 lVector = lPosition.xyz + viewPosition;",

                "			float lDistance = 1.0;",
                "			if ( pointLightDistance[ i ] > 0.0 ) {",
                "				lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",
                "			}",

                "			lVector = normalize( lVector );",
                "			float dotProduct = dot( normal, lVector );",

                "			vec3 pointLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "			diffuseLight += pointLightColor[ i ] * pointLightWeighting * lDistance;",
                "		}",
                "	#endif",

                "	#if MAX_SPOT_LIGHTS > 0",
                "		for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {",

                "			vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
                "			vec3 lVector = lPosition.xyz + viewPosition;",

                "			float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - worldPosition ) );",

                "			if ( spotEffect > spotLightAngleCos[ i ] ) {",

                "				spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );",

                "				float lDistance = 1.0;",
                "				if ( spotLightDistance[ i ] > 0.0 ) {",
                "					lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );",
                "				}",

                "				lVector = normalize( lVector );",

                "				float dotProduct = dot( normal, lVector );",
                "				vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "				diffuseLight += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;",
                "			}",

                "		}",
                "	#endif",

                "	#if MAX_HEMI_LIGHTS > 0",
                "		for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

                "			vec4 lDirection = viewMatrix * vec4( hemiLightDirection[ i ], 0.0 );",
                "			vec3 lVector = normalize( lDirection.xyz );",

                "			float dotProduct = dot( normal, lVector );",
                "			float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",

                "			diffuseLight += hemiLightColor[ i ] * hemiDiffuseWeight;",
                "		}",
                "	#endif",

                "	diffuseLight += ambient;",
                "}",
                ""
            ].join("\n"),

            perPixelVaryingHeader: [
                "varying vec3 vWorldPosition;",
                "varying vec3 vViewPosition;",
                "varying vec3 vNormal;",
                ""
            ].join("\n"),

            perPixelVaryingMain: [
                "	vWorldPosition = worldPosition.xyz;",
                "	vViewPosition = -mvPosition.xyz;",
                "	vNormal = transformedNormal;",
            ].join("\n"),

            PixelLight: [
                "void PixelLight(vec3 normal, vec3 specularColor, float specularStrength, float shininess, inout vec3 diffuseLight, inout vec3 specularLight) {",
                "	#if MAX_DIR_LIGHTS > 0",
                "		for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {",

                "			vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
                "			vec3 dirVector = normalize( lDirection.xyz );",

                "			float dotProduct = dot( normal, dirVector );",
                "			vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "			diffuseLight += directionalLightColor[ i ] * directionalLightWeighting;",

                "			vec3 dirHalfVector = normalize( dirVector + vViewPosition );",
                "			float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
                "			float dirSpecularWeight = specularStrength * max( pow( dirDotNormalHalf, shininess ), 0.0 );",
                "			float specularNormalization = ( shininess + 2.0001 ) / 8.0;",

                "			vec3 schlick = specularColor + vec3( 1.0 - specularColor ) * pow( 1.0 - dot( dirVector, dirHalfVector ), 5.0 );",
                "			specularLight += schlick * directionalLightColor[ i ] * dirSpecularWeight * directionalLightWeighting * specularNormalization;",
                "		}",
                "	#endif",

                "	#if MAX_POINT_LIGHTS > 0",
                "		for( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",

                "			vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
                "			vec3 lVector = lPosition.xyz + vViewPosition;",

                "			float lDistance = 1.0;",
                "			if ( pointLightDistance[ i ] > 0.0 ) {",
                "				lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",
                "			}",

                "			lVector = normalize( lVector );",
                "			float dotProduct = dot( normal, lVector );",

                "			vec3 pointLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "			diffuseLight += pointLightColor[ i ] * pointLightWeighting * lDistance;",

                "			vec3 pointHalfVector = normalize( lVector + vViewPosition );",
                "			float pointDiffuseWeight = max( dotProduct, 0.0 );",
                "			float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );",
                "			float pointSpecularWeight = specularStrength * max( pow( pointDotNormalHalf, shininess ), 0.0 );",

                "			float specularNormalization = ( shininess + 2.0001 ) / 8.0;",
                "			vec3 schlick = specularColor + vec3( 1.0 - specularColor ) * pow( 1.0 - dot( lVector, pointHalfVector ), 5.0 );",
                "			specularLight += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * lDistance * specularNormalization;",
                "		}",
                "	#endif",

                "	#if MAX_SPOT_LIGHTS > 0",
                "		for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {",

                "			vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
                "			vec3 lVector = lPosition.xyz + vViewPosition;",

                "			float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - vWorldPosition ) );",

                "			if ( spotEffect > spotLightAngleCos[ i ] ) {",

                "				spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );",

                "				float lDistance = 1.0;",
                "				if ( spotLightDistance[ i ] > 0.0 ) {",
                "					lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );",
                "				}",

                "				lVector = normalize( lVector );",

                "				float dotProduct = dot( normal, lVector );",
                "				vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "				diffuseLight += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;",

                "				vec3 spotHalfVector = normalize( lVector + vViewPosition );",
                "				float spotDiffuseWeight = max( dotProduct, 0.0 );",
                "				float spotDotNormalHalf = max( dot( normal, spotHalfVector ), 0.0 );",
                "				float spotSpecularWeight = specularStrength * max( pow( spotDotNormalHalf, shininess ), 0.0 );",

                "				float specularNormalization = ( shininess + 2.0001 ) / 8.0;",

                "				vec3 schlick = specularColor + vec3( 1.0 - specularColor ) * pow( 1.0 - dot( lVector, spotHalfVector ), 5.0 );",
                "				specularLight += schlick * spotLightColor[ i ] * spotSpecularWeight * spotDiffuseWeight * lDistance * specularNormalization * spotEffect;",
                "			}",

                "		}",
                "	#endif",

                "	#if MAX_HEMI_LIGHTS > 0",
                "		for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

                "			vec4 lDirection = viewMatrix * vec4( hemiLightDirection[ i ], 0.0 );",
                "			vec3 lVector = normalize( lDirection.xyz );",

                "			float dotProduct = dot( normal, lVector );",

                "			float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",
                "			float hemiDiffuseWeightBack = -0.5 * dotProduct + 0.5;",

                "			diffuseLight += hemiLightColor[ i ] * hemiDiffuseWeight;",

                "			vec3 hemiHalfVector = normalize( lVector + vViewPosition );",
                "			float hemiDotNormalHalf = max( dot( normal, hemiHalfVector ), 0.0 );",
                "			float hemiSpecularWeight = specularStrength * max( pow( hemiDotNormalHalf, shininess ), 0.0 );",

                "			float specularNormalization = ( shininess + 2.0001 ) / 8.0;",
                "			vec3 schlick = specularColor + vec3( 1.0 - specularColor ) * pow( 1.0 - dot( lVector, hemiHalfVector ), 5.0 );",
                "			specularLight += schlick * hemiLightColor[ i ] * hemiSpecularWeight * hemiDiffuseWeight * specularNormalization;",
                "		}",
                "	#endif",

                "	diffuseLight += ambient;",
                "}",
                ""
            ].join("\n"),

            PixelLightNoSpec: [
                "vec3 PixelLightNoSpec(vec3 normal) {",
                "	vec3 diffuseLight;",

                "	#if MAX_DIR_LIGHTS > 0",
                "		for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {",

                "			vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
                "			vec3 dirVector = normalize( lDirection.xyz );",

                "			float dotProduct = dot( normal, dirVector );",
                "			vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "			diffuseLight += directionalLightColor[ i ] * directionalLightWeighting;",
                "		}",
                "	#endif",

                "	#if MAX_POINT_LIGHTS > 0",
                "		for( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",

                "			vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
                "			vec3 lVector = lPosition.xyz + vViewPosition;",

                "			float lDistance = 1.0;",
                "			if ( pointLightDistance[ i ] > 0.0 ) {",
                "				lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",
                "			}",

                "			lVector = normalize( lVector );",
                "			float dotProduct = dot( normal, lVector );",

                "			vec3 pointLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "			diffuseLight += pointLightColor[ i ] * pointLightWeighting * lDistance;",
                "		}",
                "	#endif",

                "	#if MAX_SPOT_LIGHTS > 0",
                "		for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {",

                "			vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
                "			vec3 lVector = lPosition.xyz + vViewPosition;",

                "			float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - vWorldPosition ) );",

                "			if ( spotEffect > spotLightAngleCos[ i ] ) {",

                "				spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );",

                "				float lDistance = 1.0;",
                "				if ( spotLightDistance[ i ] > 0.0 ) {",
                "					lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );",
                "				}",

                "				lVector = normalize( lVector );",

                "				float dotProduct = dot( normal, lVector );",
                "				vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "				diffuseLight += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;",
                "			}",

                "		}",
                "	#endif",

                "	#if MAX_HEMI_LIGHTS > 0",
                "		for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

                "			vec4 lDirection = viewMatrix * vec4( hemiLightDirection[ i ], 0.0 );",
                "			vec3 lVector = normalize( lDirection.xyz );",

                "			float dotProduct = dot( normal, lVector );",

                "			float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",
                "			float hemiDiffuseWeightBack = -0.5 * dotProduct + 0.5;",

                "			diffuseLight += hemiLightColor[ i ] * hemiDiffuseWeight;",
                "		}",
                "	#endif",

                "	diffuseLight += ambient;",

                "	return diffuseLight;",
                "}",
                ""
            ].join("\n")
        };


        return ShaderChunks;
    }
);
