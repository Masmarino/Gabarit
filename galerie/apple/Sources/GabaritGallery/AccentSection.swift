import GabaritApple
import SwiftUI

// An ambiance's own accent (4.2): what follows it under a ground that brings one (the dore ambiance) — the primary
// buttons and the prominent glass, the chips, the chosen tab, the links, the focus ring, the switches and the slider, the
// selection. On a ground with none, Gabarit's rust, unchanged.

struct AccentSection: View {
    @State private var on = true
    @State private var size = 1
    @State private var tab = "messages"
    @State private var rail = true
    @State private var value = 0.6
    @State private var name = "Florian"

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Accent").font(GFont.title2).foregroundStyle(.gInk)
            Text("The ground's own accent: the primary buttons, the chips, the chosen tab, the links, the focus ring.")
                .font(GFont.callout).foregroundStyle(.gInk2)
            HStack(spacing: 10) {
                Button("Primary") {}.buttonStyle(.gGlassProminent)
                Button("Secondary") {}.buttonStyle(.gGlass)
                Button("4.0 primary") {}.buttonStyle(GButtonStyle(variant: .primary, material: .solid))
                GRoundButton(systemImage: "mic.fill", title: "Speak", prominent: true) {}
                Spacer(minLength: 0)
            }
            GPicker("Size", selection: $size, options: [(0, "Small"), (1, "Medium"), (2, "Large")], style: .chips)
            HStack(spacing: 18) {
                Toggle("Notifications", isOn: $on).toggleStyle(GToggleStyle())
                GSlider(value: $value, in: 0...1).frame(width: 200)
            }
            VStack(alignment: .leading, spacing: 6) {
                Text("Focused field").font(GFont.caption.weight(.semibold)).foregroundStyle(.gInk2)
                // The focus ring as GFieldFrame draws it (the accent, 1.5 points): a capture cannot hold the focus.
                Text(name).frame(maxWidth: .infinity, alignment: .leading).foregroundStyle(.gInk)
                    .modifier(GFieldFrame())
                    .overlay { Capsule().strokeBorder(.gAccent, lineWidth: 1.5).allowsHitTesting(false) }
            }
            HStack(spacing: 18) {
                Button("A link in the accent") {}.buttonStyle(GFormRowButtonStyle()).fixedSize()
                Text("Text in the accent").font(GFont.body.weight(.semibold)).foregroundStyle(.gAccentText)
                Spacer(minLength: 0)
            }
            HStack(alignment: .top, spacing: 18) {
                VStack(spacing: 6) {
                    GRailItem(title: "Messages", systemImage: "bubble.left.and.bubble.right", current: true, badge: 4) {}
                    GRailItem(title: "Spaces", systemImage: "square.grid.2x2", current: false) {}
                }
                .frame(width: 84)
                VStack(alignment: .leading, spacing: 2) {
                    GSidebarRow(title: "Profile", symbol: "person.crop.circle", selected: true)
                        .background(.gSelectedFill, in: RoundedRectangle(cornerRadius: GRadius.sm))
                    GSidebarRow(title: "Notifications", symbol: "bell", selected: false, detail: "12")
                }
                .frame(width: 240)
            }
            GTabBar(tabs: [GTab(id: "today", title: "Today", systemImage: "sun.max"),
                           GTab(id: "messages", title: "Messages", systemImage: "bubble.left.and.bubble.right", badge: 2),
                           GTab(id: "spaces", title: "Spaces", systemImage: "square.grid.2x2")],
                    selection: $tab)
                .frame(width: 420)
        }
        .padding(24)
        .gSurface(RoundedRectangle(cornerRadius: GRadius.glass, style: .continuous))
    }
}
