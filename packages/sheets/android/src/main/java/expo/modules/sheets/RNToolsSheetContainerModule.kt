package expo.modules.sheets

import android.view.ViewGroup
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class RNToolsSheetContainerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsSheetContainer")

    View(RNToolsSheetContainerView::class) {
    }
  }
}
