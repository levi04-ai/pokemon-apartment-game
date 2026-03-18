from PIL import Image

def px(f, x, y, color):
    if 0 <= x < 32 and 0 <= y < 32:
        f.putpixel((x, y), color)

def fill_rect(f, x1, y1, x2, y2, color):
    for y in range(y1, y2):
        for x in range(x1, x2):
            px(f, x, y, color)

T = (0, 0, 0, 0)

# ===== ADAM =====
AC = {
    'hair_dk': (50,35,25,255), 'hair': (75,55,40,255), 'hair_lt': (95,70,50,255),
    'skin': (235,195,155,255), 'skin_sh': (210,165,125,255),
    'glass': (130,80,170,255), 'lens': (180,200,230,255), 'eye': (30,25,35,255),
    'beard': (65,45,35,255),
    'shirt': (55,55,65,255), 'shirt_sh': (40,40,50,255), 'shirt_lt': (70,70,80,255),
    'pants': (40,45,55,255), 'pants_sh': (30,32,42,255),
    'shoe': (45,35,30,255),
}

def adam_down_stand():
    f = Image.new('RGBA', (32,32), T)
    # Hair
    fill_rect(f, 13,8, 20,9, AC['hair_dk'])
    fill_rect(f, 12,9, 21,11, AC['hair'])
    px(f,12,9,AC['hair_dk']); px(f,20,9,AC['hair_dk'])
    # Face
    fill_rect(f, 13,11, 20,12, AC['skin'])
    fill_rect(f, 12,12, 21,14, AC['skin'])
    # Glasses + eyes
    px(f,13,12,AC['glass']); px(f,14,12,AC['eye']); px(f,15,12,AC['glass'])
    px(f,16,12,AC['glass'])
    px(f,17,12,AC['glass']); px(f,18,12,AC['eye']); px(f,19,12,AC['glass'])
    # Beard
    fill_rect(f, 13,14, 20,15, AC['beard'])
    fill_rect(f, 14,15, 19,16, AC['beard'])
    # Shirt
    fill_rect(f, 12,16, 21,21, AC['shirt'])
    for y in range(16,21): px(f,12,y,AC['shirt_sh']); px(f,20,y,AC['shirt_sh'])
    # Arms
    for y in range(17,21): px(f,11,y,AC['shirt']); px(f,21,y,AC['shirt'])
    px(f,11,21,AC['skin']); px(f,21,21,AC['skin'])
    # Pants
    fill_rect(f, 13,21, 16,26, AC['pants'])
    fill_rect(f, 17,21, 20,26, AC['pants'])
    px(f,16,21,AC['pants_sh']); px(f,16,22,AC['pants_sh'])
    # Shoes
    fill_rect(f, 13,26, 16,27, AC['shoe'])
    fill_rect(f, 17,26, 20,27, AC['shoe'])
    return f

def adam_down_wl():
    f = adam_down_stand()
    fill_rect(f, 12,22, 21,27, T)
    fill_rect(f, 12,22, 15,26, AC['pants'])
    fill_rect(f, 12,26, 15,27, AC['shoe'])
    fill_rect(f, 17,22, 20,25, AC['pants'])
    fill_rect(f, 17,25, 20,26, AC['shoe'])
    return f

def adam_down_wr():
    f = adam_down_stand()
    fill_rect(f, 12,22, 21,27, T)
    fill_rect(f, 18,22, 21,26, AC['pants'])
    fill_rect(f, 18,26, 21,27, AC['shoe'])
    fill_rect(f, 13,22, 16,25, AC['pants'])
    fill_rect(f, 13,25, 16,26, AC['shoe'])
    return f

def adam_up_stand():
    f = Image.new('RGBA', (32,32), T)
    fill_rect(f, 13,8, 20,9, AC['hair_dk'])
    fill_rect(f, 12,9, 21,14, AC['hair'])
    fill_rect(f, 13,14, 20,15, AC['hair_dk'])
    fill_rect(f, 14,15, 19,16, AC['skin_sh'])
    fill_rect(f, 12,16, 21,21, AC['shirt'])
    for y in range(16,21): px(f,12,y,AC['shirt_sh']); px(f,20,y,AC['shirt_sh'])
    for y in range(17,21): px(f,11,y,AC['shirt']); px(f,21,y,AC['shirt'])
    fill_rect(f, 13,21, 16,26, AC['pants'])
    fill_rect(f, 17,21, 20,26, AC['pants'])
    px(f,16,21,AC['pants_sh']); px(f,16,22,AC['pants_sh'])
    fill_rect(f, 13,26, 16,27, AC['shoe'])
    fill_rect(f, 17,26, 20,27, AC['shoe'])
    return f

def adam_up_wl():
    f = adam_up_stand()
    fill_rect(f, 12,22, 21,27, T)
    fill_rect(f, 12,22, 15,26, AC['pants'])
    fill_rect(f, 12,26, 15,27, AC['shoe'])
    fill_rect(f, 17,22, 20,25, AC['pants'])
    fill_rect(f, 17,25, 20,26, AC['shoe'])
    return f

def adam_up_wr():
    f = adam_up_stand()
    fill_rect(f, 12,22, 21,27, T)
    fill_rect(f, 18,22, 21,26, AC['pants'])
    fill_rect(f, 18,26, 21,27, AC['shoe'])
    fill_rect(f, 13,22, 16,25, AC['pants'])
    fill_rect(f, 13,25, 16,26, AC['shoe'])
    return f

def adam_left_stand():
    f = Image.new('RGBA', (32,32), T)
    fill_rect(f, 13,8, 19,9, AC['hair_dk'])
    fill_rect(f, 12,9, 19,11, AC['hair'])
    fill_rect(f, 12,11, 18,12, AC['skin'])
    fill_rect(f, 11,12, 18,13, AC['skin'])
    px(f,12,12,AC['glass']); px(f,13,12,AC['eye']); px(f,14,12,AC['glass'])
    fill_rect(f, 11,13, 17,14, AC['skin'])
    fill_rect(f, 11,14, 16,15, AC['beard'])
    px(f,14,15,AC['skin_sh']); px(f,15,15,AC['skin_sh'])
    fill_rect(f, 12,16, 20,21, AC['shirt'])
    for y in range(16,21): px(f,12,y,AC['shirt_sh'])
    for y in range(17,21): px(f,11,y,AC['shirt'])
    px(f,11,21,AC['skin'])
    fill_rect(f, 13,21, 19,26, AC['pants'])
    fill_rect(f, 12,26, 18,27, AC['shoe'])
    return f

def adam_left_wl():
    f = adam_left_stand()
    fill_rect(f, 10,22, 21,27, T)
    fill_rect(f, 11,22, 16,26, AC['pants'])
    fill_rect(f, 11,26, 16,27, AC['shoe'])
    fill_rect(f, 16,22, 19,25, AC['pants_sh'])
    fill_rect(f, 16,25, 19,26, AC['shoe'])
    return f

def adam_left_wr():
    f = adam_left_stand()
    fill_rect(f, 10,22, 21,27, T)
    fill_rect(f, 16,22, 19,26, AC['pants_sh'])
    fill_rect(f, 16,26, 19,27, AC['shoe'])
    fill_rect(f, 11,22, 16,25, AC['pants'])
    fill_rect(f, 11,25, 16,26, AC['shoe'])
    return f

# ===== TAL =====
TC = {
    'hair_dk': (60,40,25,255), 'hair': (90,65,40,255), 'hair_lt': (115,85,55,255),
    'skin': (240,200,165,255), 'skin_sh': (215,170,135,255),
    'eye': (40,35,30,255), 'lip': (200,120,110,255),
    'top': (50,140,130,255), 'top_sh': (35,115,105,255), 'top_lt': (65,160,150,255),
    'pants': (45,45,55,255), 'pants_sh': (35,35,45,255),
    'shoe': (50,40,35,255),
}

def tal_down_stand():
    f = Image.new('RGBA', (32,32), T)
    fill_rect(f, 13,7, 20,8, TC['hair_dk'])
    fill_rect(f, 12,8, 21,10, TC['hair'])
    # Hair sides + face
    fill_rect(f, 11,10, 22,15, TC['hair'])
    fill_rect(f, 14,10, 19,11, TC['skin'])
    fill_rect(f, 13,11, 20,14, TC['skin'])
    px(f,14,12,TC['eye']); px(f,18,12,TC['eye'])
    px(f,16,13,TC['lip'])
    fill_rect(f, 14,14, 19,15, TC['skin_sh'])
    # Hair down + neck
    px(f,11,15,TC['hair']); px(f,21,15,TC['hair'])
    px(f,15,15,TC['skin_sh']); px(f,16,15,TC['skin_sh']); px(f,17,15,TC['skin_sh'])
    # Top
    fill_rect(f, 12,16, 21,21, TC['top'])
    for y in range(16,21): px(f,12,y,TC['top_sh']); px(f,20,y,TC['top_sh'])
    # Hair on shoulders
    for y in range(16,20): px(f,11,y,TC['hair']); px(f,21,y,TC['hair'])
    # Arms
    for y in range(17,21): px(f,10,y,TC['top']); px(f,22,y,TC['top'])
    px(f,10,21,TC['skin']); px(f,22,21,TC['skin'])
    # Pants
    fill_rect(f, 13,21, 16,26, TC['pants'])
    fill_rect(f, 17,21, 20,26, TC['pants'])
    px(f,16,21,TC['pants_sh']); px(f,16,22,TC['pants_sh'])
    fill_rect(f, 13,26, 16,27, TC['shoe'])
    fill_rect(f, 17,26, 20,27, TC['shoe'])
    return f

def tal_down_wl():
    f = tal_down_stand()
    fill_rect(f, 10,22, 23,27, T)
    fill_rect(f, 12,22, 15,26, TC['pants'])
    fill_rect(f, 12,26, 15,27, TC['shoe'])
    fill_rect(f, 17,22, 20,25, TC['pants'])
    fill_rect(f, 17,25, 20,26, TC['shoe'])
    return f

def tal_down_wr():
    f = tal_down_stand()
    fill_rect(f, 10,22, 23,27, T)
    fill_rect(f, 18,22, 21,26, TC['pants'])
    fill_rect(f, 18,26, 21,27, TC['shoe'])
    fill_rect(f, 13,22, 16,25, TC['pants'])
    fill_rect(f, 13,25, 16,26, TC['shoe'])
    return f

def tal_up_stand():
    f = Image.new('RGBA', (32,32), T)
    fill_rect(f, 13,7, 20,8, TC['hair_dk'])
    fill_rect(f, 11,8, 22,15, TC['hair'])
    for y in range(15,20): px(f,11,y,TC['hair']); px(f,21,y,TC['hair']); px(f,12,y,TC['hair_dk']); px(f,20,y,TC['hair_dk'])
    px(f,15,15,TC['skin_sh']); px(f,16,15,TC['skin_sh']); px(f,17,15,TC['skin_sh'])
    fill_rect(f, 13,16, 20,21, TC['top'])
    for y in range(16,21): px(f,13,y,TC['top_sh']); px(f,19,y,TC['top_sh'])
    for y in range(17,21): px(f,10,y,TC['top']); px(f,22,y,TC['top'])
    fill_rect(f, 13,21, 16,26, TC['pants'])
    fill_rect(f, 17,21, 20,26, TC['pants'])
    px(f,16,21,TC['pants_sh']); px(f,16,22,TC['pants_sh'])
    fill_rect(f, 13,26, 16,27, TC['shoe'])
    fill_rect(f, 17,26, 20,27, TC['shoe'])
    return f

def tal_up_wl():
    f = tal_up_stand()
    fill_rect(f, 10,22, 23,27, T)
    fill_rect(f, 12,22, 15,26, TC['pants']); fill_rect(f, 12,26, 15,27, TC['shoe'])
    fill_rect(f, 17,22, 20,25, TC['pants']); fill_rect(f, 17,25, 20,26, TC['shoe'])
    return f

def tal_up_wr():
    f = tal_up_stand()
    fill_rect(f, 10,22, 23,27, T)
    fill_rect(f, 18,22, 21,26, TC['pants']); fill_rect(f, 18,26, 21,27, TC['shoe'])
    fill_rect(f, 13,22, 16,25, TC['pants']); fill_rect(f, 13,25, 16,26, TC['shoe'])
    return f

def tal_left_stand():
    f = Image.new('RGBA', (32,32), T)
    fill_rect(f, 13,7, 19,8, TC['hair_dk'])
    fill_rect(f, 11,8, 20,15, TC['hair'])
    fill_rect(f, 13,10, 18,11, TC['skin'])
    fill_rect(f, 13,11, 18,14, TC['skin'])
    px(f,13,12,TC['eye'])
    px(f,15,13,TC['lip'])
    fill_rect(f, 14,14, 17,15, TC['skin_sh'])
    for y in range(15,20): px(f,11,y,TC['hair']); px(f,12,y,TC['hair_dk']); px(f,19,y,TC['hair']); px(f,18,y,TC['hair_dk'])
    px(f,14,15,TC['skin_sh']); px(f,15,15,TC['skin_sh'])
    fill_rect(f, 13,16, 19,21, TC['top'])
    for y in range(16,21): px(f,13,y,TC['top_sh'])
    for y in range(17,21): px(f,10,y,TC['top'])
    px(f,10,21,TC['skin'])
    fill_rect(f, 13,21, 19,26, TC['pants'])
    fill_rect(f, 12,26, 18,27, TC['shoe'])
    return f

def tal_left_wl():
    f = tal_left_stand()
    fill_rect(f, 9,22, 21,27, T)
    fill_rect(f, 11,22, 16,26, TC['pants']); fill_rect(f, 11,26, 16,27, TC['shoe'])
    fill_rect(f, 16,22, 19,25, TC['pants_sh']); fill_rect(f, 16,25, 19,26, TC['shoe'])
    return f

def tal_left_wr():
    f = tal_left_stand()
    fill_rect(f, 9,22, 21,27, T)
    fill_rect(f, 16,22, 19,26, TC['pants_sh']); fill_rect(f, 16,26, 19,27, TC['shoe'])
    fill_rect(f, 11,22, 16,25, TC['pants']); fill_rect(f, 11,25, 16,26, TC['shoe'])
    return f

def mirror(img):
    return img.transpose(Image.FLIP_LEFT_RIGHT)

# Build Adam sheet
adam = Image.new('RGBA', (128,128), T)
rows = [
    [adam_down_stand(), adam_down_wl(), adam_down_stand(), adam_down_wr()],
    [adam_left_stand(), adam_left_wl(), adam_left_stand(), adam_left_wr()],
    [mirror(adam_left_stand()), mirror(adam_left_wl()), mirror(adam_left_stand()), mirror(adam_left_wr())],
    [adam_up_stand(), adam_up_wl(), adam_up_stand(), adam_up_wr()],
]
for ri, row in enumerate(rows):
    for ci, frame in enumerate(row):
        adam.paste(frame, (ci*32, ri*32), frame)
adam.save('C:/Users/adam/Desktop/Pokemon Game/adam_sheet.png')
print(f'Adam: {adam.size}')

# Build Tal sheet
tal = Image.new('RGBA', (128,128), T)
rows = [
    [tal_down_stand(), tal_down_wl(), tal_down_stand(), tal_down_wr()],
    [tal_left_stand(), tal_left_wl(), tal_left_stand(), tal_left_wr()],
    [mirror(tal_left_stand()), mirror(tal_left_wl()), mirror(tal_left_stand()), mirror(tal_left_wr())],
    [tal_up_stand(), tal_up_wl(), tal_up_stand(), tal_up_wr()],
]
for ri, row in enumerate(rows):
    for ci, frame in enumerate(row):
        tal.paste(frame, (ci*32, ri*32), frame)
tal.save('C:/Users/adam/Desktop/Pokemon Game/tal_sheet.png')
print(f'Tal: {tal.size}')
print('Done!')
