"""After Hours Studio: the seated designer (Milestone 2). Neutral persona, no likeness.

Style matches the props: faceted (flat-shaded, low segment counts), chamfered clothing volumes, a simple hair mass.
Built directly in the seated typing pose, in chair-local space (origin on the floor under the seat, facing -Y),
as separate rigid parts. Each part will ride one bone of a simple armature, so hand-keyed motion never deforms
a mesh badly.

Used by studio.py:  import character; character.build(parent=chair_empty)
"""
import bpy, bmesh, math
from mathutils import Vector, Quaternion


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def mat(name, hexcol, rough=0.6, coat=0.0):
    m = bpy.data.materials.get("char_" + name)
    if m: return m
    m = bpy.data.materials.new("char_" + name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(hexcol), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    return m


PALETTE = {
    "skin": ("#A87252", 0.7),
    "hair": ("#1A1411", 0.9),
    "hoodie": ("#36475A", 0.95),    # muted slate blue: separates from the warm walls
    "hoodie_dk": ("#2C3A4A", 0.95),
    "string": ("#D9D1C4", 0.8),
    "pants": ("#2B2E36", 0.85),
    "shoe": ("#E2DCD0", 0.6),
    "sole": ("#3A3530", 0.7),
    "glasses": ("#1A1817", 0.35),
}


def M(key):
    return mat(key, *PALETTE[key])


def link(o, parent, name):
    o.name = name
    if parent: o.parent = parent
    return o


def mesh_obj(name, bm, material, parent):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material)
    return link(o, parent, name)


def loft(name, pts, radii, material, parent, sides=8, ref=Vector((1, 0, 0)), caps=True, phase=0.0):
    """Faceted tube through points; radii are (rx, ry) per ring, rx along `ref` projected off the path."""
    pts = [Vector(p) for p in pts]
    bm = bmesh.new(); rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        u = (ref - t * ref.dot(t)).normalized(); v = t.cross(u)
        rx, ry = radii[i]
        rings.append([bm.verts.new(p + u * math.cos(a) * rx + v * math.sin(a) * ry)
                      for a in (phase + k * math.tau / sides for k in range(sides))])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(sides):
            bm.faces.new((r0[k], r0[(k + 1) % sides], r1[(k + 1) % sides], r1[k]))
    if caps:
        bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, material, parent)


def blob(name, center, radii, material, parent, sub=1, shape=None, keep=None):
    """Icosphere scaled to radii; optional shape(v) edits unit-sphere coords, keep(v) drops vertices."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    if keep:
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep(v.co)], context="VERTS")
    for v in bm.verts:
        if shape: shape(v.co)
        v.co = Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2])) + Vector(center)
    return mesh_obj(name, bm, material, parent)


def block(name, size, center, material, parent, rot=(0, 0, 0), bevel=0.006):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    o = mesh_obj(name, bm, material, parent)
    o.location = center; o.rotation_euler = rot
    if bevel:
        bv = o.modifiers.new("bevel", "BEVEL"); bv.width = bevel; bv.segments = 1
    return o


def ring(name, center, radius, minor, material, parent, rot=(math.radians(90), 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=minor, major_segments=10, minor_segments=4,
                                     location=center, rotation=rot)
    o = bpy.context.object; o.data.materials.append(material)
    return link(o, parent, name)


def build(parent=None):
    """Adds the seated designer under `parent` (chair space). Returns the root empty."""
    root = bpy.data.objects.new("character", None); bpy.context.scene.collection.objects.link(root)
    if parent: root.parent = parent

    # ---- torso: hoodie, leaning slightly toward the desk ----
    loft("torso", [(0, 0.02, 0.54), (0, 0.03, 0.70), (0, 0.01, 0.88), (0, -0.01, 0.99), (0, -0.02, 1.06), (0, -0.025, 1.10)],
         [(0.17, 0.125), (0.155, 0.11), (0.18, 0.12), (0.195, 0.115), (0.16, 0.095), (0.075, 0.065)],
         M("hoodie"), root, sides=10)
    loft("waistband", [(0, 0.022, 0.55), (0, 0.024, 0.60)], [(0.176, 0.13), (0.172, 0.127)], M("hoodie_dk"), root, sides=10)
    blob("hood", (0, 0.075, 1.09), (0.13, 0.075, 0.065), M("hoodie_dk"), root, sub=1)
    block("pocket", (0.2, 0.012, 0.11), (0, -0.098, 0.68), M("hoodie_dk"), root, rot=(math.radians(-6), 0, 0), bevel=0.004)
    for s in (-1, 1):  # drawstrings
        loft(f"string_{'r' if s < 0 else 'l'}", [(s * 0.035, -0.09, 1.06), (s * 0.04, -0.12, 0.98), (s * 0.042, -0.125, 0.92)],
             [(0.005, 0.005)] * 3, M("string"), root, sides=5)
        blob(f"aglet_{'r' if s < 0 else 'l'}", (s * 0.042, -0.126, 0.91), (0.007, 0.007, 0.012), M("string"), root, sub=1)

    # ---- head ----
    loft("neck", [(0, -0.025, 1.07), (0, -0.04, 1.15)], [(0.054, 0.05), (0.05, 0.047)], M("skin"), root, sides=8)
    HC = Vector((0, -0.055, 1.245))

    def head_shape(c):
        if c.z < 0:  # jaw tapers toward the chin
            c.x *= 1 - 0.3 * -c.z
            c.y *= 1 - 0.1 * -c.z
        if c.y > 0: c.y *= 1.06  # back of the skull
    blob("head", HC, (0.086, 0.1, 0.116), M("skin"), root, sub=3, shape=head_shape)
    blob("nose", HC + Vector((0, -0.097, -0.012)), (0.012, 0.016, 0.022), M("skin"), root, sub=1)
    for s in (-1, 1):
        blob(f"ear_{'r' if s < 0 else 'l'}", HC + Vector((s * 0.085, 0.008, -0.004)), (0.012, 0.026, 0.036), M("skin"), root, sub=1)

    def hairline(c):  # keep the scalp: low at the nape, a clean line above the forehead
        return c.z > 0.32 - 0.9 * ((c.y + 1) / 2) ** 1.3
    blob("hair", HC + Vector((0, 0.006, 0.012)), (0.095, 0.108, 0.12), M("hair"), root, sub=3, keep=hairline)
    blob("quiff", HC + Vector((0.012, -0.045, 0.098)), (0.07, 0.06, 0.032), M("hair"), root, sub=1)
    # glasses
    for s in (-1, 1):
        ring(f"lens_{'r' if s < 0 else 'l'}", HC + Vector((s * 0.036, -0.103, 0.012)), 0.022, 0.0028, M("glasses"), root)
        loft(f"temple_{'r' if s < 0 else 'l'}", [HC + Vector((s * 0.058, -0.1, 0.014)), HC + Vector((s * 0.088, -0.05, 0.014)),
                                                  HC + Vector((s * 0.088, 0.0, 0.0))], [(0.0025, 0.0025)] * 3, M("glasses"), root, sides=4)
    loft("bridge", [HC + Vector((-0.012, -0.104, 0.016)), HC + Vector((0.012, -0.104, 0.016))], [(0.0025, 0.0025)] * 2,
         M("glasses"), root, sides=4, ref=Vector((0, 0, 1)))

    # ---- arms: hands on the keyboard, forearms clear of the desk edge ----
    for s in (-1, 1):
        side = "r" if s < 0 else "l"  # anatomical: it faces -Y, so its right is -X
        # the upper arm starts inside the torso, so the shoulder line stays soft (no separate shoulder ball)
        sh, el, wr = Vector((s * 0.165, 0.0, 1.03)), Vector((s * 0.235, -0.11, 0.82)), Vector((s * 0.15, -0.36, 0.805))
        loft(f"upper_arm_{side}", [sh, (sh + el) / 2, el], [(0.06, 0.058), (0.054, 0.053), (0.047, 0.047)], M("hoodie"), root)
        blob(f"elbow_{side}", el, (0.048, 0.048, 0.048), M("hoodie"), root, sub=1)
        cuff = wr + (el - wr).normalized() * 0.025
        loft(f"forearm_{side}", [el, (el + wr) / 2, cuff], [(0.046, 0.046), (0.043, 0.043), (0.04, 0.04)], M("hoodie"), root)
        loft(f"cuff_{side}", [cuff + (el - wr).normalized() * 0.012, cuff - (el - wr).normalized() * 0.006],
             [(0.042, 0.042), (0.04, 0.04)], M("hoodie_dk"), root)
        # hand: palm, curved finger block, thumb (faceted mitten with a hint of fingers)
        d = (wr - el); d.z = 0; d.normalize()
        yaw = math.atan2(-d.x, d.y)  # local +Y of the hand blocks points along the forearm
        palm_c = wr + d * 0.045 + Vector((0, 0, -0.005))
        block(f"palm_{side}", (0.072, 0.075, 0.024), palm_c, M("skin"), root, rot=(math.radians(-8), 0, yaw), bevel=0.008)
        block(f"fingers_{side}", (0.068, 0.055, 0.018), palm_c + d * 0.06 + Vector((0, 0, -0.012)), M("skin"), root,
              rot=(math.radians(-28), 0, yaw), bevel=0.007)
        side_v = Vector((d.y, -d.x, 0)) * s  # toward the inside of the hand
        loft(f"thumb_{side}", [palm_c + side_v * 0.03, palm_c + side_v * 0.045 + d * 0.04 + Vector((0, 0, -0.012))],
             [(0.012, 0.012), (0.01, 0.01)], M("skin"), root, sides=6)
        loft(f"wrist_{side}", [cuff, palm_c - d * 0.02], [(0.028, 0.026), (0.03, 0.02)], M("skin"), root, sides=6)

    # ---- legs and shoes ----
    for s in (-1, 1):
        side = "r" if s < 0 else "l"  # anatomical: it faces -Y, so its right is -X
        hp, kn, an = Vector((s * 0.095, -0.02, 0.6)), Vector((s * 0.115, -0.43, 0.6)), Vector((s * 0.12, -0.46, 0.12))
        loft(f"thigh_{side}", [hp, (hp + kn) / 2, kn], [(0.082, 0.078), (0.072, 0.068), (0.06, 0.058)], M("pants"), root,
             ref=Vector((1, 0, 0)))
        blob(f"knee_{side}", kn, (0.06, 0.06, 0.06), M("pants"), root, sub=1)
        loft(f"shin_{side}", [kn, (kn + an) / 2, an], [(0.056, 0.056), (0.05, 0.05), (0.046, 0.046)], M("pants"), root)
        # sneaker: upper, toe cap and sole
        loft(f"shoe_{side}", [an + Vector((0, 0.05, -0.06)), an + Vector((0, -0.04, -0.07)), an + Vector((0, -0.17, -0.085))],
             [(0.05, 0.05), (0.052, 0.045), (0.045, 0.032)], M("shoe"), root, ref=Vector((1, 0, 0)), sides=8)
        block(f"sole_{side}", (0.098, 0.25, 0.022), an + Vector((0, -0.055, -0.109)), M("sole"), root, bevel=0.008)

    for o in [c for c in bpy.context.scene.objects if c.parent == root]:
        o.data.polygons.foreach_set("use_smooth", [False] * len(o.data.polygons))
    arm = rig(root)
    clips(arm)
    return root


# ---------------------------------------------------------------- rig
# Joints in character space (the seated pose). Each part rides one bone rigidly: no skinning.
def _arm_joints(s):
    sh, el, wr = Vector((s * 0.165, 0.0, 1.03)), Vector((s * 0.235, -0.11, 0.82)), Vector((s * 0.15, -0.36, 0.805))
    d = (wr - el); d.z = 0; d.normalize()
    return sh, el, wr, wr + d * 0.12

BONES = [  # name, head, tail, parent
    ("root", (0, 0.02, 0.45), (0, 0.02, 0.6), None),
    ("spine", (0, 0.02, 0.6), (0, -0.01, 0.95), "root"),
    ("chest", (0, -0.01, 0.95), (0, -0.02, 1.07), "spine"),
    ("neck", (0, -0.025, 1.07), (0, -0.04, 1.15), "chest"),
    ("head", (0, -0.04, 1.15), (0, -0.055, 1.36), "neck"),
]
for _s, _side in ((-1, "r"), (1, "l")):  # anatomical sides
    _sh, _el, _wr, _hd = _arm_joints(_s)
    BONES += [(f"upper_arm_{_side}", _sh, _el, "chest"), (f"forearm_{_side}", _el, _wr, f"upper_arm_{_side}"),
              (f"hand_{_side}", _wr, _hd, f"forearm_{_side}")]

PART_BONE = [  # part-name prefix -> bone (first match wins; sided names keep their side)
    ("upper_arm", "upper_arm"), ("elbow", "forearm"), ("forearm", "forearm"), ("cuff", "forearm"), ("wrist", "forearm"),
    ("palm", "hand"), ("fingers", "hand"), ("thumb", "hand"),
    ("torso", "spine"), ("waistband", "spine"), ("pocket", "spine"),
    ("hood", "chest"), ("string", "chest"), ("aglet", "chest"),
    ("neck", "neck"),
    ("head", "head"), ("nose", "head"), ("ear", "head"), ("hair", "head"), ("quiff", "head"),
    ("lens", "head"), ("temple", "head"), ("bridge", "head"),
    ("thigh", "root"), ("knee", "root"), ("shin", "root"), ("shoe", "root"), ("sole", "root"),
]
SIDED = {"upper_arm", "forearm", "hand"}


def rig(root):
    ad = bpy.data.armatures.new("rig"); arm = bpy.data.objects.new("rig", ad)
    bpy.context.scene.collection.objects.link(arm); arm.parent = root
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for name, h, t, p in BONES:
        b = ad.edit_bones.new(name); b.head = h; b.tail = t
        if p: b.parent = ad.edit_bones[p]
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.view_layer.update()
    for o in [c for c in root.children if c.type == "MESH"]:
        bone = next(b for prefix, b in PART_BONE if o.name.startswith(prefix))
        if bone in SIDED: bone += o.name[-2:]  # "_l" / "_r"
        mw = o.matrix_world.copy()
        o.parent = arm; o.parent_type = "BONE"; o.parent_bone = bone
        bpy.context.view_layer.update()
        o.matrix_world = mw
    for pb in arm.pose.bones: pb.rotation_mode = "QUATERNION"
    return arm


# ---------------------------------------------------------------- clips
# Poses are {bone: [(axis, degrees), ...]} with axes in character space (X right, Y back, Z up; it faces -Y).
# Sides are anatomical (its right is -X). Seen from the room camera it faces away, so its right is the screen's
# right: "notice_r"/"shoo_r" turn toward a cursor on the right of the screen.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
FPS = 30


def _quat(pb, rots):
    B = pb.bone.matrix_local.to_3x3().inverted()
    q = Quaternion()
    for axis, deg in rots:
        q = Quaternion(B @ Vector(axis), math.radians(deg)) @ q
    return q


def _aim(pb, direction, spin=0.0):
    """Point a bone along a character-space direction, whatever its parent is doing (the parent must be posed)."""
    bpy.context.view_layer.update()
    if pb.parent:
        base = pb.parent.matrix.to_3x3() @ (pb.parent.bone.matrix_local.to_3x3().inverted() @ pb.bone.matrix_local.to_3x3())
    else:
        base = pb.bone.matrix_local.to_3x3()
    target = Vector(direction).normalized()
    turn = (base @ Vector((0, 1, 0))).rotation_difference(target).to_matrix()
    spin_m = Quaternion(target, math.radians(spin)).to_matrix()
    return (base.inverted() @ spin_m @ turn @ base).to_quaternion()


def _key(arm, frame, pose):
    """Bones are set parents-first; a pose entry is a list of (axis, degrees) or {"aim": dir, "spin": deg}."""
    for pb in arm.pose.bones:
        spec = pose.get(pb.name, [])
        pb.rotation_quaternion = _aim(pb, spec["aim"], spec.get("spin", 0)) if isinstance(spec, dict) else _quat(pb, spec)
    for pb in arm.pose.bones:
        pb.keyframe_insert("rotation_quaternion", frame=frame)


def mirror(pose):
    """Left/right mirror: swap sides; rotations about Y and Z change sign."""
    out = {}
    for bone, rots in pose.items():
        name = bone[:-2] + {"_l": "_r", "_r": "_l"}[bone[-2:]] if bone[-2:] in ("_l", "_r") else bone
        if isinstance(rots, dict):
            d = rots["aim"]
            out[name] = {"aim": (-d[0], d[1], d[2]), "spin": -rots.get("spin", 0)}
        else:
            out[name] = [(axis, deg if axis == X else -deg) for axis, deg in rots]
    return out


def _action(arm, name, keys):
    act = bpy.data.actions.new(name); act.use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = act
    for frame, pose in keys: _key(arm, frame, pose)
    track = arm.animation_data.nla_tracks.new(); track.name = name
    track.strips.new(name, int(keys[0][0]), act); track.mute = True
    arm.animation_data.action = None
    return act


def _typing(k):
    """Typing loop key k of 7 (k=0 and k=6 match): hands tap in turn, a slow breath and nod."""
    fl = [0, -2.5, 0, -1.5, 0, -2.2, 0][k]; fr = [-1.2, 0, -2.6, 0, -1.8, 0, -1.2][k]
    hl = [0, 5, -2, 4, 0, 5, 0][k]; hr = [3, -1, 5, 0, 4, -1, 3][k]
    breath = [0, 0.5, 1.0, 1.2, 1.0, 0.5, 0][k]; nod = [0, 0.8, 1.6, 0.8, 0, -0.6, 0][k]
    return {"spine": [(X, breath)], "head": [(X, nod)], "forearm_l": [(X, fl)], "forearm_r": [(X, fr)],
            "hand_l": [(X, hl)], "hand_r": [(X, hr)]}


# Looks over the right shoulder toward the visitor (the camera is behind and to the right), hands off the keys.
NOTICE_R = {"spine": [(Z, -24)], "chest": [(Z, -10)], "neck": [(Z, -12)], "head": [(Z, -40), (X, -6)],
            "forearm_l": [(X, -10)], "forearm_r": [(X, -14)], "hand_l": [(X, 8)], "hand_r": [(X, 8)]}


def _shoo_r(flick):
    """Right elbow out to the side, forearm up, the hand flicking outward (flick = -1..1): "go away"."""
    return {"spine": [(Z, -18)], "chest": [(Z, -8)], "neck": [(Z, -10)], "head": [(Z, -36), (X, -4)],
            "upper_arm_r": {"aim": (-0.8, -0.3, -0.45)},
            "forearm_r": {"aim": (-(0.15 + 0.35 * flick), -0.25, 0.95)},
            "hand_r": {"aim": (-(0.35 + 0.6 * flick), -0.2, 0.85)},
            "forearm_l": [(X, -8)], "hand_l": [(X, 6)]}


def clips(arm):
    rest = {}
    _action(arm, "type", [(1 + k * 10, _typing(k)) for k in range(7)])
    _action(arm, "notice_r", [(1, NOTICE_R), (20, NOTICE_R)])
    _action(arm, "notice_l", [(1, mirror(NOTICE_R)), (20, mirror(NOTICE_R))])
    shoo = [(1, _typing(0)), (8, _shoo_r(0)), (13, _shoo_r(1)), (18, _shoo_r(-0.6)), (23, _shoo_r(1)),
            (28, _shoo_r(-0.4)), (34, _shoo_r(0.6)), (44, _typing(0))]
    _action(arm, "shoo_r", shoo)
    _action(arm, "shoo_l", [(f, mirror(p)) for f, p in shoo])
    _action(arm, "still", [(1, rest), (2, rest)])
    bpy.context.scene.render.fps = FPS
