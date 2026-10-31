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
                    Text("state").font(GFont.caption).padding(6).foregroundStyle(tone.base).background(tone.tint, in: Capsule())
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
            card(header: "Messages", footer: "Muted conversations never ring.") {
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
    private func card<Rows: View>(header: String, footer: String, @ViewBuilder rows: () -> Rows) -> some View {
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
