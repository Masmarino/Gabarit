#if os(Linux)
@_exported import CGtk
@_exported import GabaritCommon
import Foundation

// Gabarit for GTK 4 (Linux), from SkollN's design: the same components as GabaritApple, built with GTK's widgets and
// dressed by Gabarit's style sheets (Resources: the colours, light and dark, the text styles, the components). Call
// `GGtk.install()` once, when the application starts (its "startup" or "activate"), before building any window.

/// A GTK widget, as GTK's C functions give and take it.
public typealias GWidget = UnsafeMutablePointer<GtkWidget>

/// An appearance: Gabarit's light or dark colours, or the desktop's choice.
public enum GScheme: Sendable { case light, dark, system }

@MainActor
public enum GGtk {
    private static var colours: OpaquePointer?

    /// Registers the IBM Plex fonts with fontconfig, then loads the style sheets for the default display.
    public static func install(scheme: GScheme = .system) {
        for file in GFamily.files {
            let name = (file as NSString).deletingPathExtension
            if let path = Bundle.module.path(forResource: name, ofType: "ttf", inDirectory: "fonts") {
                _ = FcConfigAppFontAddFile(nil, path)
            }
        }
        apply(scheme)
        for sheet in ["gabarit", "components"] { load(sheet, priority: UInt32(GTK_STYLE_PROVIDER_PRIORITY_APPLICATION)) }
    }

    /// Changes the appearance (light or dark colours) of every window.
    public static func apply(_ scheme: GScheme) {
        let dark = scheme == .dark || (scheme == .system && desktopPrefersDark())
        if let colours, let display = gdk_display_get_default() {
            gtk_style_context_remove_provider_for_display(display, colours)
        }
        colours = load(dark ? "gabarit-dark" : "gabarit-light", priority: UInt32(GTK_STYLE_PROVIDER_PRIORITY_APPLICATION) - 1)
    }

    /// The desktop's choice (GNOME's `color-scheme`, `prefer-dark`), when its settings are there.
    public static func desktopPrefersDark() -> Bool {
        guard let source = g_settings_schema_source_get_default(),
              let schema = g_settings_schema_source_lookup(source, "org.gnome.desktop.interface", 1) else { return false }
        defer { g_settings_schema_unref(schema) }
        guard g_settings_schema_has_key(schema, "color-scheme") != 0, let settings = g_settings_new("org.gnome.desktop.interface") else { return false }
        defer { g_object_unref(settings) }
        guard let value = g_settings_get_string(settings, "color-scheme") else { return false }
        defer { g_free(value) }
        return String(cString: value) == "prefer-dark"
    }

    @discardableResult
    private static func load(_ sheet: String, priority: UInt32) -> OpaquePointer? {
        guard let path = Bundle.module.path(forResource: sheet, ofType: "css"), let display = gdk_display_get_default(),
              let provider = gtk_css_provider_new() else { return nil }
        gtk_css_provider_load_from_path(provider, path)
        let opaque = OpaquePointer(provider)
        gtk_style_context_add_provider_for_display(display, opaque, priority)
        return opaque
    }
}

// MARK: Plumbing

/// GTK's functions take each widget as its own type (GtkBox, GtkLabel…): a widget passed for another, as in C.
@inlinable func cast<T, U>(_ pointer: UnsafeMutablePointer<U>?) -> UnsafeMutablePointer<T>? {
    UnsafeMutableRawPointer(pointer)?.assumingMemoryBound(to: T.self)
}

@inlinable func cast<U>(_ pointer: UnsafeMutablePointer<U>?) -> OpaquePointer? { OpaquePointer(pointer) }

@inlinable func cast<T>(_ pointer: OpaquePointer?) -> UnsafeMutablePointer<T>? { UnsafeMutablePointer(pointer) }

/// A Swift closure kept alive as long as the signal's connection.
final class GClosureBox {
    let run: () -> Void
    init(_ run: @escaping () -> Void) { self.run = run }
}

/// Connects a signal with no argument but the instance to a Swift closure.
@MainActor
public func gConnect(_ instance: UnsafeMutableRawPointer?, _ signal: String, _ action: @escaping () -> Void) {
    let box = Unmanaged.passRetained(GClosureBox(action)).toOpaque()
    let handler: @convention(c) (UnsafeMutableRawPointer?, UnsafeMutableRawPointer?) -> Void = { _, data in
        guard let data else { return }
        Unmanaged<GClosureBox>.fromOpaque(data).takeUnretainedValue().run()
    }
    let release: @convention(c) (UnsafeMutableRawPointer?, UnsafeMutablePointer<GClosure>?) -> Void = { data, _ in
        guard let data else { return }
        Unmanaged<GClosureBox>.fromOpaque(data).release()
    }
    g_signal_connect_data(instance, signal, unsafeBitCast(handler, to: GCallback.self), box, release, GConnectFlags(rawValue: 0))
}

/// Adds Gabarit's style classes to a widget.
@MainActor
@discardableResult
public func gStyle(_ widget: GWidget, _ classes: String...) -> GWidget {
    for name in classes { gtk_widget_add_css_class(widget, name) }
    return widget
}

/// A vertical or horizontal box of widgets.
@MainActor
public func gBox(_ orientation: GtkOrientation, spacing: Int32 = 0, _ children: [GWidget]) -> GWidget {
    let box = gtk_box_new(orientation, spacing)!
    for child in children { gtk_box_append(cast(box), child) }
    return box
}

/// A label in one of Gabarit's text styles (`body`, `headline`, `title2`…), aligned to the leading edge.
@MainActor
public func gLabel(_ text: String, style: String = "body", classes: [String] = [], wraps: Bool = false) -> GWidget {
    let label = gtk_label_new(text)!
    gtk_label_set_xalign(cast(label), 0)
    if wraps { gtk_label_set_wrap(cast(label), 1) } else { gtk_label_set_ellipsize(cast(label), PANGO_ELLIPSIZE_END) }
    gtk_widget_add_css_class(label, "g-\(style)")
    for name in classes { gtk_widget_add_css_class(label, name) }
    return label
}

/// A symbolic icon of the desktop's theme (`"mail-unread-symbolic"`).
@MainActor
public func gIcon(_ name: String, size: Int32 = 16) -> GWidget {
    let image = gtk_image_new_from_icon_name(name)!
    gtk_image_set_pixel_size(cast(image), size)
    return image
}

/// A flexible space, along a box's axis (horizontal: in a row; vertical: in a column).
@MainActor
public func gSpacer(_ axis: GtkOrientation = GTK_ORIENTATION_HORIZONTAL) -> GWidget {
    let spacer = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!
    if axis == GTK_ORIENTATION_HORIZONTAL { gtk_widget_set_hexpand(spacer, 1) } else { gtk_widget_set_vexpand(spacer, 1) }
    return spacer
}
#endif
