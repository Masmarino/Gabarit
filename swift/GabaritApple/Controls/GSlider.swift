#if canImport(SwiftUI)
import SwiftUI

/// Gabarit's slider: a thin track, the filled part in rust, a white knob with a rim.
public struct GSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    var step: Double?

    public init(value: Binding<Double>, in range: ClosedRange<Double>, step: Double? = nil) {
        _value = value
        self.range = range
        self.step = step
    }

    @Environment(\.gSystemControls) private var system

    public var body: some View {
        if system {
            if let step {
                Slider(value: $value, in: range, step: step).tint(GColor.accent)
            } else {
                Slider(value: $value, in: range).tint(GColor.accent)
            }
        } else {
            GSliderTrack(value: $value, range: range, step: step)
        }
    }
}

private struct GSliderTrack: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double?
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
                Capsule().fill(GColor.track).frame(height: 4).padding(.horizontal, knob / 2)
                Capsule().fill(GColor.accent).frame(width: knob / 2 + width * fraction, height: 4).padding(.leading, knob / 2)
                Circle().fill(.white)
                    .overlay { Circle().strokeBorder(dragging ? GColor.accent : GColor.border.opacity(0.5), lineWidth: 1) }
                    .shadow(color: .black.opacity(0.15), radius: 1.5, y: 1)
                    .frame(width: knob, height: knob)
                    .offset(x: width * fraction)
            }
            .frame(maxHeight: .infinity)
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0)
                .onChanged { drag in
                    dragging = true
                    set(Double((drag.location.x - knob / 2) / width))
                }
                .onEnded { _ in dragging = false })
        }
        .frame(height: GControlMetrics.compact - 8)
        .frame(minWidth: 120)
        .opacity(isEnabled ? 1 : 0.45)
        // The keyboard: Tab reaches it, the arrows move it a step (a twentieth with no step).
        .focusable(isEnabled)
        .onKeyPress(.leftArrow) { nudge(-1); return .handled }
        .onKeyPress(.rightArrow) { nudge(1); return .handled }
        .onKeyPress(.downArrow) { nudge(-1); return .handled }
        .onKeyPress(.upArrow) { nudge(1); return .handled }
        .accessibilityElement()
        .accessibilityValue("\(Int((fraction * 100).rounded())) %")
        .accessibilityAdjustableAction { direction in nudge(direction == .increment ? 1 : -1) }
    }

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

    public init(_ title: String, value: Binding<Int>, in range: ClosedRange<Int>) {
        self.title = title
        _value = value
        self.range = range
    }

    @Environment(\.gSystemControls) private var system

    public var body: some View {
        if system {
            Stepper("\(title) : \(value)", value: $value, in: range)
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
                Text("\(value)").font(GFont.body.monospacedDigit()).foregroundStyle(GColor.textPrimary)
                    .frame(minWidth: 40)
                Rectangle().fill(GColor.hairline).frame(width: 1)
                step("plus", by: 1).disabled(value >= range.upperBound)
            }
            .frame(height: GControlMetrics.compact)
            .background(GColor.background, in: shape)
            .overlay { shape.strokeBorder(GColor.hairline, lineWidth: 1) }
            .clipShape(shape)
            .fixedSize()
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityValue("\(value)")
        .accessibilityAdjustableAction { direction in
            value = min(max(value + (direction == .increment ? 1 : -1), range.lowerBound), range.upperBound)
        }
    }

    private func step(_ symbol: String, by delta: Int) -> some View {
        Button { value = min(max(value + delta, range.lowerBound), range.upperBound) } label: {
            Image(systemName: symbol).font(.system(size: 11, weight: .semibold)).foregroundStyle(GColor.textPrimary)
                .frame(width: GControlMetrics.compact + 8, height: GControlMetrics.compact)
                .contentShape(Rectangle())
        }
        .buttonStyle(GPressStyle())
    }
}
#endif
