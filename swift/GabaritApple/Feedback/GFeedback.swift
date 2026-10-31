#if canImport(SwiftUI)
import SwiftUI

public extension GTone {
    /// A solid ground in this state (a filled button, a dot): a step darker for errors in light, so white text reads.
    var fill: Color {
        switch self {
        case .error: GTone.errorFill
        default: base
        }
    }

    private static let errorFill = Color(GColorPair(light: GPaletteValues.red700, dark: GPaletteValues.red400))

    /// This state's text on the page (a message under a field): a step darker in light, for a 4.5:1 contrast at least.
    var text: Color {
        switch self {
        case .success: GColor.successText
        case .warning: GColor.warningText
        case .error: GColor.errorText
        case .info: GColor.infoText
        }
    }

    /// A readable text on this state's tint (a badge's label): darker in light, lighter in dark.
    var tintText: Color {
        switch self {
        case .success: GColor.successOnTint
        case .warning: GColor.warningOnTint
        case .error: GColor.errorOnTint
        case .info: GColor.infoOnTint
        }
    }
}

/// A small label: a state's tint, or the hover's veil with no state.
public struct GBadge: View {
    let title: String
    let systemImage: String?
    let tone: GTone?

    public init(_ title: String, systemImage: String? = nil, tone: GTone? = nil) {
        self.title = title
        self.systemImage = systemImage
        self.tone = tone
    }

    public var body: some View {
        Group {
            if let systemImage { Label(title, systemImage: systemImage) } else { Text(title) }
        }
        .font(GFont.caption2.weight(.semibold))
        .foregroundStyle(tone?.tintText ?? GColor.textSecondary)
        .padding(.horizontal, GSpacing.xs)
        .padding(.vertical, GSpacing.xxs / 2)
        .background(tone?.tint ?? GColor.hover, in: .rect(cornerRadius: GRadius.sm))
    }
}

/// An empty page: an icon in a framed square, a title, a sentence, and what to do (a primary button).
public struct GEmptyState: View {
    let systemImage: String
    let title: String
    let message: String
    let actionTitle: String?
    let actionSystemImage: String?
    let action: (() -> Void)?
    @ScaledMetric(relativeTo: .title3) private var glyph: CGFloat = 32
    @ScaledMetric(relativeTo: .title3) private var square: CGFloat = 80

    public init(systemImage: String, title: String, message: String, actionTitle: String? = nil,
                actionSystemImage: String? = nil, action: (() -> Void)? = nil) {
        self.systemImage = systemImage
        self.title = title
        self.message = message
        self.actionTitle = actionTitle
        self.actionSystemImage = actionSystemImage
        self.action = action
    }

    public var body: some View {
        VStack(spacing: GSpacing.xl) {
            Image(systemName: systemImage)
                .font(.system(size: glyph, weight: .light))
                .foregroundStyle(GColor.textSecondary)
                .frame(width: square, height: square)
                .gSurface(RoundedRectangle(cornerRadius: GRadius.lg, style: .continuous))
                .accessibilityHidden(true)
            VStack(spacing: GSpacing.xs) {
                Text(title).font(GFont.title3).foregroundStyle(GColor.textPrimary)
                    .accessibilityAddTraits(.isHeader)
                Text(message).font(GFont.subheadline).foregroundStyle(GColor.textSecondary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 320)
            }
            if let actionTitle, let action {
                Button(action: action) {
                    if let actionSystemImage { Label(actionTitle, systemImage: actionSystemImage) } else { Text(actionTitle) }
                }
                .buttonStyle(GButtonStyle(variant: .primary))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// A placeholder while content loads: a soft shape with a slow shimmer (still when motion is reduced).
public struct GSkeleton: View {
    var height: CGFloat
    var cornerRadius: CGFloat
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private static let shimmer: TimeInterval = 1.4

    public init(height: CGFloat = 20, cornerRadius: CGFloat = GRadius.sm) {
        self.height = height
        self.cornerRadius = cornerRadius
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        shape
            .fill(GColor.track)
            .overlay {
                if !reduceMotion {
                    // 30 frames a second are enough for a slow shimmer (not the screen's 120).
                    TimelineView(.animation(minimumInterval: 1 / 30)) { timeline in
                        GeometryReader { geometry in
                            LinearGradient(colors: [.clear, GColor.surface.opacity(0.6), .clear], startPoint: .leading, endPoint: .trailing)
                                .frame(width: geometry.size.width * 0.6)
                                .offset(x: Self.phase(at: timeline.date) * geometry.size.width * 1.4)
                        }
                    }
                }
            }
            .clipShape(shape)
            .frame(height: height)
            .accessibilityHidden(true)
    }

    private static func phase(at date: Date) -> CGFloat {
        let t = date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: shimmer) / shimmer
        return CGFloat(1 - 2 * t)
    }
}

/// Three dots that wave while an answer is being written. `label`: what a screen reader says.
public struct GTypingDots: View {
    let label: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(label: String) {
        self.label = label
    }

    public var body: some View {
        // With reduced motion, the dots stay still (the label still says it).
        TimelineView(.animation(minimumInterval: 1 / 30, paused: reduceMotion)) { context in
            let t = reduceMotion ? 0 : context.date.timeIntervalSinceReferenceDate
            HStack(spacing: 4) {
                ForEach(0..<3) { i in
                    let wave = (sin(t * 6 - Double(i) * 0.9) + 1) / 2
                    Circle()
                        .fill(GColor.accent.opacity(0.35 + 0.65 * wave))
                        .frame(width: 6, height: 6)
                        .offset(y: -3 * wave)
                }
            }
        }
        .frame(height: 12)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
    }
}

// MARK: Toasts

/// A passing message: a sentence and its icon.
public struct GToast: Identifiable, Equatable, Sendable {
    public let id = UUID()
    public let text: String
    public let systemImage: String

    public init(_ text: String, systemImage: String) {
        self.text = text
        self.systemImage = systemImage
    }
}

/// The passing messages of a window: one at a time, gone after a few seconds. Shown by `gToastOverlay(_:)`.
@MainActor @Observable
public final class GToastCenter {
    public private(set) var current: GToast?
    private var dismissal: Task<Void, Never>?

    public init() {}

    public func show(_ text: String, systemImage: String, for duration: Duration = .seconds(2.5)) {
        dismissal?.cancel()
        current = GToast(text, systemImage: systemImage)
        // Said by screen readers too, as soon as it shows.
        AccessibilityNotification.Announcement(text).post()
        dismissal = Task { [weak self] in
            try? await Task.sleep(for: duration)
            guard !Task.isCancelled else { return }
            self?.current = nil
        }
    }

    public func dismiss() {
        dismissal?.cancel()
        current = nil
    }
}

public extension View {
    /// The center's passing message, at the bottom of this view: the ink of a primary button, a floating shadow.
    func gToastOverlay(_ center: GToastCenter) -> some View {
        modifier(GToastOverlay(center: center))
    }
}

private struct GToastOverlay: ViewModifier {
    let center: GToastCenter
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .bottom) {
                if let toast = center.current {
                    Label(toast.text, systemImage: toast.systemImage)
                        .font(GFont.subheadline.weight(.medium))
                        .foregroundStyle(GColor.onPrimary)
                        .padding(.horizontal, GSpacing.lg)
                        .padding(.vertical, GSpacing.sm)
                        .background(GColor.primary, in: .rect(cornerRadius: GRadius.md))
                        .gShadow(GShadowValues.floating)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .padding(.bottom, GSpacing.xxl)
                }
            }
            .animation(reduceMotion ? nil : GAnimation.bouncy, value: center.current)
    }
}

// MARK: Alert, drawer

public extension View {
    /// A plain alert for an error message: the title, the message, "OK". It shows while `message` is set.
    func gErrorAlert(_ title: String, message: Binding<String?>) -> some View {
        alert(title, isPresented: Binding(get: { message.wrappedValue != nil }, set: { if !$0 { message.wrappedValue = nil } })) {
            Button(gText("OK"), role: .cancel) { message.wrappedValue = nil }
        } message: {
            Text(message.wrappedValue ?? "")
        }
    }

    /// A drawer sliding in from the leading edge (iPhone, iPad), over a dimmed page: a swipe from the edge opens it, a
    /// swipe back or a tap on the page closes it.
    func gSideDrawer<Drawer: View>(isPresented: Binding<Bool>, @ViewBuilder drawer: () -> Drawer) -> some View {
        modifier(GSideDrawer(isPresented: isPresented, drawer: drawer()))
    }
}

private struct GSideDrawer<Drawer: View>: ViewModifier {
    @Binding var isPresented: Bool
    let drawer: Drawer
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dragged: CGFloat?
    private let widthFraction: CGFloat = 0.85
    private let maxWidth: CGFloat = 340
    private let edge: CGFloat = 18

    func body(content: Content) -> some View {
        content.overlay {
            GeometryReader { proxy in
                let width = min(proxy.size.width * widthFraction, maxWidth)
                let offset = dragged ?? (isPresented ? 0 : -width)
                let progress = width > 0 ? max(0, min(1, (offset + width) / width)) : (isPresented ? 1 : 0)
                ZStack(alignment: .leading) {
                    Color.black.opacity(0.35 * progress)
                        .ignoresSafeArea()
                        .onTapGesture { set(false) }
                        .allowsHitTesting(isPresented)
                        .accessibilityAddTraits(.isButton)
                        .accessibilityLabel(gText("Close"))
                        .accessibilityHidden(!isPresented)
                    drawer
                        .frame(width: width)
                        .frame(maxHeight: .infinity)
                        .background(GColor.surface)
                        .overlay(alignment: .trailing) { Rectangle().fill(GColor.hairline).frame(width: 1) }
                        .offset(x: offset)
                        // Horizontal drags only: a list in the drawer keeps its vertical scroll.
                        .simultaneousGesture(DragGesture(minimumDistance: 10)
                            .onChanged { drag in
                                guard dragged != nil || abs(drag.translation.width) > abs(drag.translation.height) else { return }
                                dragged = min(0, max(-width, drag.translation.width))
                            }
                            .onEnded { end in
                                guard dragged != nil else { return }
                                let closes = end.translation.width < -width * 0.3 || end.predictedEndTranslation.width < -width * 0.5
                                closes ? set(false) : cancel()
                            })
                        .allowsHitTesting(isPresented)
                        .accessibilityHidden(!isPresented)
                        .accessibilityAddTraits(isPresented ? .isModal : [])
                        .accessibilityAction(.escape) { set(false) }
                    if !isPresented {
                        Color.clear
                            .frame(width: edge)
                            .frame(maxHeight: .infinity)
                            .contentShape(Rectangle())
                            // A horizontal swipe from the edge, not a vertical scroll that starts there.
                            .gesture(DragGesture(minimumDistance: 10)
                                .onChanged { drag in
                                    guard drag.translation.width > abs(drag.translation.height) else { return }
                                    dragged = -width + min(width, drag.translation.width)
                                }
                                .onEnded { end in
                                    guard dragged != nil else { return }
                                    let opens = end.translation.width > width * 0.3 || end.predictedEndTranslation.width > width * 0.5
                                    opens ? set(true) : cancel()
                                })
                    }
                }
            }
            .ignoresSafeArea()
        }
    }

    private func set(_ presented: Bool) {
        withAnimation(reduceMotion ? nil : GAnimation.smooth) {
            isPresented = presented
            dragged = nil
        }
    }

    private func cancel() {
        withAnimation(reduceMotion ? nil : GAnimation.bouncy) { dragged = nil }
    }
}
#endif
