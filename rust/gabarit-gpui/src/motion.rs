//! Gabarit's motion: the durations and springs of the tokens (`tokens::animations`) made into GPUI animations, and
//! the transitions every screen shares, so that a whole app moves the same way (GabaritApple's `.snappy`, `.smooth`,
//! `.bouncy` and its transitions).
//!
//! - [`QUICK`], [`NORMAL`], [`SLOW`]: the durations; [`SPRING`], [`BOUNCY`], [`SNAPPY`]: the springs.
//! - [`GMotion`]: an entrance (a fade, a rise, a slide, a pop), played by [`GMotionExt::g_enter`] the first time an
//!   element is drawn under its id, or by [`GMotionExt::g_enter_on_change`] each time a value changes (not when it is
//!   first drawn); [`GMotionExt::g_exit`] plays it backwards, for what its owner keeps on screen while it leaves.
//! - [`GMotionExt::g_collapse`]: an element that folds away (its height to nothing), [`GMotionExt::g_unfold`] the
//!   other way.
//! - [`spring_to`]: a value that follows its target on a spring (a knob, a tab's line, a colour).
//! - [`use_hover`]: whether the pointer is over an element, as a state, for colours that fade on hover.
//!
//! **Less motion**: when the system asks for it ([`set_reduce_motion`], `GTheme::reduce_motion`), nothing moves,
//! grows or bounces: an entrance is a short plain fade ([`REDUCED`]), a spring jumps to its target.
//!
//! GPUI has no free scale transform for boxes: a "zoom" is a rise with a fade, a pop a small bounce; icons (SVG) can
//! scale (`with_transformation`). Every animation here is one-shot (it stops once settled): none redraws a window
//! for ever.

use std::f32::consts::PI;
use std::sync::Arc;
use std::time::Duration;

use gpui::{
    Animation, AnimationElement, AnimationExt, App, ElementId, Hsla, IntoElement, Pixels,
    SpringAnimation, SpringConfig, SpringTarget, Styled, Window, px,
};

use crate::theme::{ActiveTheme, GTheme};
use crate::tokens::{GAnimationCurve, animations};

/// A press, a hover, a small change: `.snappy`'s 0.15 s.
pub const QUICK: Duration = Duration::from_millis(150);
/// A screen's change, a sheet, a banner: 0.25 s.
pub const NORMAL: Duration = Duration::from_millis(250);
/// What crosses a large part of the window: 0.35 s.
pub const SLOW: Duration = Duration::from_millis(350);
/// A leaving element, a touch quicker than its entrance.
pub const EXIT: Duration = Duration::from_millis(160);
/// The plain fade that replaces every movement when the system asks for less motion.
pub const REDUCED: Duration = Duration::from_millis(120);

/// A spring of SwiftUI's kind: `response` (seconds, the period without damping) and `damping` (the ratio, 1: no
/// bounce), for a mass of one.
pub const fn spring(response: f32, damping: f32) -> SpringConfig {
    let omega = 2.0 * PI / response;
    SpringConfig::new(omega * omega, 2.0 * damping * omega, 1.0)
}

const fn spring_of(curve: GAnimationCurve) -> SpringConfig {
    match curve {
        GAnimationCurve::Spring { response, damping } => spring(response, damping),
        _ => spring(0.3, 1.0),
    }
}

/// The panes' spring (`animations::PANE`): settled, barely a bounce.
pub const SPRING: SpringConfig = spring_of(animations::PANE);
/// The bouncy spring (`animations::BOUNCY`): a reaction that lands, a check that pops.
pub const BOUNCY: SpringConfig = spring_of(animations::BOUNCY);
/// A quick spring without bounce: a knob, a tab's line, a colour.
pub const SNAPPY: SpringConfig = spring(0.28, 1.0);

/// Whether the system asks for less motion (Gabarit's theme holds it).
pub fn reduced(cx: &App) -> bool {
    cx.theme().reduce_motion
}

/// Says whether the system asks for less motion (the app reads its setting: macOS, Windows, Linux), and redraws.
pub fn set_reduce_motion(reduce: bool, cx: &mut App) {
    if cx.theme().reduce_motion != reduce {
        cx.global_mut::<GTheme>().reduce_motion = reduce;
        cx.refresh_windows();
    }
}

/// `.snappy`'s curve: quick at first, settled at the end.
pub fn ease_out(t: f32) -> f32 {
    1. - (1. - t.clamp(0., 1.)).powi(3)
}

/// The curve of a spring, over its settling time: `(duration, easing)` for a one-shot [`Animation`].
pub fn spring_curve(config: SpringConfig) -> (Duration, impl Fn(f32) -> f32 + 'static) {
    gpui::sampled_easing(config, 0.002)
}

/// How an element enters (and, backwards, leaves): from an offset, faded or not, on a curve.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct GMotion {
    /// Where it comes from, in points from its place (`y` > 0: from below).
    pub offset: (f32, f32),
    /// Whether it fades in (from transparent).
    pub fade: bool,
    pub duration: Duration,
    /// Waits before moving (a cascade).
    pub delay: Duration,
    /// On a spring instead of `ease_out` (its own duration then).
    pub spring: Option<SpringConfig>,
}

impl GMotion {
    /// A plain fade.
    pub const fn fade() -> Self {
        GMotion {
            offset: (0., 0.),
            fade: true,
            duration: NORMAL,
            delay: Duration::ZERO,
            spring: None,
        }
    }

    /// Rises into place from `dy` points below, fading in (a message, a banner, a page).
    pub const fn rise(dy: f32) -> Self {
        GMotion {
            offset: (0., dy),
            ..Self::fade()
        }
    }

    /// Slides in from an offset, fading in (a column, a bubble).
    pub const fn slide(dx: f32, dy: f32) -> Self {
        GMotion {
            offset: (dx, dy),
            ..Self::fade()
        }
    }

    /// A small bounce into place (a reaction that lands, a count that changes): from 6 points below, on the bouncy
    /// spring.
    pub const fn pop() -> Self {
        GMotion {
            offset: (0., 6.),
            spring: Some(BOUNCY),
            ..Self::fade()
        }
    }

    /// A sheet, a dialog: a little rise on the panes' spring, as a slight zoom would.
    pub const fn present() -> Self {
        GMotion {
            offset: (0., 18.),
            spring: Some(SPRING),
            ..Self::fade()
        }
    }

    pub const fn duration(mut self, duration: Duration) -> Self {
        self.duration = duration;
        self
    }

    pub const fn delay(mut self, delay: Duration) -> Self {
        self.delay = delay;
        self
    }

    pub const fn on_spring(mut self, config: SpringConfig) -> Self {
        self.spring = Some(config);
        self
    }

    pub const fn without_fade(mut self) -> Self {
        self.fade = false;
        self
    }

    /// The animations to play: the delay (if any), then the movement. Less motion: the delay, then a short fade.
    fn animations(&self, reduced: bool, exit: bool) -> Vec<Animation> {
        let mut animations = Vec::with_capacity(2);
        if !self.delay.is_zero() {
            animations.push(Animation::new(self.delay));
        }
        let movement = if reduced {
            Animation::new(REDUCED).with_easing(gpui::ease_in_out)
        } else if exit {
            Animation::new(EXIT.min(self.duration)).with_easing(gpui::ease_in_out)
        } else if let Some(config) = self.spring {
            let (duration, easing) = spring_curve(config);
            Animation::new(duration).with_easing(easing)
        } else {
            Animation::new(self.duration).with_easing(ease_out)
        };
        animations.push(movement);
        animations
    }
}

/// Places an element at `t` of its entrance (0: where it comes from, 1: in place). Opacity never overshoots.
fn place<E: Styled>(element: E, motion: GMotion, reduced: bool, t: f32, fade_speed: f32) -> E {
    let element = if reduced {
        element.opacity(t.clamp(0., 1.))
    } else if motion.fade {
        // Seen before it settles: the fade ends at two thirds of the movement.
        element.opacity((t * fade_speed).clamp(0., 1.))
    } else {
        element
    };
    if reduced || motion.offset == (0., 0.) {
        return element;
    }
    let rest = 1. - t;
    element
        .relative()
        .left(px(motion.offset.0 * rest))
        .top(px(motion.offset.1 * rest))
}

/// Gabarit's transitions on any styled element (a `div`, an image). The element stays in the flow: its offset is
/// relative to its place, nothing around it moves. Not for an element placed `absolute` (its offset would replace its
/// place): fade it, or move its own place.
pub trait GMotionExt: Styled + IntoElement + Sized + 'static {
    /// Enters the first time it is drawn under `id` (again when `id` changes: a page, a conversation).
    fn g_enter(
        self,
        id: impl Into<ElementId>,
        motion: GMotion,
        cx: &App,
    ) -> AnimationElement<Self> {
        let reduced = reduced(cx);
        let animations = motion.animations(reduced, false);
        let last = animations.len() - 1;
        self.with_animations(id, animations, move |element, index, t| {
            place(
                element,
                motion,
                reduced,
                if index < last { 0. } else { t },
                1.5,
            )
        })
    }

    /// Leaves: the entrance backwards, quicker. For what its owner keeps drawn while it goes (a closing sheet).
    fn g_exit(self, id: impl Into<ElementId>, motion: GMotion, cx: &App) -> AnimationElement<Self> {
        let reduced = reduced(cx);
        let motion = GMotion {
            delay: Duration::ZERO,
            ..motion
        };
        self.with_animations(
            id,
            motion.animations(reduced, true),
            move |element, _, t| place(element, motion, reduced, 1. - t, 1.),
        )
    }

    /// Enters each time `value` changes (a count, a state, a set of reactions), not when it is first drawn: `id`
    /// stays the same, `value` is anything that says the change (a number, a hash). The last value is kept under `id`
    /// in the current element's scope: inside a component's `render`, the component's; in a view's `render`, the
    /// view's (there, give each item its own `id`: a row's identity in it).
    fn g_enter_on_change(
        self,
        id: impl Into<ElementId>,
        value: u64,
        motion: GMotion,
        window: &mut Window,
        cx: &mut App,
    ) -> gpui::AnyElement {
        let id: ElementId = id.into();
        let seen = window.use_keyed_state(
            ElementId::NamedChild(Arc::new(id.clone()), "g-last-value".into()),
            cx,
            |_, _| (value, false),
        );
        let (last, changed) = *seen.read(cx);
        let changed = changed || last != value;
        if last != value {
            // No notification: this draw already shows the change.
            seen.update(cx, |seen, _| *seen = (value, true));
        }
        if changed {
            self.g_enter(
                ElementId::NamedChild(Arc::new(id), value.to_string().into()),
                motion,
                cx,
            )
            .into_any_element()
        } else {
            self.into_any_element()
        }
    }

    /// Folds away: from `height` (its measured height) to nothing, fading first. Less motion: a fade, then gone.
    fn g_collapse(
        self,
        id: impl Into<ElementId>,
        height: Pixels,
        cx: &App,
    ) -> AnimationElement<Self> {
        let reduced = reduced(cx);
        let duration = if reduced { REDUCED } else { NORMAL };
        self.with_animation(
            id,
            Animation::new(duration).with_easing(gpui::ease_in_out),
            move |element, t| {
                let element = element
                    .overflow_hidden()
                    .opacity((1. - t * 1.6).clamp(0., 1.));
                if reduced && t < 1. {
                    element.h(height)
                } else {
                    element.h(height * (1. - t))
                }
            },
        )
    }

    /// Unfolds: from nothing to `height`, then fades in.
    fn g_unfold(
        self,
        id: impl Into<ElementId>,
        height: Pixels,
        cx: &App,
    ) -> AnimationElement<Self> {
        let reduced = reduced(cx);
        let duration = if reduced { REDUCED } else { NORMAL };
        self.with_animation(
            id,
            Animation::new(duration).with_easing(ease_out),
            move |element, t| {
                let element = element
                    .overflow_hidden()
                    .opacity(((t - 0.3) / 0.7).clamp(0., 1.));
                if reduced || t >= 1. {
                    element
                } else {
                    element.h(height * t)
                }
            },
        )
    }
}

impl<E: Styled + IntoElement + 'static> GMotionExt for E {}

/// A value that follows its target on a spring, under `id` (it starts at its target the first time, then moves to each
/// new one, keeping its speed when interrupted). Less motion: it jumps.
pub fn spring_to<E, T>(
    element: E,
    id: impl Into<ElementId>,
    config: SpringConfig,
    target: T,
    cx: &App,
    animator: impl FnOnce(E, T::Output) -> E + 'static,
) -> gpui::SpringAnimationElement<E>
where
    E: IntoElement + 'static,
    T: SpringTarget,
    T::Output: 'static,
{
    let playback = if reduced(cx) {
        gpui::SpringPlayback::Completed
    } else {
        gpui::SpringPlayback::Running
    };
    element.with_spring(
        id,
        SpringAnimation::new(config).to(target).playback(playback),
        animator,
    )
}

/// A colour that fades from `from` to `to` as `on` turns true, on the snappy spring (a hover, a selection). Less
/// motion: a colour change is no movement; it still fades, a little quicker.
pub fn fade_color<E: Styled + IntoElement + 'static>(
    element: E,
    id: impl Into<ElementId>,
    on: bool,
    from: Hsla,
    to: Hsla,
    paint: impl FnOnce(E, Hsla) -> E + 'static,
) -> gpui::SpringAnimationElement<E> {
    element.with_spring(
        id,
        SpringAnimation::new(SNAPPY).to(on),
        // In sRGB, as `theme::mix`: an HSL blend would turn through other hues (rust to grey through purple).
        move |element, phase| paint(element, crate::theme::mix(from, to, phase.0.clamp(0., 1.))),
    )
}

/// (As for [`GMotionExt::g_enter_on_change`], the state lives under `id` in the current scope: unique per item in a
/// view's `render`.)
///
/// Whether the pointer is over the element `id` (an element with that id must take the returned listener as its
/// `on_hover`): a state that lasts across frames, so a colour can fade on hover. Redraws when it changes.
pub fn use_hover(
    id: impl Into<ElementId>,
    window: &mut Window,
    cx: &mut App,
) -> (bool, impl Fn(&bool, &mut Window, &mut App) + 'static) {
    let id: ElementId = id.into();
    let state = window.use_keyed_state(
        ElementId::NamedChild(Arc::new(id), "g-hover".into()),
        cx,
        |_, _| false,
    );
    let hovered = *state.read(cx);
    (hovered, move |over: &bool, _: &mut Window, cx: &mut App| {
        let over = *over;
        state.update(cx, |hovered, cx| {
            if *hovered != over {
                *hovered = over;
                cx.notify();
            }
        });
    })
}

/// A layer over the whole of its parent (which must be `relative`), in its shape, that fades in as `on` turns true and
/// out as it turns false, on the snappy spring: a hover's veil, a selection's ground. Put it first among the parent's
/// children: the rest is drawn over it. Less motion: a colour that comes and goes is no movement, it still fades.
pub fn fading_layer(
    id: impl Into<ElementId>,
    on: bool,
    color: Hsla,
    radius: Pixels,
) -> gpui::SpringAnimationElement<gpui::Div> {
    gpui::div()
        .absolute()
        .top_0()
        .left_0()
        .size_full()
        .rounded(radius)
        .bg(color)
        .with_spring(id, SpringAnimation::new(SNAPPY).to(on), |layer, phase| {
            layer.opacity(phase.0.clamp(0., 1.))
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn springs_settle_without_drifting() {
        for config in [SPRING, BOUNCY, SNAPPY] {
            let (duration, easing) = spring_curve(config);
            assert!(
                duration > Duration::from_millis(100) && duration < Duration::from_millis(1500)
            );
            assert_eq!(easing(0.), 0.);
            assert_eq!(easing(1.), 1.);
        }
    }

    #[test]
    fn the_bouncy_spring_overshoots_and_the_snappy_one_does_not() {
        let peak = |config| {
            let (_, easing) = spring_curve(config);
            (0..=100)
                .map(|i| easing(i as f32 / 100.))
                .fold(0f32, f32::max)
        };
        assert!(peak(BOUNCY) > 1.02);
        assert!(peak(SNAPPY) <= 1.001);
    }

    #[test]
    fn less_motion_is_a_short_fade() {
        let animations = GMotion::rise(12.)
            .delay(Duration::from_millis(40))
            .animations(true, false);
        assert_eq!(animations.len(), 2);
        assert_eq!(animations[1].duration, REDUCED);
    }
}
