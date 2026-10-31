import Foundation
import GabaritGtk

// The gallery's sections, the same as the Mac's (galerie/apple): controls, forms, frame, feedback, window. Each is drawn
// at twice its size, light then dark, to <folder>/<section>-<appearance>.png, so the two galleries compare side by side.

let folder = CommandLine.arguments.dropFirst().first ?? "."

@MainActor func margins(_ widget: GWidget, _ value: Int32) -> GWidget {
    gtk_widget_set_margin_start(widget, value)
    gtk_widget_set_margin_end(widget, value)
    gtk_widget_set_margin_top(widget, value)
    gtk_widget_set_margin_bottom(widget, value)
    return widget
}

@MainActor func start(_ widget: GWidget) -> GWidget {
    gtk_widget_set_halign(widget, GTK_ALIGN_START)
    return widget
}

/// A wrapper cut by one of Gabarit's radii.
@MainActor func rounded(_ widget: GWidget, _ radius: Int, border: Bool = false) -> GWidget {
    let box = gStyle(gBox(GTK_ORIENTATION_VERTICAL, [widget]), "g-radius-\(radius)")
    if border { gtk_widget_add_css_class(box, "g-gallery-bordered") }
    gtk_widget_set_overflow(box, GTK_OVERFLOW_HIDDEN)
    return box
}

@MainActor func controls() -> GWidget {
    let states = [GTone.success, .warning, .error, .info].map { tone in
        gStyle(gLabel("state", style: "caption"), "g-gallery-state", "g-\(tone)")
    }
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 14, [
        gLabel("Controls", style: "title2"),
        start(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, [
            gButton("Primary", variant: .primary) {}, gButton("Secondary") {}, gButton("Ghost", variant: .ghost) {},
            gButton("Danger", variant: .danger) {}, gButton("Delete", destructive: true) {}, gCloseButton(tooltip: "Close") {},
        ])),
        gSwitchRow("Notifications", detail: "A sentence that explains the setting.", isOn: true) { _ in },
        gSwitchRow("Off", isOn: false) { _ in },
        gTextField("Name", text: "Florian").view,
        gPicker("Appearance", options: ["System", "Light", "Dark"], selected: 1) { _ in },
        gPicker("Size", options: ["Small", "Medium", "Large"], selected: 1, style: .chips) { _ in },
        gSlider(value: 0.6, in: 0...1) { _ in },
        gStepper("Reminders", value: 3, in: 0...10) { _ in },
        start(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 8, states)),
    ])
    return gStyle(gBox(GTK_ORIENTATION_VERTICAL, [margins(column, 24)]), "g-surface")
}

@MainActor func forms() -> GWidget {
    let messages = gFormSection("Messages", rows: [
        gSwitchRow("Show previews", detail: "The first words of a message.", isOn: true) { _ in },
        gValueRow("Devices", value: "3"),
        gFormButtons([gButton("Reset") {}, gButton("Save", variant: .primary) {}]),
    ], footer: "Muted conversations never ring.")
    let rows = gBox(GTK_ORIENTATION_VERTICAL, spacing: 2, [
        gSidebarRow("Profile", icon: "avatar-default-symbolic", selected: true),
        gSidebarRow("Notifications", icon: "preferences-system-notifications-symbolic", selected: false, detail: "12"),
        gSidebarRow("Privacy", icon: "system-lock-screen-symbolic", selected: false, warns: true),
    ])
    gtk_widget_set_size_request(rows, 240, -1)
    let sidebar = start(gStyle(gBox(GTK_ORIENTATION_VERTICAL, [margins(rows, 8)]), "g-sidebar", "g-radius-12"))
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 32, [
        gPageTitle("Notifications", summary: "What reaches you, and when."), messages, sidebar, gSheetButton("Create") {},
    ])
    return margins(column, 24)
}

@MainActor func frame() -> GWidget {
    let items = gBox(GTK_ORIENTATION_VERTICAL, spacing: 6, [
        gRailItem("Today", icon: "weather-clear-symbolic", current: false) {},
        gRailItem("Messages", icon: "mail-unread-symbolic", current: true, badge: 4) {},
        gRailItem("Spaces", icon: "view-grid-symbolic", current: false) {},
    ])
    gtk_widget_set_size_request(items, 84, -1)
    let rail = gStyle(gBox(GTK_ORIENTATION_VERTICAL, [margins(items, 8)]), "g-frame", "g-radius-12")
    gtk_widget_set_valign(rail, GTK_ALIGN_START)
    let menu = rounded(gMenuList([
        gMenuItem("Mark as read", icon: "mail-read-symbolic") {},
        gMenuItem("Mute", icon: "notifications-disabled-symbolic", checked: true) {},
        gMenuItem("Leave", icon: "system-log-out-symbolic", destructive: true) {},
    ]), 8, border: true)
    let right = gBox(GTK_ORIENTATION_VERTICAL, spacing: 18, [gNavTabs(["Overview", "Members", "Roles"], selected: 0) { _ in }, menu])
    gtk_widget_set_hexpand(right, 1)
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 18, [
        rounded(gPageBand(icon: "preferences-system-notifications-symbolic", title: "Notifications", summary: "What reaches you, and when."), 12),
        gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 18, [rail, right]),
        rounded(gWindowHeader(title: "Settings", subtitle: "SkollN", icon: "emblem-system-symbolic",
                              trailing: [gCloseButton(tooltip: "Close") {}]), 12),
    ])
    return margins(column, 24)
}

@MainActor func feedback() -> GWidget {
    let first = gSkeleton(height: 16), second = gSkeleton(height: 16)
    gtk_widget_set_size_request(first, 260, 16)
    gtk_widget_set_size_request(second, 200, 16)
    let empty = gEmptyState(icon: "mail-unread-symbolic", title: "No messages yet", message: "Start a conversation with a contact.",
                            action: ("New conversation", {}), actionIcon: "document-edit-symbolic")
    let emptyBox = gBox(GTK_ORIENTATION_VERTICAL, [empty])
    gtk_widget_set_size_request(emptyBox, -1, 260)
    gtk_widget_set_vexpand(empty, 1)
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 18, [
        start(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 8, [
            gBadge("Article", icon: "x-office-document-symbolic"), gBadge("Synced", tone: .success), gBadge("Offline", tone: .warning),
            gBadge("Error", tone: .error), gBadge("New", icon: "starred-symbolic", tone: .info),
        ])),
        gBox(GTK_ORIENTATION_VERTICAL, spacing: 8, [start(first), start(second), gSkeleton(height: 60, cornerRadius: GRadius.md)]),
        gTypingDots(label: "Writing"),
        start(gToast("Link copied", icon: "insert-link-symbolic")),
        emptyBox,
    ])
    return margins(column, 24)
}

@MainActor func window() -> GWidget {
    let logo = gStyle(gIcon("starred-symbolic", size: 30), "g-gallery-logo")
    gtk_widget_set_margin_top(logo, 40)
    gtk_widget_set_margin_bottom(logo, 12)
    let square = gRailSquareButton(icon: "emblem-system-symbolic", tooltip: "Settings") {}
    gtk_widget_set_margin_bottom(square, 12)
    let spacer = gSpacer(GTK_ORIENTATION_VERTICAL)
    gtk_widget_set_size_request(spacer, -1, 8)
    let page = gBox(GTK_ORIENTATION_VERTICAL, [
        gSidebarRow("Marie", icon: "avatar-default-symbolic", selected: true, detail: "2"),
        gSidebarRow("Paul", icon: "avatar-default-symbolic", selected: false),
    ])
    gtk_widget_set_size_request(page, 260, -1)
    gtk_widget_set_halign(page, GTK_ALIGN_START)
    gtk_widget_set_valign(page, GTK_ALIGN_START)
    let shell = gAppShellContent(band: [gBandTitle("Messages", subtitle: "2 unread")], rail: [
        logo,
        gRailItem("Today", icon: "weather-clear-symbolic", current: false) {},
        gRailItem("Messages", icon: "mail-unread-symbolic", current: true, badge: 2) {},
        gRailItem("Spaces", icon: "view-grid-symbolic", current: false) {},
        spacer,
        gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 4, [
            gRailButton(icon: "preferences-desktop-locale-symbolic", tooltip: "Translate") {},
            gRailButton(icon: "audio-input-microphone-symbolic", tooltip: "Hands-free", isOn: true, value: "on") {},
        ]),
        square,
    ], page: margins(page, 12))
    gtk_widget_set_size_request(shell, 600, 380)
    return shell
}

// MARK: Drawing

/// What only the gallery draws: the states' samples, a menu's rim, the logo.
let galleryStyle = """
.g-gallery-state { padding: 6px; border-radius: 999px; }
.g-gallery-state.g-success { color: @g_success; background-color: alpha(@g_success, 0.14); }
.g-gallery-state.g-warning { color: @g_warning; background-color: alpha(@g_warning, 0.14); }
.g-gallery-state.g-error { color: @g_error; background-color: alpha(@g_error, 0.14); }
.g-gallery-state.g-info { color: @g_info; background-color: alpha(@g_info, 0.14); }
.g-gallery-bordered { border: 1px solid @g_hairline; }
.g-gallery-logo { color: @g_accent; }
"""

/// The section in its window: the page's ground, 20 around, 600 wide.
@MainActor func open(_ application: OpaquePointer?, _ section: GWidget) -> GWidget {
    let window = gtk_application_window_new(UnsafeMutablePointer(application))!
    let gtkWindow = UnsafeMutableRawPointer(window).assumingMemoryBound(to: GtkWindow.self)
    gtk_window_set_decorated(gtkWindow, 0)
    gStyle(window, "g-window")
    let frame = margins(gBox(GTK_ORIENTATION_VERTICAL, [section]), 20)
    gtk_widget_set_size_request(frame, 600, -1)
    gtk_window_set_child(gtkWindow, gStyle(gBox(GTK_ORIENTATION_VERTICAL, [frame]), "g-page"))
    gtk_window_present(gtkWindow)
    return window
}

/// The window's content at twice its size, to a PNG.
@MainActor func save(_ window: GWidget, _ path: String) {
    let gtkWindow = UnsafeMutableRawPointer(window).assumingMemoryBound(to: GtkWindow.self)
    guard let child = gtk_window_get_child(gtkWindow), let paintable = gtk_widget_paintable_new(child),
          let snapshot = gtk_snapshot_new() else { return }
    let width = Double(gtk_widget_get_width(child)), height = Double(gtk_widget_get_height(child))
    gtk_snapshot_scale(snapshot, 2, 2)
    gdk_paintable_snapshot(paintable, snapshot, width, height)
    guard let node = gtk_snapshot_free_to_node(snapshot),
          let renderer = gtk_native_get_renderer(OpaquePointer(window)) else { return }
    var bounds = graphene_rect_t()
    graphene_rect_init(&bounds, 0, 0, Float(width * 2), Float(height * 2))
    if let texture = gsk_renderer_render_texture(renderer, node, &bounds) {
        _ = gdk_texture_save_to_png(texture, path)
        print(path)
    }
}

@MainActor func later(_ milliseconds: UInt32, _ run: @escaping () -> Void) {
    let box = Unmanaged.passRetained(Later(run)).toOpaque()
    let fire: @convention(c) (UnsafeMutableRawPointer?) -> gboolean = { data in
        let later = Unmanaged<Later>.fromOpaque(data!).takeRetainedValue()
        MainActor.assumeIsolated { later.run() }
        return 0
    }
    g_timeout_add(milliseconds, fire, box)
}

final class Later {
    let run: () -> Void
    init(_ run: @escaping () -> Void) { self.run = run }
}

let activate: @convention(c) (UnsafeMutableRawPointer?, UnsafeMutableRawPointer?) -> Void = { application, _ in
    MainActor.assumeIsolated {
        GGtk.install(scheme: .light)
        if let provider = gtk_css_provider_new(), let display = gdk_display_get_default() {
            gtk_css_provider_load_from_string(provider, galleryStyle)
            gtk_style_context_add_provider_for_display(display, OpaquePointer(provider), 900)
        }
        let app = OpaquePointer(application)
        let sections: [(String, GWidget)] = [("controls", controls()), ("forms", forms()), ("frame", frame()),
                                             ("feedback", feedback()), ("window", window())]
        let windows = sections.map { (name: $0.0, window: open(app, $0.1)) }
        later(1500) {
            for item in windows { save(item.window, "\(folder)/\(item.name)-light.png") }
            GGtk.apply(.dark)
            later(1000) {
                for item in windows { save(item.window, "\(folder)/\(item.name)-dark.png") }
                g_application_quit(UnsafeMutableRawPointer(application)?.assumingMemoryBound(to: GApplication.self))
            }
        }
    }
}

let application = gtk_application_new("com.masmarino.gabarit.gallery", G_APPLICATION_NON_UNIQUE)
g_signal_connect_data(application, "activate", unsafeBitCast(activate, to: GCallback.self), nil, nil, GConnectFlags(rawValue: 0))
exit(g_application_run(UnsafeMutableRawPointer(application)?.assumingMemoryBound(to: GApplication.self), 0, nil))
