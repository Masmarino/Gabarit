#if os(Linux)
import Foundation

// Gabarit's controls, forms and feedback for GTK 4: GTK's own widgets, dressed by components.css.

// MARK: Controls

/// A Gabarit button: ink (primary), fine frame (secondary), no ground (ghost), red (danger). `regular`: full height
/// (44), for a sheet's main button. `destructive`: a secondary or ghost button whose text is red.
@MainActor
public func gButton(_ title: String, variant: GButtonVariant = .secondary, regular: Bool = false, destructive: Bool = false,
                    action: @escaping () -> Void) -> GWidget {
    let button = gtk_button_new_with_label(title)!
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
    let button = gtk_button_new_from_icon_name("window-close-symbolic")!
    gStyle(button, "g-close")
    gPointer(button)
    gtk_widget_set_tooltip_text(button, tooltip)
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
    return (gBox(GTK_ORIENTATION_VERTICAL, spacing: 6, [gLabel(title, classes: ["g-field-title"]), entry]), entry)
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

// MARK: Feedback

/// A small label: a state's tint, or the hover's veil with no state.
@MainActor
public func gBadge(_ text: String, tone: GTone? = nil) -> GWidget {
    let badge = gLabel(text, style: "caption2", classes: ["g-badge"])
    if let tone { gtk_widget_add_css_class(badge, "g-\(tone)") }
    gtk_widget_set_halign(badge, GTK_ALIGN_START)
    return badge
}

/// A passing message: the ink of a primary button, a floating shadow.
@MainActor
public func gToast(_ text: String, icon: String) -> GWidget {
    let toast = gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 8, [gIcon(icon), gLabel(text)])
    gStyle(toast, "g-toast")
    gtk_widget_set_halign(toast, GTK_ALIGN_CENTER)
    return toast
}

/// An empty page: an icon in a framed square, a title, a sentence, and what to do (a primary button).
@MainActor
public func gEmptyState(icon: String, title: String, message: String, action: (title: String, run: () -> Void)? = nil) -> GWidget {
    let square = gIcon(icon, size: 32)
    gStyle(square, "g-empty-icon")
    gtk_widget_set_halign(square, GTK_ALIGN_CENTER)
    let heading = gLabel(title, style: "title3")
    let sentence = gLabel(message, style: "subheadline", classes: ["g-text-secondary"], wraps: true)
    for label in [heading, sentence] {
        gtk_label_set_xalign(cast(label), 0.5)
        gtk_label_set_justify(cast(label), GTK_JUSTIFY_CENTER)
    }
    var children = [square, gBox(GTK_ORIENTATION_VERTICAL, spacing: 8, [heading, sentence])]
    if let action {
        let button = gButton(action.title, variant: .primary, action: action.run)
        gtk_widget_set_halign(button, GTK_ALIGN_CENTER)
        children.append(button)
    }
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 24, children)
    gtk_widget_set_valign(column, GTK_ALIGN_CENTER)
    gtk_widget_set_halign(column, GTK_ALIGN_CENTER)
    return column
}

// MARK: Forms

/// A page's title: large and bold, the sentence that says what it is for more discreet below.
@MainActor
public func gPageTitle(_ title: String, summary: String) -> GWidget {
    gBox(GTK_ORIENTATION_VERTICAL, spacing: 6, [gLabel(title, classes: ["g-page-title"]),
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
    if let footer { children.append(gLabel(footer, classes: ["g-section-footer"], wraps: true)) }
    return gBox(GTK_ORIENTATION_VERTICAL, spacing: 8, children)
}

/// A form page: the title, then its sections, in a reading width, scrolling.
@MainActor
public func gForm(title: String, summary: String, sections: [GWidget]) -> GWidget {
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 32, [gPageTitle(title, summary: summary)] + sections)
    gtk_widget_set_size_request(column, 520, -1)
    gtk_widget_set_halign(column, GTK_ALIGN_START)
    for (side, margin) in [(0, 40), (1, 40), (2, 36), (3, 48)] {
        switch side {
        case 0: gtk_widget_set_margin_start(column, Int32(margin))
        case 1: gtk_widget_set_margin_end(column, Int32(margin))
        case 2: gtk_widget_set_margin_top(column, Int32(margin))
        default: gtk_widget_set_margin_bottom(column, Int32(margin))
        }
    }
    let scroll = gtk_scrolled_window_new()!
    gtk_scrolled_window_set_child(cast(scroll), column)
    gtk_widget_set_vexpand(scroll, 1)
    gtk_widget_set_hexpand(scroll, 1)
    return gStyle(scroll, "g-page")
}

/// A section in a side column: an icon and its name; the chosen one in rust on a soft ground.
@MainActor
public func gSidebarRow(_ title: String, icon: String, selected: Bool, detail: String? = nil) -> GWidget {
    let name = gLabel(title)
    gtk_widget_set_hexpand(name, 1)
    var children = [gIcon(icon), name]
    if let detail { children.append(gLabel(detail, style: "callout")) }
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
