import bpy
import mathutils

import os
import os.path
import math
import operator

MAX_INFLUENCES = 3


# #####################################################
# Utils
# #####################################################

def write_file( fname, content ):
	out = open( fname, "w" )
	out.write( content )
	out.close()

def ensure_folder_exist( foldername ):
	if not os.access( foldername, os.R_OK|os.W_OK|os.X_OK ):
		os.makedirs( foldername )

def ensure_extension( filepath, extension ):
	if not filepath.lower().endswith( extension ):
		filepath += extension
	return filepath

MAT4X4 = "[%s,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s]"
def mat4_string( m ):
	return MAT4X4 % (
		round(m[0][0], 15), round(m[1][0], 15), round(m[2][0], 15), round(m[3][0], 15),
		round(m[0][1], 15), round(m[1][1], 15), round(m[2][1], 15), round(m[3][1], 15),
		round(m[0][2], 15), round(m[1][2], 15), round(m[2][2], 15), round(m[3][2], 15),
		round(m[0][3], 15), round(m[1][3], 15), round(m[2][3], 15), round(m[3][3], 15)
	)

def mat4_string_transposed( m ):
	return MAT4X4 % (
		round(m[0][0], 15), round(m[0][1], 15), round(m[0][2], 15), round(m[0][3], 15),
		round(m[1][0], 15), round(m[1][1], 15), round(m[1][2], 15), round(m[1][3], 15),
		round(m[2][0], 15), round(m[2][1], 15), round(m[2][2], 15), round(m[2][3], 15),
		round(m[3][0], 15), round(m[3][1], 15), round(m[3][2], 15), round(m[3][3], 15)
	)

def get_armature():
	if len(bpy.data.armatures) == 0:
		print("Warning: no armatures in the scene")
		return None, None

	armature = bpy.data.armatures[0]
	
	for object in bpy.data.objects:
		if object.type == 'ARMATURE':
			return armature, object

	print("Warning: no node of type 'ARMATURE' in the scene")
	return None, None
	

def get_action_state( frame, action, bone, armatureObject ):
	armatureObject.animation_data.action = bpy.data.actions[ action.name ]
	bpy.context.scene.frame_set( frame )
	
	bonePose = armatureObject.pose.bones[ bone.name ]
	matrix_local = bonePose.matrix
	pos =  mathutils.Vector((1.0, 1.0, 1.0))
	rot = mathutils.Quaternion((0.0, 0.0, 0.0, 1.0))
	scl = mathutils.Vector((1.0, 1.0, 1.0))
	
	if bone.parent != None:
		matrix_local = bonePose.parent.matrix.inverted() * matrix_local
	
	pos, rot, scl = matrix_local.decompose()

	return pos, rot, scl
	
	


# #####################################################
# Templates - mesh
# #####################################################

TEMPLATE_FILE = """\
{   
	"vertices": [%(vertices)s],

	"normals": [%(normals)s],

	"colors": [%(colors)s],

	"uvs": [%(uvs)s],

	"faces": [%(faces)s],

	"bones": [%(bones)s],

	"boneWeights": [%(boneWeights)s],

	"boneIndices": [%(boneIndices)s],
	
	"animations": {%(animations)s}
}
"""

TEMPLATE_KEYFRAMES  = '[ %s,%s,%s, %s,%s,%s,%s, %s,%s,%s ]'
TEMPLATE_BONE = """\
{   
	"parent": %(parent)d,
	"name": "%(name)s",
	"skinned": %(skinned)s,
	"bindPose": %(bindPose)s,
	
	"position": [%(position)s],
	"rotation": [%(rotation)s],
	"scale": [%(scale)s]
}
"""

def float_str( flt ):
	
	return str( round( flt, 16 ) )

def flat_array( array ):
	
	return ", ".join( float_str( x ) for x in array )

def get_animation():
	if( len( bpy.data.armatures ) == 0 ):
		return ""
	
	fps = bpy.data.scenes[0].render.fps
	armature, armatureObject = get_armature()
	if armature is None or armatureObject is None:
		return ""

	animations_string = ""

	count = -1
	action_count = len( bpy.data.actions ) - 1
	
	for action in bpy.data.actions:
		count += 1
		
		end_frame = int( action.frame_range[1] )
		start_frame = int( action.frame_range[0] )
		frame_length = int( end_frame - start_frame )
		
		frames = []
		
		for frame in range( frame_length ):
			key_frame = []
			
			for bone in armature.bones:
				pos, rot, scl = get_action_state( frame, action, bone, armatureObject )
				
				px, py, pz = pos.x, pos.y, pos.z
				rx, ry, rz, rw = rot.x, rot.y, rot.z, rot.w
				sx, sy, sz = scl.x, scl.y, scl.z
				
				bone_frame = TEMPLATE_KEYFRAMES % (
					float_str(px), float_str(py), float_str(pz),
					float_str(rx), float_str(ry), float_str(rz), float_str(rw),
					float_str(sx), float_str(sy), float_str(sz)
				)
				key_frame.append( bone_frame )
			
			key_frame_string = "[%s]" % ",".join( key_frame )
			frames.append( key_frame_string );
		
		frame_string = ",".join( frames )
		animations_string += '"%s": [%s]' % ( action.name, frame_string )
		
		if( count < action_count ):
			animations_string += ","
	
	return animations_string
	

def get_mesh_string( obj ):
	mesh = obj.to_mesh( bpy.context.scene, True, "PREVIEW" )
	
	vertices = []
	normals = []
	tangents = []
	colors = []
	uvs = []
	indices = []
	bones = []
	boneIndices = []
	boneWeights = []
	
	vertex_number = -1
	for face in obj.data.polygons:
		vertices_in_face = face.vertices[:]
		
		for vertex in vertices_in_face:
			
			vertex_number += 1
			
			vertices.append( obj.data.vertices[ vertex ].co.x )
			vertices.append( obj.data.vertices[ vertex ].co.y )
			vertices.append( obj.data.vertices[ vertex ].co.z )
			
			normals.append( obj.data.vertices[ vertex ].normal.x )
			normals.append( obj.data.vertices[ vertex ].normal.y )
			normals.append( obj.data.vertices[ vertex ].normal.z )
			
			indices.append( vertex_number )
	
	if len( mesh.tessface_uv_textures ) > 0:
		for data in mesh.tessface_uv_textures.active.data:
			
			uvs.append( data.uv1.x )
			uvs.append( data.uv1.y )
			uvs.append( data.uv2.x )
			uvs.append( data.uv2.y )
			uvs.append( data.uv3.x )
			uvs.append( data.uv3.y )
	
	if len( mesh.tessface_vertex_colors ) > 0:
		for data in mesh.tessface_vertex_colors.active.data:
			colors.append( data.color1.r )
			colors.append( data.color1.g )
			colors.append( data.color1.b )
			colors.append( data.color2.r )
			colors.append( data.color2.g )
			colors.append( data.color2.b )
			colors.append( data.color3.r )
			colors.append( data.color3.g )
			colors.append( data.color3.b )
	
	if( len( bpy.data.armatures ) > 0 ):
		armature, armatureObject = get_armature()
		
		for face in obj.data.polygons:
			vertices_in_face = face.vertices[:]
			
			for vertex_index in vertices_in_face:
				vertex = obj.data.vertices[ vertex_index ]
				
				bone_array = []

				for group in vertex.groups:
					index = group.group
					weight = group.weight
	
					bone_array.append( [index, weight] )
	
				bone_array.sort(key = operator.itemgetter(1), reverse=True)
				
				total_weight = 0.0
				for i in range(len(bone_array)):
					total_weight += bone_array[i][1]
				for i in range(len(bone_array)):
					bone_array[i][1] /= total_weight
	
				for i in range(MAX_INFLUENCES):
					if i < len(bone_array):
						bone_proxy = bone_array[i]
						
						found = 0
						index = bone_proxy[0]
						weight = bone_proxy[1]
	
						for j, bone in enumerate(armature.bones):
							if obj.vertex_groups[index].name == bone.name:
								boneIndices.append(j)
								boneWeights.append(weight)
								found = 1
								break
	
						if found != 1:
							boneIndices.append(0)
							boneWeights.append(0)
	
					else:
						boneIndices.append(0)
						boneWeights.append(0)
					
		bone_id = -1
		for bone in armature.bones:
			bone_id += 1
			
			parent_index = -1
			weight = 0
			skinned = "0"
			name = bone.name
			
			matrix_local = bone.matrix_local
			pos =  mathutils.Vector((1.0, 1.0, 1.0))
			rot = mathutils.Quaternion((0.0, 0.0, 0.0, 1.0))
			scl = mathutils.Vector((1.0, 1.0, 1.0))
			
			if bone.parent != None:
				parent_index = i = 0
				
				matrix_local = bone.parent.matrix_local.inverted() * matrix_local
				
				for parent in armature.bones:
					if parent.name == bone.parent.name:
						parent_index = i
					i += 1
			
			pos, rot, scl = matrix_local.decompose()
			bindPose = bone.matrix_local
			
			j = -1
			for boneIndex in boneIndices:
				j += 1
				if int( boneIndex ) == bone_id:
					weight += float( boneWeights[j] )
			
			if weight > 0:
				skinned = "1"
			
			bones.append(TEMPLATE_BONE % {
				"parent": parent_index,
				"name": name,
				"skinned": skinned,
				"bindPose": mat4_string(bindPose.inverted()),
				"position": ", ".join([ float_str(pos.x), float_str(pos.y), float_str(pos.z) ]),
				"rotation": ", ".join([ float_str(rot.x), float_str(rot.y), float_str(rot.z), float_str(rot.w) ]),
				"scale": ", ".join([ float_str(scl.x), float_str(scl.y), float_str(scl.z) ])
			})
		
	return TEMPLATE_FILE % {
		"vertices": flat_array( vertices ),
		"normals":  flat_array( normals ),
		"colors": flat_array( colors ),
		"uvs": flat_array( uvs ),
		"faces": flat_array( indices ),
		"bones": ",".join( bones ),
		"boneIndices": flat_array( boneIndices ),
		"boneWeights": flat_array( boneWeights ),
		"animations": get_animation()
	}

def export_mesh( obj, filepath ):
	
	write_file( filepath, get_mesh_string( obj ) )
	
	print("writing", filepath, "done")


# #####################################################
# Main
# #####################################################

def save( operator, context, filepath = "" ):
	filepath = ensure_extension( filepath, ".json")
	
	bpy.ops.object.duplicate()
	bpy.ops.object.mode_set( mode = "OBJECT" )
	bpy.ops.object.modifier_add( type="TRIANGULATE" )
	bpy.ops.object.modifier_apply( apply_as = "DATA", modifier = "Triangulate" )
	
	export_mesh( context.active_object, filepath )
	bpy.ops.object.delete()
	
	return {"FINISHED"}