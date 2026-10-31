#if canImport(SwiftUI)
import SwiftUI

/// A choice among options, its value and its name: the title on the left, Gabarit's menu or chips on the right.
public struct GPicker<Value: Hashable>: View {
    let title: String
    @Binding var selection: Value
    let options: [(value: Value, title: String)]
    var style: GPickerStyle
    /// A sentence under the title, like a switch's.
    var detail: String?

    public init(_ title: String, selection: Binding<Value>, options: [(Value, String)], style: GPickerStyle = .menu,
                detail: String? = nil) {
        self.title = title
        _selection = selection
        self.options = options.map { (value: $0.0, title: $0.1) }
        self.style = style
        self.detail = detail
    }

    @Environment(\.gSystemControls) private var system

    public var body: some View {
        if system {
            Picker(title, selection: $selection) {
                ForEach(options, id: \.value) { Text($0.title).tag($0.value) }
            }
        } else {
            gabarit
        }
    }

    private var gabarit: some View {
        HStack(alignment: .center, spacing: 12) {
            if !title.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    // Said by the menu or the chips' group, not twice.
                    Text(title).font(GFont.body).foregroundStyle(GColor.textPrimary).accessibilityHidden(true)
                    if let detail {
                        Text(detail).font(GFont.caption).foregroundStyle(GColor.textDiscret).fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 12)
            }
            switch style {
            case .menu: GMenuField(title: title, selection: $selection, options: options)
            case .chips: GChips(selection: $selection, options: options)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
    }
}

/// A choice's face: the current choice in a field, the two arrows on the right.
private struct GMenuFace: View {
    let title: String
    var active = false
    @ScaledMetric(relativeTo: .body) private var chevron: CGFloat = 10
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.colorSchemeContrast) private var contrast

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous)
        HStack(spacing: 8) {
            Text(title).font(GFont.body).foregroundStyle(GColor.textPrimary).lineLimit(1)
            Image(systemName: "chevron.up.chevron.down")
                .font(.system(size: chevron, weight: .semibold))
                .foregroundStyle(GColor.textDiscret)
        }
        .padding(.leading, 10).padding(.trailing, 8)
        .frame(minHeight: GControlMetrics.compact)
        .background(active ? GColor.hover : Color.clear, in: shape)
        .background(GColor.background, in: shape)
        .overlay { shape.strokeBorder(active ? GColor.accent : GColor.controlRim(contrast), lineWidth: active ? 1.5 : 1) }
        .contentShape(shape)
        .opacity(isEnabled ? 1 : GOpacity.disabled)
    }
}

#if os(iOS)
/// On iPhone and iPad: Gabarit's face, and the list in the system's menu (under the finger, where it belongs).
private struct GMenuField<Value: Hashable>: View {
    let title: String
    @Binding var selection: Value
    let options: [(value: Value, title: String)]

    var body: some View {
        Menu {
            Picker("", selection: $selection) {
                ForEach(options, id: \.value) { option in Text(option.title).tag(option.value) }
            }
        } label: {
            GMenuFace(title: options.first { $0.value == selection }?.title ?? "—")
                .gTouchTarget(height: GControlMetrics.compact)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityValue(options.first { $0.value == selection }?.title ?? "")
    }
}
#else
/// The current choice in a Gabarit field; the list opens in a bubble, the current choice ticked in rust.
private struct GMenuField<Value: Hashable>: View {
    let title: String
    @Binding var selection: Value
    let options: [(value: Value, title: String)]
    @State private var open = false
    @State private var hovering = false
    /// The line the arrows point at in the open list (Return chooses it).
    @State private var highlighted: Int?
    @FocusState private var listFocused: Bool
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button { open.toggle() } label: {
            GMenuFace(title: options.first { $0.value == selection }?.title ?? "—", active: hovering || open)
        }
        .buttonStyle(.plain)
        .onHover { hovering = $0 }
        .gPointer()
        // As the Mac's pop-up button: the arrows change the choice with the menu closed.
        .onKeyPress(.upArrow) { move(-1); return .handled }
        .onKeyPress(.downArrow) { move(1); return .handled }
        .accessibilityLabel(title)
        .accessibilityValue(options.first { $0.value == selection }?.title ?? "")
        .popover(isPresented: $open, arrowEdge: .bottom) {
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(Array(options.enumerated()), id: \.element.value) { index, option in
                        if index > 0 { Rectangle().fill(GColor.hairline).frame(height: 1) }
                        GMenuRow(title: option.title, checked: option.value == selection, highlighted: highlighted == index) {
                            choose(option.value)
                        }
                    }
                }
            }
            .scrollBounceBehavior(.basedOnSize)
            // The keyboard in the list: the arrows move, Return chooses, Escape closes (the bubble's own).
            .focusable()
            .focusEffectDisabled()
            .focused($listFocused)
            .onAppear {
                highlighted = options.firstIndex { $0.value == selection }
                listFocused = true
            }
            .onKeyPress(.downArrow) { highlight(1); return .handled }
            .onKeyPress(.upArrow) { highlight(-1); return .handled }
            .onKeyPress(.return) {
                if let highlighted { choose(options[highlighted].value) }
                return .handled
            }
            .frame(minWidth: 220, maxHeight: 340)
            .fixedSize(horizontal: false, vertical: options.count <= 8)
            .background(GColor.surface)
            // The bubble is a window of its own: it takes the appearance of the view that opens it.
            .preferredColorScheme(colorScheme)
        }
    }

    private func move(_ offset: Int) {
        guard let index = options.firstIndex(where: { $0.value == selection }) else { return }
        selection = options[min(max(index + offset, 0), options.count - 1)].value
    }

    private func highlight(_ offset: Int) {
        guard !options.isEmpty else { return }
        highlighted = min(max((highlighted ?? -1) + offset, 0), options.count - 1)
    }

    private func choose(_ value: Value) {
        selection = value
        open = false
    }
}

/// A line of a choice's list: its name, a rust tick if it is the current choice, the veil on hover.
private struct GMenuRow: View {
    let title: String
    let checked: Bool
    var highlighted = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            GHover { hovering in row(hovering || highlighted) }
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(checked ? .isSelected : [])
    }

    private func row(_ hovering: Bool) -> some View {
        HStack(spacing: 10) {
            Text(title).font(GFont.body.weight(checked ? .semibold : .regular)).foregroundStyle(GColor.textPrimary)
            Spacer(minLength: 16)
            Image(systemName: "checkmark").font(GFont.subheadline.weight(.semibold)).foregroundStyle(GColor.accent)
                .opacity(checked ? 1 : 0)
        }
        .padding(.horizontal, 14).padding(.vertical, 9)
        .background(hovering ? GColor.hover : Color.clear)
        .contentShape(Rectangle())
    }
}
#endif

/// Chips side by side: the current choice tinted rust, the others on the ground.
private struct GChips<Value: Hashable>: View {
    @Binding var selection: Value
    let options: [(value: Value, title: String)]
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: 6) {
            ForEach(options, id: \.value) { option in
                let current = option.value == selection
                let shape = RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous)
                Button { gWithAnimation(.snappy(duration: 0.15), reduceMotion: reduceMotion) { selection = option.value } } label: {
                    GHover { hovering in
                        Text(option.title)
                            .font(GFont.callout.weight(current ? .semibold : .medium))
                            .foregroundStyle(current ? GColor.accentText : (hovering ? GColor.textPrimary : GColor.textSecondary))
                            .padding(.horizontal, 12)
                            .frame(minHeight: GControlMetrics.compact)
                            .background(current ? GColor.selectedFill : (hovering ? GColor.hover : GColor.background), in: shape)
                            .overlay { shape.strokeBorder(current ? GColor.accent.opacity(0.7) : (hovering ? GColor.border.opacity(0.5) : GColor.hairline), lineWidth: 1) }
                            .contentShape(shape)
                            .gTouchTarget(height: GControlMetrics.compact)
                    }
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(current ? .isSelected : [])
            }
        }
        .gDimmedWhenDisabled()
        .fixedSize()
    }
}
#endif
