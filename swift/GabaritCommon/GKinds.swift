/// Gabarit's buttons: ink (primary), fine frame (secondary), no ground (ghost), red (danger).
public enum GButtonVariant: Sendable { case primary, secondary, ghost, danger }

/// The states (success, warning, error, information), rather than the system's colours.
public enum GTone: Sendable, CaseIterable { case success, warning, error, info }

/// How a choice shows: a menu (the current choice in a field, the list in a bubble), or chips side by side.
public enum GPickerStyle: Sendable { case menu, chips }
