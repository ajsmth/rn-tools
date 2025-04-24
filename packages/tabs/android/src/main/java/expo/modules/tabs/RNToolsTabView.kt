package expo.modules.tabs

import android.content.Context
import android.view.ViewGroup
import androidx.compose.ui.platform.ComposeView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class RNToolsTabView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    private var composeView: ComposeView

    val props = TabProps()

    init {
        layoutParams = LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )

        composeView = ComposeView(context).apply {

        }

        addView(composeView)
    }
}
