package expo.modules.tabs

import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNToolsTabsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RNToolsTabs")

    View(RNToolsTabsView::class) {
      GroupView<RNToolsTabsView> {
        AddChildView { parent, child: View, index ->
          parent.tabViews.add(index, child as ViewGroup)
        }

        GetChildCount { parent ->
          return@GetChildCount parent.tabViews.size
        }

        GetChildViewAt { parent, index ->
          parent.tabViews.get(index)
        }

        RemoveChildView { parent, child: View ->
          parent.tabViews.remove(child as ViewGroup)
        }

        RemoveChildViewAt { parent, index ->
          parent.tabViews.removeAt(index)
        }
      }
    }
  }
}
