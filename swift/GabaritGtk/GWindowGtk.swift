#if os(Linux)
import Foundation

// Gabarit's windows for GTK 4, as on the Mac. The main window (`gAppShell`): the dark rail on the left from top to
// bottom, then the top band (the page's title, the desktop's window buttons, `gtk-decoration-layout`) and the page under
// a rounded corner. A secondary window (`gWindow`): Gabarit's dark header (an icon, a title, a subtitle) and its cross
// instead of the desktop's buttons; Escape closes it. Both are GTK header bars: the window moves by them.

/// A dark header bar: what goes on the leading side (a title, the band's content); the window's buttons on the other
/// side if `buttons`.
@MainActor
public func gHeaderBar(_ leading: GWidget, buttons: Bool = true) -> GWidget {
    let bar = gtk_header_bar_new()!
    gStyle(bar, "g-frame", "g-window-header")
    gtk_header_bar_set_title_widget(cast(bar), gBox(GTK_ORIENTATION_HORIZONTAL, []))
    gtk_header_bar_set_show_title_buttons(cast(bar), buttons ? 1 : 0)
    gtk_header_bar_pack_start(cast(bar), leading)
    return bar
}

/// The top band's title and its subtitle, light on the dark frame.
@MainActor
public func gBandTitle(_ title: String, subtitle: String? = nil) -> GWidget {
    var labels = [gLabel(title, style: "title3", classes: ["g-band-title"])]
    if let subtitle, !subtitle.isEmpty { labels.append(gLabel(subtitle, style: "caption2", classes: ["g-band-subtitle"])) }
    let column = gBox(GTK_ORIENTATION_VERTICAL, labels)
    gtk_widget_set_valign(column, GTK_ALIGN_CENTER)
    return column
}

/// A secondary window's header (Mac's `GWindowHeader`): an icon, the title and its subtitle, what goes on the right
/// (the cross), on the dark frame with a fine line below. 52 high.
@MainActor
public func gWindowHeader(title: String, subtitle: String? = nil, icon: String? = nil, trailing: [GWidget] = []) -> GWidget {
    var labels = [gLabel(title, style: "headline", classes: ["g-window-title"])]
    if let subtitle { labels.append(gLabel(subtitle, style: "caption", classes: ["g-window-subtitle"])) }
    let titles = gBox(GTK_ORIENTATION_VERTICAL, labels)
    gtk_widget_set_valign(titles, GTK_ALIGN_CENTER)
    var leading = [titles]
    if let icon { leading.insert(gIcon(icon), at: 0) }
    let bar = gHeaderBar(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, leading), buttons: false)
    for widget in trailing.reversed() { gtk_header_bar_pack_end(cast(bar), widget) }
    return bar
}

/// A secondary window drawn by the app (settings, tools): Gabarit's dark header and its cross, then the content on
/// the page's ground. Escape closes it, as on the Mac.
@MainActor
public func gWindow(application: OpaquePointer?, title: String, subtitle: String? = nil, icon: String? = nil,
                    size: (width: Int32, height: Int32), content: GWidget, closeTooltip: String = "Close (Esc)") -> GWidget {
    let window = gtk_application_window_new(cast(application))!
    gStyle(window, "g-window")
    gtk_window_set_title(cast(window), title)
    gtk_window_set_default_size(cast(window), size.width, size.height)
    let close = gCloseButton(tooltip: closeTooltip) { gtk_window_close(cast(window)) }
    gtk_window_set_titlebar(cast(window), gWindowHeader(title: title, subtitle: subtitle, icon: icon, trailing: [close]))
    let escape = gtk_shortcut_controller_new()!
    gtk_shortcut_controller_add_shortcut(escape, gtk_shortcut_new(gtk_shortcut_trigger_parse_string("Escape"),
                                                                        gtk_named_action_new("window.close")))
    gtk_widget_add_controller(window, escape)
    gtk_widget_set_vexpand(content, 1)
    gtk_window_set_child(cast(window), gStyle(gBox(GTK_ORIENTATION_VERTICAL, [content]), "g-page"))
    return window
}

/// A page of the dark rail: the icon and its name; the current page in rust, on a slight ground, with a line on the
/// left. `badge`: a count on the icon's corner (99+ above 99).
@MainActor
public func gRailItem(_ title: String, icon: String, current: Bool, badge: Int = 0, action: @escaping () -> Void) -> GWidget {
    let label = gLabel(title, style: "caption2")
    gtk_label_set_xalign(cast(label), 0.5)
    let symbol = gIcon(icon, size: 18)
    gtk_widget_set_size_request(symbol, 22, 22)
    var top = symbol
    if badge > 0 {
        let overlay = gtk_overlay_new()!
        gtk_overlay_set_child(cast(overlay), symbol)
        let count = gLabel(badge > 99 ? "99+" : "\(badge)", style: "caption2", classes: ["g-rail-badge"])
        gtk_widget_set_halign(count, GTK_ALIGN_END)
        gtk_widget_set_valign(count, GTK_ALIGN_START)
        gtk_overlay_add_overlay(cast(overlay), count)
        gtk_widget_set_halign(overlay, GTK_ALIGN_CENTER)
        top = overlay
    }
    let content = gBox(GTK_ORIENTATION_VERTICAL, spacing: 3, [top, label])
    gtk_widget_set_valign(content, GTK_ALIGN_CENTER)
    let button = gtk_button_new()!
    gtk_button_set_child(cast(button), content)
    gtk_button_set_has_frame(cast(button), 0)
    gStyle(button, "g-rail-item")
    gPointer(button)
    gAccessibleLabel(button, badge > 0 ? "\(title), \(badge)" : title)
    if current { gtk_widget_add_css_class(button, "g-current") }
    gAccessibleState(button, GTK_ACCESSIBLE_STATE_SELECTED, current)
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// A small button of the rail (translate, hands-free): an icon, in rust on a slight ground when `isOn`.
@MainActor
public func gRailButton(icon: String, tooltip: String, isOn: Bool = false, value: String? = nil, action: @escaping () -> Void) -> GWidget {
    let button = gtk_button_new_from_icon_name(gIconName(icon))!
    gStyle(button, "g-rail-button")
    if isOn { gtk_widget_add_css_class(button, "g-on") }
    gtk_widget_set_hexpand(button, 1)
    gPointer(button)
    gtk_widget_set_tooltip_text(button, value.map { "\(tooltip) : \($0)" } ?? tooltip)
    gAccessibleLabel(button, value.map { "\(tooltip), \($0)" } ?? tooltip)
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// The rail's square button (settings): an icon in a 44 square with a fine rim.
@MainActor
public func gRailSquareButton(icon: String, tooltip: String, action: @escaping () -> Void) -> GWidget {
    let button = gtk_button_new_from_icon_name(gIconName(icon))!
    gStyle(button, "g-rail-square")
    gtk_widget_set_halign(button, GTK_ALIGN_CENTER)
    gPointer(button)
    gtk_widget_set_tooltip_text(button, tooltip)
    gAccessibleLabel(button, tooltip)
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// The rail's quick search button: a magnifier and the whole shortcut ("Ctrl + K" on Linux).
@MainActor
public func gCommandKButton(shortcut: String = "Ctrl + K", tooltip: String = "Quick search (Ctrl + K)",
                            action: @escaping () -> Void) -> GWidget {
    let label = gLabel(shortcut, style: "caption")
    gtk_label_set_xalign(cast(label), 0.5)
    let content = gBox(GTK_ORIENTATION_VERTICAL, spacing: 3, [gIcon("magnifyingglass", size: 15), label])
    gtk_widget_set_valign(content, GTK_ALIGN_CENTER)
    let button = gtk_button_new()!
    gtk_button_set_child(cast(button), content)
    gStyle(button, "g-command-k")
    gPointer(button)
    gtk_widget_set_tooltip_text(button, tooltip)
    gAccessibleLabel(button, tooltip)
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// A page's dark band (a page with no rail): its icon framed, its title and the sentence that says what it is for, what
/// goes on the right.
@MainActor
public func gPageBand(icon: String, title: String, summary: String, accessory: GWidget? = nil) -> GWidget {
    let symbol = gStyle(gIcon(icon, size: 22), "g-page-band-icon")
    gtk_widget_set_valign(symbol, GTK_ALIGN_CENTER)
    let texts = gBox(GTK_ORIENTATION_VERTICAL, spacing: 3, [gLabel(title, style: "title2", classes: ["g-page-band-title"]),
                                                             gLabel(summary, style: "subheadline", classes: ["g-page-band-summary"], wraps: true)])
    gtk_widget_set_hexpand(texts, 1)
    gtk_widget_set_valign(texts, GTK_ALIGN_CENTER)
    var children = [symbol, texts]
    if let accessory { children.append(accessory) }
    return gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 14, children), "g-frame", "g-page-band")
}

/// The main window's content: the dark rail on the left (top to bottom), the top band over the page, the page in a
/// sheet with a rounded top-left corner.
@MainActor
public func gAppShellContent(band: [GWidget], rail: [GWidget], page: GWidget) -> GWidget {
    let header = gHeaderBar(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 12, band))
    gtk_widget_add_css_class(header, "g-band")
    let railColumn = gStyle(gBox(GTK_ORIENTATION_VERTICAL, spacing: 4, rail), "g-frame", "g-rail")
    gtk_widget_set_size_request(railColumn, 92, -1)
    // The rail keeps its width: what it holds (a flexible space) does not widen it.
    gtk_widget_set_hexpand(railColumn, 0)
    gtk_widget_set_hexpand(page, 1)
    gtk_widget_set_vexpand(page, 1)
    let sheet = gStyle(gBox(GTK_ORIENTATION_VERTICAL, [page]), "g-shell-page")
    gtk_widget_set_overflow(sheet, GTK_OVERFLOW_HIDDEN)
    gtk_widget_set_hexpand(sheet, 1)
    gtk_widget_set_vexpand(sheet, 1)
    let column = gBox(GTK_ORIENTATION_VERTICAL, [header, sheet])
    gtk_widget_set_hexpand(column, 1)
    return gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, [railColumn, column]), "g-frame")
}

/// The main window, as on the Mac: `gAppShellContent` up to the top of the window (no title bar of its own).
@MainActor
public func gAppShell(application: OpaquePointer?, title: String, band: [GWidget], rail: [GWidget], page: GWidget,
                      size: (width: Int32, height: Int32) = (1280, 800)) -> GWidget {
    let window = gtk_application_window_new(cast(application))!
    gStyle(window, "g-window", "g-frame")
    gtk_window_set_title(cast(window), title)
    gtk_window_set_default_size(cast(window), size.width, size.height)
    // A hidden title bar: the window draws its own frame (its shadow, its corners), the band is in the content.
    let none = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!
    gtk_widget_set_visible(none, 0)
    gtk_window_set_titlebar(cast(window), none)
    gtk_window_set_child(cast(window), gAppShellContent(band: band, rail: rail, page: page))
    return window
}
#endif
