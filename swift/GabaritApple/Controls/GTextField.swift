#if canImport(SwiftUI)
import SwiftUI

/// Gabarit's text field: a hollow of thin glass with no rim, rust when it has the focus (4.1); the title as the prompt.
public struct GTextFieldStyle: TextFieldStyle {
    /// In a Gabarit form, whose rows are in cards: no frame of its own (`GForm` sets it).
    var bare: Bool

    public init() { bare = false }
    init(bare: Bool) { self.bare = bare }

    // swiftlint:disable:next identifier_name
    public func _body(configuration: TextField<Self._Label>) -> some View {
        configuration.textFieldStyle(.plain).modifier(GFieldFrame(bare: bare))
    }
}

/// A field's frame (4.1): a hollow of thin glass (`gGlassHollow`), with no rim at rest; a capsule for a line of text, a
/// row's corners (`GRadius.row`) for a long text (`multiline`). The focus draws the accent's rim (3:1); more contrast, a
/// rim always (`GColor.border`). `bare` (a form card's row): none, the card is its frame (a frame in a frame), the row
/// its room, the text and the cursor what is seen.
public struct GFieldFrame: ViewModifier {
    var isBare: Bool
    var multiline: Bool
    @FocusState private var focused: Bool
    @State private var hovering = false
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.colorSchemeContrast) private var contrast
    @Environment(\.gPointerPreview) private var preview

    public nonisolated init(bare: Bool = false, multiline: Bool = false) {
        isBare = bare
        self.multiline = multiline
    }

    public func body(content: Content) -> some View {
        if isBare { bare(content) } else { framed(content) }
    }

    private func bare(_ content: Content) -> some View {
        content
            .font(GFont.body)
            .frame(maxWidth: .infinity, minHeight: GControlMetrics.height - 16, alignment: .leading)
            .opacity(isEnabled ? 1 : GOpacity.disabled)
    }

    private func framed(_ content: Content) -> some View {
        let shape = multiline ? AnyInsettableShape(RoundedRectangle(cornerRadius: GRadius.row, style: .continuous)) : AnyInsettableShape(Capsule())
        let rim = focused ? GColor.accent : contrast == .increased ? GColor.border : hovering || preview != nil ? GColor.border.opacity(0.35) : Color.clear
        return content
            .font(GFont.body)
            .focused($focused)
            .padding(.horizontal, multiline ? 12 : 14)
            .padding(.vertical, 6)
            .frame(minHeight: GControlMetrics.height)
            // A click on the padding too puts the cursor in the field (on the ground behind it: the field keeps its own
            // clicks).
            .background { shape.fill(Color.clear).contentShape(shape).onTapGesture { focused = true } }
            .gGlassHollow(in: shape)
            .overlay { shape.strokeBorder(rim, lineWidth: focused ? 1.5 : 1).allowsHitTesting(false) }
            .onHover { hovering = $0 }
            .opacity(isEnabled ? 1 : GOpacity.disabled)
            .animation(GAnimation.hover, value: focused)
    }
}

/// Any insettable shape (a field's capsule or its rounded rectangle).
struct AnyInsettableShape: InsettableShape {
    private let path: @Sendable (CGRect) -> Path
    private let inset: @Sendable (CGFloat) -> AnyInsettableShape

    init<S: InsettableShape>(_ shape: S) {
        path = { shape.path(in: $0) }
        inset = { AnyInsettableShape(shape.inset(by: $0)) }
    }

    func path(in rect: CGRect) -> Path { path(rect) }
    func inset(by amount: CGFloat) -> AnyInsettableShape { inset(amount) }
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
                .modifier(GFieldFrame(multiline: axis == .vertical))
        }
        .padding(.vertical, 2)
    }
}

public extension View {
    /// A long text (`TextEditor`) in Gabarit's field frame (except under a system `Form`).
    func gEditorFrame() -> some View {
        modifier(GEditorFrame())
    }

    /// The frame of a field laid right on a page, like the settings' fields: a capsule hollowed in thin glass, with no
    /// rim (4.1).
    func gFieldBox() -> some View {
        textFieldStyle(.plain)
            .gGlassHollow(in: Capsule())
    }
}

private struct GEditorFrame: ViewModifier {
    @Environment(\.gSystemControls) private var system

    func body(content: Content) -> some View {
        if system { content } else { content.modifier(GFieldFrame(multiline: true)) }
    }
}
#endif
