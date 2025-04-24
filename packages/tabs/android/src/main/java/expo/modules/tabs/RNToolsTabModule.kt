package expo.modules.tabs

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNToolsTabModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("RNToolsTab")

        View(RNToolsTabView::class) {
        }
    }
}
