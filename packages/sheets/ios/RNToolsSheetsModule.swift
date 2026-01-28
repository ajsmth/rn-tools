import ExpoModulesCore

struct SheetAppearance: Record {
    @Field
    var grabberVisible: Bool?

    @Field
    var backgroundColor: String?

    @Field
    var cornerRadius: Float?
}

public class RNToolsSheetsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNToolsSheets")

        View(RNToolsSheetsView.self) {
            Events("onDismiss", "onStateChange", "onDismissPrevented")

            Prop("snapPoints") { (view, snapPoints: [CGFloat]) in
                view.updateSnapPoints(snapPoints)
            }

            Prop("isOpen") { (view, isOpen: Bool) in
                view.updateIsOpen(isOpen)
            }

            Prop("initialIndex") { (view, initialIndex: Int) in
                view.updateInitialIndex(initialIndex)
            }

            Prop("appearanceIOS") { (view, appearance: SheetAppearance) in
                view.updateAppearance(
                    grabberVisible: appearance.grabberVisible ?? true,
                    backgroundColor: appearance.backgroundColor,
                    cornerRadius: appearance.cornerRadius
                )
            }

            Prop("canDismiss") { (view, canDismiss: Bool) in
                view.updateCanDismiss(canDismiss)
            }
        }
    }
}
