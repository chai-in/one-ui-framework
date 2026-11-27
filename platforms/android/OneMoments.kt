// SPDX-License-Identifier: AGPL-3.0-only
package one.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kotlin.math.*

enum class OneMomentId(val number: Int, val slug: String, val title: String, val category: String,
                       val springPreset: OneSpringPreset, val reducedMotionSummary: String) {
    BarsFade(1, "bars-fade", "Bars Fade", "feedback", OneSpringPreset.Gentle,
        "Show a static progress indicator and its accessible label."),
    BloomToggle(2, "bloom-toggle", "Bloom Toggle", "selection", OneSpringPreset.Tactile,
        "Swap the checked marker instantly."),
    SnapGrid(3, "snap-grid", "Snap Grid", "layout", OneSpringPreset.Detent,
        "Place the selection on its final grid cell."),
    CardFan(4, "card-fan", "Card Fan", "selection", OneSpringPreset.Gentle,
        "Keep cards stationary and mark the selected card."),
    GooeyTabBar(5, "gooey-tab-bar", "Gooey Tab Bar", "navigation", OneSpringPreset.Elastic,
        "Move the active tab marker immediately."),
    BlocksScale(6, "blocks-scale", "Blocks Scale", "feedback", OneSpringPreset.Snappy,
        "Show the current block count without scaling."),
    StretchToggle(7, "stretch-toggle", "Stretch Toggle", "selection", OneSpringPreset.Elastic,
        "Set the final thumb position on change."),
    MergeDrops(8, "merge-drops", "Merge Drops", "feedback", OneSpringPreset.Elastic,
        "Present the merged state and its text immediately."),
    PaperPlane(9, "paper-plane", "Paper Plane", "action", OneSpringPreset.Snappy,
        "Show the send result without flight."),
    DetentDial(10, "detent-dial", "Detent Dial", "input", OneSpringPreset.Detent,
        "Set the indicated detent directly."),
    DominoRow(11, "domino-row", "Domino Row", "feedback", OneSpringPreset.Tactile,
        "Set all completed segments at once."),
    PebbleRating(12, "pebble-rating", "Pebble Rating", "input", OneSpringPreset.Tactile,
        "Mark the selected rating immediately."),
    JellyPad(13, "jelly-pad", "Jelly Pad", "action", OneSpringPreset.Elastic,
        "Use a static pressed state."),
    SwipeConfirm(14, "swipe-confirm", "Swipe Confirm", "action", OneSpringPreset.Detent,
        "Commit immediately on activation and display confirmation."),
    Bookmark(15, "bookmark", "Bookmark", "selection", OneSpringPreset.Snappy,
        "Swap the saved marker immediately."),
    DepthStack(16, "depth-stack", "Depth Stack", "layout", OneSpringPreset.Gentle,
        "Show the selected item without depth travel."),
    MenuMorph(17, "menu-morph", "Menu Morph", "disclosure", OneSpringPreset.Snappy,
        "Switch the icon and menu visibility instantly."),
    ElasticString(18, "elastic-string", "Elastic String", "input", OneSpringPreset.Elastic,
        "Update the value with a stationary track."),
    RipplePad(19, "ripple-pad", "Ripple Pad", "action", OneSpringPreset.Tactile,
        "Indicate activation without an expanding ripple."),
    WormDots(20, "worm-dots", "Worm Dots", "navigation", OneSpringPreset.Elastic,
        "Mark the current page without stretching."),
    DownloadRing(21, "download-ring", "Download Ring", "feedback", OneSpringPreset.Gentle,
        "Update the ring to the current value immediately."),
    LeafTabs(22, "leaf-tabs", "Leaf Tabs", "navigation", OneSpringPreset.Tactile,
        "Show the chosen tab and panel immediately."),
    BellToggle(23, "bell-toggle", "Bell Toggle", "selection", OneSpringPreset.Tactile,
        "Use a stationary notification-state icon."),
    InkSwitch(24, "ink-switch", "Ink Switch", "selection", OneSpringPreset.Gentle,
        "Show the checked state without spreading ink."),
    RockerSwitch(25, "rocker-switch", "Rocker Switch", "selection", OneSpringPreset.Detent,
        "Set the labelled switch state immediately."),
    ScrubWave(26, "scrub-wave", "Scrub Wave", "input", OneSpringPreset.Detent,
        "Update the playhead and time directly."),
    SquashPlay(27, "squash-play", "Squash Play", "action", OneSpringPreset.Tactile,
        "Switch playback state without scaling."),
    RubberSearch(28, "rubber-search", "Rubber Search", "input", OneSpringPreset.Elastic,
        "Keep the search field fixed while editing."),
    Odometer(29, "odometer", "Odometer", "feedback", OneSpringPreset.Snappy,
        "Display and expose the final number once."),
    TideProgress(30, "tide-progress", "Tide Progress", "feedback", OneSpringPreset.Gentle,
        "Show the current fill level without waves."),
    EclipseHalf(31, "eclipse-half", "Eclipse Half", "selection", OneSpringPreset.Gentle,
        "Show the chosen appearance immediately."),
    MagnetGrid(32, "magnet-grid", "Magnet Grid", "selection", OneSpringPreset.Tactile,
        "Keep items fixed and show the current selection."),
    Checklist(33, "checklist", "Checklist", "selection", OneSpringPreset.Snappy,
        "Set checkbox markers immediately."),
    FlipCoin(34, "flip-coin", "Flip Coin", "action", OneSpringPreset.Elastic,
        "Expose the chosen face immediately."),
    RadialMenu(35, "radial-menu", "Radial Menu", "disclosure", OneSpringPreset.Snappy,
        "Show all menu items in their final positions."),
    DotRevolve(36, "dot-revolve", "Dot Revolve", "feedback", OneSpringPreset.Gentle,
        "Use a stationary indicator while the operation is pending.")
}

object OneMomentCatalog {
    val entries: List<OneMomentId> = OneMomentId.values().toList()
    private val bySlug = entries.associateBy { it.slug }
    fun fromSlug(slug: String): OneMomentId? = bySlug[slug]
}

@Composable
private fun momentValue(target: Float, id: OneMomentId): Float {
    if (oneReducedMotion()) return target
    return animateFloatAsState(target, animationSpec = oneAnimationSpec(id.springPreset), label = id.slug).value
}

@Composable
fun OnePaperPlaneButton(sent: Boolean, onSend: () -> Unit, modifier: Modifier = Modifier, label: String = "Send") {
    val travel = momentValue(if (sent) 1f else 0f, OneMomentId.PaperPlane)
    val reduced = oneReducedMotion()
    val ink = OneTokens.colors().onAction
    OneButton(label, onSend, modifier.semantics { stateDescription = if (sent) "Sent" else "Ready" },
        leading = {
            Canvas(Modifier.size(24.dp).graphicsLayer {
                translationX = if (reduced) 0f else 4.dp.toPx() * travel
                translationY = if (reduced) 0f else -3.dp.toPx() * travel
            }) {
                if (sent) {
                    drawLine(ink, Offset(0f, center.y), Offset(center.x * 0.7f, size.height * 0.8f), 2.dp.toPx())
                    drawLine(ink, Offset(center.x * 0.7f, size.height * 0.8f), Offset(size.width, size.height * 0.1f), 2.dp.toPx())
                } else {
                    val plane = Path().apply {
                        moveTo(0f, center.y); lineTo(size.width, 0f); lineTo(center.x, size.height); close()
                    }
                    drawPath(plane, ink)
                }
            }
        })
}

@Composable
fun OneSwipeConfirm(confirmed: Boolean, onConfirm: () -> Unit, modifier: Modifier = Modifier, label: String = "Confirm") {
    var offset by remember(confirmed) { mutableFloatStateOf(0f) }
    val palette = OneTokens.colors()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val reduced = oneReducedMotion()
    Column(modifier) {
        BoxWithConstraints {
            val trackWidth = if (constraints.hasBoundedWidth) maxWidth else 180.dp
            val travel = with(LocalDensity.current) { (trackWidth - 48.dp).toPx().coerceAtLeast(0f) }
            val target = if (confirmed) travel else if (reduced) 0f else offset.coerceIn(0f, travel)
            val x = momentValue(target, OneMomentId.SwipeConfirm).coerceIn(0f, travel)
            val commit by rememberUpdatedState(onConfirm)
            Box(Modifier.width(trackWidth).height(48.dp).background(palette.surfaceRaised, CircleShape)
                .pointerInput(confirmed, travel, rtl) {
                if (!confirmed && travel > 0f) detectHorizontalDragGestures(
                    onDragStart = { offset = 0f },
                    onHorizontalDrag = { change, delta ->
                        change.consume()
                        offset = (offset + if (rtl) -delta else delta).coerceIn(0f, travel)
                    },
                    onDragCancel = { offset = 0f },
                    onDragEnd = {
                        val crossed = OnePhysicsMath.swipeProgress(offset.toDouble(), travel.toDouble()).confirmed
                        offset = 0f
                        if (crossed) commit()
                    },
                )
            }) {
                Box(Modifier.offset { IntOffset(x.roundToInt(), 0) }.size(48.dp)
                    .background(palette.action, CircleShape), contentAlignment = Alignment.Center) {
                    Text(if (confirmed) "✓" else if (rtl) "‹" else "›", color = palette.onAction,
                        modifier = Modifier.clearAndSetSemantics {})
                }
            }
        }
        OneButton(label, onConfirm, role = OneActionRole.Accept, enabled = !confirmed,
            modifier = Modifier.semantics { stateDescription = if (confirmed) "Confirmed" else "Ready" })
    }
}

@Composable
fun OneChecklist(items: List<String>, checked: Set<Int>, onCheckedChange: (Int, Boolean) -> Unit,
                 modifier: Modifier = Modifier, label: String = "Checklist") {
    val palette = OneTokens.colors()
    Column(modifier.semantics { contentDescription = label }) {
        items.forEachIndexed { index, item ->
            val selected = index in checked
            val scale = momentValue(if (selected) 1.08f else 1f, OneMomentId.Checklist)
            Row(Modifier.fillMaxWidth().heightIn(min = 48.dp)
                .toggleable(selected, role = Role.Checkbox, onValueChange = { onCheckedChange(index, it) }),
                verticalAlignment = Alignment.CenterVertically) {
                Text(if (selected) "☑" else "☐", color = palette.textPrimary,
                    modifier = Modifier.graphicsLayer { scaleX = scale; scaleY = scale }.clearAndSetSemantics {})
                Spacer(Modifier.width(OneTokens.Space.xs))
                Text(item, color = palette.textPrimary)
            }
        }
    }
}

@Composable
fun OneDetentDial(value: Float, onValueChange: (Float) -> Unit, modifier: Modifier = Modifier,
                  range: ClosedFloatingPointRange<Float> = 0f..10f, detents: Int = 11, label: String = "Dial") {
    require(detents >= 2 && range.endInclusive > range.start)
    val snapped = OnePhysicsMath.snapToDetent(value.toDouble(), detents, range.start.toDouble(), range.endInclusive.toDouble()).toFloat()
    val fraction = momentValue((snapped - range.start) / (range.endInclusive - range.start), OneMomentId.DetentDial)
    val ink = OneTokens.colors().textPrimary
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Canvas(Modifier.size(48.dp)) {
            drawCircle(ink, size.minDimension * 0.44f, style = Stroke(2.dp.toPx()))
            val angle = PI * (0.75 + 1.5 * fraction)
            drawLine(ink, center, center + Offset(cos(angle).toFloat(), sin(angle).toFloat()) * (size.minDimension * 0.4f), 2.dp.toPx())
        }
        Slider(value = snapped, onValueChange = {
            onValueChange(OnePhysicsMath.snapToDetent(it.toDouble(), detents, range.start.toDouble(), range.endInclusive.toDouble()).toFloat())
        }, valueRange = range, steps = detents - 2,
            modifier = Modifier.semantics { contentDescription = label; stateDescription = snapped.toString() })
    }
}

@Composable
fun OneOdometer(value: Int, modifier: Modifier = Modifier, label: String = "Count") {
    val animated = momentValue(value.toFloat(), OneMomentId.Odometer)
    val display = if (animated == value.toFloat()) value else animated.roundToInt()
    Text(display.toString(), color = OneTokens.colors().textPrimary, modifier = modifier.clearAndSetSemantics {
        contentDescription = label
        stateDescription = value.toString()
        liveRegion = LiveRegionMode.Polite
    })
}

@Composable
fun OneRockerSwitch(checked: Boolean, onCheckedChange: (Boolean) -> Unit, modifier: Modifier = Modifier,
                    label: String = "Power") {
    val palette = OneTokens.colors()
    val tilt = momentValue(if (checked) 18f else -18f, OneMomentId.RockerSwitch)
    Row(modifier.heightIn(min = 48.dp).toggleable(checked, role = Role.Switch, onValueChange = onCheckedChange),
        verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(48.dp, 32.dp).graphicsLayer { rotationY = tilt }
            .background(if (checked) palette.accept else palette.surfaceRaised, RoundedCornerShape(8.dp)),
            contentAlignment = if (checked) Alignment.CenterEnd else Alignment.CenterStart) {
            Text(if (checked) "I" else "O", color = if (checked) palette.onAccept else palette.textPrimary,
                modifier = Modifier.padding(horizontal = 6.dp).clearAndSetSemantics {})
        }
        Spacer(Modifier.width(OneTokens.Space.xs))
        Text(label, color = palette.textPrimary)
    }
}

@Composable
private fun MomentProgress(id: OneMomentId, progress: Float?, label: String, modifier: Modifier) {
    val palette = OneTokens.colors()
    val fraction = progress?.takeIf { it.isFinite() }?.coerceIn(0f, 1f)
    val reduced = oneReducedMotion()
    val frame = modifier.size(96.dp, 48.dp).semantics {
        contentDescription = label
        progressBarRangeInfo = if (fraction == null) ProgressBarRangeInfo.Indeterminate else ProgressBarRangeInfo(fraction, 0f..1f)
    }
    if (fraction == null && reduced) {
        Box(frame, contentAlignment = Alignment.Center) {
            Text("…", color = palette.textPrimary, modifier = Modifier.clearAndSetSemantics {})
        }
        return
    }
    val fill = momentValue(fraction ?: 0.5f, id).coerceIn(0f, 1f)
    val phase = if (fraction == null) {
        rememberInfiniteTransition(label = label).animateFloat(
            initialValue = 0f, targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(1400, easing = LinearEasing)), label = label,
        ).value
    } else 0f
    Canvas(frame) {
        when (id) {
            OneMomentId.DownloadRing, OneMomentId.DotRevolve -> {
                val radius = size.minDimension * 0.38f
                val topLeft = center - Offset(radius, radius)
                val arcSize = Size(radius * 2, radius * 2)
                drawCircle(palette.borderControl, radius + 3.dp.toPx(), style = Stroke(1.dp.toPx()))
                drawCircle(palette.surfaceRaised, radius, style = Stroke(3.dp.toPx()))
                drawArc(palette.textPrimary, phase * 360 - 90, fill * 360, false, topLeft, arcSize, style = Stroke(3.dp.toPx()))
                if (id == OneMomentId.DotRevolve) {
                    val angle = (phase + fill) * 2 * PI - PI / 2
                    drawCircle(palette.textPrimary, 4.dp.toPx(), center + Offset(cos(angle).toFloat(), sin(angle).toFloat()) * radius)
                }
            }
            OneMomentId.TideProgress -> {
                drawRect(palette.surfaceRaised)
                val water = Path().apply {
                    moveTo(0f, size.height)
                    for (i in 0..32) {
                        val x = i / 32f
                        val wave = if (reduced) 0f else sin(2 * PI * (phase + x)).toFloat()
                        val y = size.height * (1 - fill) + wave * min(fill, 1 - fill) * 6.dp.toPx()
                        lineTo(size.width * x, y)
                    }
                    lineTo(size.width, size.height); close()
                }
                drawPath(water, palette.textPrimary)
                drawRect(palette.borderControl, style = Stroke(2.dp.toPx()))
            }
            else -> {
                val width = size.width / 8
                for (i in 0 until 8) {
                    val active = i < fill * 8
                    val fade = if (fraction == null) (0.75 + 0.25 * cos(2 * PI * (phase - i / 8f))).toFloat() else 1f
                    val origin = Offset(i * width, size.height * 0.25f)
                    val segment = Size(width * 0.65f, size.height * 0.5f)
                    if (active) {
                        drawRect(palette.textPrimary, origin, segment, alpha = fade)
                    } else {
                        drawRect(palette.borderControl, origin, segment, style = Stroke(1.dp.toPx()))
                    }
                }
            }
        }
    }
}

@Composable
fun OneDownloadRing(progress: Float? = null, modifier: Modifier = Modifier, label: String = "Download Ring") {
    MomentProgress(OneMomentId.DownloadRing, progress, label, modifier)
}

@Composable
fun OneTideProgress(progress: Float? = null, modifier: Modifier = Modifier, label: String = "Tide Progress") {
    MomentProgress(OneMomentId.TideProgress, progress, label, modifier)
}

@Composable
fun OneBarsFade(progress: Float? = null, modifier: Modifier = Modifier, label: String = "Bars Fade") {
    MomentProgress(OneMomentId.BarsFade, progress, label, modifier)
}

@Composable
fun OneDotRevolve(progress: Float? = null, modifier: Modifier = Modifier, label: String = "Dot Revolve") {
    MomentProgress(OneMomentId.DotRevolve, progress, label, modifier)
}
