#if os(Linux)
import Foundation

// What comes over a page, as on the Mac: a card's clickable row, sheets (a modal window with Gabarit's title and cross),
// an error's alert, passing messages, and the quick search (Ctrl + K). Passing messages and the quick search show in a
// host (`gOverlayHost`) laid around the window's content.

// MARK: Rows

/// A card's clickable row (Mac's `GFormRowButtonStyle`): its text in rust (red if it destroys), the veil on hover.
@MainActor
public func gRowButton(_ title: String, destructive: Bool = false, action: @escaping () -> Void) -> GWidget {
    let label = gLabel(title)
    let button = gtk_button_new()!
    gtk_button_set_child(cast(button), label)
    gtk_button_set_has_frame(cast(button), 0)
    gStyle(button, "g-row-button")
    if destructive { gtk_widget_add_css_class(button, "g-destructive") }
    gtk_widget_set_hexpand(button, 1)
    gPointer(button)
    gConnect(UnsafeMutableRawPointer(button), "clicked", action)
    return button
}

// MARK: Sheets

/// A sheet's title (Mac's `GSheetTitle`): a back arrow if `back`, the title large and its sentence discreet, the cross
/// on the right.
@MainActor
public func gSheetTitle(_ title: String, summary: String, closeTooltip: String = "Close (Esc)", closeLabel: String = "Close",
                        backTooltip: String = "Back",
                        back: (() -> Void)? = nil, dismiss: @escaping () -> Void) -> GWidget {
    var children: [GWidget] = []
    if let back {
        let arrow = gtk_button_new_from_icon_name(gIconName("chevron.left"))!
        gStyle(arrow, "g-sheet-back")
        gtk_widget_set_valign(arrow, GTK_ALIGN_START)
        gtk_widget_set_tooltip_text(arrow, backTooltip)
        gAccessibleLabel(arrow, backTooltip)
        gPointer(arrow)
        gConnect(UnsafeMutableRawPointer(arrow), "clicked", back)
        children.append(arrow)
    }
    let texts = gBox(GTK_ORIENTATION_VERTICAL, spacing: 4, [gLabel(title, style: "title", classes: ["g-sheet-title"], heading: 1),
                                                             gLabel(summary, style: "callout", classes: ["g-text-discret"], wraps: true)])
    gtk_widget_set_hexpand(texts, 1)
    children.append(texts)
    let close = gCloseButton(tooltip: closeTooltip, label: closeLabel, action: dismiss)
    gtk_widget_set_valign(close, GTK_ALIGN_START)
    children.append(close)
    return gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 16, children), "g-sheet-header")
}

/// A sheet: a modal window over `parent`, Gabarit's title and cross on top, then the content on the page's ground.
/// Escape closes it. Returns the window (`gtk_window_close` to close it from the content).
@MainActor
@discardableResult
/// `focus`: what has the keyboard first (a field; otherwise GTK's first, which may be the back arrow or the cross);
/// `defaultButton`: what Return triggers from a field.
public func gSheet(parent: GWidget, title: String, summary: String, size: (width: Int32, height: Int32) = (560, 640),
                   content: GWidget, focus: GWidget? = nil, defaultButton: GWidget? = nil,
                   onClose: (() -> Void)? = nil) -> GWidget {
    let window = gtk_window_new()!
    let gtkWindow: UnsafeMutablePointer<GtkWindow>? = cast(window)
    gStyle(window, "g-window", "g-sheet")
    gtk_window_set_title(gtkWindow, title)
    gtk_window_set_modal(gtkWindow, 1)
    gtk_window_set_transient_for(gtkWindow, cast(parent))
    gtk_window_set_destroy_with_parent(gtkWindow, 1)
    gtk_window_set_default_size(gtkWindow, size.width, size.height)
    // No title bar: the sheet's title is its own.
    let none = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!
    gtk_widget_set_visible(none, 0)
    gtk_window_set_titlebar(gtkWindow, none)
    let header = gSheetTitle(title, summary: summary) { gtk_window_close(gtkWindow) }
    gtk_widget_set_vexpand(content, 1)
    gtk_window_set_child(gtkWindow, gStyle(gBox(GTK_ORIENTATION_VERTICAL, [header, content]), "g-page"))
    let escape = gtk_shortcut_controller_new()!
    gtk_shortcut_controller_add_shortcut(escape, gtk_shortcut_new(gtk_shortcut_trigger_parse_string("Escape"),
                                                                  gtk_named_action_new("window.close")))
    gtk_widget_add_controller(window, escape)
    if let onClose { gConnect(UnsafeMutableRawPointer(window), "destroy", onClose) }
    if let defaultButton { gtk_window_set_default_widget(gtkWindow, defaultButton) }
    gtk_window_present(gtkWindow)
    if let focus { gtk_widget_grab_focus(focus) }
    return window
}

/// An error's alert over `parent` (a small modal window, as Gabarit draws it): the title, the message, "OK". Return
/// and Escape close it.
@MainActor
public func gErrorAlert(parent: GWidget, title: String, message: String, ok: String = "OK") {
    let window = gtk_window_new()!
    let gtkWindow: UnsafeMutablePointer<GtkWindow>? = cast(window)
    gStyle(window, "g-window", "g-alert")
    gtk_window_set_title(gtkWindow, title)
    gtk_window_set_modal(gtkWindow, 1)
    gtk_window_set_transient_for(gtkWindow, cast(parent))
    gtk_window_set_destroy_with_parent(gtkWindow, 1)
    gtk_window_set_resizable(gtkWindow, 0)
    let none = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!
    gtk_widget_set_visible(none, 0)
    gtk_window_set_titlebar(gtkWindow, none)
    let button = gButton(ok, variant: .primary) { gtk_window_close(gtkWindow) }
    gtk_widget_set_halign(button, GTK_ALIGN_END)
    let text = gLabel(message, classes: ["g-text-secondary"], wraps: true)
    gtk_label_set_max_width_chars(cast(text), 48)
    let column = gBox(GTK_ORIENTATION_VERTICAL, spacing: 8, [gLabel(title, style: "title3", heading: 1), text])
    gtk_widget_set_margin_bottom(column, 12)
    gtk_window_set_child(gtkWindow, gStyle(gBox(GTK_ORIENTATION_VERTICAL, [column, button]), "g-alert-content"))
    gtk_window_set_default_widget(gtkWindow, button)
    let escape = gtk_shortcut_controller_new()!
    gtk_shortcut_controller_add_shortcut(escape, gtk_shortcut_new(gtk_shortcut_trigger_parse_string("Escape"),
                                                                  gtk_named_action_new("window.close")))
    gtk_widget_add_controller(window, escape)
    gtk_window_present(gtkWindow)
    gtk_widget_grab_focus(button)
    // Said once the window is shown (its accessible object exists then).
    gAnnounce(window, "\(title). \(message)", high: true)
}

// MARK: The host

/// The window's content in a host that can show passing messages and the quick search over it. Give the host to
/// `gShowToast` and `gCommandPalette`, and set it as the window's child.
@MainActor
public func gOverlayHost(_ content: GWidget) -> GWidget {
    let overlay = gtk_overlay_new()!
    gtk_overlay_set_child(cast(overlay), content)
    return overlay
}

// MARK: Passing messages

/// A passing message at the bottom of the host, gone after `seconds`; screen readers say it as it shows.
@MainActor
public func gShowToast(_ host: GWidget, _ text: String, icon: String, seconds: Double = 2.5) {
    let toast = gToast(text, icon: icon)
    gtk_widget_set_valign(toast, GTK_ALIGN_END)
    gtk_widget_set_margin_bottom(toast, 32)
    gtk_widget_set_can_target(toast, 0)
    gtk_overlay_add_overlay(cast(host), toast)
    gAnnounce(toast, text)
    // Kept alive until then: the window may close first, and the message is removed only if it is still there.
    g_object_ref(UnsafeMutableRawPointer(toast))
    gAfter(UInt32(seconds * 1000)) {
        if gtk_widget_get_parent(toast) == host { gtk_overlay_remove_overlay(cast(host), toast) }
        g_object_unref(UnsafeMutableRawPointer(toast))
    }
}

/// Runs `action` once after `milliseconds`, on the main loop. Returns the timer (`g_source_remove` cancels it).
@MainActor
@discardableResult
public func gAfter(_ milliseconds: UInt32, _ action: @escaping () -> Void) -> guint {
    let box = Unmanaged.passRetained(GClosureBox(action)).toOpaque()
    let fire: @convention(c) (UnsafeMutableRawPointer?) -> gboolean = { data in
        let closure = Unmanaged<GClosureBox>.fromOpaque(data!).takeRetainedValue()
        MainActor.assumeIsolated { closure.run() }
        return 0
    }
    return g_timeout_add(milliseconds, fire, box)
}

// MARK: The quick search

/// An entry of the quick search: a page, an action, a conversation…
public struct GCommandItem {
    public let id: String
    public let label: String
    public var detail: String?
    /// A symbolic icon of the desktop's theme.
    public let icon: String
    public var keywords: [String]
    /// The shortcut shown on the right ("Ctrl + N"…).
    public var shortcut: String?
    public let perform: () -> Void

    public init(id: String, label: String, detail: String? = nil, icon: String, keywords: [String] = [], shortcut: String? = nil,
                perform: @escaping () -> Void) {
        self.id = id
        self.label = label
        self.detail = detail
        self.icon = icon
        self.keywords = keywords
        self.shortcut = shortcut
        self.perform = perform
    }
}

public struct GCommandGroup {
    public let title: String
    public let items: [GCommandItem]

    public init(title: String, items: [GCommandItem]) {
        self.title = title
        self.items = items
    }
}

/// Opens the quick search over the host: a field, then the entries that match, by group; the arrows choose, Return
/// opens, Escape (or a click beside it) closes.
@MainActor
public func gCommandPalette(_ host: GWidget, prompt: String = "Search", nothing: String = "Nothing matches.",
                            name: String = "Quick search", groups: [GCommandGroup]) {
    let palette = GCommandPaletteView(host: host, prompt: prompt, nothing: nothing, name: name, groups: groups)
    palette.open()
}

/// Ctrl + K on the window opens the quick search over the host; `groups` is asked each time.
@MainActor
public func gCommandShortcut(window: GWidget, host: GWidget, groups: @escaping () -> [GCommandGroup]) {
    let controller = gtk_shortcut_controller_new()!
    gtk_shortcut_controller_set_scope(controller, GTK_SHORTCUT_SCOPE_GLOBAL)
    let box = Unmanaged.passRetained(GClosureBox {
        if let open = GCommandPaletteView.current { open.close() } else { gCommandPalette(host, groups: groups()) }
    }).toOpaque()
    let run: @convention(c) (UnsafeMutablePointer<GtkWidget>?, OpaquePointer?, gpointer?) -> gboolean = { _, _, data in
        let closure = Unmanaged<GClosureBox>.fromOpaque(data!).takeUnretainedValue()
        MainActor.assumeIsolated { closure.run() }
        return 1
    }
    let release: @convention(c) (gpointer?) -> Void = { data in Unmanaged<GClosureBox>.fromOpaque(data!).release() }
    // Ctrl + K again closes it.
    gtk_shortcut_controller_add_shortcut(controller, gtk_shortcut_new(gtk_shortcut_trigger_parse_string("<Control>k"),
                                                                      gtk_callback_action_new(run, box, release)))
    gtk_widget_add_controller(window, controller)
}

@MainActor
final class GCommandPaletteView {
    let host: GWidget
    let prompt: String
    let nothing: String
    let name: String
    let groups: [GCommandGroup]
    private var layer: GWidget?
    private var entry: GWidget?
    private var list: GWidget?
    private var scroll: GWidget?
    private var shown: [(item: GCommandItem, row: GWidget)] = []
    private var active = 0
    /// What had the keyboard before it opened: it gets it back on closing.
    private var previousFocus: GWidget?
    /// Kept alive while it shows (the signals hold no reference).
    static var current: GCommandPaletteView?

    init(host: GWidget, prompt: String, nothing: String, name: String, groups: [GCommandGroup]) {
        self.host = host
        self.prompt = prompt
        self.nothing = nothing
        self.name = name
        self.groups = groups
    }

    func open() {
        Self.current?.close()
        Self.current = self
        let entry = gtk_entry_new()!
        gStyle(entry, "g-command-field")
        gtk_entry_set_placeholder_text(cast(entry), prompt)
        gtk_widget_set_hexpand(entry, 1)
        gAccessibleLabel(entry, name)
        gConnect(UnsafeMutableRawPointer(entry), "changed") { [weak self] in self?.refresh() }
        gConnect(UnsafeMutableRawPointer(entry), "activate") { [weak self] in self?.run(self?.active ?? 0) }
        // The keys, wherever the focus is in the panel (caught before the field).
        let keys = gtk_event_controller_key_new()!
        gtk_event_controller_set_propagation_phase(keys, GTK_PHASE_CAPTURE)
        let pressed: @convention(c) (OpaquePointer?, guint, guint, GdkModifierType, gpointer?) -> gboolean = { _, key, _, _, data in
            let view = Unmanaged<GCommandPaletteView>.fromOpaque(data!).takeUnretainedValue()
            return MainActor.assumeIsolated { view.key(Int32(key)) ? 1 : 0 }
        }
        g_signal_connect_data(UnsafeMutableRawPointer(keys), "key-pressed", unsafeBitCast(pressed, to: GCallback.self),
                              Unmanaged.passUnretained(self).toOpaque(), nil, GConnectFlags(rawValue: 0))
        let escape = gtk_label_new("Esc")!
        gStyle(escape, "g-mono", "g-text-discret")
        gAccessibleHidden(escape)
        // A click on "Esc" closes it too, as on the Mac.
        let escapeClick = gtk_gesture_click_new()!
        gConnect(UnsafeMutableRawPointer(escapeClick), "released") { [weak self] in self?.close() }
        gtk_widget_add_controller(escape, escapeClick)
        gPointer(escape)
        let field = gStyle(gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, [gIcon("magnifyingglass"), entry, escape]), "g-command-top")
        let list = gBox(GTK_ORIENTATION_VERTICAL, spacing: 2, [])
        gStyle(list, "g-command-list")
        let scroll = gtk_scrolled_window_new()!
        gtk_scrolled_window_set_policy(cast(scroll), GTK_POLICY_NEVER, GTK_POLICY_AUTOMATIC)
        gtk_scrolled_window_set_propagate_natural_height(cast(scroll), 1)
        gtk_scrolled_window_set_max_content_height(cast(scroll), 420)
        gtk_scrolled_window_set_child(cast(scroll), list)
        let line = gStyle(gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0)!, "g-hairline")
        let panel = gStyle(gBox(GTK_ORIENTATION_VERTICAL, [field, line, scroll]), "g-command-palette")
        gtk_widget_set_overflow(panel, GTK_OVERFLOW_HIDDEN)
        let clamp = gClamp(panel, maximum: 620)
        // Its margins outside it, and only its own height: a click anywhere beside the panel reaches the scrim.
        gtk_widget_set_halign(clamp, GTK_ALIGN_CENTER)
        gtk_widget_set_valign(clamp, GTK_ALIGN_START)
        gtk_widget_set_hexpand(clamp, 0)
        gtk_widget_set_margin_top(clamp, 72)
        gtk_widget_set_margin_start(clamp, 16)
        gtk_widget_set_margin_end(clamp, 16)
        // The scrim: a click beside the panel closes it.
        let scrim = gStyle(gtk_box_new(GTK_ORIENTATION_VERTICAL, 0)!, "g-scrim")
        gAccessibleHidden(scrim)
        let click = gtk_gesture_click_new()!
        gConnect(UnsafeMutableRawPointer(click), "released") { [weak self] in self?.close() }
        gtk_widget_add_controller(scrim, click)
        let layer = gtk_overlay_new()!
        gtk_overlay_set_child(cast(layer), scrim)
        gtk_overlay_add_overlay(cast(layer), clamp)
        gtk_widget_add_controller(layer, keys)
        // The page behind out of Tab's reach while it shows.
        if let page = gtk_overlay_get_child(cast(host)) { gtk_widget_set_can_focus(page, 0) }
        if let root = gtk_widget_get_root(host), let focus = gtk_root_get_focus(root) {
            previousFocus = focus
            g_object_ref(UnsafeMutableRawPointer(focus))
        }
        gtk_overlay_add_overlay(cast(host), layer)
        // The window closed with it open: nothing is left to remove.
        gConnect(UnsafeMutableRawPointer(layer), "destroy") { [weak self] in
            guard let self else { return }
            self.layer = nil
            if Self.current === self { Self.current = nil }
        }
        self.layer = layer
        self.entry = entry
        self.list = list
        self.scroll = scroll
        refresh()
        gtk_widget_grab_focus(entry)
    }

    private func refresh() {
        guard let list else { return }
        while let child = gtk_widget_get_first_child(list) { gtk_box_remove(cast(list), child) }
        shown = []
        active = 0
        let query = entry.map { String(cString: gtk_editable_get_text(cast($0))) } ?? ""
        for group in groups {
            let entries = group.items.map { GCommandSearch.Entry(id: $0.id, label: $0.label, detail: $0.detail, keywords: $0.keywords) }
            let byID = Dictionary(group.items.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
            let kept = GCommandSearch.filter(entries, query: query, limit: query.isEmpty ? 6 : 8).compactMap { byID[$0.id] }
            guard !kept.isEmpty else { continue }
            gtk_box_append(cast(list), gLabel(group.title.uppercased(), style: "caption2", classes: ["g-command-group"], heading: 3))
            for item in kept {
                let index = shown.count
                let row = self.row(item) { [weak self] in self?.run(index) }
                shown.append((item, row))
                gtk_box_append(cast(list), row)
            }
        }
        if shown.isEmpty {
            let empty = gLabel(nothing, style: "subheadline", classes: ["g-text-secondary", "g-command-empty"])
            gtk_label_set_xalign(cast(empty), 0.5)
            gtk_box_append(cast(list), empty)
            if let entry { gAnnounce(entry, nothing) }
        }
        select(0, announce: false)
    }

    private func row(_ item: GCommandItem, run: @escaping () -> Void) -> GWidget {
        let name = gLabel(item.label, style: "subheadline", classes: ["g-command-label"])
        var children = [gIcon(item.icon, size: 14), name]
        let spoken = [item.label, item.detail].compactMap { $0 }.joined(separator: ", ")
        if let detail = item.detail { children.append(gLabel(detail, style: "footnote", classes: ["g-text-secondary"])) }
        children.append(gSpacer())
        if let shortcut = item.shortcut { children.append(gLabel(shortcut, style: "mono", classes: ["g-text-discret"])) }
        let button = gtk_button_new()!
        gtk_button_set_child(cast(button), gBox(GTK_ORIENTATION_HORIZONTAL, spacing: 10, children))
        gtk_button_set_has_frame(cast(button), 0)
        gStyle(button, "g-command-row")
        // The field keeps the keyboard: the arrows choose the row (no second highlight from a focused row).
        gtk_widget_set_focusable(button, 0)
        gAccessibleLabel(button, spoken)
        gPointer(button)
        gConnect(UnsafeMutableRawPointer(button), "clicked", run)
        return button
    }

    private func select(_ index: Int, announce: Bool = true) {
        guard !shown.isEmpty else { return }
        if shown.indices.contains(active) { gtk_widget_remove_css_class(shown[active].row, "g-active") }
        active = min(max(index, 0), shown.count - 1)
        let row = shown[active].row
        gtk_widget_add_css_class(row, "g-active")
        if let scroll, let viewport = gtk_scrolled_window_get_child(cast(scroll)) {
            gtk_viewport_scroll_to(cast(viewport), row, nil)
        }
        // The choice is a colour only: screen readers are told it.
        if announce {
            gAnnounce(row, "\(shown[active].item.label), \(active + 1) / \(shown.count)")
        }
    }

    private func key(_ key: Int32) -> Bool {
        switch key {
        case GDK_KEY_Down, GDK_KEY_KP_Down: select(active + 1)
        case GDK_KEY_Up, GDK_KEY_KP_Up: select(active - 1)
        case GDK_KEY_Page_Down: select(active + 5)
        case GDK_KEY_Page_Up: select(active - 5)
        case GDK_KEY_Escape: close()
        default: return false
        }
        return true
    }

    private func run(_ index: Int) {
        guard shown.indices.contains(index) else { return }
        let item = shown[index].item
        close()
        item.perform()
    }

    func close() {
        if let layer, let parent = gtk_widget_get_parent(layer) {
            gtk_overlay_remove_overlay(cast(parent), layer)
            if let page = gtk_overlay_get_child(cast(host)) { gtk_widget_set_can_focus(page, 1) }
        }
        layer = nil
        if let previousFocus {
            if gtk_widget_get_root(previousFocus) != nil { gtk_widget_grab_focus(previousFocus) }
            g_object_unref(UnsafeMutableRawPointer(previousFocus))
            self.previousFocus = nil
        }
        if Self.current === self { Self.current = nil }
    }
}
#endif
