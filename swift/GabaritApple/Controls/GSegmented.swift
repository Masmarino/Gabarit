#if canImport(SwiftUI)
import SwiftUI

/// A segmented control (4.1): a track of liquid glass, the current segment under a lens of liquid glass that slides from
/// one segment to the next on the bouncy spring (at once when the system asks for reduced motion). A page's tabs
/// (`GNavTabs`) are drawn so too.
public struct GSegmentedControl<Value: Hashable>: View {
    @Binding var selection: Value
    let options: [(value: Value, title: String)]
    var label: String

    /// `label`: what a screen reader calls the whole.
    public init(_ label: String = "", selection: Binding<Value>, options: [(Value, String)]) {
        self.label = label
        _selection = selection
        self.options = options.map { (value: $0.0, title: $0.1) }
    }

    public var body: some View {
        GLensSegments(items: options.map(\.value), title: { value in options.first { $0.value == value }?.title ?? "" },
                      selection: $selection)
            .accessibilityLabel(label)
    }
}

/// The track, its segments and the lens; shared by `GSegmentedControl` and `GNavTabs`.
struct GLensSegments<Value: Hashable>: View {
    let items: [Value]
    let title: (Value) -> String
    @Binding var selection: Value
    var fill = false
    @Namespace private var lens
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: 0) {
            ForEach(items, id: \.self) { item in
                let current = item == selection
                Button { gWithAnimation(GAnimation.bouncy, reduceMotion: reduceMotion) { selection = item } } label: {
                    GLive { hovering, pressed in
                        Text(title(item))
                            .font(GFont.callout.weight(current ? .semibold : .medium))
                            .foregroundStyle(current || hovering ? AnyShapeStyle(.gInk) : AnyShapeStyle(.gInk2))
                            .lineLimit(1)
                            .padding(.horizontal, 14)
                            .frame(maxWidth: fill ? .infinity : nil, minHeight: GControlMetrics.compact - 4)
                            .background {
                                if current {
                                    Capsule().fill(Color.white.opacity(0.0001))
                                        .gLiquidControl(hovering: hovering, pressed: pressed)
                                        .matchedGeometryEffect(id: "lens", in: lens)
                                } else if hovering {
                                    Capsule().fill(GColor.hover)
                                }
                            }
                            .contentShape(Capsule())
                            .gTouchTarget(height: GControlMetrics.compact - 4)
                    }
                }
                .buttonStyle(GLiveStyle())
                .accessibilityAddTraits(current ? .isSelected : [])
            }
        }
        .padding(2)
        // The track: thin liquid glass, still.
        .gLiquidGlass(interactive: false, thin: true)
        .fixedSize(horizontal: !fill, vertical: true)
        .gDimmedWhenDisabled()
        .accessibilityElement(children: .contain)
    }
}
#endif
