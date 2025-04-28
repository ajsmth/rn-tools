package expo.modules.tabs

import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.BottomNavigation
import androidx.compose.material.BottomNavigationItem
import androidx.compose.material.Scaffold
import androidx.compose.material.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.facebook.react.views.view.ReactViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class RNToolsTabsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var composeView: ComposeView

  override val shouldUseAndroidLayout: Boolean
    get() = true

  val props = TabsProps()
  var rootViewGroup = TabsRootView(context, appContext)
  var tabViews: MutableList<RNToolsTabScreen> = mutableListOf()

  init {

    composeView = ComposeView(context).apply {
      setContent {
        val navController = rememberNavController()

        Scaffold(
          bottomBar = {
            BottomNavigation {
              (0 until tabViews.size).forEach { index ->
                val route = index.toString()
                val tab = tabViews.get(index)

                BottomNavigationItem(
                  icon = { /* you can supply an Icon here if you like */ },
                  label = {
                    tab?.props?.label               // String?
                      ?.takeIf { it.isNotEmpty() }// still String?
                      ?.let { Text(it) }          // only runs when non-null / non-empty
                  },
                  selected = navController.currentDestination?.route == route,
                  onClick = {
                    if (navController.currentDestination?.route != route) {
                      navController.navigate(route) {
                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                      }
                    }
                  }
                )
              }
            }
          }
        ) { innerPadding ->
          NavHost(navController, startDestination = "0", modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            (0 until tabViews.size).forEach { index ->
              val route = index.toString()
              val childView = tabViews[index]
              composable(route) {
                AndroidView(
                  factory = { childView },
                  modifier = Modifier.fillMaxSize()
                )
              }
            }
          }
        }
      }
    }

    addView(composeView)
    requestLayout()
  }
}



class TabsRootView internal constructor(context: Context, appContext: AppContext) : ReactViewGroup(context) {

}
