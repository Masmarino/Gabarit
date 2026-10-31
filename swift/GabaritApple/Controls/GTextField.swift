#if canImport(SwiftUI)
import SwiftUI

/// Gabarit's text field: the ground, a fine rim, rust when it has the focus; the title as the prompt.
public struct GTextFieldStyle: TextFieldStyle {
    public init() {}

    // swiftlint:disable:next identifier_name
    public func _body(configuration: TextField<Self._Label>) -> some View {
        configuration.textFieldStyle(.plain).modifier(GFieldFrame())
    }
}

/// A field's frame (text, long text): ground, rim, rust when it has the focus.
public struct GFieldFrame: ViewModifier {
    @FocusState private var focused: Bool
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.colorSchemeContrast) private var contrast

    public nonisolated init() {}

    public func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous)
        content
            .font(GFont.body)
            .focused($focused)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .frame(minHeight: GControlMetrics.height)
            .background(GColor.background, in: shape)
            .overlay { shape.strokeBorder(focused ? GColor.accent : GColor.controlRim(contrast), lineWidth: focused ? 1.5 : 1) }
            // A click on the padding too puts the cursor in the field.
            .contentShape(shape)
            .onTapGesture { focused = true }
            .opacity(isEnabled ? 1 : GOpacity.disabled)
            .animation(GAnimation.hover, value: focused)
    }
}

/// A Gabarit text field with its title: the title above (small, discreet) and the field below, full width, `prompt`
/// as the placeholder.
public struct GTextField: View {
    let title: String
    @Binding var text: String
    var prompt: String?
    var axis: Axis

    public init(_ title: String, text: Binding<String>, prompt: String? = nil, axis: Axis = .horizontal) {
        self.title = title
        _text = text
        self.prompt = prompt
        self.axis = axis
    }

    @Environment(\.gSystemControls) private var system

    public var body: some View {
        if system {
            TextField(title, text: $text, prompt: prompt.map { Text($0) }, axis: axis)
        } else {
            framed
        }
    }

    private var framed: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Said once, by the field below.
            Text(title).font(GFont.caption.weight(.semibold)).foregroundStyle(GColor.textSecondary)
                .accessibilityHidden(true)
            // No placeholder by default: the title is already above the field.
            TextField(title, text: $text, prompt: Text(prompt ?? "").foregroundStyle(GColor.textDiscret), axis: axis)
                .labelsHidden()
                .textFieldStyle(.plain)
                .modifier(GFieldFrame())
        }
        .padding(.vertical, 2)
    }
}

public extension View {
    /// A long text (`TextEditor`) in Gabarit's field frame (except under a system `Form`).
    func gEditorFrame() -> some View {
        modifier(GEditorFrame())
    }

    /// The frame of a field laid right on a page, like the settings' fields: a soft-cornered rectangle, the surface, a
    /// fine line.
    func gFieldBox() -> some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.md, style: .continuous)
        return textFieldStyle(.plain)
            .background(GColor.surface, in: shape)
            .overlay { shape.strokeBorder(GColor.hairline, lineWidth: 1) }
    }
}

private struct GEditorFrame: ViewModifier {
    @Environment(\.gSystemControls) private var system

    func body(content: Content) -> some View {
        if system { content } else { content.modifier(GFieldFrame()) }
    }
}
#endif
