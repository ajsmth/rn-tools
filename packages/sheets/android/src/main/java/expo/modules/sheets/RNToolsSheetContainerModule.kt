package expo.modules.sheets

import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class RNToolsSheetContainerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsSheetContainer")

    Events("onDismiss")


    View(RNToolsSheetContainerView::class) {}
  }
}
