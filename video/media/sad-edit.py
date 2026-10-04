# "Photoshops" the happy Lewandowski photo into a sad one for the v10 hook: a liquify-style warp
# (mouth corners pulled down, inner eyebrows raised), tears, and a cold desaturated grade.
# Run from video/media/ after fetch.py:  ../voiceover/.venv/bin/python sad-edit.py
# Writes ../public/v8/rl-happy-sad.jpg (git-ignored like the source photo, CC BY-SA 4.0 Sven Mandel; edit noted in CREDITS.md).
import cv2
import numpy as np

SRC, DST = "../public/v8/rl-happy.jpg", "../public/v8/rl-happy-sad.jpg"

# (x, y) of a feature in the 1250×1041 source, its displacement (dx, dy) and radius of influence
WARPS = [
    ((574, 596), (10, 58), 52),  # left mouth corner: down and slightly in
    ((734, 588), (-10, 58), 52),  # right mouth corner
    ((655, 560), (0, -8), 40),  # upper lip centre lifts a little (the "crying" mouth)
    ((655, 650), (0, 18), 80),  # lower lip / chin follows
    ((636, 372), (10, -30), 32),  # left eyebrow, inner end up and in
    ((712, 366), (-10, -30), 32),  # right eyebrow, inner end up and in
    ((548, 390), (0, 14), 38),  # left eyebrow, outer end down
    ((800, 392), (0, 14), 38),  # right eyebrow, outer end down
]

TEARS = [  # polyline from the lower eyelid down the cheek
    [(598, 440), (594, 478), (588, 520), (582, 562), (578, 590)],
    [(752, 436), (758, 474), (764, 514), (768, 548)],
]


def liquify(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    map_x, map_y = xs.copy(), ys.copy()
    for (px, py), (dx, dy), r in WARPS:
        # backward map: a destination pixel near the moved point samples from where it came from
        cx, cy = px + dx, py + dy
        wgt = np.exp(-((xs - cx) ** 2 + (ys - cy) ** 2) / (2 * r * r))
        map_x -= dx * wgt
        map_y -= dy * wgt
    return cv2.remap(img, map_x, map_y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def tears(img: np.ndarray) -> np.ndarray:
    layer = np.zeros(img.shape[:2], np.float32)
    for line in TEARS:
        pts = np.array(line, np.int32)
        cv2.polylines(layer, [pts], False, 1.0, thickness=13, lineType=cv2.LINE_AA)
        cv2.circle(layer, line[-1], 13, 1.0, -1, lineType=cv2.LINE_AA)  # drop at the end
    glow = cv2.GaussianBlur(layer, (0, 0), 3)
    core = cv2.GaussianBlur(layer, (0, 0), 1.2)
    out = img.astype(np.float32)
    shine = np.array([255, 245, 225], np.float32)  # BGR: wet, slightly blue-white
    out = out * (1 - 0.6 * glow[..., None]) + shine * 0.6 * glow[..., None]
    out = out * (1 - 0.55 * core[..., None]) + 255 * 0.55 * core[..., None]
    # a darker edge on one side reads as a wet streak rather than a white line
    edge = cv2.GaussianBlur(np.roll(layer, 6, axis=1), (0, 0), 2)
    out *= 1 - 0.25 * np.clip(edge - layer, 0, 1)[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


def grade(img: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= 0.25  # mostly drain the colour
    hsv[..., 2] *= 0.85
    out = cv2.cvtColor(hsv.clip(0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    out = out * np.array([1.12, 1.0, 0.86], np.float32)  # cold blue cast (BGR)
    return np.clip(out, 0, 255).astype(np.uint8)


img = cv2.imread(SRC)
cv2.imwrite(DST, grade(tears(liquify(img))), [cv2.IMWRITE_JPEG_QUALITY, 92])
print(DST)
