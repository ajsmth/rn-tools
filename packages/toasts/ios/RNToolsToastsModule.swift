import ExpoModulesCore

public class RNToolsToastsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsToasts")

        View(RNToolsToastsView.self) {
            Prop("isVisible") { (view: RNToolsToastsView, isVisible: Bool) in
                view.updateIsVisible(isVisible)
            }

            Prop("debugLayout") { (view: RNToolsToastsView, debugLayout: Bool?) in
                view.updateDebugLayout(debugLayout ?? false)
            }
        }
    }
}
