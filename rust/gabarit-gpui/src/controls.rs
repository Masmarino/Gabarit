//! Gabarit's form controls (GabaritApple's `GToggle.swift`, `GSlider.swift`): the switch and its row, the checkbox,
//! the slider, the stepper. Each draws a value its owner holds and says when it changes (`on_change`), as GPUI's
//! elements do.

use std::rc::Rc;

use gpui::{
    AccessibleAction, App, Bounds, CursorStyle, ElementId, Empty, IntoElement, KeyDownEvent,
    ParentElement, Pixels, RenderOnce, Role, SharedString, Styled, Toggled, Window, canvas, div,
    prelude::*, px, relative,
};

use crate::assets::icon;
use crate::button::metrics;
use crate::motion;
use crate::relief::{GPointer, Live, glow, hollow, knob};
use crate::theme::{ActiveTheme, GTextExt, alpha, black};
use crate::tokens::{opacity, radius, text};

pub type ChangeHandler<T> = Rc<dyn Fn(T, &mut Window, &mut App)>;

/// The title of a control's row, and the sentence that explains it, more discreet.
pub(crate) fn row_label(
    title: SharedString,
    detail: Option<SharedString>,
    cx: &App,
) -> impl IntoElement + use<> {
    let colors = cx.theme().colors;
    div()
        .flex()
        .flex_col()
        .flex_1()
        .min_w_0()
        .gap(px(2.))
        .child(
            div()
                .g_text(text::BODY)
                .text_color(colors.text_primary)
                .child(title),
        )
        .when_some(detail, |this, detail| {
            this.child(
                div()
                    .g_text(text::CAPTION)
                    .text_color(colors.text_discret)
                    .child(detail),
            )
        })
}

/// A switch's track and knob (`GSwitch`): a flat track, rust when on, the track's grey when off, a white knob. Under
/// the pointer, its rim stronger, its glow wider; held down, the knob stretches and turns to liquid glass (4.1: it
/// lights and grows on the bouncy spring, the track showing through it), back to white when released.
#[derive(IntoElement)]
pub struct GSwitch {
    id: ElementId,
    on: bool,
    live: Live,
    held: bool,
}

impl GSwitch {
    pub(crate) fn new(id: impl Into<ElementId>, on: bool, live: Live, held: bool) -> Self {
        GSwitch {
            id: id.into(),
            on,
            live,
            held,
        }
    }
}

/// A knob (a switch's, a slider's) that turns to liquid glass while it is held (4.1): the glass under it, lit and
/// grown on the bouncy spring, the white knob fading out over it; released, the white comes back.
fn glass_knob(size: Pixels, held: bool, cx: &App) -> gpui::Div {
    let radius = size / 2.;
    div()
        .relative()
        .rounded_full()
        .child(crate::glass::control_glass(
            "g-knob-glass",
            crate::glass::GMaterial::liquid().nested(),
            radius,
            held,
            cx,
        ))
        .child(motion::spring_to(
            knob(size).absolute().top_0().left_0().size_full(),
            "g-knob-white",
            motion::SNAPPY,
            held,
            cx,
            |white, phase: gpui::AnimationPhase| white.opacity(1. - phase.0.clamp(0., 1.)),
        ))
}

pub const SWITCH_WIDTH: f32 = 36.0;
pub const SWITCH_HEIGHT: f32 = 20.0;

impl RenderOnce for GSwitch {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let reduce_motion = cx.theme().reduce_motion;
        let (on, live, held) = (self.on, self.live, self.held);
        let knob_size = SWITCH_HEIGHT - 4.0;
        let travel = SWITCH_WIDTH - 4.0 - knob_size;
        let group = SharedString::new_static(live.group);
        // Off, a rim stronger than the fine line: the track shows on a white card too.
        let rim = if on {
            alpha(colors.border, 0.0)
        } else if live.hovered() {
            colors.border
        } else {
            alpha(colors.border, 0.35)
        };
        let mut shadows = vec![hollow(0.12)];
        if on {
            shadows.push(glow(colors.accent, if live.hovered() { 7.0 } else { 5.0 }));
        }
        let mut track = div()
            .id(self.id.clone())
            .relative()
            .flex_none()
            .w(px(SWITCH_WIDTH))
            .h(px(SWITCH_HEIGHT))
            .rounded_full()
            .border_1()
            .border_color(rim)
            .shadow(shadows);
        if live.follows() {
            let hover_rim = if on { rim } else { colors.border };
            let hover_glow = vec![hollow(0.12), glow(colors.accent, 7.0)];
            track = track.group_hover(group.clone(), move |style| {
                let style = style.border_color(hover_rim);
                if on { style.shadow(hover_glow) } else { style }
            });
        }
        let stretch = knob_size * 0.18;
        let mut thumb = glass_knob(px(knob_size), held, cx)
            .id("g-knob")
            .absolute()
            .top(px(1.))
            .size(px(knob_size))
            .shadow(vec![
                gpui::BoxShadow::new(px(0.), px(1.), black(if held { 0.1 } else { 0.18 }))
                    .blur_radius(px(1.5)),
            ]);
        if held && !reduce_motion {
            thumb = thumb.w(px(knob_size + stretch));
        }
        // On, the knob on the right, its stretch towards the left. It slides on a spring that starts where it is: no
        // movement when the switch is first drawn, a smooth one (interrupted, it turns back) at each change. Less
        // motion: it jumps.
        let target = if on { 1. } else { 0. };
        let thumb = motion::spring_to(
            thumb,
            "g-knob-slide",
            motion::SNAPPY,
            target,
            cx,
            move |thumb, t: f32| {
                if (t - target).abs() < 0.002 && on {
                    thumb.right(px(1.))
                } else {
                    thumb.left(px(1. + travel * t))
                }
            },
        );
        // The track's colour follows the knob.
        let (off_ground, on_ground) = (colors.track, colors.accent);
        motion::fade_color(
            track.child(thumb),
            "g-switch-ground",
            on,
            off_ground,
            on_ground,
            |track, color| track.bg(color),
        )
    }
}

/// Gabarit's switch in its row (`GToggleStyle`): its title, the sentence that explains it, the switch on the right.
/// The whole row is the button: a click, Space or Return.
#[derive(IntoElement)]
pub struct GToggle {
    id: ElementId,
    title: SharedString,
    detail: Option<SharedString>,
    on: bool,
    disabled: bool,
    preview: Option<GPointer>,
    on_change: Option<ChangeHandler<bool>>,
}

impl GToggle {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>, on: bool) -> Self {
        GToggle {
            id: id.into(),
            title: title.into(),
            detail: None,
            on,
            disabled: false,
            preview: None,
            on_change: None,
        }
    }

    pub fn detail(mut self, detail: impl Into<SharedString>) -> Self {
        self.detail = Some(detail.into());
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    pub fn preview(mut self, preview: Option<GPointer>) -> Self {
        self.preview = preview;
        self
    }

    pub fn on_change(mut self, handler: impl Fn(&bool, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }
}

impl RenderOnce for GToggle {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let live = Live::new("g-toggle", self.preview, !self.disabled);
        let (held, press) = motion::use_press(self.id.clone(), window, cx);
        let held = live.pressed() || (live.follows() && held);
        let on = self.on;
        let mut row = div()
            .id(self.id.clone())
            .group("g-toggle")
            .flex()
            .items_center()
            .gap(px(12.))
            .w_full()
            .role(Role::Switch)
            .aria_label(self.title.clone())
            .aria_toggled(if on { Toggled::True } else { Toggled::False })
            .when(self.disabled, |this| this.opacity(opacity::DISABLED));
        if live.follows() {
            row = motion::on_press(row, &press)
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true);
            if let Some(handler) = self.on_change.clone() {
                row = row.on_click(move |_, window, cx| handler(!on, window, cx));
            }
        }
        let title = self.title.clone();
        row.child(row_label(title, self.detail.clone(), cx))
            .child(GSwitch::new("g-switch", on, live, held))
    }
}

/// A checkbox, ticked in rust, and its title on the right.
#[derive(IntoElement)]
pub struct GCheckbox {
    id: ElementId,
    title: SharedString,
    checked: bool,
    disabled: bool,
    preview: Option<GPointer>,
    on_change: Option<ChangeHandler<bool>>,
}

impl GCheckbox {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>, checked: bool) -> Self {
        GCheckbox {
            id: id.into(),
            title: title.into(),
            checked,
            disabled: false,
            preview: None,
            on_change: None,
        }
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    pub fn preview(mut self, preview: Option<GPointer>) -> Self {
        self.preview = preview;
        self
    }

    pub fn on_change(mut self, handler: impl Fn(&bool, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }
}

impl RenderOnce for GCheckbox {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let live = Live::new("g-checkbox", self.preview, !self.disabled);
        let checked = self.checked;
        let group = SharedString::new_static(live.group);
        let rest_rim = if checked {
            colors.accent
        } else {
            alpha(colors.border, 0.6)
        };
        let mut box_ = div()
            .id("g-check-box")
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .size(px(16.))
            .rounded(px(radius::MD))
            .border_1()
            .border_color(if live.hovered() && !checked {
                colors.border
            } else {
                rest_rim
            })
            .shadow(if checked {
                vec![glow(colors.accent, 3.0)]
            } else {
                vec![hollow(0.1)]
            });
        if live.follows() && !checked {
            let border = colors.border;
            box_ = box_.group_hover(group, move |style| style.border_color(border));
        }
        let mut row = div()
            .id(self.id.clone())
            .group("g-checkbox")
            .flex()
            .items_center()
            .gap(px(8.))
            .role(Role::CheckBox)
            .aria_label(self.title.clone())
            .aria_toggled(if checked {
                Toggled::True
            } else {
                Toggled::False
            })
            .when(self.disabled, |this| this.opacity(opacity::DISABLED));
        if live.follows() {
            row = row
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true);
            if let Some(handler) = self.on_change.clone() {
                row = row.on_click(move |_, window, cx| handler(!checked, window, cx));
            }
        }
        // The check pops in on the bouncy spring (it grows past its size and settles), the ground fills with it;
        // unchecked, it shrinks away. No movement when first drawn; less motion: at once.
        let (empty, full) = (colors.background, colors.accent);
        let mark = cx.theme().on_accent().unwrap_or(gpui::white());
        let box_ = motion::spring_to(
            box_,
            "g-check-pop",
            motion::BOUNCY,
            checked,
            cx,
            move |box_, phase: gpui::AnimationPhase| {
                let scale = phase.0.max(0.);
                box_.bg(crate::theme::mix(empty, full, phase.0.clamp(0., 1.)))
                    .when(scale > 0.02, |this| {
                        this.child(icon("check", px(11.), mark).with_transformation(
                            gpui::Transformation::scale(gpui::size(scale, scale)),
                        ))
                    })
            },
        );
        row.child(box_).child(
            div()
                .g_text(text::BODY)
                .text_color(colors.text_primary)
                .child(self.title),
        )
    }
}

/// The slider's drag: nothing to draw while it moves.
struct SliderDrag;

/// Gabarit's slider (`GSlider`): a thin track, the filled part in rust, a white knob with a rim. The arrows move it a
/// step (a twentieth with no step); a screen reader's increment and decrement too.
#[derive(IntoElement)]
pub struct GSlider {
    id: ElementId,
    value: f64,
    min: f64,
    max: f64,
    step: Option<f64>,
    label: SharedString,
    format: Option<Rc<dyn Fn(f64) -> String>>,
    disabled: bool,
    preview: Option<GPointer>,
    on_change: Option<ChangeHandler<f64>>,
}

impl GSlider {
    pub fn new(id: impl Into<ElementId>, value: f64, min: f64, max: f64) -> Self {
        GSlider {
            id: id.into(),
            value,
            min,
            max,
            step: None,
            label: SharedString::default(),
            format: None,
            disabled: false,
            preview: None,
            on_change: None,
        }
    }

    pub fn step(mut self, step: f64) -> Self {
        self.step = Some(step);
        self
    }

    /// What a screen reader calls it (the row's title).
    pub fn label(mut self, label: impl Into<SharedString>) -> Self {
        self.label = label.into();
        self
    }

    /// How a screen reader says the value (a percentage by default).
    pub fn format(mut self, format: impl Fn(f64) -> String + 'static) -> Self {
        self.format = Some(Rc::new(format));
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    pub fn preview(mut self, preview: Option<GPointer>) -> Self {
        self.preview = preview;
        self
    }

    pub fn on_change(mut self, handler: impl Fn(&f64, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }
}

/// A value moved to a fraction of the range, on its steps.
fn slider_value(fraction: f64, min: f64, max: f64, step: Option<f64>) -> f64 {
    let mut value = min + fraction.clamp(0., 1.) * (max - min);
    if let Some(step) = step.filter(|step| *step > 0.) {
        value = min + ((value - min) / step).round() * step;
    }
    value.clamp(min, max)
}

impl RenderOnce for GSlider {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        // Where the track lies, for a click (GPUI's mouse events do not carry the element's bounds).
        let track_bounds =
            window.use_keyed_state(self.id.clone(), cx, |_, _| Bounds::<Pixels>::default());
        let colors = cx.theme().colors;
        let reduce_motion = cx.theme().reduce_motion;
        let live = Live::new("g-slider", self.preview, !self.disabled);
        let (min, max, step, value) = (self.min, self.max, self.step, self.value);
        let fraction = if max > min {
            ((value - min) / (max - min)).clamp(0., 1.)
        } else {
            0.
        } as f32;
        let knob_size = 16.0;
        // Held (pressed or dragged, until the button is released anywhere): the knob turns to liquid glass (4.1).
        let (held_state, press) = motion::use_press(self.id.clone(), window, cx);
        let held = live.pressed() || (live.follows() && held_state);
        let lit = live.hovered();
        let knob_rim = if held {
            alpha(colors.border, 0.0)
        } else if lit {
            colors.border
        } else {
            alpha(colors.border, 0.5)
        };
        let knob_shadow = |held: bool, lit: bool| {
            let (color, blur, y) = if held {
                (alpha(colors.accent, 0.3), 4., 0.)
            } else if lit {
                (black(0.22), 2.5, 1.)
            } else {
                (black(0.15), 1.5, 1.)
            };
            vec![gpui::BoxShadow::new(px(0.), px(y), color).blur_radius(px(blur))]
        };
        let scale = |held: bool, lit: bool| {
            if reduce_motion {
                1.
            } else if held {
                1.1
            } else if lit {
                1.06
            } else {
                1.
            }
        };
        let knob_px = |held, lit| px(knob_size * scale(held, lit));
        let group = SharedString::new_static(live.group);
        let mut thumb = glass_knob(knob_px(held, lit), held, cx)
            .id("g-slider-knob")
            .absolute()
            .top(relative(0.5))
            .size(knob_px(held, lit))
            .border_1()
            .border_color(knob_rim)
            .shadow(knob_shadow(held, lit));
        if live.follows() && !held {
            let (hover_rim, hover_shadow, hover_size) = (
                colors.border,
                knob_shadow(false, true),
                knob_px(false, true),
            );
            thumb = thumb.group_hover(group, move |style| {
                style
                    .border_color(hover_rim)
                    .shadow(hover_shadow)
                    .size(hover_size)
            });
        }
        // The knob's centre runs from half a knob in from each end.
        let thumb = thumb
            .left(gpui::DefiniteLength::Fraction(fraction))
            .ml(px(-knob_size / 2.))
            .mt(px(-knob_size / 2.));

        let format = self.format.clone();
        let spoken = format.map_or_else(
            || format!("{:.0} %", fraction * 100.),
            |format| format(value),
        );
        let nudge_step = step.unwrap_or((max - min) / 20.);
        let on_change = self.on_change.clone();
        let mut slider = div()
            .id(self.id.clone())
            .group("g-slider")
            .relative()
            .flex()
            .items_center()
            .h(px(metrics::COMPACT - 8.))
            .min_w(px(120.))
            .w_full()
            .px(px(knob_size / 2.))
            .role(Role::Slider)
            .aria_label(self.label.clone())
            .aria_numeric_value(value)
            .aria_min_numeric_value(min)
            .aria_max_numeric_value(max)
            .aria_numeric_value_step(nudge_step)
            .aria_value(SharedString::from(spoken))
            .when(self.disabled, |this| this.opacity(opacity::DISABLED));
        if live.follows() {
            slider = motion::on_press(slider, &press)
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true);
            if let Some(handler) = on_change {
                let nudge = {
                    let handler = handler.clone();
                    move |steps: f64, window: &mut Window, cx: &mut App| {
                        handler((value + steps * nudge_step).clamp(min, max), window, cx)
                    }
                };
                let nudge = Rc::new(nudge);
                let (up, down, keys) = (nudge.clone(), nudge.clone(), nudge.clone());
                let (press, drag) = (handler.clone(), handler.clone());
                let inset = knob_size / 2.;
                slider = slider
                    .on_a11y_action(AccessibleAction::Increment, move |_, window, cx| {
                        up(1., window, cx)
                    })
                    .on_a11y_action(AccessibleAction::Decrement, move |_, window, cx| {
                        down(-1., window, cx)
                    })
                    .on_key_down(move |event: &KeyDownEvent, window, cx| {
                        match event.keystroke.key.as_str() {
                            "left" | "down" => keys(-1., window, cx),
                            "right" | "up" => keys(1., window, cx),
                            _ => {}
                        }
                    })
                    .on_mouse_down(gpui::MouseButton::Left, {
                        let track_bounds = track_bounds.clone();
                        move |event, window, cx| {
                            // A click on the track puts the knob there, before any drag.
                            let bounds = *track_bounds.read(cx);
                            let width = bounds.size.width.max(px(1.));
                            let x = event.position.x - bounds.left();
                            press(slider_value((x / width) as f64, min, max, step), window, cx);
                        }
                    })
                    .on_drag(SliderDrag, |_, _, _, cx| cx.new(|_| Empty))
                    .on_drag_move::<SliderDrag>(move |event, window, cx| {
                        let bounds = event.bounds;
                        let width = (bounds.size.width - px(2. * inset)).max(px(1.));
                        let x = event.event.position.x - bounds.left() - px(inset);
                        drag(slider_value((x / width) as f64, min, max, step), window, cx);
                    });
            }
        }
        slider
            // The track: hollow, its filled part in rust, glowing a little.
            .child(
                div()
                    .relative()
                    .w_full()
                    .child({
                        let track_bounds = track_bounds.clone();
                        canvas(
                            move |bounds, _, cx| {
                                track_bounds.update(cx, |stored, _| *stored = bounds)
                            },
                            |_, _, _, _| {},
                        )
                        .absolute()
                        .size_full()
                    })
                    .h(px(4.))
                    .rounded_full()
                    .bg(colors.track)
                    .shadow(vec![hollow(0.1)])
                    .child(
                        div()
                            .absolute()
                            .top_0()
                            .left(px(-knob_size / 2.))
                            .h_full()
                            .w(relative(fraction))
                            .ml(px(0.))
                            .pl(px(knob_size / 2.))
                            .rounded_full()
                            .bg(colors.accent)
                            .shadow(vec![glow(colors.accent, 3.)])
                            .child(Empty),
                    )
                    .child(thumb),
            )
    }
}

/// A number to raise or lower (`GStepper`): its title, and two buttons on either side of the value, in a field.
#[derive(IntoElement)]
pub struct GStepper {
    id: ElementId,
    title: SharedString,
    value: i64,
    min: i64,
    max: i64,
    on_change: Option<ChangeHandler<i64>>,
}

impl GStepper {
    pub fn new(
        id: impl Into<ElementId>,
        title: impl Into<SharedString>,
        value: i64,
        min: i64,
        max: i64,
    ) -> Self {
        GStepper {
            id: id.into(),
            title: title.into(),
            value,
            min,
            max,
            on_change: None,
        }
    }

    pub fn on_change(mut self, handler: impl Fn(&i64, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }
}

impl RenderOnce for GStepper {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let (value, min, max) = (self.value, self.min, self.max);
        let shape = px(radius::PILL);
        let step = |id: &'static str,
                    symbol: &'static str,
                    delta: i64,
                    enabled: bool,
                    handler: Option<ChangeHandler<i64>>| {
            let press = colors.press;
            let hover = colors.hover;
            div()
                .id(id)
                .flex()
                .items_center()
                .justify_center()
                .relative()
                .w(px(metrics::COMPACT + 8.))
                .h_full()
                .rounded(shape)
                .aria_label(if delta > 0 { "Increase" } else { "Decrease" })
                .role(Role::Button)
                .when(!enabled, |this| this.opacity(opacity::DISABLED))
                .when(enabled, |this| {
                    this.cursor(CursorStyle::PointingHand)
                        .hover(move |style| style.bg(hover))
                        .active(move |style| style.bg(press))
                        .when_some(handler, |this, handler| {
                            this.on_click(move |_, window, cx| {
                                handler((value + delta).clamp(min, max), window, cx)
                            })
                        })
                })
                .child(icon(symbol, px(12.), colors.ink))
        };
        let hairline = || {
            div()
                .relative()
                .w(px(1.))
                .h(px(14.))
                .bg(alpha(colors.ink, 0.14))
        };
        let increment = self.on_change.clone();
        let decrement = self.on_change.clone();
        // 4.1: a capsule of liquid glass, its two halves the buttons.
        let field = crate::glass::glass_on(div(), crate::glass::GMaterial::liquid(), shape, cx)
            .id("g-stepper-field")
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .h(px(metrics::COMPACT))
            .text_color(colors.ink)
            .child(step(
                "minus",
                "minus",
                -1,
                value > min,
                self.on_change.clone(),
            ))
            .child(hairline())
            .child(
                div()
                    .relative()
                    .min_w(px(40.))
                    .text_center()
                    .g_text(text::BODY)
                    .text_color(colors.ink)
                    .child(value.to_string()),
            )
            .child(hairline())
            .child(step("plus", "plus", 1, value < max, self.on_change.clone()));
        div()
            .id(self.id)
            .flex()
            .items_center()
            .gap(px(12.))
            .w_full()
            .role(Role::SpinButton)
            .aria_label(self.title.clone())
            .aria_numeric_value(value as f64)
            .aria_min_numeric_value(min as f64)
            .aria_max_numeric_value(max as f64)
            .when_some(increment, |this, handler| {
                this.on_a11y_action(AccessibleAction::Increment, move |_, window, cx| {
                    handler((value + 1).min(max), window, cx)
                })
            })
            .when_some(decrement, |this, handler| {
                this.on_a11y_action(AccessibleAction::Decrement, move |_, window, cx| {
                    handler((value - 1).max(min), window, cx)
                })
            })
            .child(
                div()
                    .flex_1()
                    .g_text(text::BODY)
                    .text_color(colors.text_primary)
                    .child(self.title),
            )
            .child(field)
    }
}
