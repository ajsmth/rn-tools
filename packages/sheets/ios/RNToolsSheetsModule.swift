import ExpoModulesCore

public class RNToolsSheetsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsSheets")

        View(RNToolsSheetsView.self) {
            Events("onDismiss", "onStateChange")

            Prop("snapPoints") { (view, snapPoints: [Int]) in
                view.props.snapPoints = snapPoints
            }

            Prop("isOpen") { (view, isOpen: Bool) in
                view.props.isOpen = isOpen
            }

            Prop("openToIndex") { (view, openToIndex: Int) in
                view.props.openToIndex = openToIndex
            }
            
            Prop("appearanceIOS") { (view, appearance: SheetAppearance) in
                view.props.grabberVisible = appearance.grabberVisible ?? true
                view.props.backgroundColor = appearance.backgroundColor
                view.props.cornerRadius = appearance.cornerRadius
            }
        }
    }
}
