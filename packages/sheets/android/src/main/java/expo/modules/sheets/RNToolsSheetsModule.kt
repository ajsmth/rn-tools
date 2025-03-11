package expo.modules.sheets

import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class RNToolsSheetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsSheets")

    Events("onDismiss")


    View(RNToolsSheetsView::class) {
      Prop("isVisible") { view: RNToolsSheetsView, isVisible: Boolean ->
        view.props.isVisible = isVisible

        if (isVisible) {
          view.showSheet()
        } else {
        }
      }
    }
  }
}
