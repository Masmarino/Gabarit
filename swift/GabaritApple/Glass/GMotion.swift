#if canImport(SwiftUI)
import SwiftUI

// The motion (4.0): a page comes in fading and rising a little (`GAnimation.page`, `GAnimationValues.pageRise`), a
// ground fades into the next (`GAnimation.ground`, 450 ms), a tile grows into the page it opens (`GAnimation.shared`).
// When the system asks for reduced motion, only the fades stay.

public extension AnyTransition {
    /// A page: fades in rising `pageRise` points, fades out. `reduceMotion`: the fade alone.
    static func gPage(reduceMotion: Bool = false) -> AnyTransition {
        let fade = AnyTransition.opacity
        let rise = reduceMotion ? fade : fade.combined(with: .offset(y: GAnimationValues.pageRise))
        return .asymmetric(insertion: rise, removal: fade).animation(GAnimation.page)
    }

    /// A page, with motion.
    static var gPage: AnyTransition { gPage() }

    /// A ground into the next: a fade of 450 ms.
    static var gGround: AnyTransition { AnyTransition.opacity.animation(GAnimation.ground) }
}

public extension View {
    /// Comes in as a page when it first shows (a fade and a short rise), each time `value` changes too.
    func gPageAppear<V: Equatable>(value: V) -> some View {
        modifier(GPageAppear(value: value))
    }

    /// Comes in as a page when it first shows.
    func gPageAppear() -> some View {
        modifier(GPageAppear(value: 0))
    }

    /// The tile a page grows from (`gSharedDestination`): the same `id` in the same namespace.
    func gSharedSource<ID: Hashable>(id: ID, in namespace: Namespace.ID) -> some View {
        matchedTransitionSource(id: id, in: namespace)
    }

    /// A page pushed in a navigation stack that grows from its tile (`gSharedSource`); on the Mac, which has no zoom,
    /// the page comes in as any page.
    @ViewBuilder func gSharedDestination<ID: Hashable>(id: ID, in namespace: Namespace.ID) -> some View {
        #if os(iOS)
        navigationTransition(.zoom(sourceID: id, in: namespace))
        #else
        gPageAppear()
        #endif
    }
}

private struct GPageAppear<V: Equatable>: ViewModifier {
    let value: V
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .opacity(shown ? 1 : 0)
            .offset(y: shown || reduceMotion ? 0 : GAnimationValues.pageRise)
            .onAppear { reveal() }
            .onChange(of: value) {
                // Hidden at once, then shown again on the next turn: otherwise both would land in the same frame.
                var hide = Transaction()
                hide.disablesAnimations = true
                withTransaction(hide) { shown = false }
                Task { @MainActor in reveal() }
            }
    }

    private func reveal() {
        withAnimation(reduceMotion ? GAnimation.quick : GAnimation.page) { shown = true }
    }
}
#endif
