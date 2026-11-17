//! The ground (4.0): one ambiance under the whole window, rail and header included (`GGround`), and the pictures of it
//! the glass lays under itself.
//!
//! GPUI blurs nothing behind an element. But under the glass there is only the ground, and the ground is fixed: its
//! picture is computed here once, in Rust (the gradient of 2 to 4 stops at its angle, its radial light, its tone's veil),
//! sharp for the ground itself, blurred and saturated for the glass (`glass::BLUR_CONTENT` ×`SATURATION_CONTENT` for a
//! panel, `BLUR_LIQUID` ×`SATURATION_LIQUID` ×`BRIGHTNESS_LIQUID` for the liquid glass), and kept. Each picture is laid
//! over the whole window (its viewport), and an element paints only the part under its own bounds, in its own rounded
//! shape (`Window::paint_image`'s `bounds` and `image_bounds`): the glass shows the ground blurred at the very place it
//! sits, as a real backdrop filter would.
//!
//! The pictures are small (640 points on the longer side; a smooth ground loses nothing, GPUI's sampler is linear),
//! kept per ground and per window shape (the aspect ratio by twentieths), with a touch of dither against banding.
//!
//! The limit: the glass blurs the ground, not what lies between (a menu over a card shows the ground blurred under it,
//! not the card). Gabarit lays the glass on the ground, so it holds; glass laid on glass is drawn `nested` (a tint and
//! its light, no backdrop).

use std::cell::RefCell;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::sync::Arc;

use gpui::{
    AnyElement, App, Bounds, Corners, Div, IntoElement, ParentElement, Pixels, RenderImage,
    RenderOnce, StyleRefinement, Styled, Window, canvas, div, point,
};
use image::{Frame, RgbaImage};

use crate::motion::{GMotion, GMotionExt};
use crate::theme::ActiveTheme;
use crate::tokens::{GGroundSpec, GRgba, glass};

/// Which picture of the ground.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum GBackdrop {
    /// The ground itself, sharp, veiled.
    Sharp,
    /// Under a panel's glass: blurred wide, saturated.
    Content,
    /// Under the liquid glass: blurred short, saturated more, a touch brighter.
    Liquid,
}

/// What a ground's picture is made of: the ambiance and the veil laid over it (its tone's).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct GGroundPaint {
    pub spec: GGroundSpec,
    pub veil: GRgba,
}

impl GGroundPaint {
    /// The current theme's ground.
    pub fn of(cx: &App) -> Self {
        let theme = cx.theme();
        GGroundPaint {
            spec: theme.ground,
            veil: GRgba {
                alpha: theme.tone.veil,
                ..theme.ground.glass
            },
        }
    }

    /// A key for the ground: every value that changes its picture.
    pub fn key(&self) -> u64 {
        let mut hasher = std::collections::hash_map::DefaultHasher::new();
        let spec = &self.spec;
        let colour = |c: GRgba, h: &mut std::collections::hash_map::DefaultHasher| {
            [c.red, c.green, c.blue, c.alpha]
                .iter()
                .for_each(|v| v.to_bits().hash(h))
        };
        spec.name.hash(&mut hasher);
        spec.angle.to_bits().hash(&mut hasher);
        spec.stops.iter().for_each(|s| colour(*s, &mut hasher));
        colour(spec.light.color, &mut hasher);
        [
            spec.light.x,
            spec.light.y,
            spec.light.radius,
            spec.light.strength,
        ]
        .iter()
        .for_each(|v| v.to_bits().hash(&mut hasher));
        colour(self.veil, &mut hasher);
        hasher.finish()
    }
}

/// The longer side of a ground's picture, in pixels.
const LONG_SIDE: usize = 640;
/// The window's longer side the blurs are measured for, in points (the picture is stretched over the window: a blur
/// in points is the same fraction of a window of any size; a smooth ground hides the difference).
const NOMINAL_WINDOW: f32 = 1200.0;
/// The pictures kept, at most (a window being resized makes new shapes).
const KEPT: usize = 48;

type Key = (u64, GBackdrop, u32);

thread_local! {
    static PICTURES: RefCell<HashMap<Key, Arc<RenderImage>>> = RefCell::new(HashMap::new());
}

/// The picture of `ground` for a window of `size`, computed at its first request and kept.
pub fn picture(
    ground: &GGroundPaint,
    backdrop: GBackdrop,
    size: gpui::Size<Pixels>,
) -> Arc<RenderImage> {
    let (width, height) = (size.width.as_f32().max(1.), size.height.as_f32().max(1.));
    // The aspect ratio, by twentieths (the picture is stretched over the window: a little off is invisible).
    let aspect = ((width / height) * 20.).round().clamp(4., 80.) as u32;
    let key = (ground.key(), backdrop, aspect);
    if let Some(found) = PICTURES.with(|p| p.borrow().get(&key).cloned()) {
        return found;
    }
    let ratio = aspect as f32 / 20.;
    let (w, h) = if ratio >= 1. {
        (
            LONG_SIDE,
            ((LONG_SIDE as f32 / ratio).round() as usize).max(1),
        )
    } else {
        (
            ((LONG_SIDE as f32 * ratio).round() as usize).max(1),
            LONG_SIDE,
        )
    };
    let mut pixels = draw(ground, w, h);
    let scale = LONG_SIDE as f32 / NOMINAL_WINDOW;
    match backdrop {
        GBackdrop::Sharp => {}
        GBackdrop::Content => {
            blur(&mut pixels, w, h, glass::BLUR_CONTENT * scale);
            filter(&mut pixels, glass::SATURATION_CONTENT, 1.0);
        }
        GBackdrop::Liquid => {
            blur(&mut pixels, w, h, glass::BLUR_LIQUID * scale);
            filter(
                &mut pixels,
                glass::SATURATION_LIQUID,
                glass::BRIGHTNESS_LIQUID,
            );
        }
    }
    let image = to_gpui(&pixels, w, h);
    PICTURES.with(|p| {
        let mut p = p.borrow_mut();
        if p.len() >= KEPT {
            p.clear();
        }
        p.insert(key, image.clone());
    });
    image
}

type Rgb = [f32; 3];

fn rgb(c: GRgba) -> Rgb {
    [c.red, c.green, c.blue]
}

fn mix(a: Rgb, b: Rgb, t: f32) -> Rgb {
    [0, 1, 2].map(|i| a[i] + (b[i] - a[i]) * t)
}

/// The ground, in sRGB from 0 to 1, as CSS draws it: `linear-gradient(<angle>deg, stops evenly spaced)`, then the light
/// (`radial-gradient(circle at x y, colour at strength, transparent at radius)`, the radius a fraction of the longer
/// side), then the veil.
pub fn draw(ground: &GGroundPaint, width: usize, height: usize) -> Vec<Rgb> {
    let spec = &ground.spec;
    let (w, h) = (width as f32, height as f32);
    let angle = spec.angle.to_radians();
    let (dx, dy) = (angle.sin(), -angle.cos());
    // CSS's gradient line: through the centre, long enough for the corners to meet its ends.
    let length = (w * dx).abs() + (h * dy).abs();
    let stops: Vec<Rgb> = spec.stops.iter().map(|s| rgb(*s)).collect();
    let segments = (stops.len().max(2) - 1) as f32;
    let light = &spec.light;
    let (lx, ly, radius) = (light.x * w, light.y * h, (light.radius * w.max(h)).max(1.));
    let light_colour = rgb(light.color);
    let veil = (rgb(ground.veil), ground.veil.alpha);
    let mut pixels = Vec::with_capacity(width * height);
    for y in 0..height {
        let fy = y as f32 + 0.5;
        for x in 0..width {
            let fx = x as f32 + 0.5;
            let t = (((fx - w / 2.) * dx + (fy - h / 2.) * dy) / length + 0.5).clamp(0., 1.);
            let mut colour = if stops.len() == 1 {
                stops[0]
            } else {
                let place = t * segments;
                let index = (place.floor() as usize).min(stops.len() - 2);
                mix(stops[index], stops[index + 1], place - index as f32)
            };
            let distance = ((fx - lx).powi(2) + (fy - ly).powi(2)).sqrt();
            let wash = light.strength * (1. - distance / radius).max(0.);
            colour = mix(colour, light_colour, wash);
            colour = mix(colour, veil.0, veil.1);
            pixels.push(colour);
        }
    }
    pixels
}

/// A Gaussian blur of standard deviation `sigma` (pixels), as three box blurs, rows then columns, edges held.
fn blur(pixels: &mut [Rgb], width: usize, height: usize, sigma: f32) {
    // Three boxes of radius r give a variance of ((2r + 1)² − 1) / 4.
    let radius = (((4. * sigma * sigma + 1.).sqrt() - 1.) / 2.)
        .round()
        .max(1.) as usize;
    let mut line = Vec::new();
    for _ in 0..3 {
        for y in 0..height {
            line.clear();
            line.extend_from_slice(&pixels[y * width..(y + 1) * width]);
            box_pass(&line, radius, |x, c| pixels[y * width + x] = c);
        }
        for x in 0..width {
            line.clear();
            line.extend((0..height).map(|y| pixels[y * width + x]));
            box_pass(&line, radius, |y, c| pixels[y * width + x] = c);
        }
    }
}

/// One box blur along a line, with a running sum (the edges repeat their last pixel).
fn box_pass(line: &[Rgb], radius: usize, mut write: impl FnMut(usize, Rgb)) {
    let n = line.len();
    let at = |i: isize| line[i.clamp(0, n as isize - 1) as usize];
    let r = radius as isize;
    let size = (2 * radius + 1) as f32;
    let mut sum = [0.0f32; 3];
    for i in -r..=r {
        let p = at(i);
        sum = [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]];
    }
    for i in 0..n as isize {
        write(i as usize, sum.map(|v| v / size));
        let (add, remove) = (at(i + r + 1), at(i - r));
        sum = [0, 1, 2].map(|c| sum[c] + add[c] - remove[c]);
    }
}

/// CSS's `saturate(s) brightness(b)`.
fn filter(pixels: &mut [Rgb], s: f32, b: f32) {
    for p in pixels.iter_mut() {
        let [r, g, bl] = *p;
        let out = [
            (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * bl,
            (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * bl,
            (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * bl,
        ];
        *p = out.map(|v| (v * b).clamp(0., 1.));
    }
}

/// The pixels as GPUI's image (BGRA, opaque), with half a step of dither so a long gradient does not band.
fn to_gpui(pixels: &[Rgb], width: usize, height: usize) -> Arc<RenderImage> {
    let mut bytes = Vec::with_capacity(width * height * 4);
    for (index, [r, g, b]) in pixels.iter().enumerate() {
        // A small integer hash: the same noise for the same pixel.
        let mut n = (index as u32).wrapping_mul(0x9E37_79B9);
        n ^= n >> 15;
        n = n.wrapping_mul(0x85EB_CA6B);
        n ^= n >> 13;
        let dither = (n & 0xFF) as f32 / 255. - 0.5;
        let byte = |v: f32| (v * 255. + dither).round().clamp(0., 255.) as u8;
        bytes.extend_from_slice(&[byte(*b), byte(*g), byte(*r), 255]);
    }
    let image = RgbaImage::from_raw(width as u32, height as u32, bytes)
        .expect("the bytes of the ground's picture");
    Arc::new(RenderImage::new(vec![Frame::new(image)]))
}

/// Paints the part of the ground's picture under `bounds`, in its rounded shape: the picture lies over the whole
/// window. For an element of one's own, at paint time (a `canvas`).
pub fn paint_backdrop(
    ground: &GGroundPaint,
    backdrop: GBackdrop,
    bounds: Bounds<Pixels>,
    corners: Corners<Pixels>,
    window: &mut Window,
) {
    let viewport = window.viewport_size();
    let image = picture(ground, backdrop, viewport);
    let whole = Bounds::new(point(Pixels::ZERO, Pixels::ZERO), viewport);
    let corners = corners.clamp_radii_for_quad_size(bounds.size);
    window
        .paint_image(bounds, whole, corners, image, 0, false)
        .ok();
}

/// A layer that paints a ground's picture over the whole of its parent (which must be `relative`).
pub(crate) fn layer(
    ground: GGroundPaint,
    backdrop: GBackdrop,
    corners: Corners<Pixels>,
) -> gpui::Canvas<()> {
    canvas(
        |_, _, _| {},
        move |bounds, _, window, _| paint_backdrop(&ground, backdrop, bounds, corners, window),
    )
}

/// The ground (`GGround`): lay it under the whole window (the root view's element), the rest on it. It paints the
/// current theme's ground ([`crate::theme::set_ground`]); when the ground changes, the new one fades in over the old
/// (`animations::GROUND`, 0.45 s). Children and styles as a `div`'s.
///
/// The glass's backdrop is the ground over the whole window: lay the ground over the whole window too (or the glass
/// shows a ground the window does not).
#[derive(IntoElement)]
pub struct GGround {
    base: Div,
    children: Vec<AnyElement>,
    corners: Corners<Pixels>,
}

impl GGround {
    pub fn new() -> Self {
        GGround {
            base: div(),
            children: Vec::new(),
            corners: Corners::default(),
        }
    }

    /// Rounded corners: a window that draws its own (`bars::window_corner_radius`).
    pub fn corners(mut self, corners: Corners<Pixels>) -> Self {
        self.corners = corners;
        self
    }
}

impl Default for GGround {
    fn default() -> Self {
        Self::new()
    }
}

impl Styled for GGround {
    fn style(&mut self) -> &mut StyleRefinement {
        self.base.style()
    }
}

impl ParentElement for GGround {
    fn extend(&mut self, elements: impl IntoIterator<Item = AnyElement>) {
        self.children.extend(elements)
    }
}

impl RenderOnce for GGround {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let current = GGroundPaint::of(cx);
        let key = current.key();
        // The ground drawn before this one, to fade from.
        let state = window.use_keyed_state("g-ground", cx, |_, _| (current, None::<GGroundPaint>));
        let (shown, previous) = *state.read(cx);
        let previous = if shown.key() != key {
            state.update(cx, |state, _| *state = (current, Some(shown)));
            Some(shown)
        } else {
            previous
        };
        let corners = self.corners;
        let fill = |element: gpui::Canvas<()>| element.absolute().top_0().left_0().size_full();
        // No `relative()`: it would undo an `absolute()` laid on it (GPUI lays absolute children on their parent).
        self.base
            .rounded_tl(corners.top_left)
            .rounded_tr(corners.top_right)
            .rounded_bl(corners.bottom_left)
            .rounded_br(corners.bottom_right)
            .children(previous.map(|previous| fill(layer(previous, GBackdrop::Sharp, corners))))
            .child(
                fill(layer(current, GBackdrop::Sharp, corners)).g_enter_on_change(
                    "g-ground-in",
                    key,
                    GMotion::ground(),
                    window,
                    cx,
                ),
            )
            .children(self.children)
    }
}
