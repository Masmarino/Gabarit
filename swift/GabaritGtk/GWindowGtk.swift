#if os(Linux)
import Foundation

// Gabarit's windows for GTK 4. A window keeps GTK's own header bar (the window's buttons where the desktop puts them,
// `gtk-decoration-layout`), dressed in Gabarit's dark frame: a secondary window (`gWindow`) carries its icon, title and
// subtitle there; the main window (`gAppShell`) its top band, then the dark rail and the page under a rounded corner.

/// A dark header bar: what goes on the leading side (a title, the band's content), the window's buttons on the other.
@MainActor
public func gHeaderBar(_ leading: GWidget) -> GWidget {
    let bar = gtk_header_bar_new()!
    gStyle(bar, "g-frame", "g-window-header")
    gtk_header_bar_set_title_widget(cast(bar), gBox(GTK_ORIENTATION_HORIZONTAL, []))
    gtk_header_bar_pack_start(cast(bar), leading)
    return bar
}

/// A title and its subtitle, light on the dark frame.
@MainActor
public func gBandTitle(_ title: String, subtitle: String? = nil) -> GWidget {
    var labels = [gLabel(title, classes: ["g-band-title"])]
    if let subtitle, !subtitle.isEmpty { labels.append(gLabel(subtitle, classes: ["g-band-subtitle"])) }
    let column = gBox(GTK_ORIENTATION_VERTICAL, labels)
    gtk_widget_set_valign(column, GTK_ALIGN_CENTER)
    return column
}

/// A secondary window drawn by the app (settings, tools): Gabarit's dark header (an icon, a title, a subtitle, the
/// desktop's window buttons), then the content on the page's ground.
@MainActor
public func gWindow(application: OpaquePointer?, title: String, subtitle: String? = nil, icon: String? = nil,
                    size: (width: Int32, height: Int32), content: GWidget) -> GWidget {
    let window = gtk_application_window_new(cast(application))!
    gStyle(window, "g-window")
    gtk_window_set_title(cast(window), title)
    gtk_window_set_default_size(cast(window), size.width, size.height)
    var leading = [gBandTitle(title, subtitle: subtitle)]
    if let icon { leading.insert(gIcon(icon, size: 22), at: 0) }
    gtk_window_set_titlebar(cast(window), gHeaderBar(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, leading)))
    gtk_widget_set_vexpand(content, 1)
    gtk_window_set_child(cast(window), gStyle(gBox(GTK_ORIENTATION_VERTICAL, [content]), "g-page"))
    return window
}

/// A page of the dark rail: the icon and its name; the current page in rust, on a slight ground, with a line on the
/// left.
@MainActor
public func gRailItem(_ title: String, icon: String, current: Bool, action: @escaping () -> Void) -> GWidget {
    let label = gLabel(title, style: "caption2")
    gtk_label_set_xalign(cast(label), 0.5)
    let content = gBox(GTK_ORIENTATION_VERTICAL, spacing: 3, [gIcon(icon, size: 18), label])
    gtk_widget_set_valign(content, GTK_ALIGN_CENTER)
    let button = gtk_button_new()!
    gtk_button_set_child(cast(button), content)
    gtk_button_set_has_frame(cast(button), 0)
    gStyle(button, "g-rail-item")
    gPointer(button)
    if current { gtk_widget_add_css_class(button, "g-current") }
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

/// The main window, as on the Mac: the dark top band (the page's title, the window's buttons), the dark rail on the
/// left, the page following the appearance in a sheet with a rounded top-left corner.
@MainActor
public func gAppShell(application: OpaquePointer?, title: String, band: GWidget, rail: [GWidget], page: GWidget,
                      size: (width: Int32, height: Int32) = (1280, 800)) -> GWidget {
    let window = gtk_application_window_new(cast(application))!
    gStyle(window, "g-window", "g-frame")
    gtk_window_set_title(cast(window), title)
    gtk_window_set_default_size(cast(window), size.width, size.height)
    let header = gHeaderBar(band)
    gtk_widget_add_css_class(header, "g-band")
    gtk_window_set_titlebar(cast(window), header)
    let railColumn = gStyle(gBox(GTK_ORIENTATION_VERTICAL, spacing: 4, rail), "g-frame", "g-rail")
    gtk_widget_set_size_request(railColumn, 92, -1)
    // The rail keeps its width: what it holds (a flexible space) does not widen it.
    gtk_widget_set_hexpand(railColumn, 0)
    gtk_widget_set_hexpand(page, 1)
    gtk_widget_set_vexpand(page, 1)
    let sheet = gStyle(gBox(GTK_ORIENTATION_VERTICAL, [page]), "g-shell-page")
    gtk_widget_set_overflow(sheet, GTK_OVERFLOW_HIDDEN)
    gtk_widget_set_hexpand(sheet, 1)
    gtk_window_set_child(cast(window), gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, [railColumn, sheet]), "g-frame"))
    return window
}
#endif
