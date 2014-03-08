bl_info = {
    "name":         "Ares.js",
    "author":       "Nathan Faucett",
    "blender":      (2,6,0),
    "version":      (0,0,1),
    "location":     "File > Import-Export",
    "description":  "Export Ares.js data format",
    "category":     "Import-Export",
    "wiki_url":     "https://github.com/lonewolfgames",
    "tracker_url":  "https://github.com/lonewolfgames",
}

import bpy
import time
from bpy_extras.io_utils import ExportHelper


def writeToFile( file, string ):
    file.write( bytes( string, "UTF-8" ) )


def export_object( context, filepath ):
    
    ob = context.active_object
    
    bpy.ops.object.modifier_add( type='TRIANGULATE' )
    ob.modifiers["Triangulate"].use_beauty = False
    bpy.ops.object.modifier_apply( apply_as="DATA", modifier="Triangulate" )

    bpy.ops.object.mode_set(mode='OBJECT')
    
    vertices = []
    normals = []
    uvs = []
    indices = []
    
    vertex_number = -1
    
    for face in ob.data.polygons:
        vertices_in_face = face.vertices[:]
        
        for vertex in vertices_in_face:
            
            vertex_number += 1
            
            vertices.append( ob.data.vertices[ vertex ].co.x )
            vertices.append( ob.data.vertices[ vertex ].co.y )
            vertices.append( ob.data.vertices[ vertex ].co.z )
            
            normals.append( ob.data.vertices[ vertex ].normal.x )
            normals.append( ob.data.vertices[ vertex ].normal.y )
            normals.append( ob.data.vertices[ vertex ].normal.z )
            
            indices.append( vertex_number )
    
    mesh = ob.to_mesh( bpy.context.scene, True, "PREVIEW" )
    useUvs = len( mesh.tessface_uv_textures ) > 0
    
    if useUvs:
        for data in mesh.tessface_uv_textures.active.data:
            uvs.append( data.uv1.x )
            uvs.append( data.uv1.y )
            uvs.append( data.uv2.x )
            uvs.append( data.uv2.y )
            uvs.append( data.uv3.x )
            uvs.append( data.uv3.y )
        
    file = open( filepath, "wb" )
    
    writeToFile( file, "{\n" );
    
    writeToFile( file, '    "vertices": [' );
    writeToFile( file, ", ".join( str(f) for f in vertices ) );
    writeToFile( file, "],\n" );
    
    writeToFile( file, '    "normals": [' );
    writeToFile( file, ", ".join( str(f) for f in normals ) );
    writeToFile( file, "],\n" );
    
    if useUvs:
        writeToFile( file, '    "uv": [' );
        writeToFile( file, ", ".join( str(f) for f in uvs ) );
        writeToFile( file, "],\n" );
    
    writeToFile( file, '    "faces": [' );
    writeToFile( file, ", ".join( str(f) for f in indices ) );
    writeToFile( file, "]\n" );
    
    writeToFile( file, "}" );
    
    file.flush()
    file.close()
    
    return True
    

class ExportAresjs( bpy.types.Operator, ExportHelper ):
    bl_idname = "export_ares.js"
    bl_label = "Export Ares.js"
    bl_options = {"PRESET"}
    
    filename_ext = ".js"
    
    def execute( self, context ):
        start_time = time.time()
        
        print('\n_____START_____')
        
        filepath = self.filepath
        filepath = bpy.path.ensure_ext( filepath, self.filename_ext )
        
        exported = export_object( context, filepath )
        
        if exported:
            print("finished export in %s seconds" %( ( time.time() - start_time ) ) )
            print( filepath )
            print('\n_____FINISHED_____')
        
        return {'FINISHED'}


def menu_func( self, context ):
    self.layout.operator( ExportAresjs.bl_idname, text="Ares.js(.js)")

def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append( menu_func )
    
def unregister():
    bpy.utils.unregister_module(__name__)
    bpy.types.INFO_MT_file_export.remove( menu_func )

if __name__ == "__main__":
    register()