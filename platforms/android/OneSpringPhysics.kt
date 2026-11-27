// SPDX-License-Identifier: AGPL-3.0-only
package one.ui

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.SpringSpec
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.MotionDurationScale
import kotlin.math.*

enum class OneMotionProfile { Calm, Tactile, Reduced }
enum class OneActionBorderPolicy { BorderlessFilled, Bordered }

val LocalOneMotionProfile = staticCompositionLocalOf { OneMotionProfile.Calm }
val LocalOneActionBorderPolicy = staticCompositionLocalOf { OneActionBorderPolicy.BorderlessFilled }

data class OneSpringConfig(val stiffness: Double, val damping: Double, val mass: Double = 1.0) {
    init {
        require(stiffness.isFinite() && stiffness > 0 && damping.isFinite() && damping >= 0 && mass.isFinite() && mass > 0)
    }

    fun asComposeSpring(): SpringSpec<Float> = spring(
        stiffness = (stiffness / mass).toFloat(),
        dampingRatio = (damping / (2 * sqrt(stiffness * mass))).toFloat(),
    )
}

enum class OneSpringPreset(val config: OneSpringConfig, val spec: SpringSpec<Float>) {
    Snappy(OneSpringConfig(420.0, 32.0), OneSprings.snappy),
    Tactile(OneSpringConfig(360.0, 24.0), OneSprings.tactile),
    Elastic(OneSpringConfig(300.0, 20.0), OneSprings.elastic),
    Gentle(OneSpringConfig(220.0, 26.0), OneSprings.gentle),
    Detent(OneSpringConfig(520.0, 38.0), OneSprings.detent),
}

@Composable
internal fun oneReducedMotion(): Boolean {
    val systemScale = rememberCoroutineScope().coroutineContext[MotionDurationScale]?.scaleFactor
    return LocalOneMotionProfile.current == OneMotionProfile.Reduced || systemScale == 0f
}

@Composable
internal fun oneAnimationSpec(preset: OneSpringPreset): AnimationSpec<Float> = when {
    oneReducedMotion() -> snap()
    LocalOneMotionProfile.current == OneMotionProfile.Tactile -> preset.spec
    else -> tween(200, easing = CubicBezierEasing(0.3f, 0.06f, 0.06f, 0.79f))
}

data class OneSpringSample(val position: Double, val velocity: Double)

object OneSpringSolver {
    /** Unit step, with time in seconds and initial velocity in units per second. */
    fun evaluate(t: Double, config: OneSpringConfig, initialVelocity: Double = 0.0): OneSpringSample {
        require(t.isFinite() && t >= 0 && initialVelocity.isFinite())
        val v = initialVelocity
        if (t == 0.0) return OneSpringSample(0.0, v)
        val a = config.damping / (2 * config.mass)
        val w2 = config.stiffness / config.mass
        val w = sqrt(w2)
        if (a > w) {
            val b = sqrt(a - w) * sqrt(a + w)
            val slow = -w2 / (a + b)
            val decay = exp(slow * t)
            val impulse = v + slow
            val displacement = -decay + decay * (-expm1(-2 * b * t) / (2 * b)) * impulse
            return OneSpringSample(1 + displacement, slow * displacement + exp(-(a + b) * t) * impulse)
        }
        val decay = exp(-a * t)
        if (decay == 0.0) return OneSpringSample(1.0, 0.0)
        val b = sqrt(w - a) * sqrt(w + a)
        val c = decay * cos(b * t)
        val s = decay * if (b == 0.0) t else sin(b * t) / b
        return OneSpringSample(1 - c + (v - a) * s, v * c + (w2 - a * v) * s)
    }
}

object OnePhysicsMath {
    fun rubberBand(offset: Double, limit: Double, resistance: Double = 0.55): Double {
        require(offset.isFinite() && limit.isFinite() && limit >= 0 && resistance.isFinite() && resistance >= 0)
        if (offset == 0.0 || limit == 0.0 || resistance == 0.0) return 0.0
        return sign(offset) * (limit / (1 + limit / abs(offset) / resistance))
    }

    fun snapToDetent(value: Double, steps: Int, min: Double, max: Double): Double {
        require(value.isFinite() && min.isFinite() && max.isFinite() && steps > 0 && max >= min)
        if (steps == 1 || max == min || value <= min) return min
        if (value >= max) return max
        val index = floor((value - min) / (max - min) * (steps - 1) + 0.5)
        return min + (max - min) * (index / (steps - 1))
    }

    fun angularDetent(angle: Double, count: Int): Double {
        require(angle.isFinite() && count > 0)
        val wrapped = ((angle % 360) + 360) % 360
        return (floor(wrapped / 360 * count + 0.5) % count) * (360.0 / count)
    }

    data class Swipe(val progress: Double, val confirmed: Boolean)

    fun swipeProgress(deltaX: Double, trackWidth: Double, threshold: Double = 0.8): Swipe {
        require(deltaX.isFinite() && trackWidth.isFinite() && trackWidth >= 0 && threshold > 0 && threshold <= 1)
        val fraction = if (trackWidth == 0.0) 0.0 else (deltaX / trackWidth).coerceIn(0.0, 1.0)
        return Swipe(fraction, fraction >= threshold)
    }
}
