package expo.modules.rntoolscore

import android.view.View
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNToolsOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsOverlay")

    View(RNToolsOverlayView::class) {
      GroupView<RNToolsOverlayView> {
        AddChildView { parent, child: View, index ->
          parent.rootViewGroup.addView(child, index)
        }

        GetChildCount { parent ->
          parent.rootViewGroup.childCount
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

      Prop("contentHeight") { view: RNToolsOverlayView, contentHeight: Float ->
        view.setContentHeight(contentHeight)
      }

      Prop("offsetTop") { view: RNToolsOverlayView, offsetTop: Float ->
        view.setOffsetTop(offsetTop)
      }
    }
  }
}
