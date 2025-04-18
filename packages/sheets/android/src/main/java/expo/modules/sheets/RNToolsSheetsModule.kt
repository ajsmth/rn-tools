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

      Events("onDismiss", "onStateChange")

      Prop("isOpen") { view: RNToolsSheetsView, isOpen: Boolean ->
        view.props.isOpen = isOpen
      }

      Prop("openToIndex") { view: RNToolsSheetsView, openToIndex: Int ->
        view.props.openToIndex = openToIndex
      }

      Prop("snapPoints") { view: RNToolsSheetsView, snapPoints: List<Int> ->
        view.props.snapPoints = snapPoints.map { view.convertToPx(it) }
      }

      Prop("appearanceAndroid") { view: RNToolsSheetsView, appearance: SheetAppearance ->
        view.props.dimAmount = appearance.dimAmount ?: 0.56f
        view.props.backgroundColor = appearance.backgroundColor
        view.props.cornerRadius = appearance.cornerRadius?.toFloat()
      }
    }
  }
}
