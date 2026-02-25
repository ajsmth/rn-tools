import ExpoModulesCore

public class RNToolsNotificationsTopLaneModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsNotificationsTopLane")
        View(RNToolsNotificationsTopLaneView.self) {}
    }
}

public class RNToolsNotificationsBottomLaneModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsNotificationsBottomLane")
        View(RNToolsNotificationsBottomLaneView.self) {}
    }
}
