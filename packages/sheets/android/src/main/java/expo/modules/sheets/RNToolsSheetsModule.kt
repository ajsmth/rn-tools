package expo.modules.sheets

import android.view.View
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNToolsSheetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsSheets")

    View(RNToolsSheetsView::class) {

      GroupView<RNToolsSheetsView> {
        AddChildView { parent, child: View, index ->
          parent.rootViewGroup.addView(child, index)
        }

        GetChildCount { parent ->
          return@GetChildCount parent.rootViewGroup.childCount
        }

        GetChildViewAt { parent, index ->
          parent.rootViewGroup.getChildAt(index)
        }

        RemoveChildView { parent, child: View ->
          parent.rootViewGroup.removeView(child)
        }

        RemoveChildViewAt { parent, index ->
          parent.rootViewGroup.removeViewAt(index)
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
