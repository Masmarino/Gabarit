#if os(Linux)
import Foundation

// Gabarit's controls, forms and feedback for GTK 4: GTK's own widgets, dressed by components.css.

// MARK: Controls

/// A Gabarit button: ink (primary), fine frame (secondary), no ground (ghost), red (danger). `regular`: full height
/// (44), for a sheet's main button. `destructive`: a secondary or ghost button whose text is red. `icon`: a symbolic
/// icon before the title.
@MainActor
public func gButton(_ title: String, icon: String? = nil, variant: GButtonVariant = .secondary, regular: Bool = false,
                    destructive: Bool = false, action: @escaping () -> Void) -> GWidget {
    let button = gtk_button_new()!
    let label = gtk_label_new(title)!
    if let icon {
        let content = gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 6, [gIcon(icon, size: 14), label])
        gtk_widget_set_halign(content, GTK_ALIGN_CENTER)
        gtk_button_set_child(cast(button), content)
    } else {
        gtk_button_set_child(cast(button), label)
    }
    gStyle(button, "g-button", "g-\(variant)")
    gPointer(button)
    if regular { gtk_widget_add_css_class(button, "g-regular") }
    if destructive { gtk_widget_add_css_class(button, "g-destructive") }
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// Gabarit's close button: a cross in a circle with a fine rim (on the dark frame when in a `g-frame`).
@MainActor
public func gCloseButton(tooltip: String, action: @escaping () -> Void) -> GWidget {
    let button = gtk_button_new_from_icon_name(gIconName("xmark"))!
    gStyle(button, "g-close")
    gPointer(button)
    gtk_widget_set_tooltip_text(button, tooltip)
    gAccessibleLabel(button, tooltip)
    gtk_widget_set_valign(button, GTK_ALIGN_CENTER)
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// A switch row: its title, the sentence that explains it more discreet below, Gabarit's switch on the right.
@MainActor
public func gSwitchRow(_ title: String, detail: String? = nil, isOn: Bool, onChange: @escaping (Bool) -> Void) -> GWidget {
    let toggle = gtk_switch_new()!
    gStyle(toggle, "g-switch")
    gPointer(toggle)
    gtk_switch_set_active(cast(toggle), isOn ? 1 : 0)
    gtk_widget_set_valign(toggle, GTK_ALIGN_CENTER)
    gAccessibleLabel(toggle, title)
    gConnect(UnsafeMutableRawPointer(toggle), "notify::active") { onChange(gtk_switch_get_active(cast(toggle)) != 0) }
    var texts = [gLabel(title)]
    if let detail { texts.append(gLabel(detail, style: "caption", classes: ["g-text-discret"], wraps: true)) }
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 2, texts)
    gtk_widget_set_hexpand(column, 1)
    gtk_widget_set_valign(column, GTK_ALIGN_CENTER)
    return gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 12, [column, toggle])
}

/// A text field with its title above (small, discreet), full width; `prompt` as the placeholder. Returns the whole
/// and the entry (to read its text).
@MainActor
public func gTextField(_ title: String, text: String = "", prompt: String? = nil) -> (view: GWidget, entry: GWidget) {
    let entry = gtk_entry_new()!
    gStyle(entry, "g-field")
    gtk_editable_set_text(cast(entry), text)
    if let prompt { gtk_entry_set_placeholder_text(cast(entry), prompt) }
    return (gBox(GTK_ORIENTATION_VERTICAL, spacing: 6, [gLabel(title, style: "caption", classes: ["g-field-title"]), entry]), entry)
}

/// A choice in a field, the list in a bubble (GtkDropDown).
@MainActor
public func gMenu(_ options: [String], selected: Int, onChange: @escaping (Int) -> Void) -> GWidget {
    let list = gtk_string_list_new(nil)
    for option in options { gtk_string_list_append(list, option) }
    let dropdown = gtk_drop_down_new(list, nil)!
    let menu = OpaquePointer(dropdown)
    gStyle(dropdown, "g-menu")
    gPointer(dropdown)
    gtk_drop_down_set_selected(menu, guint(selected))
    gtk_widget_set_valign(dropdown, GTK_ALIGN_CENTER)
    gConnect(UnsafeMutableRawPointer(dropdown), "notify::selected") { onChange(Int(gtk_drop_down_get_selected(menu))) }
    return dropdown
}

/// Chips side by side (two to four short options): the current one tinted rust.
@MainActor
public func gChips(_ options: [String], selected: Int, onChange: @escaping (Int) -> Void) -> GWidget {
    var buttons: [GWidget] = []
    for (index, option) in options.enumerated() {
        let chip = gtk_toggle_button_new_with_label(option)!
        gStyle(chip, "g-chip")
        gPointer(chip)
        if let first = buttons.first { gtk_toggle_button_set_group(cast(chip), cast(first)) }
        gtk_toggle_button_set_active(cast(chip), index == selected ? 1 : 0)
        gConnect(UnsafeMutableRawPointer(chip), "toggled") { if gtk_toggle_button_get_active(cast(chip)) != 0 { onChange(index) } }
        buttons.append(chip)
    }
    let row = gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 6, buttons)
    gtk_widget_set_valign(row, GTK_ALIGN_CENTER)
    return row
}

/// A titled choice: the title (and its sentence) on the left, the menu or chips on the right.
@MainActor
public func gPicker(_ title: String, detail: String? = nil, options: [String], selected: Int, style: GPickerStyle = .menu,
                    onChange: @escaping (Int) -> Void) -> GWidget {
    var texts = [gLabel(title)]
    if let detail { texts.append(gLabel(detail, style: "caption", classes: ["g-text-discret"], wraps: true)) }
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 2, texts)
    gtk_widget_set_hexpand(column, 1)
    gtk_widget_set_valign(column, GTK_ALIGN_CENTER)
    let control = style == .menu ? gMenu(options, selected: selected, onChange: onChange) : gChips(options, selected: selected, onChange: onChange)
    gAccessibleLabel(control, title)
    return gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 12, [column, control])
}

/// Gabarit's slider: a thin track, the filled part in rust, a white knob with a rim.
@MainActor
public func gSlider(value: Double, in range: ClosedRange<Double>, step: Double = 0.01, onChange: @escaping (Double) -> Void) -> GWidget {
    let scale = gtk_scale_new_with_range(GTK_ORIENTATION_HORIZONTAL, range.lowerBound, range.upperBound, step)!
    gStyle(scale, "g-slider")
    gPointer(scale)
    gtk_scale_set_draw_value(cast(scale), 0)
    gtk_range_set_value(cast(scale), value)
    gtk_widget_set_hexpand(scale, 1)
    gConnect(UnsafeMutableRawPointer(scale), "value-changed") { onChange(gtk_range_get_value(cast(scale))) }
    return scale
}

/// A number to raise or lower: the title on the left, then two buttons on either side of the value, in a field.
@MainActor
public func gStepper(_ title: String, value: Int, in range: ClosedRange<Int>, decrease: String = "Decrease",
                     increase: String = "Increase", onChange: @escaping (Int) -> Void) -> GWidget {
    let state = GStepperState(value)
    let number = gLabel("\(value)", classes: ["g-stepper-value"])
    gtk_label_set_xalign(cast(number), 0.5)
    gtk_widget_set_size_request(number, 40, -1)
    let minus = gtk_button_new_from_icon_name(gIconName("minus"))!
    let plus = gtk_button_new_from_icon_name(gIconName("plus"))!
    for (button, name) in [(minus, decrease), (plus, increase)] {
        gStyle(button, "g-stepper-step")
        gPointer(button)
        gAccessibleLabel(button, name)
    }
    func update() {
        gtk_label_set_text(cast(number), "\(state.value)")
        gtk_widget_set_sensitive(minus, state.value > range.lowerBound ? 1 : 0)
        gtk_widget_set_sensitive(plus, state.value < range.upperBound ? 1 : 0)
    }
    for (button, delta) in [(minus, -1), (plus, 1)] {
        gConnect(UnsafeMutableRawPointer(button), "clicked") {
            state.value = min(max(state.value + delta, range.lowerBound), range.upperBound)
            update()
            onChange(state.value)
        }
    }
    update()
    let line = { gStyle(gtk_box_new(GTK_ORIENTATION_VERTICAL, 0)!, "g-hairline") }
    let field = gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, [minus, line(), number, line(), plus]), "g-stepper")
    gtk_widget_set_overflow(field, GTK_OVERFLOW_HIDDEN)
    gtk_widget_set_valign(field, GTK_ALIGN_CENTER)
    let name = gLabel(title)
    gtk_widget_set_hexpand(name, 1)
    return gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 12, [name, field])
}

final class GStepperState {
    var value: Int
    init(_ value: Int) { self.value = value }
}

// MARK: Feedback

/// A small label: a state's tint, or the hover's veil with no state.
@MainActor
public func gBadge(_ text: String, icon: String? = nil, tone: GTone? = nil) -> GWidget {
    let label = gLabel(text, style: "caption2")
    let badge = icon.map { gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 4, [gIcon($0, size: 10), label]) } ?? label
    gtk_widget_add_css_class(badge, "g-badge")
    if let tone { gtk_widget_add_css_class(badge, "g-\(tone)") }
    gtk_widget_set_halign(badge, GTK_ALIGN_START)
    return badge
}

/// A passing message: the ink of a primary button, a floating shadow.
@MainActor
public func gToast(_ text: String, icon: String) -> GWidget {
    let toast = gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 8, [gIcon(icon, size: 13), gLabel(text, style: "subheadline")])
    gStyle(toast, "g-toast")
    gtk_widget_set_halign(toast, GTK_ALIGN_CENTER)
    return toast
}

/// An empty page: an icon in a framed square, a title, a sentence, and what to do (a primary button).
@MainActor
public func gEmptyState(icon: String, title: String, message: String, action: (title: String, run: () -> Void)? = nil,
                        actionIcon: String? = nil) -> GWidget {
    let square = gIcon(icon, size: 32)
    gStyle(square, "g-empty-icon")
    gtk_widget_set_halign(square, GTK_ALIGN_CENTER)
    let heading = gLabel(title, style: "title3")
    let sentence = gLabel(message, style: "subheadline", classes: ["g-text-secondary"], wraps: true)
    for label in [heading, sentence] {
        gtk_label_set_xalign(cast(label), 0.5)
        gtk_label_set_justify(cast(label), GTK_JUSTIFY_CENTER)
    }
    // At most 320 wide, as on the Mac.
    gtk_label_set_max_width_chars(cast(sentence), 52)
    var children = [square, gBox(GTK_ORIENTATION_VERTICAL, spacing: 8, [heading, sentence])]
    if let action {
        let button = gButton(action.title, icon: actionIcon, variant: .primary, action: action.run)
        gtk_widget_set_halign(button, GTK_ALIGN_CENTER)
        children.append(button)
    }
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 24, children)
    gtk_widget_set_valign(column, GTK_ALIGN_CENTER)
    gtk_widget_set_halign(column, GTK_ALIGN_CENTER)
    return column
}

/// A placeholder while content loads: a soft shape with a slow shimmer (still when the desktop turns animations off).
/// `cornerRadius`: one of Gabarit's radii (4, 6, 8, 12).
@MainActor
public func gSkeleton(height: Int32 = 20, cornerRadius: Double = GRadius.sm) -> GWidget {
    let shape = gStyle(gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!, "g-skeleton", "g-radius-\(Int(cornerRadius))")
    gtk_widget_set_size_request(shape, -1, height)
    gAccessibleHidden(shape)
    return shape
}

/// Three dots that wave while an answer is being written. `label`: what a screen reader says.
@MainActor
public func gTypingDots(label: String) -> GWidget {
    let dots = (1...3).map { gStyle(gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!, "g-typing-dot", "g-dot-\($0)") }
    for dot in dots { gtk_widget_set_valign(dot, GTK_ALIGN_CENTER) }
    let row = gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 4, dots)
    gtk_widget_set_size_request(row, -1, 12)
    gtk_widget_set_halign(row, GTK_ALIGN_START)
    gAccessibleLabel(row, label)
    return row
}

// MARK: Menus

/// A menu line: an icon and its name; red if it destroys; `checked`: a rust tick on the right (always room for it).
@MainActor
public func gMenuItem(_ title: String, icon: String, destructive: Bool = false, checked: Bool? = nil,
                      action: @escaping () -> Void) -> GWidget {
    let symbol = gIcon(icon, size: 14)
    gtk_widget_set_size_request(symbol, 20, -1)
    let name = gLabel(title)
    gtk_widget_set_hexpand(name, 1)
    var children = [symbol, name]
    if let checked {
        let tick = gStyle(gIcon("checkmark", size: 14), "g-menu-tick")
        gtk_widget_set_size_request(tick, 16, -1)
        gtk_widget_set_opacity(tick, checked ? 1 : 0)
        children.append(tick)
    }
    let button = gtk_button_new()!
    gtk_button_set_child(cast(button), gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, children))
    gtk_button_set_has_frame(cast(button), 0)
    gStyle(button, "g-menu-item")
    if destructive { gtk_widget_add_css_class(button, "g-destructive") }
    gPointer(button)
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// A menu's lines on the surface, split by a fine line.
@MainActor
public func gMenuList(_ items: [GWidget]) -> GWidget {
    var children: [GWidget] = []
    for (index, item) in items.enumerated() {
        if index > 0 { children.append(gStyle(gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!, "g-hairline")) }
        children.append(item)
    }
    let list = gStyle(gBox(GTK_ORIENTATION_VERTICAL, children), "g-menu-list")
    gtk_widget_set_size_request(list, 240, -1)
    return list
}

/// A button that opens a menu in a bubble: `face` is what it shows; a line clicked closes the bubble.
@MainActor
public func gMenuButton(_ face: GWidget, items: [GWidget], tooltip: String? = nil) -> GWidget {
    let popover = gtk_popover_new()!
    gStyle(popover, "g-menu-popover")
    gtk_popover_set_has_arrow(cast(popover), 0)
    gtk_popover_set_child(cast(popover), gMenuList(items))
    for item in items {
        gConnect(UnsafeMutableRawPointer(item), "clicked") { gtk_popover_popdown(cast(popover)) }
    }
    let button = gtk_menu_button_new()!
    gtk_menu_button_set_child(cast(button), face)
    gtk_menu_button_set_popover(cast(button), popover)
    gStyle(button, "g-menu-button")
    gPointer(button)
    if let tooltip {
        gtk_widget_set_tooltip_text(button, tooltip)
        gAccessibleLabel(button, tooltip)
    }
    return button
}

// MARK: Forms

/// A page's title: large and bold, the sentence that says what it is for more discreet below.
@MainActor
public func gPageTitle(_ title: String, summary: String) -> GWidget {
    gBox(GTK_ORIENTATION_VERTICAL, spacing: 6, [gLabel(title, style: "largeTitle", classes: ["g-page-title"]),
                                                gLabel(summary, classes: ["g-page-summary"], wraps: true)])
}

/// A row of a form's card: what it holds, at a constant height.
@MainActor
public func gRow(_ content: GWidget) -> GWidget {
    gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, [content]), "g-row")
}

/// A value and its title: the title on the left, the value on the right, more discreet.
@MainActor
public func gValueRow(_ title: String, value: String) -> GWidget {
    let label = gLabel(title)
    gtk_widget_set_hexpand(label, 1)
    return gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 12, [label, gLabel(value, classes: ["g-row-value"])])
}

/// A form's section: its title, its rows in a card split by fine lines, its sentence discreet below.
@MainActor
public func gFormSection(_ title: String? = nil, rows: [GWidget], footer: String? = nil) -> GWidget {
    var cardRows: [GWidget] = []
    for (index, row) in rows.enumerated() {
        if index > 0 {
            let line = gStyle(gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!, "g-hairline")
            gtk_widget_set_margin_start(line, 16)
            cardRows.append(line)
        }
        cardRows.append(gRow(row))
    }
    var children: [GWidget] = []
    if let title { children.append(gLabel(title, style: "headline", classes: ["g-section-title"])) }
    children.append(gStyle(gBox(GTK_ORIENTATION_VERTICAL, cardRows), "g-card"))
    if let footer { children.append(gLabel(footer, style: "callout", classes: ["g-section-footer"], wraps: true)) }
    return gBox(GTK_ORIENTATION_VERTICAL, spacing: 8, children)
}

/// A form's buttons, side by side on the right (`leading`: on the left).
@MainActor
public func gFormButtons(_ buttons: [GWidget], leading: Bool = false) -> GWidget {
    gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 8, leading ? buttons + [gSpacer()] : [gSpacer()] + buttons)
}

/// A sheet's main button: full width, full height (44), right on the ground.
@MainActor
public func gSheetButton(_ title: String, variant: GButtonVariant = .primary, action: @escaping () -> Void) -> GWidget {
    let button = gButton(title, variant: variant, regular: true, action: action)
    gtk_widget_set_hexpand(button, 1)
    return button
}

/// A form page: the title, then its sections, in a reading width (680 at most, aligned left), scrolling.
@MainActor
public func gForm(title: String, summary: String, sections: [GWidget]) -> GWidget {
    let heading = gPageTitle(title, summary: summary)
    gtk_widget_set_margin_bottom(heading, 28)
    let column = gBox(GTK_ORIENTATION_VERTICAL, [heading, gBox(GTK_ORIENTATION_VERTICAL, spacing: 32, sections)])
    gtk_widget_set_margin_start(column, 40)
    gtk_widget_set_margin_end(column, 40)
    gtk_widget_set_margin_top(column, 36)
    gtk_widget_set_margin_bottom(column, 48)
    let scroll = gtk_scrolled_window_new()!
    gtk_scrolled_window_set_policy(cast(scroll), GTK_POLICY_NEVER, GTK_POLICY_AUTOMATIC)
    gtk_scrolled_window_set_child(cast(scroll), gClamp(column, maximum: 680 + 80))
    gtk_widget_set_vexpand(scroll, 1)
    gtk_widget_set_hexpand(scroll, 1)
    return gStyle(scroll, "g-page")
}

/// A section in a side column: an icon and its name; the chosen one in rust on a soft ground.
@MainActor
public func gSidebarRow(_ title: String, icon: String, selected: Bool, detail: String? = nil, warns: Bool = false,
                        warning: String = "Needs attention") -> GWidget {
    let name = gLabel(title)
    gtk_widget_set_hexpand(name, 1)
    let symbol = gIcon(icon)
    gtk_widget_set_size_request(symbol, 20, 20)
    var children = [symbol, name]
    if let detail { children.append(gLabel(detail, style: "callout", classes: ["g-sidebar-detail"])) }
    if warns {
        let dot = gStyle(gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!, "g-warning-dot")
        gtk_widget_set_valign(dot, GTK_ALIGN_CENTER)
        gAccessibleLabel(dot, warning)
        children.append(dot)
    }
    let row = gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, children), "g-sidebar-row")
    if selected { gtk_widget_add_css_class(row, "g-selected") }
    return row
}

/// Underlined tabs: the text, a rust line under the current one.
@MainActor
public func gNavTabs(_ titles: [String], selected: Int, onChange: @escaping (Int) -> Void) -> GWidget {
    var buttons: [GWidget] = []
    for (index, title) in titles.enumerated() {
        let tab = gtk_toggle_button_new_with_label(title)!
        gtk_button_set_has_frame(cast(tab), 0)
        gStyle(tab, "g-nav-tab")
        gPointer(tab)
        if let first = buttons.first { gtk_toggle_button_set_group(cast(tab), cast(first)) }
        gtk_toggle_button_set_active(cast(tab), index == selected ? 1 : 0)
        gConnect(UnsafeMutableRawPointer(tab), "toggled") { if gtk_toggle_button_get_active(cast(tab)) != 0 { onChange(index) } }
        buttons.append(tab)
    }
    return gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, buttons + [gSpacer()]), "g-nav-tabs")
}
#endif
