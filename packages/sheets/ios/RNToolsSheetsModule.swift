import ExpoModulesCore

public class RNToolsSheetsModule: Module {
  public func definition() -> ModuleDefinition {
   Name("RNToolsSheets")
    
    
   View(RNToolsSheetsView.self) {
     Events("onDismiss")
     
     Prop("snapPoints") { (view, snapPoints: [Int]) in
       view.props.snapPoints = snapPoints
     }

     Prop("isVisible") { (view, isVisible: Bool) in
       view.props.isVisible = isVisible
     }
   }
  }
}
