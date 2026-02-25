import ExpoModulesCore

public class RNToolsNotificationsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsNotifications")

        View(RNToolsNotificationsView.self) {
            Prop("debugLayout") { (view: RNToolsNotificationsView, debugLayout: Bool?) in
                view.updateDebugLayout(debugLayout ?? false)
            }
        }
    }
}
