package expo.modules.tabs

import android.view.View
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNToolsTabScreenModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("RNToolsTabScreen")

        View(RNToolsTabScreen::class) {
            GroupView<RNToolsTabScreen> {
                AddChildView { parent, child: View, index ->
                   parent.addView(child, index)
                }

                GetChildCount { parent ->
                    return@GetChildCount parent.childCount
                }

                GetChildViewAt { parent, index ->
                    parent.getChildAt(index)
                }

                RemoveChildView { parent, child: View ->
                    parent.removeView(child)
                }

                RemoveChildViewAt { parent, index ->
                    parent.removeViewAt(index)
                }
            }


            Prop("label") { view: RNToolsTabScreen, label: String ->
                view.props.label = label
            }
        }
    }
}
