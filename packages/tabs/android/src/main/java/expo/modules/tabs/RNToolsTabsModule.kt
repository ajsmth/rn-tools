package expo.modules.tabs

import android.view.View
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNToolsTabsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsTabs")

    View(RNToolsTabsView::class) {
      GroupView<RNToolsTabsView> {
          AddChildView { parent, child: View, index ->

              if (child is RNToolsTabScreen) {
                  parent.tabViews.add(index, child)
              } else {
                  parent.rootViewGroup.addView(child, index)
              }
          }

          GetChildCount { parent ->
              return@GetChildCount parent.tabViews.size + parent.rootViewGroup.childCount
          }

          GetChildViewAt { parent, index ->
              parent.tabViews[index]
          }

          RemoveChildView { parent, child: View ->
              parent.tabViews.remove(child)
          }

          RemoveChildViewAt { parent, index ->
              parent.tabViews.removeAt(index)
          }
      }
    }
  }
}
