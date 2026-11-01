#if canImport(SwiftUI)
import SwiftUI

/// Gabarit's slider: a thin track, the filled part in rust, a white knob with a rim.
/// `label`: what a screen reader calls it (the row's title); `format`: how it says the value (a percentage by default).
public struct GSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    var step: Double?
    var label: String?
    var format: ((Double) -> String)?

    public init(value: Binding<Double>, in range: ClosedRange<Double>, step: Double? = nil, label: String? = nil,
                format: ((Double) -> String)? = nil) {
        _value = value
        self.range = range
        self.step = step
        self.label = label
        self.format = format
    }

    @Environment(\.gSystemControls) private var system

    public var body: some View {
        if system {
            Group {
                if let step {
                    Slider(value: $value, in: range, step: step).tint(GColor.accent)
                } else {
                    Slider(value: $value, in: range).tint(GColor.accent)
                }
            }
            .accessibilityLabel(label ?? "")
        } else {
            GSliderTrack(value: $value, range: range, step: step, label: label, format: format)
        }
    }
}

private struct GSliderTrack: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double?
    let label: String?
    let format: ((Double) -> String)?
    @Environment(\.isEnabled) private var isEnabled
    @State private var dragging = false

    private var fraction: Double {
        guard range.upperBound > range.lowerBound else { return 0 }
        return min(max((value - range.lowerBound) / (range.upperBound - range.lowerBound), 0), 1)
    }

    var body: some View {
        GeometryReader { geometry in
            #if os(macOS)
            let knob: CGFloat = 16
            #else
            let knob: CGFloat = 24
            #endif
            let width = max(geometry.size.width - knob, 1)
            ZStack(alignment: .leading) {
                Capsule().fill(GColor.track.gHollow(0.1)).frame(height: 4).padding(.horizontal, knob / 2)
                Capsule().fill(GColor.accent).frame(width: knob / 2 + width * fraction, height: 4).padding(.leading, knob / 2).gGlow(radius: 3)
                GKnob()
                    .overlay { Circle().strokeBorder(dragging ? GColor.accent : GColor.border.opacity(0.5), lineWidth: 1) }
                    .shadow(color: .black.opacity(0.15), radius: 1.5, y: 1)
                    .frame(width: knob, height: knob)
                    .offset(x: width * fraction)
            }
            .frame(maxHeight: .infinity)
            .contentShape(Rectangle())
            // On a touch screen, a short distance first: a vertical scroll that starts on it stays a scroll.
            .gesture(DragGesture(minimumDistance: GSliderTrack.dragStart)
                .onChanged { drag in
                    dragging = true
                    set(Double((drag.location.x - knob / 2) / width))
                }
                .onEnded { _ in dragging = false })
        }
        .frame(height: GControlMetrics.compact - 8)
        .gTouchTarget(height: GControlMetrics.compact - 8)
        .frame(minWidth: 120)
        .opacity(isEnabled ? 1 : GOpacity.disabled)
        // The keyboard: Tab reaches it, the arrows move it a step (a twentieth with no step).
        .focusable(isEnabled)
        .onKeyPress(.leftArrow) { nudge(-1); return .handled }
        .onKeyPress(.rightArrow) { nudge(1); return .handled }
        .onKeyPress(.downArrow) { nudge(-1); return .handled }
        .onKeyPress(.upArrow) { nudge(1); return .handled }
        .accessibilityElement()
        .accessibilityLabel(label ?? "")
        .accessibilityValue(format?(value) ?? fraction.formatted(.percent.precision(.fractionLength(0))))
        .accessibilityAdjustableAction { direction in nudge(direction == .increment ? 1 : -1) }
    }

    #if os(macOS)
    private static let dragStart: CGFloat = 0
    #else
    private static let dragStart: CGFloat = 2
    #endif

    private func nudge(_ steps: Double) {
        let unit = step ?? (range.upperBound - range.lowerBound) / 20
        value = min(max(value + steps * unit, range.lowerBound), range.upperBound)
    }

    private func set(_ fraction: Double) {
        var next = range.lowerBound + min(max(fraction, 0), 1) * (range.upperBound - range.lowerBound)
        if let step, step > 0 { next = range.lowerBound + ((next - range.lowerBound) / step).rounded() * step }
        value = min(max(next, range.lowerBound), range.upperBound)
    }
}

/// A number to raise or lower: two Gabarit buttons on either side of the value.
public struct GStepper: View {
    let title: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    @ScaledMetric(relativeTo: .body) private var glyph: CGFloat = 11

    public init(_ title: String, value: Binding<Int>, in range: ClosedRange<Int>) {
        self.title = title
        _value = value
        self.range = range
    }

    @Environment(\.gSystemControls) private var system

    public var body: some View {
        if system {
            Stepper(value: $value, in: range) { LabeledContent(title, value: value, format: .number) }
        } else {
            gabarit
        }
    }

    private var gabarit: some View {
        HStack(spacing: 12) {
            Text(title).font(GFont.body).foregroundStyle(GColor.textPrimary)
            Spacer(minLength: 12)
            let shape = RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous)
            HStack(spacing: 0) {
                step("minus", by: -1).disabled(value <= range.lowerBound)
                Rectangle().fill(GColor.hairline).frame(width: 1)
                Text(value, format: .number).font(GFont.body.monospacedDigit()).foregroundStyle(GColor.textPrimary)
                    .frame(minWidth: 40)
                Rectangle().fill(GColor.hairline).frame(width: 1)
                step("plus", by: 1).disabled(value >= range.upperBound)
            }
            .frame(minHeight: GControlMetrics.compact)
            .background(GColor.background, in: shape)
            .overlay { shape.strokeBorder(GColor.hairline, lineWidth: 1) }
            .gRaised(shape)
            .clipShape(shape)
            .fixedSize()
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityValue(value.formatted())
        .accessibilityAdjustableAction { direction in
            value = min(max(value + (direction == .increment ? 1 : -1), range.lowerBound), range.upperBound)
        }
    }

    private func step(_ symbol: String, by delta: Int) -> some View {
        Button { value = min(max(value + delta, range.lowerBound), range.upperBound) } label: {
            Image(systemName: symbol).font(.system(size: glyph, weight: .semibold)).foregroundStyle(GColor.textPrimary)
                .frame(width: GControlMetrics.compact + 8, height: GControlMetrics.compact)
                .contentShape(Rectangle())
                .gTouchTarget(height: GControlMetrics.compact)
        }
        .buttonStyle(GPressStyle())
    }
}
#endif
