"""After Hours Studio: isometric cutaway look-dev (semi-lowpoly, dark and warm). Approved 2026-11-02.
Run: blender -b --factory-startup --python iso_study.py -- <out.png> [samples] [projects_dir] ["x,y,z,ortho_scale"]
Units are metres. Room floor spans x 0..W, y 0..D. Walls stand on x=0 (screen left) and y=D (screen right);
the camera looks in from the open +x/-y corner.
"""
import bpy, bmesh, sys, math, os, random
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "//iso.png"
SAMPLES = int(argv[1]) if len(argv) > 1 else 96
PROJ = argv[2] if len(argv) > 2 else ""
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene

# ---------- materials ----------
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def mat(name, hexcol, rough=0.6, metal=0.0, emit=None, strength=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(hexcol), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = (*srgb(emit), 1)
        b.inputs["Emission Strength"].default_value = strength
    return m

def glow(name, hexcol, strength):
    return mat(name, "#000000", 0.4, emit=hexcol, strength=strength)

def img_mat(name, path, strength=0.0, rough=0.5):
    """Image texture; with strength > 0 it glows (screens), otherwise it's a print."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(path)
    tex.extension = "EXTEND"
    b.inputs["Roughness"].default_value = rough
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    if strength:
        b.inputs["Base Color"].default_value = (0, 0, 0, 1)
        nt.links.remove(b.inputs["Base Color"].links[0])
        nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = strength
    return m

M = {
    "slab": mat("slab", "#141210", 0.8),          # cut edges of floor and walls
    "wall": mat("wall", "#2B2622", 0.9),          # dark warm plaster
    "wall2": mat("wall2", "#26221F", 0.9),
    "skirt": mat("skirt", "#1A1714", 0.6),
    "desk": mat("desk", "#5A3A24", 0.45, coat=0.2),  # oiled walnut top
    "desk_leg": mat("desk_leg", "#1B1B1C", 0.42, 0.6),
    "cream": mat("cream", "#CFC4B2", 0.5),         # retro-beige plastics
    "cream_dk": mat("cream_dk", "#A89C8A", 0.55),
    "charcoal": mat("charcoal", "#2C2A2E", 0.55),
    "dark": mat("dark", "#1B1A1E", 0.5),
    "metal": mat("metal", "#B8B4B0", 0.3, 1.0),
    "chair": mat("chair", "#2A2826", 0.75),         # charcoal mesh
    "lamp": mat("lamp", "#1E1D1C", 0.4, 0.5),
    "wood": mat("wood", "#8A5A3C", 0.6),
    "wood_lt": mat("wood_lt", "#B48460", 0.6),
    "sofa": mat("sofa", "#2E3A34", 0.85),          # deep moss
    "sofa_dk": mat("sofa_dk", "#25302A", 0.85),
    "cushion": mat("cushion", "#B5835A", 0.85),
    "rug": mat("rug", "#3A3430", 0.95),
    "cork": mat("cork", "#8A6A48", 0.95),
    "paper": mat("paper", "#D9D1C4", 0.9),
    "skin": mat("skin", "#B07A58", 0.55),
    "hair": mat("hair", "#1E1714", 0.6),
    "hoodie": mat("hoodie", "#3B4652", 0.85),
    "jeans": mat("jeans", "#2B3140", 0.85),
    "shoe": mat("shoe", "#ECE6DC", 0.6),
    "leaf": mat("leaf", "#4A6B3E", 0.7),
    "leaf2": mat("leaf2", "#38553A", 0.7),
    "pot": mat("pot", "#8E5A3C", 0.7),
    "mug": mat("mug", "#F4EEE4", 0.35, coat=0.5),
    "frame": mat("frame", "#8E6B47", 0.5),
    "trim": glow("trim", "#FFB46A", 3),            # arcade side trim, warm and quiet
    "led": glow("led", "#FFB46A", 5),             # warm cove strips
    "bulb": glow("bulb", "#FFD9A0", 20),
    "term": glow("term", "#6BFF8E", 3.0),          # terminal text
    "term_bg": glow("term_bg", "#071A10", 1.0),
    "marquee": glow("marquee", "#FFC27A", 4),
    "arc_scr": glow("arc_scr", "#05060F", 1.0),
    "star": glow("star", "#E8F0FF", 6),
    "ship": glow("ship", "#F99E35", 6),            # brand accent, the one physical use
    "hall": glow("hall", "#CFE0FF", 6),
}
BOOKS = ["#6B4A3A", "#3A4148", "#8A7356", "#4A5245", "#BFB3A0", "#2E2A28", "#9A5A3C", "#5C5348", "#7A6A5A"]

# ---------- helpers ----------
def finish(o, m, bevel=0.0, seg=1, smooth=False):
    if bevel:
        bv = o.modifiers.new("bevel", "BEVEL"); bv.width = bevel; bv.segments = seg
        bv.limit_method = "ANGLE"
    if smooth:
        bpy.ops.object.shade_smooth()
    o.data.materials.append(m)
    return o

def box(name, size, loc, m, rot=(0, 0, 0), bevel=0.006, seg=1, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    finish(o, m, bevel, seg)
    if parent: o.parent = parent
    return o

def cyl(name, r, h, loc, m, rot=(0, 0, 0), verts=10, r2=None, bevel=0.0, parent=None, smooth=False):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; o.name = name
    finish(o, m, bevel, 1, smooth)
    if parent: o.parent = parent
    return o

def ico(name, r, loc, m, scale=(1, 1, 1), sub=1, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, location=loc, subdivisions=sub, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = scale
    finish(o, m)
    if parent: o.parent = parent
    return o

def prism(name, pts, width, m, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.006):
    """Extrude a 2D profile (y, z) along x by `width`."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((-width / 2, y, z)) for y, z in pts]
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in ext["geom"]:
        if isinstance(v, bmesh.types.BMVert): v.co.x += width
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); scn.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    bpy.context.view_layer.objects.active = o
    return finish(o, m, bevel)

def tube(name, pts, r, m, closed=False):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    cu.bevel_depth = r; cu.bevel_resolution = 2
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts): p.co = (*c, 1)
    sp.use_cyclic_u = closed
    o = bpy.data.objects.new(name, cu); scn.collection.objects.link(o)
    o.data.materials.append(m)
    return o

def empty(name, loc, rz=0):
    e = bpy.data.objects.new(name, None); scn.collection.objects.link(e)
    e.location = loc; e.rotation_euler = (0, 0, math.radians(rz))
    return e

def proj_img(slug):
    p = os.path.join(PROJ, slug, "hero.png")
    return p if PROJ and os.path.exists(p) else None

def screen(name, size, loc, rot, slug, fallback, strength=1.6, parent=None):
    path = proj_img(slug)
    m = img_mat(name, path, strength) if path else fallback
    o = box(name, size, loc, m, rot=rot, bevel=0, parent=parent)
    if path:  # project the image onto the front face (local -Y)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.cube_project(cube_size=1, scale_to_bounds=True)
        bpy.ops.object.mode_set(mode="OBJECT")
        me = o.data
        uv = me.uv_layers.active.data
        for poly in me.polygons:  # map the -Y face to the whole image, flip-free
            if poly.normal.y < -0.9:
                xs = [me.vertices[me.loops[li].vertex_index].co for li in poly.loop_indices]
                minx, maxx = min(v.x for v in xs), max(v.x for v in xs)
                minz, maxz = min(v.z for v in xs), max(v.z for v in xs)
                for li in poly.loop_indices:
                    v = me.vertices[me.loops[li].vertex_index].co
                    uv[li].uv = ((v.x - minx) / (maxx - minx), (v.z - minz) / (maxz - minz))
    return o

W, D, H, T = 4.4, 4.4, 3.0, 0.16  # room size, wall/slab thickness

# ---------- shell (cutaway) ----------
box("slab", (W + T, D + T, 0.24), ((W - T) / 2, (D + T) / 2, -0.12), M["slab"], bevel=0.01)
box("wall_l", (T, D + T, H), (-T / 2, (D + T) / 2, H / 2), M["slab"], bevel=0.01)
box("wall_r", (W, T, H), (W / 2, D + T / 2, H / 2), M["slab"], bevel=0.01)
# interior plaster skins so the cut edge stays dark
box("skin_l", (0.004, D, H - 0.02), (0.002, D / 2, H / 2 - 0.01), M["wall2"], bevel=0)
box("skin_r", (W, 0.004, H - 0.02), (W / 2, D - 0.002, H / 2 - 0.01), M["wall"], bevel=0)
box("skirt_l", (0.02, D, 0.09), (0.01, D / 2, 0.045), M["skirt"], bevel=0.002)
box("skirt_r", (W, 0.02, 0.09), (W / 2, D - 0.01, 0.045), M["skirt"], bevel=0.002)
# floor: oak planks (brick texture stretched into boards), satin finish
fl = box("floor", (W, D, 0.01), (W / 2, D / 2, 0.005), M["slab"], bevel=0)
fm = bpy.data.materials.new("floor"); fm.use_nodes = True
nt = fm.node_tree; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.38
br = nt.nodes.new("ShaderNodeTexBrick"); br.offset = 0.37; br.offset_frequency = 1
br.inputs["Scale"].default_value = 1.0; br.inputs["Brick Width"].default_value = 1.4
br.inputs["Row Height"].default_value = 0.12; br.inputs["Mortar Size"].default_value = 0.004
br.inputs["Bias"].default_value = 0.0
br.inputs["Color1"].default_value = (*srgb("#6A4A34"), 1); br.inputs["Color2"].default_value = (*srgb("#4E3424"), 1)
br.inputs["Mortar"].default_value = (*srgb("#1E140E"), 1)
tc = nt.nodes.new("ShaderNodeTexCoord")
nt.links.new(tc.outputs["Object"], br.inputs["Vector"]); nt.links.new(br.outputs["Color"], b.inputs["Base Color"])
fl.data.materials[0] = fm

# warm cove light along the top of both walls: a slim wooden cornice hides an LED strip
box("cove_l", (0.08, D, 0.06), (0.04, D / 2, H - 0.2), M["wood"], bevel=0.004)
box("cove_r", (W, 0.08, 0.06), (W / 2, D - 0.04, H - 0.2), M["wood"], bevel=0.004)
tube("led_l", [(0.085, 0.0, H - 0.235), (0.085, D - 0.085, H - 0.235)], 0.008, M["led"])
tube("led_r", [(0.085, D - 0.085, H - 0.235), (W, D - 0.085, H - 0.235)], 0.008, M["led"])

# vertical walnut slat panel on the left wall behind the arcade and sofa
for i in range(22):
    box("slat", (0.035, 0.04, H - 0.3), (0.02, 0.08 + i * 0.075, (H - 0.3) / 2 + 0.05), M["wood"], bevel=0.004)

# ---------- 01 workstation: L-desk in the back corner ----------
TOP = 0.75
box("desk_l", (0.75, 1.85, 0.04), (0.38, D - 0.75 - 0.925, TOP - 0.02), M["desk"])          # along left wall
box("desk_r", (2.4, 0.75, 0.04), (1.2 + 0.0, D - 0.38, TOP - 0.02), M["desk"])   # along right wall
for x, y in ((0.7, D - 2.55), (0.06, D - 2.55), (2.35, D - 0.7), (2.35, D - 0.06)):
    box("leg", (0.05, 0.05, TOP - 0.04), (x, y, (TOP - 0.04) / 2), M["desk_leg"])
box("drawers", (0.45, 0.6, 0.5), (2.05, D - 0.38, 0.45), M["cream_dk"])
for z in (0.32, 0.5, 0.66):
    box("pull", (0.12, 0.012, 0.015), (2.05, D - 0.69, z), M["metal"], bevel=0.003)

# main monitor in the corner, angled 45 deg, showing a real project
mon = empty("mon", (0.4, D - 0.4, TOP), 45)  # faces the room (+x,-y)

box("mon_foot", (0.26, 0.2, 0.015), (0, 0.05, 0.008), M["charcoal"], parent=mon)
box("mon_neck", (0.05, 0.03, 0.3), (0, 0.1, 0.16), M["charcoal"], parent=mon)
box("mon_shell", (0.74, 0.05, 0.44), (0, 0.06, 0.5), M["dark"], bevel=0.012, seg=2, parent=mon)
screen("mon_screen", (0.7, 0.004, 0.4), (0, 0.033, 0.5), (0, 0, 0), "romblon-tourism", M["term_bg"], 1.8, parent=mon)

# retro beige computer on the left desk with a green terminal (the "workhorse")
pc = empty("pc", (0.33, D - 1.75, TOP), 0)
pc.rotation_euler = (0, 0, math.radians(90))  # faces +x
box("pc_case", (0.42, 0.38, 0.12), (0, 0.02, 0.06), M["cream"], bevel=0.01, seg=2, parent=pc)
box("pc_slot", (0.14, 0.01, 0.012), (0.1, -0.17, 0.07), M["dark"], bevel=0.002, parent=pc)
box("pc_led", (0.015, 0.01, 0.01), (-0.15, -0.17, 0.05), mat("led_red", "#000000", emit="#FF3B2F", strength=8), bevel=0, parent=pc)
box("crt", (0.36, 0.34, 0.31), (0, 0.04, 0.29), M["cream"], bevel=0.02, seg=2, parent=pc)
box("crt_back", (0.26, 0.16, 0.22), (0, 0.24, 0.28), M["cream_dk"], bevel=0.02, seg=2, parent=pc)
box("crt_bezel", (0.3, 0.012, 0.24), (0, -0.135, 0.3), M["cream_dk"], bevel=0.006, parent=pc)
box("crt_glass", (0.25, 0.01, 0.19), (0, -0.142, 0.305), M["term_bg"], bevel=0.004, parent=pc)
for i in range(9):
    ln = random.uniform(0.04, 0.2)
    box("tline", (ln, 0.004, 0.009), (-0.11 + ln / 2, -0.149, 0.385 - i * 0.019), M["term"], bevel=0, parent=pc)

# keyboards
def keyboard(name, loc, rz, cols=14, rows=5, case=M["cream"], caps=(M["cream_dk"], M["charcoal"])):
    k = empty(name, loc, rz)
    box("kb_case", (cols * 0.02 + 0.03, rows * 0.02 + 0.03, 0.022), (0, 0, 0.011), case, bevel=0.005, parent=k)
    for r in range(rows):
        for c in range(cols):
            mm = caps[1] if (c in (0, cols - 1) or r == 0) else caps[0]
            box("key", (0.017, 0.017, 0.01), (-cols * 0.01 + 0.01 + c * 0.02, -rows * 0.01 + 0.01 + r * 0.02, 0.026),
                mm, bevel=0.003, parent=k)
    return k
keyboard("kb_main", (0.62, D - 0.62, TOP), 45)
keyboard("kb_pc", (0.61, D - 1.75, TOP), 90)
# mouse: smooth domed shell, split buttons, scroll wheel; front (local +Y) points at the monitor
MX, MY, PAD = 0.84, D - 0.44, TOP + 0.004
box("mousepad", (0.25, 0.21, 0.004), (MX, MY, TOP + 0.002), mat("pad", "#2A2724", 0.9), rot=(0, 0, math.radians(45)), bevel=0.002)
ms = empty("mouse", (MX, MY, PAD), 45)
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=24, ring_count=12, location=(0, 0, 0))
body = bpy.context.object; body.name = "mouse_body"
for v in body.data.vertices:  # egg shape: wider and taller toward the palm (local -Y), flat underside
    t = (v.co.y + 1) / 2
    v.co.x *= 0.03 * (0.8 + 0.25 * (1 - t)); v.co.y *= 0.06
    v.co.z = max(v.co.z, -0.15) * 0.022 * (0.75 + 0.35 * (1 - t)) + 0.004
bpy.ops.object.shade_smooth(); body.data.materials.append(M["cream"]); body.parent = ms
box("mouse_split", (0.0016, 0.034, 0.012), (0, 0.036, 0.018), M["charcoal"], bevel=0, parent=ms)
cyl("mouse_wheel", 0.0075, 0.006, (0, 0.03, 0.024), M["charcoal"], rot=(0, math.radians(90), 0), verts=12, parent=ms, smooth=True)
# cables: mouse and keyboard run to a hub under the monitor foot (no cut ends)
f = Vector((-0.7071, 0.7071, 0))
m0 = Vector((MX, MY, PAD + 0.006)) + f * 0.06
tube("mcable", [tuple(m0), tuple(m0 + f * 0.05 + Vector((0, 0, -0.004))), (0.76, D - 0.22, PAD + 0.002),
                (0.6, D - 0.18, PAD + 0.002), (0.47, D - 0.33, PAD + 0.002)], 0.0035, M["cream_dk"])
k0 = Vector((0.62, D - 0.62, TOP + 0.012)) + f * 0.075
tube("kcable", [tuple(k0), tuple(k0 + f * 0.06 + Vector((0, 0, -0.008))), (0.44, D - 0.39, PAD + 0.002)], 0.0035, M["cream_dk"])

# pen tablet + sketchbook + pencils
box("tablet", (0.3, 0.2, 0.012), (1.65, D - 0.45, TOP + 0.006), M["charcoal"], rot=(0, 0, math.radians(-8)), bevel=0.006)
box("tablet_area", (0.22, 0.14, 0.002), (1.66, D - 0.45, TOP + 0.013), mat("tab_area", "#3A3740", 0.4), rot=(0, 0, math.radians(-8)), bevel=0)
cyl("stylus", 0.005, 0.15, (1.62, D - 0.6, TOP + 0.006), M["charcoal"], rot=(0, math.radians(90), math.radians(30)), verts=6)
box("sketchbook", (0.21, 0.28, 0.018), (0.38, D - 2.25, TOP + 0.009), mat("sb", "#2F4D6B", 0.7), rot=(0, 0, math.radians(12)), bevel=0.004)
box("sb_page", (0.2, 0.27, 0.004), (0.385, D - 2.25, TOP + 0.02), M["paper"], rot=(0, 0, math.radians(12)), bevel=0)
cup = cyl("pencup", 0.04, 0.1, (0.18, D - 1.15, TOP + 0.05), M["charcoal"], verts=8)
for i, c in enumerate(["#F2C14E", "#E1574A", "#3E7CB1", "#5B9E7A"]):
    cyl("pencil", 0.005, 0.17, (0.18 + math.cos(i * 1.6) * 0.015, D - 1.15 + math.sin(i * 1.6) * 0.015, TOP + 0.12),
        mat("pc" + c, c, 0.5), rot=(math.radians(8 * math.cos(i)), math.radians(8 * math.sin(i)), 0), verts=6)

# desk lamp: weighted base, two-section arm, cone shade hanging down over the desk
LX, LY = 0.3, D - 1.25
lamp = empty("lamp", (LX, LY, TOP), 0)
cyl("lamp_base", 0.09, 0.03, (0, 0, 0.015), M["lamp"], verts=16, bevel=0.006, parent=lamp)
p0, p1, p2 = (LX, LY, TOP + 0.03), (LX + 0.1, LY, TOP + 0.42), (LX + 0.36, LY, TOP + 0.5)
tube("lamp_arm", [p0, p1, p2], 0.009, M["lamp"])
ico("lamp_joint", 0.016, p1, M["lamp"], sub=2)
ico("lamp_joint2", 0.014, p2, M["lamp"], sub=2)
sd = Vector((-0.55, 0, 0.83)).normalized()  # shade axis: narrow end up toward the joint, opening down
sc = Vector(p2) - sd * 0.085
cyl("lamp_shade", 0.1, 0.16, tuple(sc), M["lamp"], r2=0.03, rot=(0, math.atan2(sd.x, sd.z), 0), verts=16, bevel=0.003, smooth=True)
ico("lamp_bulb", 0.03, tuple(sc - sd * 0.05), M["bulb"], sub=2)

# mug, plate, plant on desk
cyl("mug", 0.04, 0.09, (1.3, D - 0.55, TOP + 0.045), M["mug"], verts=12, bevel=0.004)
tube("mug_h", [(1.34, D - 0.55, TOP + 0.07), (1.37, D - 0.55, TOP + 0.06), (1.36, D - 0.55, TOP + 0.03), (1.34, D - 0.55, TOP + 0.025)], 0.007, M["mug"])
cyl("pot", 0.08, 0.14, (2.15, D - 0.2, TOP + 0.07), M["pot"], r2=0.1, verts=8, bevel=0.004)
# small desk plant: same build as the floor plant (leaves spiral up a stem, pointing outward), at ~40% scale
PX, PY, PZ = 2.15, D - 0.2, TOP + 0.14
cyl("dstem", 0.007, 0.3, (PX, PY, PZ + 0.13), M["wood"], verts=6)
for i in range(10):
    a = i / 10 * math.tau * 2.3
    ico("dleaf", 0.07, (PX + math.cos(a) * 0.07, PY + math.sin(a) * 0.07, PZ + 0.04 + (i / 10) * 0.24),
        M["leaf" if i % 2 else "leaf2"], scale=(0.5, 1.4, 0.18), sub=1,
        rot=(math.radians(25 + i * 3), 0, a + math.pi / 2))

# speakers + wall shelf with books above the right desk
for x in (0.55, 1.95):
    box("speaker", (0.2, 0.2, 0.32), (x, D - 0.12, 1.87), mat("spk", "#5A4636", 0.6), bevel=0.008)
    cyl("woofer", 0.065, 0.01, (x, D - 0.225, 1.82), M["dark"], rot=(math.radians(90), 0, 0), verts=12)
    cyl("tweeter", 0.03, 0.01, (x, D - 0.225, 1.96), M["dark"], rot=(math.radians(90), 0, 0), verts=10)
box("shelf", (1.9, 0.26, 0.03), (1.25, D - 0.13, 1.7), M["wood_lt"])
x = 0.72
while x < 1.78:
    t = random.uniform(0.03, 0.06); hh = random.uniform(0.18, 0.27)
    if 1.3 < x < 1.38:
        for j in range(4):  # a horizontal stack
            box("book_flat", (0.24, 0.17, 0.035), (x + 0.12, D - 0.13, 1.735 + j * 0.036),
                mat("bf", random.choice(BOOKS), 0.7), rot=(0, 0, random.uniform(-.1, .1)), bevel=0.003)
        x += 0.27; continue
    box("book", (t, random.uniform(0.15, 0.2), hh), (x, D - 0.13, 1.715 + hh / 2),
        mat("bk", random.choice(BOOKS), 0.7), bevel=0.003)
    x += t + 0.004

# chair (faceted) + seated figure
ch = empty("chair", (0.97, D - 0.97, 0), 45 + 180)
for i in range(5):
    a = i / 5 * math.tau
    box("star", (0.3, 0.04, 0.035), (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.08), M["charcoal"], rot=(0, 0, a), parent=ch)
    ico("caster", 0.03, (math.cos(a) * 0.29, math.sin(a) * 0.29, 0.03), M["dark"], parent=ch)
cyl("gas", 0.025, 0.35, (0, 0, 0.27), M["metal"], verts=8, parent=ch)
box("seat", (0.5, 0.48, 0.09), (0, 0, 0.47), M["chair"], bevel=0.035, seg=2, parent=ch)
box("back", (0.46, 0.08, 0.62), (0, 0.25, 0.86), M["chair"], rot=(math.radians(-8), 0, 0), bevel=0.035, seg=2, parent=ch)
for s in (-1, 1):
    box("arm", (0.04, 0.25, 0.03), (s * 0.27, 0.0, 0.65), M["charcoal"], parent=ch)
    box("arm_post", (0.03, 0.03, 0.18), (s * 0.27, 0.08, 0.56), M["charcoal"], parent=ch)

# figure in chair-local space; chair -Y faces the monitor
fig = ch
ico("hips", 0.17, (0, 0.02, 0.58), M["jeans"], scale=(1.05, 0.9, 0.6), parent=fig)
ico("torso", 0.18, (0, 0.06, 0.86), M["hoodie"], scale=(1.0, 0.72, 1.35), parent=fig)
ico("hood", 0.11, (0, 0.14, 1.07), M["hoodie"], scale=(1.2, 0.8, 0.6), parent=fig)
cyl("neck", 0.04, 0.08, (0, 0.04, 1.1), M["skin"], verts=8, parent=fig)
ico("head", 0.1, (0, 0.0, 1.22), M["skin"], scale=(0.88, 1.0, 1.1), sub=2, parent=fig)
ico("hair", 0.105, (0, 0.025, 1.26), M["hair"], scale=(0.92, 1.02, 0.92), sub=1, parent=fig)
for s in (-1, 1):
    box("thigh", (0.14, 0.42, 0.14), (s * 0.1, -0.2, 0.58), M["jeans"], bevel=0.03, parent=fig)
    box("shin", (0.11, 0.12, 0.44), (s * 0.11, -0.4, 0.3), M["jeans"], bevel=0.03, parent=fig)
    box("shoe", (0.11, 0.24, 0.08), (s * 0.11, -0.46, 0.04), M["shoe"], bevel=0.02, parent=fig)
    box("upper", (0.09, 0.09, 0.28), (s * 0.22, 0.0, 0.88), M["hoodie"], rot=(math.radians(35), 0, 0), bevel=0.03, parent=fig)
    box("fore", (0.08, 0.3, 0.08), (s * 0.17, -0.24, 0.76), M["hoodie"], rot=(0, 0, -s * 0.25), bevel=0.025, parent=fig)
    ico("hand", 0.035, (s * 0.12, -0.4, 0.77), M["skin"], scale=(1, 1.3, 0.6), parent=fig)

# ---------- 02 project wall (right wall, past the desk) ----------
frames = [("tulipa-landscaping", 0.62, 0.42, 3.05, 1.95), ("glow-smoothies", 0.42, 0.56, 3.75, 1.9),
          ("amperk-cafe", 0.5, 0.36, 2.9, 1.38), ("ozone", 0.36, 0.36, 3.5, 1.34), ("bcea", 0.3, 0.42, 4.0, 1.3)]
for slug, w, h, x, z in frames:
    box("frame", (w, 0.035, h), (x, D - 0.018, z), M["frame"], bevel=0.004)
    box("mat", (w - 0.04, 0.004, h - 0.04), (x, D - 0.037, z), M["paper"], bevel=0)
    screen("print_" + slug, (w - 0.1, 0.004, h - 0.1), (x, D - 0.041, z), (0, 0, 0), slug,
           mat("pr", "#8899AA", 0.8), strength=0.0)
box("ledge", (1.3, 0.1, 0.025), (3.4, D - 0.05, 0.98), M["wood_lt"])
box("swatch", (0.2, 0.012, 0.28), (3.0, D - 0.06, 1.12), M["paper"], rot=(math.radians(-10), 0, 0), bevel=0.002)
for i, c in enumerate(["#E1574A", "#F2C14E", "#5B9E7A", "#3E7CB1"]):
    box("chip", (0.16, 0.004, 0.05), (3.0, D - 0.07, 1.22 - i * 0.06), mat("ch" + c, c, 0.8), rot=(math.radians(-10), 0, 0), bevel=0)

# ---------- 06 door (right wall, near the open edge) ----------
DX0, DX1, DH = 4.0, 4.4, 2.1   # only a sliver of the jamb: door sits at the cut edge
# (kept as a lit gap: a corridor glow strip in the cut)

# ---------- 04 pinboard (left wall above the desk) ----------
box("cork", (0.03, 1.1, 0.7), (0.015, D - 1.9, 1.62), M["cork"], bevel=0.006)
box("cork_frame", (0.035, 1.14, 0.74), (0.012, D - 1.9, 1.62), M["wood"], bevel=0.004)
pins = ["#E1574A", "#F2C14E", "#3E7CB1", "#5B9E7A"]
for i in range(8):
    w, h = random.uniform(0.14, 0.24), random.uniform(0.1, 0.2)
    y = D - 2.35 + (i % 4) * 0.27 + random.uniform(-.03, .03); z = 1.47 + (i // 4) * 0.28 + random.uniform(-.03, .03)
    box("note", (0.004, w, h), (0.033, y, z), mat("n", random.choice(["#F1EADF", "#F6E58D", "#BEE3F8", "#F8C8D0"]), 0.9),
        rot=(random.uniform(-.1, .1), 0, 0), bevel=0)
    for k in range(int(h * 30)):
        box("scribble", (0.002, random.uniform(0.04, w - 0.04), 0.004), (0.036, y, z + h / 2 - 0.03 - k * 0.022),
            M["charcoal"], bevel=0)
    ico("pin", 0.012, (0.04, y, z + h / 2 - 0.015), mat("pin", random.choice(pins), 0.3), sub=1)

# ---------- 03 arcade cabinet (front-left, against the left wall) ----------
arc = empty("arcade", (0.42, 0.95, 0), 90)  # local -Y faces +x (into the room)
prof = [(0.36, 0.0), (0.36, 1.86), (0.02, 1.86), (-0.04, 1.62), (0.06, 1.55), (-0.06, 1.1),
        (-0.26, 1.0), (-0.26, 0.9), (-0.06, 0.86), (-0.06, 0.0)]
for s in (-1, 1):
    prism("cab_side", prof, 0.035, mat("cab_side", "#1E1B19", 0.5, coat=0.3), loc=(s * 0.34, 0, 0)).parent = arc
    tube("neon", [(s * 0.36, y, z) for y, z in prof], 0.006, M["trim"], closed=True).parent = arc
box("cab_body", (0.64, 0.38, 0.86), (0, 0.15, 0.43), mat("cab", "#1E1A22", 0.5, coat=0.3), parent=arc)
box("coin_door", (0.26, 0.01, 0.3), (0, -0.045, 0.45), M["charcoal"], bevel=0.004, parent=arc)
for x in (-0.05, 0.05):
    box("coin", (0.03, 0.01, 0.05), (x, -0.052, 0.52), mat("coin", "#000000", emit="#FF5A3C", strength=6), bevel=0, parent=arc)
box("kick", (0.64, 0.01, 0.1), (0, -0.065, 0.05), M["charcoal"], bevel=0, parent=arc)
box("cab_upper", (0.64, 0.34, 0.8), (0, 0.2, 1.45), mat("cab_u", "#1E1A22", 0.5, coat=0.3), parent=arc)
cp = box("ctrl", (0.7, 0.22, 0.06), (0, -0.16, 0.94), M["charcoal"], rot=(math.radians(-10), 0, 0), bevel=0.01, parent=arc)
for x in (-0.18, 0.12):
    cyl("stick", 0.007, 0.08, (x, -0.17, 1.0), M["metal"], verts=6, parent=arc)
    ico("ball", 0.022, (x, -0.17, 1.05), mat("ball", "#E1574A", 0.25, coat=1), sub=2, parent=arc)
    for k in range(3):
        cyl("btn", 0.014, 0.014, (x + 0.06 + k * 0.035, -0.15, 0.975), mat("btn", "#F2C14E", 0.3, coat=1), verts=10, parent=arc)
# screen bezel follows the slope between z 1.1 and 1.55
ang = math.atan2(1.55 - 1.1, 0.06 - (-0.06))
scr_rot = (-(math.radians(90) - ang), 0, 0)  # lean back with the cabinet slope
box("bezel", (0.56, 0.02, 0.46), (0, 0.01, 1.33), M["dark"], rot=scr_rot, bevel=0.006, parent=arc)
s_obj = screen("arc_screen", (0.46, 0.006, 0.36), (0, -0.005, 1.33), scr_rot, "astrox", M["arc_scr"], 2.2, parent=arc)
mq = box("marquee", (0.6, 0.03, 0.2), (0, 0.0, 1.72), mat("mq_bg", "#000000", emit="#2A1A10", strength=2), rot=(math.radians(-12), 0, 0), bevel=0.004, parent=arc)
bpy.ops.object.text_add(location=(0, -0.025, 1.7), rotation=(math.radians(90 - 12), 0, 0))
txt = bpy.context.object; txt.data.body = "ASTROX"; txt.data.align_x = "CENTER"; txt.data.align_y = "CENTER"
txt.data.size = 0.11; txt.data.extrude = 0.004; txt.data.materials.append(M["marquee"]); txt.parent = arc

# ---------- foreground: sofa, side table, rug, floor plant, beanbag ----------
box("rug", (1.9, 1.5, 0.012), (2.15, 1.9, 0.006), M["rug"], bevel=0.004)
for i in range(5):  # tiled rug: charcoal, greige and the brand accent
    for j in range(4):
        c = ["#2A2724", "#6E655C", "#4A4440", "#F99E35", "#8A8178"][(i * 3 + j * 2 + i * j) % 5]
        box("rtile", (0.37, 0.36, 0.006), (1.39 + i * 0.38, 1.36 + j * 0.37, 0.015), mat("rt" + c, c, 0.95), bevel=0.002)
sofa = empty("sofa", (1.85, 0.62, 0), 0)  # back toward camera, faces the desk
box("sofa_base", (1.6, 0.8, 0.3), (0, 0, 0.27), M["sofa"], bevel=0.04, seg=2, parent=sofa)
box("sofa_back", (1.6, 0.22, 0.42), (0, -0.3, 0.63), M["sofa"], rot=(math.radians(-8), 0, 0), bevel=0.05, seg=2, parent=sofa)
for s in (-1, 1):
    box("sofa_arm", (0.2, 0.8, 0.5), (s * 0.78, 0, 0.4), M["sofa_dk"], bevel=0.05, seg=2, parent=sofa)
    box("seat_cush", (0.66, 0.6, 0.12), (s * 0.34, 0.07, 0.48), M["sofa"], bevel=0.04, seg=2, parent=sofa)
    box("sofa_foot", (0.05, 0.05, 0.1), (s * 0.72, s * 0.3, 0.05), M["wood"], parent=sofa)
ico("pillow", 0.17, (0.55, -0.12, 0.66), M["cushion"], scale=(1, 0.45, 0.9), rot=(math.radians(-15), 0, math.radians(15)), parent=sofa)
st = empty("sidetable", (3.25, 1.75, 0), 20)
box("st_top", (0.5, 0.42, 0.03), (0, 0, 0.42), M["wood_lt"], parent=st)
for sx in (-1, 1):
    for sy in (-1, 1):
        box("st_leg", (0.035, 0.035, 0.41), (sx * 0.21, sy * 0.17, 0.205), M["wood"], parent=st)
for j, c in enumerate(["#7C5BA6", "#E8DCCB", "#3E7CB1"]):
    box("st_book", (0.26, 0.19, 0.035), (-0.05, 0.02, 0.455 + j * 0.036), mat("sb" + c, c, 0.7), rot=(0, 0, j * 0.15 - 0.1), bevel=0.003, parent=st)
box("st_paper", (0.2, 0.26, 0.002), (0.12, -0.02, 0.436), M["paper"], rot=(0, 0, 0.3), bevel=0, parent=st)
# bin + big plant near the right wall
cyl("bin", 0.13, 0.32, (2.75, D - 0.3, 0.16), mat("bin", "#9A96A0", 0.35, 1.0), r2=0.15, verts=12)
cyl("fpot", 0.17, 0.36, (4.05, D - 0.4, 0.18), M["pot"], r2=0.2, verts=8, bevel=0.006)
for i in range(13):
    a = i / 13 * math.tau * 2.3
    ico("fleaf", 0.17, (4.05 + math.cos(a) * 0.17, D - 0.4 + math.sin(a) * 0.17, 0.55 + (i / 13) * 0.75),
        M["leaf" if i % 2 else "leaf2"], scale=(0.5, 1.4, 0.18), sub=1,
        rot=(math.radians(25 + i * 3), 0, a + math.pi / 2))
cyl("stem", 0.015, 0.9, (4.05, D - 0.4, 0.7), M["wood"], verts=6)
# power strip with cables under the desk
box("strip", (0.32, 0.06, 0.04), (1.2, D - 0.25, 0.02), M["charcoal"], bevel=0.006)
# tripod floor lamp beside the sofa, glowing linen shade
for k in range(3):
    a = k / 3 * math.tau + 0.4
    p0 = (3.0 + math.cos(a) * 0.22, 0.3 + math.sin(a) * 0.22, 0.0)
    tube("tripod", [p0, (3.0, 0.3, 1.3)], 0.012, M["wood"])
cyl("shade", 0.2, 0.32, (3.0, 0.3, 1.55), mat("shade", "#E8DCC8", 0.9, emit="#FFD2A0", strength=1.6), verts=16, r2=0.18)
tube("cable1", [(1.1, D - 0.25, 0.03), (0.9, D - 0.5, 0.0), (0.55, D - 0.2, 0.2), (0.5, D - 0.12, TOP + 0.004)], 0.006, M["dark"])
tube("cable2", [(1.3, D - 0.25, 0.03), (1.6, D - 0.2, 0.0), (1.9, D - 0.12, 0.4), (1.9, D - 0.1, 1.7)], 0.006, M["dark"])

# ---------- lights ----------
def area(name, loc, rot, size, energy, col, sy=None, shape="RECTANGLE"):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = energy; ld.color = col
    ld.shape = shape; ld.size = size; ld.size_y = sy or size
    o = bpy.data.objects.new(name, ld); scn.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    return o

def point(name, loc, energy, col, radius=0.05):
    ld = bpy.data.lights.new(name, "POINT"); ld.energy = energy; ld.color = col; ld.shadow_soft_size = radius
    o = bpy.data.objects.new(name, ld); scn.collection.objects.link(o); o.location = loc
    return o

def aim(o, target):
    d = Vector(target) - o.location; o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o

WARM = (1.0, 0.66, 0.38)
VIOLET = (0.62, 0.45, 1.0)
MAGENTA = (1.0, 0.25, 0.85)
COOL = (0.7, 0.85, 1.0)
GREEN = (0.45, 1.0, 0.6)

# key: desk lamp pool
bpy.context.view_layer.update()
bulb = bpy.data.objects["lamp_bulb"].matrix_world.translation
point("lamp_key", bulb + Vector((0.03, -0.0, -0.05)), 130, WARM, 0.04)
# LED strip wash down both walls
area("led_l", (0.35, D / 2, H - 0.3), (0, math.radians(20), 0), 0.25, 30, WARM, sy=D)
area("led_r", (W / 2, D - 0.35, H - 0.3), (math.radians(-20), 0, 0), W, 30, WARM, sy=0.25)
# monitor + CRT glow
aim(area("mon_glow", (0.85, D - 0.85, TOP + 0.5), (0, 0, 0), 0.6, 10, COOL, sy=0.35), (1.4, D - 1.4, 0.9))
aim(area("crt_glow", (0.6, D - 1.75, TOP + 0.3), (0, 0, 0), 0.25, 6, GREEN), (1.2, D - 1.75, 0.6))
# arcade: soft screen and marquee glow only (no neon)
aim(area("arc_glow", (0.7, 0.95, 1.35), (0, 0, 0), 0.4, 8, (0.85, 0.85, 1.0)), (1.6, 0.95, 1.0))
aim(area("marq_glow", (0.6, 0.95, 1.75), (0, 0, 0), 0.4, 6, WARM), (1.4, 0.95, 1.2))
# shelf underlight (warm pool on the wall and desk)
area("shelf_led", (1.25, D - 0.13, 1.67), (math.radians(180), 0, 0), 1.8, 40, WARM, sy=0.15)
# floor lamp beside the sofa
point("floor_lamp", (3.0, 0.3, 1.55), 70, WARM, 0.12)
# overall violet fill from above the open side (the "night" ambient that keeps everything readable)
aim(area("fill", (W + 2.5, -2.5, H + 2.5), (0, 0, 0), 4.0, 70, (1.0, 0.86, 0.74)), (1.6, 2.4, 0.5))
# soft warm top light into the room (motivates the bright floor)
area("top", (W / 2, D / 2, H + 0.6), (0, 0, 0), 3.0, 14, (1.0, 0.82, 0.7))
for o in scn.objects:
    if o.type == "LIGHT": o.visible_camera = False

# backdrop: near-black warm ground (site --bg) with a faint cool glow low-left, as in the reference
gp = box("ground", (40, 40, 0.01), (W / 2, D / 2, -0.245), mat("ground", "#141210", 0.8), bevel=0)
aim(area("backglow", (-2.0, -3.5, 1.0), (0, 0, 0), 5.0, 120, (0.55, 0.55, 1.0)), (0.5, -1.0, -0.3))
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (*srgb("#0F0E0D"), 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.25

# ---------- camera: orthographic three-quarter view ----------
cam_d = bpy.data.cameras.new("cam"); cam_d.type = "ORTHO"; cam_d.ortho_scale = 8.4
cam = bpy.data.objects.new("cam", cam_d); scn.collection.objects.link(cam); scn.camera = cam
target = Vector((2.0, 2.3, 0.95))
if len(argv) > 3:  # close-up check: "x,y,z,ortho_scale"
    zx, zy, zz, zs = map(float, argv[3].split(",")); target = Vector((zx, zy, zz)); cam_d.ortho_scale = zs
cam.location = target + Vector((1, -1, 0.95)).normalized() * 20
aim(cam, target)
cam_d.clip_end = 60

# ---------- render ----------
scn.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "HIP"; prefs.get_devices()
    for dev in prefs.devices: dev.use = True
    scn.cycles.device = "GPU" if any(dv.type == "HIP" for dv in prefs.devices) else "CPU"
except Exception:
    scn.cycles.device = "CPU"
print("DEVICE", scn.cycles.device)
scn.cycles.samples = SAMPLES; scn.cycles.use_denoising = True
scn.render.resolution_x, scn.render.resolution_y = 1600, 1216
scn.view_settings.view_transform = "AgX"; scn.view_settings.look = "AgX - Medium High Contrast"
scn.view_settings.exposure = 0.0
scn.render.filepath = OUT
bpy.ops.render.render(write_still=True)
