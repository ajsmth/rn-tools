import ExpoModulesCore

public class RNToolsToastsTopLaneModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsToastsTopLane")
        View(RNToolsToastsTopLaneView.self) {}
    }
}

public class RNToolsToastsBottomLaneModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsToastsBottomLane")
        View(RNToolsToastsBottomLaneView.self) {}
    }
}
