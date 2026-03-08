import ExpoModulesCore

public final class RNToolsOverlayModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsOverlay")
        View(RNToolsOverlayView.self) {}
    }
}
