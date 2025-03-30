// File copied from Compose Foundation 1.7.0
/*
 * Copyright 2022 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

@file:OptIn(ExperimentalFoundationApi::class)

package expo.modules.sheets.androidx.compose.foundation.gestures

import android.util.Log
import com.composables.core.androidx.collection.MutableObjectFloatMap
import com.composables.core.androidx.collection.ObjectFloatMap
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.AnimationState
import androidx.compose.animation.core.DecayAnimationSpec
import androidx.compose.animation.core.animate
import androidx.compose.animation.core.animateDecay
import androidx.compose.animation.core.calculateTargetValue
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.MutatePriority
import androidx.compose.foundation.MutatorMutex
import androidx.compose.foundation.OverscrollEffect
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.offset
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.structuralEqualityPolicy
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.requireLayoutDirection
import androidx.compose.ui.platform.InspectorInfo
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.Velocity
import com.composables.core.androidx.annotation.FloatRange
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sign
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

/**
 * Enable drag gestures between a set of predefined values.
 *
 * When a drag is detected, the offset of the [UnstyledAnchoredDraggableState] will be updated with the drag
 * delta. You should use this offset to move your content accordingly (see [Modifier.offset]).
 * When the drag ends, the offset will be animated to one of the anchors and when that anchor is
 * reached, the value of the [UnstyledAnchoredDraggableState] will also be updated to the value
 * corresponding to the new anchor.
 *
 * Dragging is constrained between the minimum and maximum anchors.
 *
 * @param state The associated [UnstyledAnchoredDraggableState].
 * @param reverseDirection Whether to reverse the direction of the drag, so a top to bottom
 * drag will behave like bottom to top, and a left to right drag will behave like right to left. If
 * not specified, this will be determined based on [orientation] and [LocalLayoutDirection].
 * @param orientation The orientation in which the [unstyledAnchoredDraggable] can be dragged.
 * @param enabled Whether this [unstyledAnchoredDraggable] is enabled and should react to the user's input.
 * @param interactionSource Optional [MutableInteractionSource] that will passed on to
 * the internal [Modifier.draggable].
 * @param overscrollEffect optional effect to dispatch any excess delta or velocity to. The excess
 * delta or velocity are a result of dragging/flinging and reaching the bounds. If you provide an
 * [overscrollEffect], make sure to apply [androidx.compose.foundation.overscroll] to render the
 * effect as well.
 * @param startDragImmediately when set to false, [draggable] will start dragging only when the
 * gesture crosses the touchSlop. This is useful to prevent users from "catching" an animating
 * widget when pressing on it. See [draggable] to learn more about startDragImmediately.
 */

fun <T> Modifier.unstyledAnchoredDraggable(
    state: UnstyledAnchoredDraggableState<T>,
    reverseDirection: Boolean,
    orientation: Orientation,
    enabled: Boolean = true,
    interactionSource: MutableInteractionSource? = null,
//    overscrollEffect: OverscrollEffect? = null,
    startDragImmediately: Boolean = state.isAnimationRunning
): Modifier = this then AnchoredDraggableElement(
    state = state,
    orientation = orientation,
    enabled = enabled,
    reverseDirection = reverseDirection,
    interactionSource = interactionSource,
    overscrollEffect = null,
    startDragImmediately = startDragImmediately
)

/**
 * Enable drag gestures between a set of predefined values.
 *
 * When a drag is detected, the offset of the [UnstyledAnchoredDraggableState] will be updated with the drag
 * delta. If the [orientation] is set to [Orientation.Horizontal] and [LocalLayoutDirection]'s
 * value is [LayoutDirection.Rtl], the drag deltas will be reversed.
 * You should use this offset to move your content accordingly (see [Modifier.offset]).
 * When the drag ends, the offset will be animated to one of the anchors and when that anchor is
 * reached, the value of the [UnstyledAnchoredDraggableState] will also be updated to the value
 * corresponding to the new anchor.
 *
 * Dragging is constrained between the minimum and maximum anchors.
 *
 * @param state The associated [UnstyledAnchoredDraggableState].
 * @param orientation The orientation in which the [unstyledAnchoredDraggable] can be dragged.
 * @param enabled Whether this [unstyledAnchoredDraggable] is enabled and should react to the user's input.
 * @param interactionSource Optional [MutableInteractionSource] that will passed on to
 * the internal [Modifier.draggable].
 * @param overscrollEffect optional effect to dispatch any excess delta or velocity to. The excess
 * delta or velocity are a result of dragging/flinging and reaching the bounds. If you provide an
 * [overscrollEffect], make sure to apply [androidx.compose.foundation.overscroll] to render the
 * effect as well.
 * @param startDragImmediately when set to false, [draggable] will start dragging only when the
 * gesture crosses the touchSlop. This is useful to prevent users from "catching" an animating
 * widget when pressing on it. See [draggable] to learn more about startDragImmediately.
 */

internal fun <T> Modifier.unstyledAnchoredDraggable(
    state: UnstyledAnchoredDraggableState<T>,
    orientation: Orientation,
    enabled: Boolean = true,
    interactionSource: MutableInteractionSource? = null,
    overscrollEffect: OverscrollEffect? = null,
    startDragImmediately: Boolean = state.isAnimationRunning
): Modifier {
    return this then AnchoredDraggableElement(
        state = state,
        orientation = orientation,
        enabled = enabled,
        reverseDirection = null,
        interactionSource = interactionSource,
        overscrollEffect = overscrollEffect,
        startDragImmediately = startDragImmediately,
    )
}

private class AnchoredDraggableElement<T>(
    private val state: UnstyledAnchoredDraggableState<T>,
    private val orientation: Orientation,
    private val enabled: Boolean,
    private val reverseDirection: Boolean?,
    private val interactionSource: MutableInteractionSource?,
    private val startDragImmediately: Boolean,
    private val overscrollEffect: OverscrollEffect?,
) : ModifierNodeElement<AnchoredDraggableNode<T>>() {
    override fun create() = AnchoredDraggableNode(
        state,
        orientation,
        enabled,
        reverseDirection,
        interactionSource,
        overscrollEffect,
        startDragImmediately,
    )

    override fun update(node: AnchoredDraggableNode<T>) {
        node.update(
            state,
            orientation,
            enabled,
            reverseDirection,
            interactionSource,
            overscrollEffect,
            startDragImmediately
        )
    }

    override fun hashCode(): Int {
        var result = state.hashCode()
        result = 31 * result + orientation.hashCode()
        result = 31 * result + enabled.hashCode()
        result = 31 * result + reverseDirection.hashCode()
        result = 31 * result + interactionSource.hashCode()
        result = 31 * result + startDragImmediately.hashCode()
        result = 31 * result + overscrollEffect.hashCode()
        return result
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true

        if (other !is AnchoredDraggableElement<*>) return false

        if (state != other.state) return false
        if (orientation != other.orientation) return false
        if (enabled != other.enabled) return false
        if (reverseDirection != other.reverseDirection) return false
        if (interactionSource != other.interactionSource) return false
        if (startDragImmediately != other.startDragImmediately) return false
        if (overscrollEffect != other.overscrollEffect) return false

        return true
    }

    override fun InspectorInfo.inspectableProperties() {
        name = "anchoredDraggable"
        properties["state"] = state
        properties["orientation"] = orientation
        properties["enabled"] = enabled
        properties["reverseDirection"] = reverseDirection
        properties["interactionSource"] = interactionSource
        properties["startDragImmediately"] = startDragImmediately
        properties["overscrollEffect"] = overscrollEffect
    }
}

@OptIn(ExperimentalFoundationApi::class)
private class AnchoredDraggableNode<T>(
    private var state: UnstyledAnchoredDraggableState<T>,
    private var orientation: Orientation,
    enabled: Boolean,
    private var reverseDirection: Boolean?,
    interactionSource: MutableInteractionSource?,
    private var overscrollEffect: OverscrollEffect?,
    private var startDragImmediately: Boolean
) : DragGestureNode(
    canDrag = AlwaysDrag,
    enabled = enabled,
    interactionSource = interactionSource,
    orientationLock = orientation
) {

    private val isReverseDirection: Boolean
        get() = when (reverseDirection) {
            null -> requireLayoutDirection() == LayoutDirection.Rtl &&
                orientation == Orientation.Horizontal
            else -> reverseDirection!!
        }


    override suspend fun drag(forEachDelta: suspend ((dragDelta: DragEvent.DragDelta) -> Unit) -> Unit) {
        state.anchoredDrag {
            forEachDelta { dragDelta ->
                if (overscrollEffect == null) {
                    dragTo(state.newOffsetForDelta(dragDelta.delta.reverseIfNeeded().toFloat()))
                } else {
                    overscrollEffect!!.applyToScroll(
                        delta = dragDelta.delta.reverseIfNeeded(),
                        source = NestedScrollSource.UserInput
                    ) { deltaForDrag ->
                        val dragOffset = state.newOffsetForDelta(deltaForDrag.toFloat())
                        val consumedDelta = (dragOffset - state.requireOffset()).toOffset()
                        dragTo(dragOffset)
                        consumedDelta
                    }
                }
            }
        }
    }

    override fun onDragStarted(startedPosition: Offset) { }

    override fun onDragStopped(velocity: Velocity) {
        if (!isAttached) return
        coroutineScope.launch {
            if (overscrollEffect == null) {
                state.settle(velocity.reverseIfNeeded().toFloat()).toVelocity()
            } else {
                overscrollEffect!!.applyToFling(
                    velocity = velocity.reverseIfNeeded()
                ) { availableVelocity ->
                    val consumed = state.settle(availableVelocity.toFloat()).toVelocity()
                    val currentOffset = state.requireOffset()
                    val minAnchor = state.anchors.minAnchor()
                    val maxAnchor = state.anchors.maxAnchor()
                    // return consumed velocity only if we are reaching the min/max anchors
                    if (currentOffset >= maxAnchor || currentOffset <= minAnchor) {
                        consumed
                    } else {
                        availableVelocity
                    }
                }
            }
        }
    }

    override fun startDragImmediately(): Boolean = startDragImmediately

    fun update(
        state: UnstyledAnchoredDraggableState<T>,
        orientation: Orientation,
        enabled: Boolean,
        reverseDirection: Boolean?,
        interactionSource: MutableInteractionSource?,
        overscrollEffect: OverscrollEffect?,
        startDragImmediately: Boolean
    ) {
        var resetPointerInputHandling = false

        if (this.state != state) {
            this.state = state
            resetPointerInputHandling = true
        }
        if (this.orientation != orientation) {
            this.orientation = orientation
            resetPointerInputHandling = true
        }

        if (this.reverseDirection != reverseDirection) {
            this.reverseDirection = reverseDirection
            resetPointerInputHandling = true
        }

        this.startDragImmediately = startDragImmediately
        this.overscrollEffect = overscrollEffect

        update(
            enabled = enabled,
            interactionSource = interactionSource,
            shouldResetPointerInputHandling = resetPointerInputHandling,
            orientationLock = orientation
        )
    }

    private fun Float.toOffset() = Offset(
        x = if (orientation == Orientation.Horizontal) this else 0f,
        y = if (orientation == Orientation.Vertical) this else 0f,
    )

    private fun Float.toVelocity() = Velocity(
        x = if (orientation == Orientation.Horizontal) this else 0f,
        y = if (orientation == Orientation.Vertical) this else 0f,
    )

    private fun Velocity.toFloat() =
        if (orientation == Orientation.Vertical) this.y else this.x

    private fun Offset.toFloat() =
        if (orientation == Orientation.Vertical) this.y else this.x

    private fun Velocity.reverseIfNeeded() = if (isReverseDirection) this * -1f else this * 1f
    private fun Offset.reverseIfNeeded() = if (isReverseDirection) this * -1f else this * 1f
}

private val AlwaysDrag: (PointerInputChange) -> Boolean = { false }

/**
 * Structure that represents the anchors of a [UnstyledAnchoredDraggableState].
 *
 * See the DraggableAnchors factory method to construct drag anchors using a default implementation.
 */

interface UnstyledDraggableAnchors<T> {

    /**
     * Get the anchor position for an associated [value]
     *
     * @param value The value to look up
     *
     * @return The position of the anchor, or [Float.NaN] if the anchor does not exist
     */
    fun positionOf(value: T): Float

    /**
     * Whether there is an anchor position associated with the [value]
     *
     * @param value The value to look up
     *
     * @return true if there is an anchor for this value, false if there is no anchor for this value
     */
    fun hasAnchorFor(value: T): Boolean

    /**
     * Find the closest anchor to the [position].
     *
     * @param position The position to start searching from
     *
     * @return The closest anchor or null if the anchors are empty
     */
    fun closestAnchor(position: Float): T?

    /**
     * Find the closest anchor to the [position], in the specified direction.
     *
     * @param position The position to start searching from
     * @param searchUpwards Whether to search upwards from the current position or downwards
     *
     * @return The closest anchor or null if the anchors are empty
     */
    fun closestAnchor(position: Float, searchUpwards: Boolean): T?

    /**
     * The smallest anchor, or [Float.NEGATIVE_INFINITY] if the anchors are empty.
     */
    fun minAnchor(): Float

    /**
     * The biggest anchor, or [Float.POSITIVE_INFINITY] if the anchors are empty.
     */
    fun maxAnchor(): Float

    /**
     * Iterate over all the anchors and corresponding positions.
     *
     * @param block The action to invoke with the anchor and position
     */
    fun forEach(block: (anchor: T, position: Float) -> Unit)

    /**
     * The amount of anchors
     */
    val size: Int
}

/**
 * [DraggableAnchorsConfig] stores a mutable configuration anchors, comprised of values of [T] and
 * corresponding [Float] positions. This [DraggableAnchorsConfig] is used to construct an immutable
 * [UnstyledDraggableAnchors] instance later on.
 */

class DraggableAnchorsConfig<T> {

    internal val anchors = MutableObjectFloatMap<T>()

    /**
     * Set the anchor position for [this] anchor.
     *
     * @param position The anchor position.
     */
    @Suppress("BuilderSetStyle")
    infix fun T.at(position: Float) {
        anchors[this] = position
    }
}

/**
 * Create a new [UnstyledDraggableAnchors] instance using a builder function.
 *
 * @param builder A function with a [DraggableAnchorsConfig] that offers APIs to configure anchors
 * @return A new [UnstyledDraggableAnchors] instance with the anchor positions set by the `builder`
 * function.
 */

fun <T : Any> UnstyledDraggableAnchors(
    builder: DraggableAnchorsConfig<T>.() -> Unit
): UnstyledDraggableAnchors<T> = MapUnstyledDraggableAnchors(DraggableAnchorsConfig<T>().apply(builder).anchors)

/**
 * Scope used for suspending anchored drag blocks. Allows to set [UnstyledAnchoredDraggableState.offset] to
 * a new value.
 *
 * @see [UnstyledAnchoredDraggableState.anchoredDrag] to learn how to start the anchored drag and get the
 * access to this scope.
 */

interface AnchoredDragScope {
    /**
     * Assign a new value for an offset value for [UnstyledAnchoredDraggableState].
     *
     * @param newOffset new value for [UnstyledAnchoredDraggableState.offset].
     * @param lastKnownVelocity last known velocity (if known)
     */
    fun dragTo(
        newOffset: Float,
        lastKnownVelocity: Float = 0f
    )
}

/**
 * State of the [unstyledAnchoredDraggable] modifier.
 * Use the constructor overload with anchors if the anchors are defined in composition, or update
 * the anchors using [updateAnchors].
 *
 * This contains necessary information about any ongoing drag or animation and provides methods
 * to change the state either immediately or by starting an animation.
 *
 * @param initialValue The initial value of the state.
 * @param positionalThreshold The positional threshold, in px, to be used when calculating the
 * target state while a drag is in progress and when settling after the drag ends. This is the
 * distance from the start of a transition. It will be, depending on the direction of the
 * interaction, added or subtracted from/to the origin offset. It should always be a positive value.
 * @param velocityThreshold The velocity threshold (in px per second) that the end velocity has to
 * exceed in order to animate to the next state, even if the [positionalThreshold] has not been
 * reached.
 * @param snapAnimationSpec The default animation spec that will be used to animate to a new state.
 * @param decayAnimationSpec The animation spec that will be used when flinging with a large enough
 * velocity to reach or cross the target state.
 * @param confirmValueChange Optional callback invoked to confirm or veto a pending state change.
 */
@Stable
class UnstyledAnchoredDraggableState<T>(
    initialValue: T,
    internal val positionalThreshold: (totalDistance: Float) -> Float,
    internal val velocityThreshold: () -> Float,
    val snapAnimationSpec: AnimationSpec<Float>,
    val decayAnimationSpec: DecayAnimationSpec<Float>,
    internal val confirmValueChange: (newValue: T) -> Boolean = { true }
) {

    /**
     * Construct an [UnstyledAnchoredDraggableState] instance with anchors.
     *
     * @param initialValue The initial value of the state.
     * @param anchors The anchors of the state. Use [updateAnchors] to update the anchors later.
     * @param snapAnimationSpec The default animation spec that will be used to animate to a new
     * state.
     * @param decayAnimationSpec The animation spec that will be used when flinging with a large
     * enough velocity to reach or cross the target state.
     * @param confirmValueChange Optional callback invoked to confirm or veto a pending state
     * change.
     * @param positionalThreshold The positional threshold, in px, to be used when calculating the
     * target state while a drag is in progress and when settling after the drag ends. This is the
     * distance from the start of a transition. It will be, depending on the direction of the
     * interaction, added or subtracted from/to the origin offset. It should always be a positive
     * value.
     * @param velocityThreshold The velocity threshold (in px per second) that the end velocity has
     * to exceed in order to animate to the next state, even if the [positionalThreshold] has not
     * been reached.
     */

    constructor(
        initialValue: T,
        anchors: UnstyledDraggableAnchors<T>,
        positionalThreshold: (totalDistance: Float) -> Float,
        velocityThreshold: () -> Float,
        snapAnimationSpec: AnimationSpec<Float>,
        decayAnimationSpec: DecayAnimationSpec<Float>,
        confirmValueChange: (newValue: T) -> Boolean = { true }
    ) : this(
        initialValue,
        positionalThreshold,
        velocityThreshold,
        snapAnimationSpec,
        decayAnimationSpec,
        confirmValueChange
    ) {
        this.anchors = anchors
        trySnapTo(initialValue)
    }

    private val dragMutex = MutatorMutex()

    /**
     * The current value of the [UnstyledAnchoredDraggableState].
     *
     * That is the closest anchor point that the state has passed through.
     */
    var currentValue: T by mutableStateOf(initialValue)
        private set

    /**
     * The value the [UnstyledAnchoredDraggableState] is currently settled at.
     *
     * When progressing through multiple anchors, e.g. `A -> B -> C`, [settledValue] will stay the
     * same until settled at an anchor, while [currentValue] will update to the closest anchor.
     */
    var settledValue: T by mutableStateOf(initialValue)
        private set

    /**
     * The target value. This is the closest value to the current offset. If no interactions like
     * animations or drags are in progress, this will be the current value.
     */
    val targetValue: T by derivedStateOf {
        dragTarget ?: run {
            val currentOffset = offset
            if (!currentOffset.isNaN()) {
                anchors.closestAnchor(offset) ?: currentValue
            } else currentValue
        }
    }

    /**
     * The current offset, or [Float.NaN] if it has not been initialized yet.
     *
     * The offset will be initialized when the anchors are first set through [updateAnchors].
     *
     * Strongly consider using [requireOffset] which will throw if the offset is read before it is
     * initialized. This helps catch issues early in your workflow.
     */
    var offset: Float by mutableFloatStateOf(Float.NaN)
        private set

    /**
     * Require the current offset.
     *
     * @see offset
     *
     * @throws IllegalStateException If the offset has not been initialized yet
     */
    fun requireOffset(): Float {
        check(!offset.isNaN()) {
            "The offset was read before being initialized. Did you access the offset in a phase " +
                "before layout, like effects or composition?"
        }
        return offset
    }

    /**
     * Whether an animation is currently in progress.
     */
    val isAnimationRunning: Boolean get() = dragTarget != null

    /**
     * The fraction of the offset between [from] and [to], as a fraction between [0f..1f], or 1f if
     * [from] is equal to [to].
     *
     * @param from The starting value used to calculate the distance
     * @param to The end value used to calculate the distance
     */
    @FloatRange(from = 0.0, to = 1.0)
    fun progress(from: T, to: T): Float {
        val fromOffset = anchors.positionOf(from)
        val toOffset = anchors.positionOf(to)
        val currentOffset = offset.coerceIn(
            min(fromOffset, toOffset), // fromOffset might be > toOffset
            max(fromOffset, toOffset)
        )
        val fraction = (currentOffset - fromOffset) / (toOffset - fromOffset)
        return if (!fraction.isNaN()) {
            // If we are very close to 0f or 1f, we round to the closest
            if (fraction < 1e-6f) 0f else if (fraction > 1 - 1e-6f) 1f else abs(fraction)
        } else 1f
    }

    /**
     * The fraction of the progress going from [settledValue] to [targetValue], within [0f..1f]
     * bounds, or 1f if the [UnstyledAnchoredDraggableState] is in a settled state.
     */
    @Deprecated(
        message = "Use the progress function to query the progress between two specified " +
            "anchors.",
        replaceWith = ReplaceWith("progress(state.settledValue, state.targetValue)")
    )
    @get:FloatRange(from = 0.0, to = 1.0)
    val progress: Float by derivedStateOf(structuralEqualityPolicy()) {
        val a = anchors.positionOf(settledValue)
        val b = anchors.positionOf(targetValue)
        val distance = abs(b - a)
        if (!distance.isNaN() && distance > 1e-6f) {
            val progress = (this.requireOffset() - a) / (b - a)
            // If we are very close to 0f or 1f, we round to the closest
            if (progress < 1e-6f) 0f else if (progress > 1 - 1e-6f) 1f else progress
        } else 1f
    }

    /**
     * The velocity of the last known animation. Gets reset to 0f when an animation completes
     * successfully, but does not get reset when an animation gets interrupted.
     * You can use this value to provide smooth reconciliation behavior when re-targeting an
     * animation.
     */
    var lastVelocity: Float by mutableFloatStateOf(0f)
        private set

    private var dragTarget: T? by mutableStateOf(null)

    var anchors: UnstyledDraggableAnchors<T> by mutableStateOf(emptyDraggableAnchors())
        private set

    /**
     * Update the anchors. If there is no ongoing [anchoredDrag] operation, snap to the [newTarget],
     * otherwise restart the ongoing [anchoredDrag] operation (e.g. an animation) with the new
     * anchors.
     *
     * <b>If your anchors depend on the size of the layout, updateAnchors should be called in the
     * layout (placement) phase, e.g. through Modifier.onSizeChanged.</b> This ensures that the
     * state is set up within the same frame.
     * For static anchors, or anchors with different data dependencies, [updateAnchors] is safe to
     * be called from side effects or layout.
     *
     * @param newAnchors The new anchors.
     * @param newTarget The new target, by default the closest anchor or the current target if there
     * are no anchors.
     */
    fun updateAnchors(
        newAnchors: UnstyledDraggableAnchors<T>,
        newTarget: T = if (!offset.isNaN()) {
            newAnchors.closestAnchor(offset) ?: targetValue
        } else targetValue
    ) {
        if (anchors != newAnchors) {
            anchors = newAnchors
            // Attempt to snap. If nobody is holding the lock, we can immediately update the offset.
            // If anybody is holding the lock, we send a signal to restart the ongoing work with the
            // updated anchors.
            val snapSuccessful = trySnapTo(newTarget)
            if (!snapSuccessful) {
                dragTarget = newTarget
            }
        }
    }

    /**
     * Find the closest anchor, taking into account the [velocityThreshold] and
     * [positionalThreshold], and settle at it with an animation.
     *
     * If the [velocity] is lower than the [velocityThreshold], the closest anchor by distance and
     * [positionalThreshold] will be the target. If the [velocity] is higher than the
     * [velocityThreshold], the [positionalThreshold] will <b>not</b> be considered and the next
     * anchor in the direction indicated by the sign of the [velocity] will be the target.
     *
     * Based on the [velocity], either [snapAnimationSpec] or [decayAnimationSpec] will be used
     * to animate towards the target.
     *
     * @return The velocity consumed in the animation
     */
    suspend fun settle(velocity: Float): Float {
        val previousValue = this.currentValue
        val targetValue = computeTarget(
            offset = requireOffset(),
            currentValue = previousValue,
            velocity = velocity
        )
        return if (confirmValueChange(targetValue)) {
            animateToWithDecay(targetValue, velocity)
        } else {
            // If the user vetoed the state change, rollback to the previous state.
            animateToWithDecay(previousValue, velocity)
        }
    }

    private fun computeTarget(
        offset: Float,
        currentValue: T,
        velocity: Float
    ): T {
        val currentAnchors = anchors
        val currentAnchorPosition = currentAnchors.positionOf(currentValue)
        val velocityThresholdPx = velocityThreshold()
        return if (currentAnchorPosition == offset || currentAnchorPosition.isNaN()) {
            currentValue
        } else {
            if (abs(velocity) >= abs(velocityThresholdPx)) {
                currentAnchors.closestAnchor(
                    offset,
                    sign(velocity) > 0
                )!!
            } else {
                val neighborAnchor =
                    currentAnchors.closestAnchor(
                        offset,
                        offset - currentAnchorPosition > 0
                    )!!
                val neighborAnchorPosition = currentAnchors.positionOf(neighborAnchor)
                val distance = abs(currentAnchorPosition - neighborAnchorPosition)
                val relativeThreshold = abs(positionalThreshold(distance))
                val relativePosition = abs(currentAnchorPosition - offset)
                if (relativePosition <= relativeThreshold) currentValue else neighborAnchor
            }
        }
    }

    private val anchoredDragScope = object : AnchoredDragScope {
        var leftBound: T? = null
        var rightBound: T? = null
        var distance = Float.NaN

        override fun dragTo(newOffset: Float, lastKnownVelocity: Float) {
            val previousOffset = offset
            offset = newOffset
            lastVelocity = lastKnownVelocity
            if (previousOffset.isNaN()) return
            val isMovingForward = newOffset >= previousOffset
            updateIfNeeded(isMovingForward)
        }

        fun updateIfNeeded(isMovingForward: Boolean) {
            updateBounds(isMovingForward)
            val distanceToCurrentAnchor = abs(offset - anchors.positionOf(currentValue))
            val crossedThreshold = distanceToCurrentAnchor >= distance / 2f
            if (crossedThreshold) {
                val closestAnchor = (if (isMovingForward) rightBound else leftBound) ?: currentValue
                if (confirmValueChange(closestAnchor)) {
                    currentValue = closestAnchor
                }
            }
        }

        fun updateBounds(isMovingForward: Boolean) {
            val currentAnchorPosition = anchors.positionOf(currentValue)
            if (offset == currentAnchorPosition) {
                val searchStartPosition = offset + (if (isMovingForward) 1f else -1f)
                val closestExcludingCurrent =
                    anchors.closestAnchor(searchStartPosition, isMovingForward) ?: currentValue
                if (isMovingForward) {
                    leftBound = currentValue
                    rightBound = closestExcludingCurrent
                } else {
                    leftBound = closestExcludingCurrent
                    rightBound = currentValue
                }
            } else {
                val closestLeft = anchors.closestAnchor(offset, false) ?: currentValue
                val closestRight = anchors.closestAnchor(offset, true) ?: currentValue
                leftBound = closestLeft
                rightBound = closestRight
            }
            distance = abs(anchors.positionOf(leftBound!!) - anchors.positionOf(rightBound!!))
        }
    }

    /**
     * Call this function to take control of drag logic and perform anchored drag with the latest
     * anchors.
     *
     * All actions that change the [offset] of this [UnstyledAnchoredDraggableState] must be performed
     * within an [anchoredDrag] block (even if they don't call any other methods on this object)
     * in order to guarantee that mutual exclusion is enforced.
     *
     * If [anchoredDrag] is called from elsewhere with the [dragPriority] higher or equal to ongoing
     * drag, the ongoing drag will be cancelled.
     *
     * <b>If the [anchors] change while the [block] is being executed, it will be cancelled and
     * re-executed with the latest anchors and target.</b> This allows you to target the correct
     * state.
     *
     * @param dragPriority of the drag operation
     * @param block perform anchored drag given the current anchor provided
     */
    suspend fun anchoredDrag(
        dragPriority: MutatePriority = MutatePriority.Default,
        block: suspend AnchoredDragScope.(anchors: UnstyledDraggableAnchors<T>) -> Unit
    ) {
        dragMutex.mutate(dragPriority) {
            restartable(inputs = { anchors }) { latestAnchors ->
                anchoredDragScope.block(latestAnchors)
            }
            val closest = anchors.closestAnchor(offset)
            if (closest != null) {
                val closestAnchorOffset = anchors.positionOf(closest)
                val isAtClosestAnchor = abs(offset - closestAnchorOffset) < 0.5f
                if (isAtClosestAnchor && confirmValueChange.invoke(closest)) {
                    settledValue = closest
                    currentValue = closest
                }
            }
        }
    }

    /**
     * Call this function to take control of drag logic and perform anchored drag with the latest
     * anchors and target.
     *
     * All actions that change the [offset] of this [UnstyledAnchoredDraggableState] must be performed
     * within an [anchoredDrag] block (even if they don't call any other methods on this object)
     * in order to guarantee that mutual exclusion is enforced.
     *
     * This overload allows the caller to hint the target value that this [anchoredDrag] is intended
     * to arrive to. This will set [UnstyledAnchoredDraggableState.targetValue] to provided value so
     * consumers can reflect it in their UIs.
     *
     * <b>If the [anchors] or [UnstyledAnchoredDraggableState.targetValue] change while the [block] is being
     * executed, it will be cancelled and re-executed with the latest anchors and target.</b> This
     * allows you to target the correct state.
     *
     * If [anchoredDrag] is called from elsewhere with the [dragPriority] higher or equal to ongoing
     * drag, the ongoing drag will be cancelled.
     *
     * @param targetValue hint the target value that this [anchoredDrag] is intended to arrive to
     * @param dragPriority of the drag operation
     * @param block perform anchored drag given the current anchor provided
     */
    suspend fun anchoredDrag(
        targetValue: T,
        dragPriority: MutatePriority = MutatePriority.Default,
        block: suspend AnchoredDragScope.(anchor: UnstyledDraggableAnchors<T>, targetValue: T) -> Unit
    ) {
        if (anchors.hasAnchorFor(targetValue)) {
            try {
                dragMutex.mutate(dragPriority) {
                    dragTarget = targetValue
                    restartable(
                        inputs = { anchors to this@UnstyledAnchoredDraggableState.targetValue }
                    ) { (anchors, latestTarget) ->
                        anchoredDragScope.block(anchors, latestTarget)
                    }
                    if (confirmValueChange(targetValue)) {
                        val latestTargetOffset = anchors.positionOf(targetValue)
                        anchoredDragScope.dragTo(latestTargetOffset, lastVelocity)
                        settledValue = targetValue
                        currentValue = targetValue
                    }
                }
            } finally {
                dragTarget = null
            }
        } else {
            if (confirmValueChange(targetValue)) {
                settledValue = targetValue
                currentValue = targetValue
            }
        }
    }

    internal fun newOffsetForDelta(delta: Float) =
        ((if (offset.isNaN()) 0f else offset) + delta)
            .coerceIn(anchors.minAnchor(), anchors.maxAnchor())

    /**
     * Drag by the [delta], coerce it in the bounds and dispatch it to the [UnstyledAnchoredDraggableState].
     *
     * @return The delta the consumed by the [UnstyledAnchoredDraggableState]
     */
    fun dispatchRawDelta(delta: Float): Float {
        val newOffset = newOffsetForDelta(delta)
        val oldOffset = if (offset.isNaN()) 0f else offset
        offset = newOffset
        return newOffset - oldOffset
    }

    /**
     * Attempt to snap synchronously. Snapping can happen synchronously when there is no other drag
     * transaction like a drag or an animation is progress. If there is another interaction in
     * progress, the suspending [snapTo] overload needs to be used.
     *
     * @return true if the synchronous snap was successful, or false if we couldn't snap synchronous
     */
    private fun trySnapTo(targetValue: T): Boolean = dragMutex.tryMutate {
        with(anchoredDragScope) {
            val targetOffset = anchors.positionOf(targetValue)
            if (!targetOffset.isNaN()) {
                dragTo(targetOffset)
                dragTarget = null
            }
            currentValue = targetValue
            settledValue = targetValue
        }
    }

    companion object {
        /**
         * The default [Saver] implementation for [UnstyledAnchoredDraggableState].
         */
        
        fun <T : Any> Saver(
            snapAnimationSpec: AnimationSpec<Float>,
            decayAnimationSpec: DecayAnimationSpec<Float>,
            positionalThreshold: (distance: Float) -> Float,
            velocityThreshold: () -> Float,
            confirmValueChange: (T) -> Boolean = { true },
        ) = Saver<UnstyledAnchoredDraggableState<T>, T>(
            save = { it.currentValue },
            restore = {
                UnstyledAnchoredDraggableState(
                    initialValue = it,
                    snapAnimationSpec = snapAnimationSpec,
                    decayAnimationSpec = decayAnimationSpec,
                    confirmValueChange = confirmValueChange,
                    positionalThreshold = positionalThreshold,
                    velocityThreshold = velocityThreshold
                )
            }
        )
    }
}

/**
 * Snap to a [targetValue] without any animation.
 * If the [targetValue] is not in the set of anchors, the [UnstyledAnchoredDraggableState.currentValue] will
 * be updated to the [targetValue] without updating the offset.
 *
 * @throws CancellationException if the interaction interrupted by another interaction like a
 * gesture interaction or another programmatic interaction like a [animateTo] or [snapTo] call.
 *
 * @param targetValue The target value of the animation
 */

suspend fun <T> UnstyledAnchoredDraggableState<T>.snapTo(targetValue: T) {
    anchoredDrag(targetValue = targetValue) { anchors, latestTarget ->
        val targetOffset = anchors.positionOf(latestTarget)
        if (!targetOffset.isNaN()) dragTo(targetOffset)
    }
}

private suspend fun <T> UnstyledAnchoredDraggableState<T>.animateTo(
    velocity: Float,
    anchoredDragScope: AnchoredDragScope,
    anchors: UnstyledDraggableAnchors<T>,
    latestTarget: T
) {
    with(anchoredDragScope) {
        val targetOffset = anchors.positionOf(latestTarget)
        var prev = if (offset.isNaN()) 0f else offset
        if (!targetOffset.isNaN() && prev != targetOffset) {
            debugLog { "Target animation is used" }
            animate(prev, targetOffset, velocity, snapAnimationSpec) { value, velocity ->
                // Our onDrag coerces the value within the bounds, but an animation may
                // overshoot, for example a spring animation or an overshooting interpolator
                // We respect the user's intention and allow the overshoot, but still use
                // DraggableState's drag for its mutex.
                dragTo(value, velocity)
                prev = value
            }
        }
    }
}

/**
 * Animate to a [targetValue].
 * If the [targetValue] is not in the set of anchors, the [UnstyledAnchoredDraggableState.currentValue] will
 * be updated to the [targetValue] without updating the offset.
 *
 * @throws CancellationException if the interaction interrupted by another interaction like a
 * gesture interaction or another programmatic interaction like a [animateTo] or [snapTo] call.
 *
 * @param targetValue The target value of the animation
 */
suspend fun <T> UnstyledAnchoredDraggableState<T>.animateTo(targetValue: T) {
    anchoredDrag(targetValue = targetValue) { anchors, latestTarget ->
        animateTo(lastVelocity, this, anchors, latestTarget)
    }
}

/**
 * Attempt to animate using decay Animation to a [targetValue]. If the [velocity] is high enough to
 * get to the target offset, we'll use [UnstyledAnchoredDraggableState.decayAnimationSpec] to get to that
 * offset and return the consumed velocity. If the [velocity] is not high
 * enough, we'll use [UnstyledAnchoredDraggableState.snapAnimationSpec] to reach the target offset.
 *
 * If the [targetValue] is not in the set of anchors, [UnstyledAnchoredDraggableState.currentValue] will be
 * updated ro the [targetValue] without updating the offset.
 *
 * @throws CancellationException if the interaction interrupted bt another interaction like a
 * gesture interaction or another programmatic interaction like [animateTo] or [snapTo] call.
 *
 * @param targetValue The target value of the animation
 * @param velocity The velocity the animation should start with
 *
 * @return The velocity consumed in the animation
 */

suspend fun <T> UnstyledAnchoredDraggableState<T>.animateToWithDecay(
    targetValue: T,
    velocity: Float,
): Float {
    var remainingVelocity = velocity
    anchoredDrag(targetValue = targetValue) { anchors, latestTarget ->
        val targetOffset = anchors.positionOf(latestTarget)
        if (!targetOffset.isNaN()) {
            var prev = if (offset.isNaN()) 0f else offset
            if (prev != targetOffset) {
                // If targetOffset is not in the same direction as the direction of the drag (sign
                // of the velocity) we fall back to using target animation.
                // If the component is at the target offset already, we use decay animation that will
                // not consume any velocity.
                if (velocity * (targetOffset - prev) < 0f || velocity == 0f) {
                    animateTo(velocity, this, anchors, latestTarget)
                    remainingVelocity = 0f
                } else {
                    val projectedDecayOffset =
                        decayAnimationSpec.calculateTargetValue(prev, velocity)
                    debugLog {
                        "offset = $prev\tvelocity = $velocity\t" +
                            "targetOffset = $targetOffset\tprojectedOffset = $projectedDecayOffset"
                    }

                    val canDecayToTarget = if (velocity > 0) {
                        projectedDecayOffset >= targetOffset
                    } else {
                        projectedDecayOffset <= targetOffset
                    }
                    if (canDecayToTarget) {
                        debugLog { "Decay animation is used" }
                        AnimationState(prev, velocity)
                            .animateDecay(decayAnimationSpec) {
                                if (abs(value) >= abs(targetOffset)) {
                                    val finalValue = value.coerceToTarget(targetOffset)
                                    dragTo(finalValue, this.velocity)
                                    remainingVelocity =
                                        if (this.velocity.isNaN()) 0f else this.velocity
                                    prev = finalValue
                                    cancelAnimation()
                                } else {
                                    dragTo(value, this.velocity)
                                    remainingVelocity = this.velocity
                                    prev = value
                                }
                            }
                    } else {
                        animateTo(velocity, this, anchors, latestTarget)
                        remainingVelocity = 0f
                    }
                }
            }
        }
    }
    return velocity - remainingVelocity
}

private fun Float.coerceToTarget(target: Float): Float {
    if (target == 0f) return 0f
    return if (target > 0) coerceAtMost(target) else coerceAtLeast(target)
}

private class AnchoredDragFinishedSignal : CancellationException("Drag finished")

private suspend fun <I> restartable(inputs: () -> I, block: suspend (I) -> Unit) {
    try {
        coroutineScope {
            var previousDrag: Job? = null
            snapshotFlow(inputs)
                .collect { latestInputs ->
                    previousDrag?.apply {
                        cancel(AnchoredDragFinishedSignal())
                        join()
                    }
                    previousDrag = launch(start = CoroutineStart.UNDISPATCHED) {
                        block(latestInputs)
                        this@coroutineScope.cancel(AnchoredDragFinishedSignal())
                    }
                }
        }
    } catch (anchoredDragFinished: AnchoredDragFinishedSignal) {
        // Ignored
    }
}

private fun <T> emptyDraggableAnchors() = MapUnstyledDraggableAnchors<T>(MutableObjectFloatMap())

@OptIn(ExperimentalFoundationApi::class)
private class MapUnstyledDraggableAnchors<T>(private val anchors: ObjectFloatMap<T>) : UnstyledDraggableAnchors<T> {

    override fun positionOf(value: T): Float = anchors.getOrDefault(value, Float.NaN)

    override fun hasAnchorFor(value: T) = anchors.containsKey(value)

    override fun closestAnchor(position: Float): T? {
        var minAnchor: T? = null
        var minDistance = Float.POSITIVE_INFINITY
        anchors.forEach { anchor, anchorPosition ->
            val distance = abs(position - anchorPosition)
            if (distance <= minDistance) {
                minAnchor = anchor
                minDistance = distance
            }
        }
        return minAnchor
    }

    override fun closestAnchor(
        position: Float,
        searchUpwards: Boolean
    ): T? {
        var minAnchor: T? = null
        var minDistance = Float.POSITIVE_INFINITY
        anchors.forEach { anchor, anchorPosition ->
            val delta = if (searchUpwards) anchorPosition - position else position - anchorPosition
            val distance = if (delta < 0) Float.POSITIVE_INFINITY else delta
            if (distance <= minDistance) {
                minAnchor = anchor
                minDistance = distance
            }
        }
        return minAnchor
    }

    override fun minAnchor() = anchors.minValueOrNaN()

    override fun maxAnchor() = anchors.maxValueOrNaN()

    override val size: Int
        get() = anchors.size

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is MapUnstyledDraggableAnchors<*>) return false

        return anchors == other.anchors
    }

    override fun hashCode() = 31 * anchors.hashCode()

    override fun toString() = "MapDraggableAnchors($anchors)"

    override fun forEach(block: (anchor: T, position: Float) -> Unit) {
        anchors.forEach(block)
    }
}

private fun <K> ObjectFloatMap<K>.minValueOrNaN(): Float {
    if (size == 1) return Float.NaN
    var minValue = Float.POSITIVE_INFINITY
    forEachValue { value ->
        if (value <= minValue) {
            minValue = value
        }
    }
    return minValue
}

private fun <K> ObjectFloatMap<K>.maxValueOrNaN(): Float {
    if (size == 1) return Float.NaN
    var maxValue = Float.NEGATIVE_INFINITY
    forEachValue { value ->
        if (value >= maxValue) {
            maxValue = value
        }
    }
    return maxValue
}

private const val DEBUG = false
private inline fun debugLog(generateMsg: () -> String) {
    if (DEBUG) {
        println("AnchoredDraggable: ${generateMsg()}")
    }
}




/**
 * Enable drag gestures between a set of predefined values with support for nested scrolling.
 *
 * This version passes scroll events to nested scrollable components before consuming them,
 * allowing nested scrollviews (like in AndroidView) to properly respond to gestures.
 *
 * When a drag is detected, the offset of the [UnstyledAnchoredDraggableState] will be updated with the drag
 * delta. You should use this offset to move your content accordingly (see [Modifier.offset]).
 * When the drag ends, the offset will be animated to one of the anchors and when that anchor is
 * reached, the value of the [UnstyledAnchoredDraggableState] will also be updated to the value
 * corresponding to the new anchor.
 *
 * Dragging is constrained between the minimum and maximum anchors.
 *
 * @param state The associated [UnstyledAnchoredDraggableState].
 * @param reverseDirection Whether to reverse the direction of the drag, so a top to bottom
 * drag will behave like bottom to top, and a left to right drag will behave like right to left. If
 * not specified, this will be determined based on [orientation] and [LocalLayoutDirection].
 * @param orientation The orientation in which the [unstyledAnchoredDraggable] can be dragged.
 * @param enabled Whether this [unstyledAnchoredDraggable] is enabled and should react to the user's input.
 * @param interactionSource Optional [MutableInteractionSource] that will passed on to
 * the internal [Modifier.draggable].
 * @param overscrollEffect optional effect to dispatch any excess delta or velocity to. The excess
 * delta or velocity are a result of dragging/flinging and reaching the bounds. If you provide an
 * [overscrollEffect], make sure to apply [androidx.compose.foundation.overscroll] to render the
 * effect as well.
 * @param startDragImmediately when set to false, [draggable] will start dragging only when the
 * gesture crosses the touchSlop. This is useful to prevent users from "catching" an animating
 * widget when pressing on it. See [draggable] to learn more about startDragImmediately.
 */
@Composable
fun <T> Modifier.nestedUnstyledAnchoredDraggable(
    state: UnstyledAnchoredDraggableState<T>,
    reverseDirection: Boolean,
    orientation: Orientation,
    enabled: Boolean = true,
    interactionSource: MutableInteractionSource? = null,
    overscrollEffect: OverscrollEffect? = null,
    startDragImmediately: Boolean = state.isAnimationRunning
): Modifier {
    Log.d("SHEET", "NESTED IN USE")
    // Create a nested scroll connection to handle nested scrolling
    val nestedScrollConnection = remember(orientation, state) {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                Log.d("SHEET", "ONPRE")
                // Don't intercept scroll events from nested components during user input
                if (source == NestedScrollSource.Drag && enabled) {
                    val delta = if (orientation == Orientation.Vertical) available.y else available.x
                    val absAvailable = abs(delta)

                    // Early return if there's effectively no movement
                    if (absAvailable < 0.001f) return Offset.Zero

                    // Determine if we're at the bounds of our own scroll
                    val currentOffset = state.offset
                    val minBound = state.anchors.minAnchor()
                    val maxBound = state.anchors.maxAnchor()

                    // Only consume if:
                    // - We're at the min bound and trying to scroll further down (negative delta)
                    // - We're at the max bound and trying to scroll further up (positive delta)
                    // Otherwise, let the nested component handle it
                    val shouldConsumeScroll = when {
                        currentOffset <= minBound && delta < 0 -> true
                        currentOffset >= maxBound && delta > 0 -> true
                        // Not at bounds - don't consume yet, let nested components handle it first
                        else -> false
                    }

                    if (shouldConsumeScroll) {
                        val reversed = if (reverseDirection) -1f else 1f
                        val consumed = state.dispatchRawDelta(delta * reversed)

                        return if (orientation == Orientation.Horizontal) {
                            Offset(consumed, 0f)
                        } else {
                            Offset(0f, consumed)
                        }
                    }
                }
                return Offset.Zero
            }

            override fun onPostScroll(
                consumed: Offset,
                available: Offset,
                source: NestedScrollSource
            ): Offset {
                Log.d("SHEET", "onPOST")

                // Handle remaining delta after nested components consumed their part
                if (source == NestedScrollSource.Drag && enabled) {
                    val delta = if (orientation == Orientation.Vertical) available.y else available.x

                    // Early return if there's effectively no movement left
                    if (abs(delta) < 0.001f) return Offset.Zero

                    val reversed = if (reverseDirection) -1f else 1f
                    val consumed = state.dispatchRawDelta(delta * reversed)

                    return if (orientation == Orientation.Horizontal) {
                        Offset(consumed, 0f)
                    } else {
                        Offset(0f, consumed)
                    }
                }
                return Offset.Zero
            }

            override suspend fun onPreFling(available: Velocity): Velocity {
                // Don't consume fling at this stage - let nested components have a chance
                return Velocity.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                // Handle remaining velocity after nested scrollables consumed their part
                if (enabled) {
                    val velocity = if (orientation == Orientation.Vertical) {
                        available.y
                    } else {
                        available.x
                    }

                    // Settle using remaining velocity
                    val reversed = if (reverseDirection) -1f else 1f
                    val settleVelocity = state.settle(velocity * reversed)

                    return if (orientation == Orientation.Horizontal) {
                        Velocity(settleVelocity, 0f)
                    } else {
                        Velocity(0f, settleVelocity)
                    }
                }
                return Velocity.Zero
            }
        }
    }

    // Apply both the nested scroll connection and the original draggable behavior
    return this
        .nestedScroll(nestedScrollConnection)
        .then(
            AnchoredDraggableElement(
                state = state,
                orientation = orientation,
                enabled = enabled,
                reverseDirection = reverseDirection,
                interactionSource = interactionSource,
                overscrollEffect = overscrollEffect,
                startDragImmediately = startDragImmediately
            )
        )
}

/**
 * Enable drag gestures between a set of predefined values with support for nested scrolling.
 *
 * When a drag is detected, the offset of the [UnstyledAnchoredDraggableState] will be updated with the drag
 * delta. If the [orientation] is set to [Orientation.Horizontal] and [LocalLayoutDirection]'s
 * value is [LayoutDirection.Rtl], the drag deltas will be reversed.
 * You should use this offset to move your content accordingly (see [Modifier.offset]).
 * When the drag ends, the offset will be animated to one of the anchors and when that anchor is
 * reached, the value of the [UnstyledAnchoredDraggableState] will also be updated to the value
 * corresponding to the new anchor.
 *
 * Dragging is constrained between the minimum and maximum anchors.
 *
 * @param state The associated [UnstyledAnchoredDraggableState].
 * @param orientation The orientation in which the [unstyledAnchoredDraggable] can be dragged.
 * @param enabled Whether this [unstyledAnchoredDraggable] is enabled and should react to the user's input.
 * @param interactionSource Optional [MutableInteractionSource] that will passed on to
 * the internal [Modifier.draggable].
 * @param overscrollEffect optional effect to dispatch any excess delta or velocity to. The excess
 * delta or velocity are a result of dragging/flinging and reaching the bounds. If you provide an
 * [overscrollEffect], make sure to apply [androidx.compose.foundation.overscroll] to render the
 * effect as well.
 * @param startDragImmediately when set to false, [draggable] will start dragging only when the
 * gesture crosses the touchSlop. This is useful to prevent users from "catching" an animating
 * widget when pressing on it. See [draggable] to learn more about startDragImmediately.
 */
@Composable
fun <T> Modifier.nestedUnstyledAnchoredDraggable(
    state: UnstyledAnchoredDraggableState<T>,
    orientation: Orientation,
    enabled: Boolean = true,
    interactionSource: MutableInteractionSource? = null,
    overscrollEffect: OverscrollEffect? = null,
    startDragImmediately: Boolean = state.isAnimationRunning
): Modifier {
    val layoutDirection = LocalLayoutDirection.current
    val reverseDirection = layoutDirection == LayoutDirection.Rtl &&
            orientation == Orientation.Horizontal

    return nestedUnstyledAnchoredDraggable(
        state = state,
        orientation = orientation,
        enabled = enabled,
        reverseDirection = reverseDirection,
        interactionSource = interactionSource,
        overscrollEffect = overscrollEffect,
        startDragImmediately = startDragImmediately
    )
}