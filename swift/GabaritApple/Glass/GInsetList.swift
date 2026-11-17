#if canImport(SwiftUI)
import SwiftUI

/// A list with no lines (4.0): rows 2 points apart, rounded (`GRadius.row`), laid on the glass or the ground that holds
/// them; the chosen row in thick glass, a soft veil under the pointer. The same on the Mac and the iPhone. It does not
/// scroll by itself: put it in a `ScrollView` (or a glass panel) as needed.
public struct GInsetList<Data: RandomAccessCollection, Row: View>: View where Data.Element: Identifiable {
    let data: Data
    var selection: Binding<Data.Element.ID?>?
    @ViewBuilder let row: (Data.Element) -> Row

    /// `selection`: the chosen row, set by a click or a tap; nil: rows that are not chosen (a plain list).
    public init(_ data: Data, selection: Binding<Data.Element.ID?>? = nil, @ViewBuilder row: @escaping (Data.Element) -> Row) {
        self.data = data
        self.selection = selection
        self.row = row
    }

    public var body: some View {
        LazyVStack(spacing: 2) {
            ForEach(data) { element in
                let chosen = selection?.wrappedValue == element.id
                if let selection {
                    Button { selection.wrappedValue = element.id } label: {
                        GLive { hovering, pressed in
                            GInsetRow(chosen: chosen, hovering: hovering, pressed: pressed) { row(element) }
                        }
                    }
                    .buttonStyle(GLiveStyle())
                    .accessibilityAddTraits(chosen ? .isSelected : [])
                } else {
                    GInsetRow(chosen: false, hovering: false, pressed: false) { row(element) }
                }
            }
        }
    }
}

/// A row of an inset list: its padding, its rounded shape, the thick glass when chosen, the veil under the pointer.
public struct GInsetRow<Content: View>: View {
    let chosen: Bool
    let hovering: Bool
    let pressed: Bool
    @ViewBuilder let content: Content

    public init(chosen: Bool, hovering: Bool = false, pressed: Bool = false, @ViewBuilder content: () -> Content) {
        self.chosen = chosen
        self.hovering = hovering
        self.pressed = pressed
        self.content = content()
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.row, style: .continuous)
        content
            .foregroundStyle(.gInk)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .frame(maxWidth: .infinity, minHeight: GSidebarRow.height + 8, alignment: .leading)
            .contentShape(shape)
            .background {
                if !chosen {
                    shape.fill(pressed ? GColor.press : (hovering ? GColor.rowHover : Color.clear))
                }
            }
            .modifier(GChosenGlass(chosen: chosen, shape: shape))
            .gPressScale(pressed, to: 0.99)
    }
}

/// The chosen row's glass: thick, only when chosen.
private struct GChosenGlass<S: InsettableShape>: ViewModifier {
    let chosen: Bool
    let shape: S

    func body(content: Content) -> some View {
        if chosen { content.gGlass(.thick, in: shape) } else { content }
    }
}
#endif
