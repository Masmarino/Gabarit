import Foundation
import GabaritGtk

// The gallery's windows: `shell` (the main window: the band, the rail, a settings page) or `window` (a secondary
// window: the controls and the feedback), in `light` or `dark`.

let arguments = CommandLine.arguments.dropFirst()
let which = arguments.first ?? "shell"
let scheme: GScheme = arguments.dropFirst().first == "dark" ? .dark : .light

@MainActor func settingsPage() -> GWidget {
    gForm(title: "Notifications", summary: "What reaches you, and when.", sections: [
        gFormSection("Messages", rows: [
            gSwitchRow("Show previews", detail: "The first words of a message.", isOn: true) { _ in },
            gValueRow("Devices", value: "3"),
            gPicker("Sound", options: ["Default", "Bell", "None"], selected: 0) { _ in },
        ], footer: "Muted conversations never ring."),
        gFormSection("Size", rows: [
            gPicker("Text", options: ["Small", "Medium", "Large"], selected: 1, style: .chips) { _ in },
            gSlider(value: 0.6, in: 0...1) { _ in },
        ]),
        gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 8, [gSpacer(), gButton("Reset") {}, gButton("Save", variant: .primary) {}]),
    ])
}

@MainActor func controlsPage() -> GWidget {
    let field = gTextField("Name", text: "Florian", prompt: "Your name")
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 16, [
        gNavTabs(["Overview", "Members", "Roles"], selected: 0) { _ in },
        gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, [
            gButton("Primary", variant: .primary) {}, gButton("Secondary") {}, gButton("Ghost", variant: .ghost) {},
            gButton("Danger", variant: .danger) {}, gButton("Delete", destructive: true) {}, gCloseButton(tooltip: "Close") {},
        ]),
        field.view,
        gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 8, [gBadge("Article"), gBadge("Synced", tone: .success), gBadge("Offline", tone: .warning),
                                                      gBadge("Error", tone: .error), gBadge("New", tone: .info)]),
        gToast("Link copied", icon: "edit-copy-symbolic"),
        gEmptyState(icon: "mail-unread-symbolic", title: "No messages yet", message: "Start a conversation with a contact.",
                    action: ("New conversation", {})),
    ])
    for margin in [gtk_widget_set_margin_start, gtk_widget_set_margin_end, gtk_widget_set_margin_top, gtk_widget_set_margin_bottom] {
        margin(column, 24)
    }
    return column
}

let activate: @convention(c) (UnsafeMutableRawPointer?, UnsafeMutableRawPointer?) -> Void = { application, _ in
    MainActor.assumeIsolated {
        GGtk.install(scheme: scheme)
        let app = OpaquePointer(application)
        let window: GWidget
        if which == "window" {
            window = gWindow(application: app, title: "Settings", subtitle: "SkollN", icon: "emblem-system-symbolic",
                             size: (720, 760), content: controlsPage())
        } else {
            let sidebar = gStyle(gBox(GTK_ORIENTATION_VERTICAL, spacing: 2, [
                gSidebarRow("Profile", icon: "avatar-default-symbolic", selected: true),
                gSidebarRow("Notifications", icon: "preferences-system-notifications-symbolic", selected: false, detail: "12"),
                gSidebarRow("Privacy", icon: "security-high-symbolic", selected: false),
            ]), "g-sidebar")
            gtk_widget_set_size_request(sidebar, 240, -1)
            gtk_widget_set_hexpand(sidebar, 0)
            for margin in [gtk_widget_set_margin_start, gtk_widget_set_margin_end, gtk_widget_set_margin_top] { margin(sidebar, 0) }
            let page = gBox(GTK_ORIENTATION_HORIZONTAL, [sidebar, settingsPage()])
            window = gAppShell(application: app, title: "SkollN", band: gBandTitle("Settings", subtitle: "3 devices"),
                               rail: [gSpacer(GTK_ORIENTATION_VERTICAL), gRailItem("Today", icon: "weather-clear-symbolic", current: false) {},
                                      gRailItem("Messages", icon: "mail-unread-symbolic", current: true) {},
                                      gRailItem("Spaces", icon: "view-grid-symbolic", current: false) {}, gSpacer(GTK_ORIENTATION_VERTICAL)],
                               page: page, size: (1180, 760))
        }
        gtk_window_present(UnsafeMutableRawPointer(window).assumingMemoryBound(to: GtkWindow.self))
    }
}

let application = gtk_application_new("com.masmarino.gabarit.gallery", G_APPLICATION_NON_UNIQUE)
g_signal_connect_data(application, "activate", unsafeBitCast(activate, to: GCallback.self), nil, nil, GConnectFlags(rawValue: 0))
exit(g_application_run(UnsafeMutableRawPointer(application)?.assumingMemoryBound(to: GApplication.self), 0, nil))
