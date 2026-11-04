import GabaritApple
import SwiftUI

// The gallery's sections. Text fields are shown through their frame on a plain text: the renderer cannot draw the
// AppKit view behind a `TextField`.

struct ControlsSection: View {
    @State private var on = true
    @State private var off = false
    @State private var choice = 1
    @State private var value = 0.6
    @State private var count = 3

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Controls").font(GFont.title2).foregroundStyle(GColor.textPrimary)
            HStack(spacing: 10) {
                Button("Primary") {}.buttonStyle(GButtonStyle(variant: .primary))
                Button("Secondary") {}.buttonStyle(GButtonStyle())
                Button("Ghost") {}.buttonStyle(GButtonStyle(variant: .ghost))
                Button("Danger") {}.buttonStyle(GButtonStyle(variant: .danger))
                Button("Delete", role: .destructive) {}.buttonStyle(GButtonStyle())
                GCloseButton(onFrame: false) {}
            }
            Toggle(isOn: $on) { Text("Notifications"); Text("A sentence that explains the setting.") }.toggleStyle(GToggleStyle())
            Toggle("Off", isOn: $off).toggleStyle(GToggleStyle())
            VStack(alignment: .leading, spacing: 6) {
                Text("Name").font(GFont.caption.weight(.semibold)).foregroundStyle(GColor.textSecondary)
                Text("Florian").frame(maxWidth: .infinity, alignment: .leading).foregroundStyle(GColor.textPrimary).modifier(GFieldFrame())
            }
            GPicker("Appearance", selection: $choice, options: [(0, "System"), (1, "Light"), (2, "Dark")])
            GPicker("Size", selection: $choice, options: [(0, "Small"), (1, "Medium"), (2, "Large")], style: .chips)
            GSlider(value: $value, in: 0...1)
            GStepper("Reminders", value: $count, in: 0...10)
            HStack {
                ForEach([GTone.success, .warning, .error, .info], id: \.self) { tone in
                    Text("state").font(GFont.caption).padding(6).foregroundStyle(tone.tintText).background(tone.tint, in: Capsule())
                }
            }
        }
        .padding(24)
        .gSurface(RoundedRectangle(cornerRadius: GRadius.lg))
    }
}

struct FormsSection: View {
    @State private var on = true

    var body: some View {
        VStack(alignment: .leading, spacing: GFormMetrics.sectionSpacing) {
            GPageTitle(title: "Notifications", summary: "What reaches you, and when.")
            Self.card(header: "Messages", footer: "Muted conversations never ring.") {
                Toggle(isOn: $on) { Text("Show previews"); Text("The first words of a message.") }.toggleStyle(GToggleStyle())
                LabeledContent("Devices", value: "3").labeledContentStyle(GLabeledContentStyle())
                GFormButtons {
                    Button("Reset") {}.buttonStyle(GButtonStyle())
                    Button("Save") {}.buttonStyle(GButtonStyle(variant: .primary))
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                GSidebarRow(title: "Profile", symbol: "person.crop.circle", selected: true)
                GSidebarRow(title: "Notifications", symbol: "bell", selected: false, detail: "12")
                GSidebarRow(title: "Privacy", symbol: "lock", selected: false, warns: true)
            }
            .frame(width: 240)
            .padding(8)
            .background(GColor.sidebar, in: RoundedRectangle(cornerRadius: GRadius.lg))
            GSheetButton(title: "Create") {}
        }
        .padding(24)
        .background(GColor.background)
    }

    /// A section as GFormLayout draws it (the renderer cannot draw the layout's scroll view).
    static func card<Rows: View>(header: String, footer: String, @ViewBuilder rows: () -> Rows) -> some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.lg, style: .continuous)
        return VStack(alignment: .leading, spacing: 8) {
            Text(header).font(GFont.headline).foregroundStyle(GColor.textPrimary).padding(.bottom, 4)
            VStack(spacing: 0) {
                Group(subviews: rows()) { subviews in
                    ForEach(Array(subviews.enumerated()), id: \.element.id) { index, row in
                        if index > 0 { Rectangle().fill(GColor.hairline).frame(height: 1).padding(.leading, 16) }
                        GFormCardRow {
                            row.frame(maxWidth: .infinity, minHeight: GFormMetrics.rowHeight - 16, alignment: .leading)
                                .padding(.horizontal, 16).padding(.vertical, 8)
                        }
                    }
                }
            }
            .background(GColor.surface, in: shape)
            .overlay { shape.strokeBorder(GColor.hairline, lineWidth: 1) }
            Text(footer).font(GFont.callout).foregroundStyle(GColor.textDiscret).padding(.horizontal, 2)
        }
    }
}

struct FrameSection: View {
    @State private var tab = "Overview"

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            GPageBand(symbol: "bell", title: "Notifications", summary: "What reaches you, and when.")
                .clipShape(RoundedRectangle(cornerRadius: GRadius.lg))
            HStack(alignment: .top, spacing: 18) {
                VStack(spacing: 6) {
                    GRailItem(title: "Today", systemImage: "sun.max", current: false) {}
                    GRailItem(title: "Messages", systemImage: "bubble.left.and.bubble.right", current: true, badge: 4) {}
                    GRailItem(title: "Spaces", systemImage: "square.grid.2x2", current: false) {}
                }
                .frame(width: 84)
                .padding(8)
                .background(GPalette.graphite950, in: RoundedRectangle(cornerRadius: GRadius.lg))
                VStack(alignment: .leading, spacing: 18) {
                    GNavTabs(tabs: ["Overview", "Members", "Roles"], title: { $0 }, selection: $tab)
                    GMenu {
                        GMenuItem(title: "Mark as read", systemImage: "envelope.open") {}
                        GMenuItem(title: "Mute", systemImage: "bell.slash", checked: true) {}
                        GMenuItem(title: "Leave", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) {}
                    }
                    .clipShape(RoundedRectangle(cornerRadius: GRadius.md))
                    .overlay { RoundedRectangle(cornerRadius: GRadius.md).strokeBorder(GColor.hairline) }
                }
            }
            GWindowHeader(title: "Settings", subtitle: "SkollN") {
                Image(systemName: "gearshape").foregroundStyle(GPalette.graphite100)
            } trailing: {
                GCloseButton {}
            }
            .clipShape(RoundedRectangle(cornerRadius: GRadius.lg))
        }
        .padding(24)
        .background(GColor.background)
    }
}

struct FeedbackSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 8) {
                GBadge("Article", systemImage: "doc.text")
                GBadge("Synced", tone: .success)
                GBadge("Offline", tone: .warning)
                GBadge("Error", tone: .error)
                GBadge("New", systemImage: "sparkles", tone: .info)
            }
            VStack(alignment: .leading, spacing: 8) {
                GSkeleton(height: 16).frame(width: 260)
                GSkeleton(height: 16).frame(width: 200)
                GSkeleton(height: 60, cornerRadius: GRadius.md)
            }
            GTypingDots(label: "Writing")
            Label("Link copied", systemImage: "link")
                .font(GFont.subheadline.weight(.medium))
                .foregroundStyle(GColor.onPrimary)
                .padding(.horizontal, GSpacing.lg).padding(.vertical, GSpacing.sm)
                .background(GColor.primary, in: .rect(cornerRadius: GRadius.md))
                .gShadow(GShadowValues.floating)
            GEmptyState(systemImage: "tray", title: "No messages yet", message: "Start a conversation with a contact.",
                        actionTitle: "New conversation", actionSystemImage: "square.and.pencil") {}
                .frame(height: 260)
        }
        .padding(24)
        .background(GColor.background)
    }
}

struct OverlaysSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            GSheetTitle(title: "New space", summary: "A place to share with a few people.", back: {}) {}
                .padding(.horizontal, -GFormMetrics.sheetMargin)
            FormsSection.card(header: "Members", footer: "They can leave at any time.") {
                Button("Invite people") {}.buttonStyle(GFormRowButtonStyle())
                Button("Leave the space", role: .destructive) {}.buttonStyle(GFormRowButtonStyle())
            }
        }
        .padding(24)
        .background(GColor.background)
    }
}

struct WindowSection: View {
    @State private var page = "messages"

    var body: some View {
        GAppShell {
            Image(systemName: "seal.fill").font(.system(size: 30)).foregroundStyle(GColor.accent).padding(.top, 40).padding(.bottom, 12)
            GRailItem(title: "Today", systemImage: "sun.max", current: page == "today") { page = "today" }
            GRailItem(title: "Messages", systemImage: "bubble.left.and.bubble.right", current: page == "messages", badge: 2) {}
            GRailItem(title: "Spaces", systemImage: "square.grid.2x2", current: false) {}
            Spacer(minLength: 8)
            HStack(spacing: 4) {
                GRailButton(symbol: "character.bubble", help: "Translate") {}
                GRailButton(symbol: "ear", help: "Hands-free", isOn: true, value: "on") {}
            }
            GRailSquareButton(symbol: "gearshape", help: "Settings") {}.padding(.bottom, 12)
        } bar: {
            GBarTitle(title: "Messages", subtitle: "2 unread")
            Spacer()
        } page: {
            VStack(alignment: .leading, spacing: 0) {
                GSidebarRow(title: "Marie", symbol: "person.circle", selected: true, detail: "2")
                GSidebarRow(title: "Paul", symbol: "person.circle", selected: false)
            }
            .frame(width: 260)
            .padding(12)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .frame(width: 600, height: 380)
    }
}

// MARK: Pointer states

/// Each control at rest, under the pointer, held down (forced by `gPointerPreview`), to look at them side by side.
struct StatesSection: View {
    private func row<V: View>(_ name: String, @ViewBuilder _ control: @escaping () -> V) -> some View {
        GridRow {
            Text(name).font(GFont.caption).foregroundStyle(GColor.textDiscret).gridColumnAlignment(.leading)
            control()
            control().environment(\.gPointerPreview, .hover)
            control().environment(\.gPointerPreview, .pressed)
            control().disabled(true)
        }
    }

    var body: some View {
        Grid(alignment: .center, horizontalSpacing: 14, verticalSpacing: 14) {
            GridRow {
                Color.clear.frame(width: 1, height: 1)
                ForEach(["Rest", "Hover", "Pressed", "Disabled"], id: \.self) { Text($0).font(GFont.headline).foregroundStyle(GColor.textPrimary) }
            }
            row("Primary") { Button("Save") {}.buttonStyle(GButtonStyle(variant: .primary)) }
            row("Secondary") { Button("Reset") {}.buttonStyle(GButtonStyle(variant: .secondary)) }
            row("Ghost") { Button("Later") {}.buttonStyle(GButtonStyle(variant: .ghost)) }
            row("Danger") { Button("Delete") {}.buttonStyle(GButtonStyle(variant: .danger)) }
            row("Destructive") { Button("Leave", role: .destructive) {}.buttonStyle(GButtonStyle(variant: .secondary)) }
            row("Close") { GCloseButton(title: "Close", onFrame: false) {} }
            row("Chips") { GPicker("", selection: .constant(1), options: [(1, "On"), (2, "Off")], style: .chips) }
            row("Menu") { GPicker("", selection: .constant(1), options: [(1, "Light"), (2, "Dark")]) }
            row("Switch") { Toggle("", isOn: .constant(true)).toggleStyle(GToggleStyle()).frame(width: 60) }
            row("Slider") { GSlider(value: .constant(0.5), in: 0...1).frame(width: 110) }
            row("Stepper") { GStepper("", value: .constant(3), in: 0...9) }
            row("Field") { Text("Florian").font(GFont.body).frame(width: 90, alignment: .leading).modifier(GFieldFrame()) }
            row("Sidebar") { GSidebarRow(title: "Privacy", symbol: "lock", selected: false).frame(width: 130) }
            row("Selected") { GSidebarRow(title: "Profile", symbol: "person", selected: true).frame(width: 130) }
            row("Menu line") { GMenuItem(title: "Reply", systemImage: "arrowshape.turn.up.left") {}.frame(width: 130) }
        }
        .environment(\.gFormLayout, true)
    }
}

/// The same controls in a window, to try with the real pointer: `swift run GabaritGallery --live`.
struct LiveSection: View {
    @State private var on = true
    @State private var chip = 1
    @State private var menu = 1
    @State private var value = 0.5
    @State private var count = 3
    @State private var text = "Florian"
    @State private var page = "Messages"

    var body: some View {
        HStack(spacing: 0) {
            VStack(spacing: 4) {
                ForEach(["Today", "Messages", "Spaces"], id: \.self) { name in
                    GRailItem(title: name, systemImage: "bubble.left", current: page == name) { page = name }
                }
                Spacer()
            }
            .padding(8).frame(width: 92).background(GFrameColor.ground)
            GForm {
                Section("Buttons") {
                    HStack {
                        Button("Save") {}.buttonStyle(GButtonStyle(variant: .primary))
                        Button("Reset") {}.buttonStyle(GButtonStyle(variant: .secondary))
                        Button("Later") {}.buttonStyle(GButtonStyle(variant: .ghost))
                        Button("Delete") {}.buttonStyle(GButtonStyle(variant: .danger))
                        GCloseButton(title: "Close", onFrame: false) {}
                    }
                    Button("A row of the card") {}
                }
                Section("Controls") {
                    Toggle("A switch", isOn: $on)
                    GPicker("Chips", selection: $chip, options: [(1, "One"), (2, "Two"), (3, "Three")], style: .chips)
                    GPicker("A menu", selection: $menu, options: [(1, "Light"), (2, "Dark")])
                    GSlider(value: $value, in: 0...1)
                    GStepper("A stepper", value: $count, in: 0...9)
                    TextField("A field", text: $text)
                }
                Section("Column") {
                    ForEach(["Profile", "Privacy"], id: \.self) { name in
                        Button {} label: { GSidebarRow(title: name, symbol: "person", selected: name == "Profile") }.buttonStyle(GLiveStyle())
                    }
                }
            }
        }
        .frame(width: 720, height: 640)
    }
}
