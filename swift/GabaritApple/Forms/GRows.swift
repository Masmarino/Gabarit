#if canImport(SwiftUI)
import SwiftUI

/// A section in a column (the Mac's left column, an iPhone list): a monochrome icon and its name, at a constant height;
/// the chosen section on a soft ground, in rust; the others, the veil on hover. `warns`: a warning dot on the right.
public struct GSidebarRow: View {
    let title: String
    let symbol: String
    let selected: Bool
    var warns: Bool
    /// A number or a value, discreet on the right (a filter's lines).
    var detail: String?
    @State private var hovering = false

    #if os(macOS)
    public static let height: CGFloat = 28
    #else
    public static let height: CGFloat = 40
    #endif
    public static var selectedFill: Color { GSidebarRowFill.selected }
    /// A section's name: discreet in the Mac's column, plain in an iPhone list.
    #if os(macOS)
    public static var text: Color { GColor.textSecondary }
    #else
    public static var text: Color { GColor.textPrimary }
    #endif
    /// The hover: far more discreet than the selection (half Gabarit's veil), so they are never mistaken.
    public static var hoverFill: Color { GColor.rowHover }

    public init(title: String, symbol: String, selected: Bool, warns: Bool = false, detail: String? = nil) {
        self.title = title
        self.symbol = symbol
        self.selected = selected
        self.warns = warns
        self.detail = detail
    }

    public var body: some View {
        HStack(spacing: 10) {
            GSidebarIcon(symbol: symbol, selected: selected)
            Text(title)
                .font(GFont.body.weight(selected ? .semibold : .regular))
                .foregroundStyle(selected ? GColor.accentText : Self.text)
                .lineLimit(1)
            Spacer(minLength: 4)
            if let detail {
                Text(detail).font(GFont.callout.monospacedDigit())
                    .foregroundStyle(selected ? GColor.accentText : GColor.textDiscret)
            }
            if warns { Circle().fill(GColor.warning).frame(width: 6, height: 6).accessibilityLabel(gText("Needs attention")) }
        }
        .padding(.horizontal, 10)
        .frame(height: GSidebarRow.height)
        .contentShape(Rectangle())
        .gTouchTarget(height: GSidebarRow.height)
        .background {
            RoundedRectangle(cornerRadius: GRadius.md, style: .continuous)
                .fill(selected ? Self.selectedFill : (hovering ? Self.hoverFill : Color.clear))
        }
        .onHover { hovering = $0 }
        .gPointer()
        .animation(.easeOut(duration: 0.12), value: hovering)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

/// A section's icon: the symbol as a stroke (no fill), in a box of the same size for all, so the names line up.
public struct GSidebarIcon: View {
    let symbol: String
    var selected: Bool
    #if os(macOS)
    public static let glyph = CGSize(width: 18, height: 15)
    #else
    public static let glyph = CGSize(width: 20, height: 17)
    #endif

    public init(symbol: String, selected: Bool = false) {
        self.symbol = symbol
        self.selected = selected
    }

    public var body: some View {
        Image(systemName: symbol.hasSuffix(".fill") ? String(symbol.dropLast(5)) : symbol)
            .resizable()
            .symbolRenderingMode(.monochrome)
            .scaledToFit()
            .symbolVariant(.none)
            .fontWeight(selected ? .semibold : .regular)
            .frame(maxWidth: Self.glyph.width, maxHeight: Self.glyph.height)
            .frame(width: Self.glyph.width + 2, height: Self.glyph.width + 2)
            .foregroundStyle(selected ? GColor.accent : GColor.textDiscret)
            .accessibilityHidden(true)
    }
}

/// A button in the left column: like a section, the icon in the same column.
public struct GSidebarLabelStyle: LabelStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 10) {
            configuration.icon.font(.system(size: 13)).frame(width: 20)
            configuration.title.lineLimit(1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10)
        .frame(height: GSidebarRow.height)
        .contentShape(Rectangle())
    }
}

/// The side columns' selection, on iPhone and iPad too.
public enum GSidebarRowFill {
    public static var selected: Color { GColor.selectedFill }
}

/// A clickable row's hover (Mac): a soft veil with rounded corners. In a form's card, the card draws it centred in the
/// row's cell (`GFormCardRow`), the same everywhere; elsewhere, a little wider than the row.
public struct GRowHover: ViewModifier {
    var enabled: Bool
    /// Out of a card: how far the veil spills out of the row, left and right (half that at top and bottom).
    var outset: CGFloat
    @State private var hovering = false
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.gFormCardRow) private var inCard

    public init(enabled: Bool = true, outset: CGFloat = 8) {
        self.enabled = enabled
        self.outset = outset
    }

    public func body(content: Content) -> some View {
        let lit = hovering && enabled && isEnabled
        content
            #if os(macOS)
            .background {
                if !inCard {
                    RoundedRectangle(cornerRadius: GRadius.md, style: .continuous)
                        .fill(GSidebarRow.hoverFill)
                        .padding(.horizontal, -outset).padding(.vertical, -outset / 2)
                        .opacity(lit ? 1 : 0)
                }
            }
            .preference(key: GRowLitKey.self, value: lit)
            .onHover { hovering = $0 }
            .gPointer()
            .animation(.easeOut(duration: 0.12), value: hovering)
            #endif
    }
}

/// A hovered row, passed up to the card that draws it.
public struct GRowLitKey: PreferenceKey {
    public static let defaultValue = false
    public static func reduce(value: inout Bool, nextValue: () -> Bool) { value = value || nextValue() }
}

/// A card's row (Mac): the hover veil, rounded, centred in its cell, inset from the card's edges and its lines (the
/// same in every card).
public struct GFormCardRow<Row: View>: View {
    @ViewBuilder let row: Row
    @State private var lit = false

    public init(@ViewBuilder row: () -> Row) {
        self.row = row()
    }

    public var body: some View {
        row
            .environment(\.gFormCardRow, true)
            .onPreferenceChange(GRowLitKey.self) { lit = $0 }
            .background {
                RoundedRectangle(cornerRadius: GRadius.md, style: .continuous)
                    .fill(GSidebarRow.hoverFill)
                    .padding(.horizontal, 8).padding(.vertical, 5)
                    .opacity(lit ? 1 : 0)
            }
            .animation(.easeOut(duration: 0.12), value: lit)
    }
}
#endif
