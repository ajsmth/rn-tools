import ExpoModulesCore

public class RNToolsToastsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsToasts")

        View(RNToolsToastsView.self) {
            Events("onShown", "onDismissed")

            Prop("isVisible") { (view, isVisible: Bool) in
                view.updateIsVisible(isVisible)
            }

            Prop("position") { (view, position: String) in
                view.updatePosition(position)
            }

            Prop("duration") { (view, duration: Double) in
                view.updateDuration(duration)
            }
        }
    }
}
