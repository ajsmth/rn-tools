package expo.modules.tabs

import android.content.Context
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
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class RNToolsTabsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var composeView: ComposeView

  val props = TabsProps()
  var tabViews: MutableList<ViewGroup> = mutableListOf()

  init {
    layoutParams = LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )

    composeView = ComposeView(context).apply {
      setContent {
        val navController = rememberNavController()

        Scaffold(
          bottomBar = {
            BottomNavigation {
              (0 until tabViews.size).forEach { index ->
                val route = index.toString()
                BottomNavigationItem(
                  icon = { /* you can supply an Icon here if you like */ },
                  label = { Text("Tab ${index + 1}") },
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
          NavHost(navController, startDestination = "0", modifier = Modifier.padding(innerPadding)) {
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
  }
}
