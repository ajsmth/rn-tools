//package expo.modules.sheets
//
//import android.content.Context
//import android.view.View
//import android.view.ViewGroup
//import android.widget.FrameLayout
//import androidx.compose.ui.platform.ComposeView
//import expo.modules.kotlin.AppContext
//import expo.modules.kotlin.viewevent.EventDispatcher
//import expo.modules.kotlin.views.ExpoView
//
//class JetpackSheetView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
//    val onDismiss by EventDispatcher()
//    var rootViewGroup = SheetRootView(context, appContext)
//    private lateinit var composeView: ComposeView
//
//    val props = SheetProps()
//
//    init {
//        layoutParams = LayoutParams(
//            ViewGroup.LayoutParams.MATCH_PARENT,
//            ViewGroup.LayoutParams.MATCH_PARENT
//        )
//
//        props.rootViewGroup = rootViewGroup
//
//        composeView = ComposeView(context).apply {
//            setContent {
//                SheetView(props)
//            }
//        }
//
//        addView(composeView)
//    }
//
//    override fun setId(id: Int) {
//        super.setId(id)
//        rootViewGroup.id = id
//    }
//
//
////  fun hideSheet() {
////  }
////
////  fun showSheet() {
////    (rootViewGroup.parent as? ViewGroup)?.removeView(rootViewGroup)
////
////      val frameLayout = FrameLayout(context)
////      frameLayout.addView(rootViewGroup)
////  }
//}
