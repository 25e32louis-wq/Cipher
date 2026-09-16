# Blender-ready concept script for the CIPHER CORE.
# Open in Blender 4.x, run from the Scripting workspace, then export the selected
# CIPHER_CORE collection to GLB and replace the procedural visual in the site.
import bpy, math
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def mat(name, color, metallic=0.0, rough=.35):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.metallic=metallic; m.roughness=rough; return m
metal=mat('Graphite Metal',(0.07,.08,.1),.82,.24); red=mat('Signal Red',(.32,.035,.028),.6,.2); gold=mat('Antique Gold',(.45,.3,.08),.82,.27)
collection=bpy.data.collections.new('CIPHER_CORE'); bpy.context.scene.collection.children.link(collection)
# Two engineered C-rings using beveled curves.
def ccurve(name, radius, depth, material):
    cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.bevel_depth=depth; cu.bevel_resolution=5; sp=cu.splines.new('POLY'); seg=52; sp.points.add(seg)
    for i in range(seg+1):
        t=math.radians(-55 + (270*i/seg)); sp.points[i].co=(radius*math.cos(t),radius*math.sin(t),0,1)
    ob=bpy.data.objects.new(name,cu); collection.objects.link(ob); cu.materials.append(material); return ob
for name,r,d,m in [('CORE_BACK',2.35,.22,metal),('CORE_MID',2.05,.30,red),('CORE_FRONT',1.78,.19,gold)]:
    o=ccurve(name,r,d,m); o.rotation_euler=(math.radians(18),math.radians(-12),math.radians(8))
# central dark glass disk
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.05, depth=.35, location=(0,0,.1)); disk=bpy.context.object; disk.name='CORE_GLASS'; disk.data.materials.append(mat('Dark Glass',(.015,.018,.022),.3,.12)); collection.objects.link(disk); bpy.context.scene.collection.objects.unlink(disk)
# thin signal nodes
for i,ang in enumerate((28,148,268)):
    a=math.radians(ang); x,y=2.18*math.cos(a),2.18*math.sin(a); bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.08,location=(x,y,.25)); n=bpy.context.object; n.name=f'SIGNAL_NODE_{i+1}'; n.data.materials.append(red); collection.objects.link(n); bpy.context.scene.collection.objects.unlink(n)
# lighting
bpy.ops.object.light_add(type='AREA', location=(4,-3,5)); key=bpy.context.object; key.data.energy=900; key.data.shape='DISK'; key.data.size=4
bpy.ops.object.light_add(type='AREA', location=(-4,2,2)); fill=bpy.context.object; fill.data.energy=500; fill.data.size=3
bpy.ops.object.light_add(type='POINT', location=(0,0,3)); rim=bpy.context.object; rim.data.energy=250
# camera
bpy.ops.object.camera_add(location=(0,-9,4.8)); cam=bpy.context.object; cam.rotation_euler=(math.radians(67),0,0); bpy.context.scene.camera=cam
# world
bpy.context.scene.world.color=(.005,.006,.008)
for o in collection.objects: o.select_set(True)
