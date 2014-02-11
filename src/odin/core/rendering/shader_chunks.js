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
                "}\n",
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
                "}\n",
            ].join("\n"),

            perturbNormal2Arb: [
                "vec3 perturbNormal2Arb(sampler2D map, vec3 uv, vec3 eye_pos, vec3 surf_norm, float scale) {",

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
                "}\n",
            ].join("\n"),

            default_vertex: [
                "vec4 mvPosition;",

                "#ifdef USE_SKINNING",
                "mvPosition = modelViewMatrix * skinned;",
                "#endif",

                "#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS )",
                "mvPosition = modelViewMatrix * vec4( morphed, 1.0 );",
                "#endif",

                "#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS )",
                "mvPosition = modelViewMatrix * vec4( position, 1.0 );",
                "#endif",
                ""
            ].join("\n"),

            defaultnormal_vertex: [
                "vec3 objectNormal;",

                "#ifdef USE_SKINNING",
                "objectNormal = skinnedNormal.xyz;",
                "#endif",

                "#if !defined( USE_SKINNING ) && defined( USE_MORPHNORMALS )",
                "objectNormal = morphedNormal;",
                "#endif",

                "#if !defined( USE_SKINNING ) && ! defined( USE_MORPHNORMALS )",
                "objectNormal = normal;",
                "#endif",

                "#ifdef FLIP_SIDED",
                "objectNormal = -objectNormal;",
                "#endif",

                "vec3 transformedNormal = normalMatrix * objectNormal;",
                ""
            ].join("\n"),

            worldpos_vertex: [
                "#if defined( USE_ENVMAP ) || defined( USE_LIGHTS ) || defined ( USE_SHADOWMAP )",

                "#ifdef USE_SKINNING",
                "vec4 worldPosition = modelMatrix * skinned;",
                "#endif",

                "#if defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )",
                "vec4 worldPosition = modelMatrix * vec4( morphed, 1.0 );",
                "#endif",

                "#if ! defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )",
                "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
                "#endif",

                "#endif",
                ""
            ].join("\n"),

            lights_pars_vertexlit: [
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

                "varying vec3 vLightFront;",

                "#ifdef DOUBLE_SIDED",
                "	varying vec3 vLightBack;",
                "#endif",
                ""
            ].join("\n"),

            lights_pars_vertexlit_fragment: [
                "varying vec3 vLightFront;",

                "#ifdef DOUBLE_SIDED",
                "	varying vec3 vLightBack;",
                "#endif",
                ""
            ].join("\n"),

            lights_vertexlit: [
                "transformedNormal = normalize( transformedNormal );",

                "#if MAX_DIR_LIGHTS > 0",
                "	for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {",

                "		vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
                "		vec3 dirVector = normalize( lDirection.xyz );",

                "		float dotProduct = dot( transformedNormal, dirVector );",
                "		vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "		#ifdef DOUBLE_SIDED",
                "			vec3 directionalLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );",
                "		#endif",

                "		vLightFront += directionalLightColor[ i ] * directionalLightWeighting;",

                "		#ifdef DOUBLE_SIDED",
                "			vLightBack += directionalLightColor[ i ] * directionalLightWeightingBack;",
                "		#endif",
                "	}",
                "#endif",

                "#if MAX_POINT_LIGHTS > 0",
                "	for( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",

                "		vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
                "		vec3 lVector = lPosition.xyz - mvPosition.xyz;",

                "		float lDistance = 1.0;",
                "		if ( pointLightDistance[ i ] > 0.0 ) {",
                "			lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",
                "		}",

                "		lVector = normalize( lVector );",
                "		float dotProduct = dot( transformedNormal, lVector );",

                "		vec3 pointLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "		#ifdef DOUBLE_SIDED",
                "			vec3 pointLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );",
                "		#endif",

                "		vLightFront += pointLightColor[ i ] * pointLightWeighting * lDistance;",

                "		#ifdef DOUBLE_SIDED",
                "			vLightBack += pointLightColor[ i ] * pointLightWeightingBack * lDistance;",
                "		#endif",
                "	}",
                "#endif",

                "#if MAX_SPOT_LIGHTS > 0",
                "	for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {",

                "		vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
                "		vec3 lVector = lPosition.xyz - mvPosition.xyz;",

                "		float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - worldPosition.xyz ) );",

                "		if ( spotEffect > spotLightAngleCos[ i ] ) {",

                "			spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );",

                "			float lDistance = 1.0;",
                "			if ( spotLightDistance[ i ] > 0.0 ) {",
                "				lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );",
                "			}",

                "			lVector = normalize( lVector );",

                "			float dotProduct = dot( transformedNormal, lVector );",
                "			vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );",

                "			#ifdef DOUBLE_SIDED",
                "				vec3 spotLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );",
                "			#endif",

                "			vLightFront += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;",

                "			#ifdef DOUBLE_SIDED",
                "				vLightBack += spotLightColor[ i ] * spotLightWeightingBack * lDistance * spotEffect;",
                "			#endif",

                "		}",

                "	}",
                "#endif",

                "#if MAX_HEMI_LIGHTS > 0",
                "	for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

                "		vec4 lDirection = viewMatrix * vec4( hemiLightDirection[ i ], 0.0 );",
                "		vec3 lVector = normalize( lDirection.xyz );",

                "		float dotProduct = dot( transformedNormal, lVector );",

                "		float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",
                "		float hemiDiffuseWeightBack = -0.5 * dotProduct + 0.5;",

                "		vLightFront += hemiLightColor[ i ] * hemiDiffuseWeight;",

                "		#ifdef DOUBLE_SIDED",
                "			vLightBack += hemiLightColor[ i ] * hemiDiffuseWeightBack;",
                "		#endif",

                "	}",
                "#endif",

                "vLightFront = vLightFront + ambient;",

                "#ifdef DOUBLE_SIDED",
                "	vLightBack = vLightBack + ambient;",
                "#endif",
                ""
            ].join("\n")
        };


        return ShaderChunks;
    }
);
