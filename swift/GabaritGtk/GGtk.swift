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
    private static var installed = false

    /// Registers the IBM Plex fonts with fontconfig, then loads the style sheets for the default display. Once: a
    /// second call only applies `scheme`.
    public static func install(scheme: GScheme = .system) {
        guard !installed else { return apply(scheme) }
        installed = true
        for file in GFamily.files {
            let name = (file as NSString).deletingPathExtension
            if let path = Bundle.module.path(forResource: name, ofType: "ttf", inDirectory: "fonts") {
                _ = FcConfigAppFontAddFile(nil, path)
            }
        }
        // Text drawn as on the Mac: letters at their exact place and shape, not snapped to the pixel (GTK 4.14's hinting
        // thins them and shuffles their spacing).
        if let settings = gtk_settings_get_default() {
            let object = UnsafeMutableRawPointer(settings).assumingMemoryBound(to: GObject.self)
            gSet(object, "gtk-hint-font-metrics", false)
            gSet(object, "gtk-xft-hinting", 0)
            gSet(object, "gtk-xft-hintstyle", "hintnone")
            gSet(object, "gtk-xft-antialias", 1)
            gSet(object, "gtk-xft-rgba", "none")
        }
        // Phosphor's icons, beside the desktop's theme: the apps name them as on the Mac.
        if let icons = Bundle.module.path(forResource: "icons", ofType: nil), let display = gdk_display_get_default() {
            gtk_icon_theme_add_search_path(gtk_icon_theme_get_for_display(display), icons)
        }
        apply(scheme)
        for sheet in ["gabarit", "components"] { load(sheet, priority: UInt32(GTK_STYLE_PROVIDER_PRIORITY_APPLICATION)) }
    }

    /// Changes the appearance (light or dark colours) of every window.
    public static func apply(_ scheme: GScheme) {
        let dark = scheme == .dark || (scheme == .system && desktopPrefersDark())
        if let colours, let display = gdk_display_get_default() {
            gtk_style_context_remove_provider_for_display(display, colours)
            g_object_unref(UnsafeMutableRawPointer(colours))
        }
        // GTK's own parts (scrollbars, selection, tooltips) in the same appearance.
        if let settings = gtk_settings_get_default() {
            gSet(UnsafeMutableRawPointer(settings).assumingMemoryBound(to: GObject.self), "gtk-application-prefer-dark-theme", dark)
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
        // The display keeps it: Gabarit keeps a reference only to the colours' sheet, which it swaps.
        if !sheet.hasPrefix("gabarit-") { g_object_unref(provider) }
        return opaque
    }
}

// MARK: Plumbing

/// Sets a GObject property (a boolean, a number or a string), if the object has it.
@MainActor
func gSet(_ object: UnsafeMutablePointer<GObject>, _ name: String, _ value: Any) {
    guard g_object_class_find_property(UnsafeMutableRawPointer(object.pointee.g_type_instance.g_class)?.assumingMemoryBound(to: GObjectClass.self), name) != nil else { return }
    var gvalue = GValue()
    switch value {
    case let flag as Bool: g_value_init(&gvalue, GType(5 << 2)); g_value_set_boolean(&gvalue, flag ? 1 : 0)
    case let number as Int: g_value_init(&gvalue, GType(6 << 2)); g_value_set_int(&gvalue, gint(number))
    case let text as String: g_value_init(&gvalue, GType(16 << 2)); g_value_set_string(&gvalue, text)
    default: return
    }
    g_object_set_property(object, name, &gvalue)
    g_value_unset(&gvalue)
}

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

/// Connects a signal to a Swift closure, whatever the signal carries: the closure is passed first (a swapped connection),
/// so a signal's own arguments (`notify`'s property, a click's position) never take its place. Returns the
/// connection, to disconnect it.
@MainActor
@discardableResult
public func gConnect(_ instance: UnsafeMutableRawPointer?, _ signal: String, _ action: @escaping () -> Void) -> gulong {
    let box = Unmanaged.passRetained(GClosureBox(action)).toOpaque()
    let handler: @convention(c) (UnsafeMutableRawPointer?) -> Void = { data in
        guard let data else { return }
        Unmanaged<GClosureBox>.fromOpaque(data).takeUnretainedValue().run()
    }
    let release: @convention(c) (UnsafeMutableRawPointer?, UnsafeMutablePointer<GClosure>?) -> Void = { data, _ in
        guard let data else { return }
        Unmanaged<GClosureBox>.fromOpaque(data).release()
    }
    return g_signal_connect_data(instance, signal, unsafeBitCast(handler, to: GCallback.self), box, release, G_CONNECT_SWAPPED)
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

/// The pointing hand over a widget: it can be clicked.
@MainActor
@discardableResult
public func gPointer(_ widget: GWidget) -> GWidget {
    gtk_widget_set_cursor(widget, GCursor.pointer)
    return widget
}

/// One pointing hand for every widget (not a new cursor per row of a list rebuilt at each key).
@MainActor
enum GCursor {
    static let pointer = gdk_cursor_new_from_name("pointer", nil)
}

/// The name screen readers say for a widget with no text of its own (an icon, a switch beside its title).
@MainActor
@discardableResult
public func gAccessibleLabel(_ widget: GWidget, _ label: String) -> GWidget {
    var value = GValue()
    g_value_init(&value, GType(16 << 2))
    g_value_set_string(&value, label)
    var property = GTK_ACCESSIBLE_PROPERTY_LABEL
    withUnsafePointer(to: &value) { values in
        gtk_accessible_update_property_value(OpaquePointer(widget), 1, &property, values)
    }
    g_value_unset(&value)
    return widget
}

/// A widget of `type` with an accessible role: GTK takes a role only at creation (a box that is a group, a label that
/// is a heading).
@MainActor
public func gNew(_ type: GType, role: GtkAccessibleRole) -> GWidget {
    var value = GValue()
    g_value_init(&value, gtk_accessible_role_get_type())
    g_value_set_enum(&value, gint(role.rawValue))
    defer { g_value_unset(&value) }
    return "accessible-role".withCString { name in
        var names: [UnsafePointer<CChar>?] = [name]
        return withUnsafePointer(to: &value) { values in
            UnsafeMutableRawPointer(g_object_new_with_properties(type, 1, &names, values)!).assumingMemoryBound(to: GtkWidget.self)
        }
    }
}

/// A text property for screen readers (a value said aloud, a keyboard shortcut, a description).
@MainActor
@discardableResult
public func gAccessibleText(_ widget: GWidget, _ property: GtkAccessibleProperty, _ text: String) -> GWidget {
    var value = GValue()
    g_value_init(&value, GType(16 << 2))
    g_value_set_string(&value, text)
    var name = property
    withUnsafePointer(to: &value) { values in gtk_accessible_update_property_value(OpaquePointer(widget), 1, &name, values) }
    g_value_unset(&value)
    return widget
}

/// A number property for screen readers (a heading's level, a value and its bounds).
@MainActor
@discardableResult
public func gAccessibleNumber(_ widget: GWidget, _ property: GtkAccessibleProperty, _ number: Double) -> GWidget {
    var value = GValue()
    if property == GTK_ACCESSIBLE_PROPERTY_LEVEL {
        g_value_init(&value, GType(6 << 2))
        g_value_set_int(&value, gint(number))
    } else {
        g_value_init(&value, GType(15 << 2))
        g_value_set_double(&value, number)
    }
    var name = property
    withUnsafePointer(to: &value) { values in gtk_accessible_update_property_value(OpaquePointer(widget), 1, &name, values) }
    g_value_unset(&value)
    return widget
}

/// A yes-or-no state for screen readers that may also be unset: SELECTED (the current page, the chosen section).
/// GTK reads these as a number (−1 unset, 0, 1).
@MainActor
@discardableResult
public func gAccessibleState(_ widget: GWidget, _ state: GtkAccessibleState, _ on: Bool) -> GWidget {
    var value = GValue()
    g_value_init(&value, GType(6 << 2))
    g_value_set_int(&value, on ? 1 : 0)
    var name = state
    withUnsafePointer(to: &value) { values in gtk_accessible_update_state_value(OpaquePointer(widget), 1, &name, values) }
    g_value_unset(&value)
    return widget
}

/// Says `text` to screen readers now (a passing message, a choice made with the arrows). Only through AT-SPI: GTK 4.14
/// crashes when its other accessibility contexts (no accessibility bus) are asked to announce.
@MainActor
public func gAnnounce(_ widget: GWidget, _ text: String, high: Bool = false) {
    guard let context = gtk_accessible_get_at_context(OpaquePointer(widget)) else { return }
    defer { g_object_unref(UnsafeMutableRawPointer(context)) }
    let instance = UnsafeMutableRawPointer(context).assumingMemoryBound(to: GTypeInstance.self)
    guard String(cString: g_type_name(instance.pointee.g_class.pointee.g_type)) == "GtkAtSpiContext" else { return }
    gtk_accessible_announce(OpaquePointer(widget), text,
                            high ? GTK_ACCESSIBLE_ANNOUNCEMENT_PRIORITY_HIGH : GTK_ACCESSIBLE_ANNOUNCEMENT_PRIORITY_MEDIUM)
}

/// Hidden from screen readers (a drawing that says nothing).
@MainActor
@discardableResult
public func gAccessibleHidden(_ widget: GWidget) -> GWidget {
    var value = GValue()
    g_value_init(&value, GType(5 << 2))
    g_value_set_boolean(&value, 1)
    var state = GTK_ACCESSIBLE_STATE_HIDDEN
    withUnsafePointer(to: &value) { values in
        gtk_accessible_update_state_value(OpaquePointer(widget), 1, &state, values)
    }
    g_value_unset(&value)
    return widget
}

/// A widget at most `maximum` wide, against the leading edge of the room it is given (a reading width).
@MainActor
public func gClamp(_ child: GWidget, maximum: Int32) -> GWidget {
    let measure: @convention(c) (UnsafeMutablePointer<GtkWidget>?, GtkOrientation, Int32, UnsafeMutablePointer<Int32>?,
                                 UnsafeMutablePointer<Int32>?, UnsafeMutablePointer<Int32>?, UnsafeMutablePointer<Int32>?) -> Void = {
        widget, orientation, forSize, minimum, natural, _, _ in
        guard let child = gtk_widget_get_first_child(widget) else { return }
        let limit = Int32(Int(bitPattern: g_object_get_data(UnsafeMutableRawPointer(widget)?.assumingMemoryBound(to: GObject.self), "g-clamp")))
        var low: Int32 = 0, high: Int32 = 0
        if orientation == GTK_ORIENTATION_HORIZONTAL {
            // As wide as it may be: the room given, up to the limit.
            gtk_widget_measure(child, orientation, forSize, &low, &high, nil, nil)
            high = max(low, limit)
        } else {
            let width = forSize < 0 ? forSize : min(forSize, limit)
            gtk_widget_measure(child, orientation, width, &low, &high, nil, nil)
        }
        minimum?.pointee = low
        natural?.pointee = high
    }
    let allocate: @convention(c) (UnsafeMutablePointer<GtkWidget>?, Int32, Int32, Int32) -> Void = { widget, width, height, _ in
        guard let child = gtk_widget_get_first_child(widget) else { return }
        let limit = Int32(Int(bitPattern: g_object_get_data(UnsafeMutableRawPointer(widget)?.assumingMemoryBound(to: GObject.self), "g-clamp")))
        var low: Int32 = 0
        gtk_widget_measure(child, GTK_ORIENTATION_HORIZONTAL, -1, &low, nil, nil, nil)
        gtk_widget_allocate(child, max(low, min(width, limit)), height, -1, nil)
    }
    let mode: @convention(c) (UnsafeMutablePointer<GtkWidget>?) -> GtkSizeRequestMode = { _ in GTK_SIZE_REQUEST_HEIGHT_FOR_WIDTH }
    let box = gBox(GTK_ORIENTATION_HORIZONTAL, [child])
    g_object_set_data(UnsafeMutableRawPointer(box).assumingMemoryBound(to: GObject.self), "g-clamp", UnsafeMutableRawPointer(bitPattern: Int(maximum)))
    gtk_widget_set_layout_manager(box, gtk_custom_layout_new(mode, measure, allocate))
    gtk_widget_set_hexpand(box, 1)
    return box
}

/// A label in one of Gabarit's text styles (`body`, `headline`, `title2`…), aligned to the leading edge.
@MainActor
/// `heading`: a title's level (1 the page's, 2 a section's…), said as such by screen readers.
public func gLabel(_ text: String, style: String = "body", classes: [String] = [], wraps: Bool = false,
                   heading: Int? = nil) -> GWidget {
    let label: GWidget
    if let heading {
        label = gNew(gtk_label_get_type(), role: GTK_ACCESSIBLE_ROLE_HEADING)
        gtk_label_set_text(cast(label), text)
        gAccessibleNumber(label, GTK_ACCESSIBLE_PROPERTY_LEVEL, Double(heading))
    } else {
        label = gtk_label_new(text)!
    }
    gtk_label_set_xalign(cast(label), 0)
    if wraps { gtk_label_set_wrap(cast(label), 1) } else { gtk_label_set_ellipsize(cast(label), PANGO_ELLIPSIZE_END) }
    gtk_widget_add_css_class(label, "g-\(style)")
    for name in classes { gtk_widget_add_css_class(label, name) }
    return label
}

/// An icon's name for GTK. The apps write the Mac's (an SF Symbol: `"bell"`, `"lock.fill"`), drawn by Phosphor's icon
/// that `GSymbols` gives; a name ending in "-symbolic" is the desktop theme's; any other, Phosphor's own (`"acorn"`).
public func gIconName(_ name: String) -> String {
    if name.hasSuffix("-symbolic") { return name }
    if let icon = GSymbols.phosphor(for: name) { return "gabarit-ph-\(icon.name)\(icon.filled ? "-fill" : "")-symbolic" }
    return "gabarit-ph-\(name)-symbolic"
}

/// An icon, by the Mac's name (`"bell"`, `"gearshape.fill"`), drawn by Phosphor (see `gIconName`). `size`: as an SF
/// Symbol's font size; Phosphor draws in a wider margin, so its icon is asked a quarter larger to look the same.
@MainActor
/// Hidden from screen readers unless `decorative` is false (an icon that says something no text beside it says).
public func gIcon(_ name: String, size: Int32 = 16, decorative: Bool = true) -> GWidget {
    let image = gtk_image_new_from_icon_name(gIconName(name))!
    gtk_image_set_pixel_size(cast(image), name.hasSuffix("-symbolic") ? size : (size * 5 + 2) / 4)
    if decorative { gAccessibleHidden(image) }
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
