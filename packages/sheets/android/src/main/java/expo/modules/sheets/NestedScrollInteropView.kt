package expo.modules.sheets

import android.annotation.SuppressLint
import android.content.Context
import android.util.AttributeSet
import android.view.View
import androidx.appcompat.widget.ContentFrameLayout
import androidx.compose.ui.input.nestedscroll.NestedScrollDispatcher
import androidx.core.view.NestedScrollingParent3
import androidx.core.view.NestedScrollingChild3
import androidx.core.view.ViewCompat
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.viewinterop.AndroidView

// A custom ViewGroup that forwards nested scrolling to Compose
@SuppressLint("RestrictedApi")
class NestedScrollInteropView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : ContentFrameLayout(context, attrs),  NestedScrollingParent3 {

    var nestedScrollDispatcher: NestedScrollDispatcher? = null

    override fun onNestedScrollAccepted(child: View, target: View, axes: Int, type: Int) {}
    override fun onStopNestedScroll(target: View, type: Int) {}
    override fun onStartNestedScroll(child: View, target: View, axes: Int, type: Int) = true
    override fun onNestedScroll(
        target: View, dxConsumed: Int, dyConsumed: Int,
        dxUnconsumed: Int, dyUnconsumed: Int, type: Int, consumed: IntArray
    ) {
        // Forward scrolling delta to Compose dispatcher
        nestedScrollDispatcher?.dispatchPostScroll(
            consumed = androidx.compose.ui.geometry.Offset.Zero,
            available = androidx.compose.ui.geometry.Offset(0f, -dyUnconsumed.toFloat()),
            source = androidx.compose.ui.input.nestedscroll.NestedScrollSource.Drag
        )
    }

    override fun getNestedScrollAxes(): Int {
        TODO("Not yet implemented")
    }

    override fun onNestedPreScroll(target: View, dx: Int, dy: Int, consumed: IntArray) {
        TODO("Not yet implemented")
    }

    override fun onNestedScroll(
        target: View,
        dxConsumed: Int,
        dyConsumed: Int,
        dxUnconsumed: Int,
        dyUnconsumed: Int
    ) {
        TODO("Not yet implemented")
    }

    override fun onNestedScroll(
        target: View,
        dxConsumed: Int,
        dyConsumed: Int,
        dxUnconsumed: Int,
        dyUnconsumed: Int,
        type: Int
    ) {
        TODO("Not yet implemented")
    }

    override fun onStartNestedScroll(child: View, target: View, axes: Int): Boolean {
        return axes and ViewCompat.SCROLL_AXIS_VERTICAL != 0
    }

    override fun onNestedScrollAccepted(child: View, target: View, axes: Int) {
        TODO("Not yet implemented")
    }

    override fun onStopNestedScroll(target: View) {
        TODO("Not yet implemented")
    }

    override fun onNestedPreScroll(
        target: View, dx: Int, dy: Int, consumed: IntArray, type: Int
    ) {
        val offset = nestedScrollDispatcher?.dispatchPreScroll(
            available = androidx.compose.ui.geometry.Offset(0f, -dy.toFloat()),
            source = androidx.compose.ui.input.nestedscroll.NestedScrollSource.Drag
        ) ?: androidx.compose.ui.geometry.Offset.Zero
        consumed[1] = -offset.y.toInt()
    }

    override fun onNestedFling(target: View, velocityX: Float, velocityY: Float, consumed: Boolean) = false
    override fun onNestedPreFling(target: View, velocityX: Float, velocityY: Float) = false
}