package expo.modules.sheets

import android.view.View
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class RNToolsSheetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsSheets")

    View(RNToolsSheetsView::class) {

      GroupView<RNToolsSheetsView> {
        AddChildView { parent, child: View, index ->
          parent.addView(child, index)
        }
      }

      Events("onDismiss")

      Prop("isVisible") { view: RNToolsSheetsView, isVisible: Boolean ->
        if (isVisible) {
          view.showSheet()
        } else {
          view.hideSheet()
        }
      }
    }
  }
}
