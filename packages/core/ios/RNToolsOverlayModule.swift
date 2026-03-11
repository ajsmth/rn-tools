import ExpoModulesCore

public final class RNToolsOverlayModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsOverlay")
        View(RNToolsOverlayView.self) {
            Prop("contentHeight") { (view: RNToolsOverlayView, contentHeight: Double?) in
                view.setContentHeight(contentHeight)
            }

            Prop("offsetTop") { (view: RNToolsOverlayView, offsetTop: Double?) in
                view.setOffsetTop(offsetTop)
            }
        }
    }
}
