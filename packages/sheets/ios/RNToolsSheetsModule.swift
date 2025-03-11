import ExpoModulesCore

public class RNToolsSheetsModule: Module {
  public func definition() -> ModuleDefinition {
   Name("RNToolsSheets")
    
    
   View(RNToolsSheetsView.self) {
     Events("onDismiss")

     Prop("isVisible") { (view, isVisible: Bool) in
       view.props.isVisible = isVisible
     }
   }
  }
}
