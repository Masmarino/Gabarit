import Foundation
import GabaritCommon
import Testing

struct GTokensTests {
    @Test func slate100IsSkollNs() {
        #expect(GPaletteValues.slate100 == GRGBA(hex: 0xE4E8ED))
    }

    @Test func rolesPointAtThePalette() {
        #expect(GColorValues.background.light == GPaletteValues.slate50)
        #expect(GColorValues.background.dark == GPaletteValues.graphite900)
        #expect(GColorValues.hover.light == GPaletteValues.slate900.opacity(0.07))
        #expect(GColorValues.frame.light == GColorValues.frame.dark)
    }

    @Test func textSizesAreSkollNs() {
        #expect(GTextStyles.title.desktop == 22)
        #expect(GTextStyles.title2.desktop == 17)
        #expect(GTextStyles.title3.desktop == 15)
        #expect(GTextStyles.subheadline.desktop == 11)
        #expect(GTextStyles.footnote.desktop == 10)
        #expect(GTextStyles.body.phone == 17)
    }

    /// The primary text reaches 7:1 on the background, in both appearances (as the web's contrast.spec.ts asks).
    @Test func primaryTextContrast() {
        for (text, ground) in [(GColorValues.textPrimary.light, GColorValues.background.light),
                               (GColorValues.textPrimary.dark, GColorValues.background.dark)] {
            #expect(ratio(text, ground) >= 7)
        }
    }

    private func ratio(_ a: GRGBA, _ b: GRGBA) -> Double {
        func luminance(_ c: GRGBA) -> Double {
            func channel(_ v: Double) -> Double { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
            return 0.2126 * channel(c.red) + 0.7152 * channel(c.green) + 0.0722 * channel(c.blue)
        }
        let (l1, l2) = (luminance(a), luminance(b))
        return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
    }
}

struct GCommandSearchTests {
    private let entries = [GCommandSearch.Entry(id: "1", label: "Réglages"), GCommandSearch.Entry(id: "2", label: "Messages", keywords: ["conversations"]),
                           GCommandSearch.Entry(id: "3", label: "Nouvelle conversation")]

    @Test func ignoresCaseAndAccents() {
        #expect(GCommandSearch.filter(entries, query: "reglages").map(\.id) == ["1"])
    }

    @Test func labelsStartingWithTheQueryComeFirst() {
        #expect(GCommandSearch.filter(entries, query: "conv").map(\.id) == ["3", "2"])
    }

    @Test func anEmptyQueryKeepsTheOrder() {
        #expect(GCommandSearch.filter(entries, query: " ", limit: 2).map(\.id) == ["1", "2"])
    }
}

@Suite struct GSymbolsTests {
    @Test func everySymbolHasACharacterUnderWinUI() {
        #expect(GSymbols.phosphor.keys.filter { GSymbols.glyph(for: $0) == nil }.isEmpty)
    }

    @Test func aFilledSymbolTakesTheFilledFont() {
        #expect(GSymbols.glyph(for: "bell")?.character == "\u{E0CE}")
        #expect(GSymbols.glyph(for: "lock.fill")?.font == GSymbols.fillFont)
        #expect(GSymbols.glyph(for: "lock")?.font == GSymbols.font)
    }
}
