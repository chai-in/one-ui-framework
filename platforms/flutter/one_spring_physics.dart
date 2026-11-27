// SPDX-License-Identifier: AGPL-3.0-only
import 'dart:math' as math;
import 'package:flutter/widgets.dart';
import 'one_design_tokens.g.dart';

enum OneSpringPreset {
  snappy(OneSprings.snappy),
  tactile(OneSprings.tactile),
  elastic(OneSprings.elastic),
  gentle(OneSprings.gentle),
  detent(OneSprings.detent);

  final SpringDescription description;
  const OneSpringPreset(this.description);
}

enum OneMotionMode { calm, tactile, reduced }

class OneMotionProfile extends InheritedWidget {
  const OneMotionProfile({
    super.key,
    this.mode = OneMotionMode.calm,
    required super.child,
  });

  final OneMotionMode mode;

  static OneMotionMode of(BuildContext context) {
    final profile = context
        .dependOnInheritedWidgetOfExactType<OneMotionProfile>();
    if (MediaQuery.disableAnimationsOf(context)) return OneMotionMode.reduced;
    return profile?.mode ?? OneMotionMode.calm;
  }

  @override
  bool updateShouldNotify(OneMotionProfile oldWidget) => mode != oldWidget.mode;
}

class OneSpringSample {
  final double position;
  final double velocity;
  const OneSpringSample(this.position, this.velocity);
}

abstract final class OneSpringSolver {
  /// Unit step from zero to one. Time is seconds, velocity is units per second.
  static OneSpringSample evaluate(
    double t,
    SpringDescription config, {
    double initialVelocity = 0,
  }) {
    if (!t.isFinite ||
        t < 0 ||
        !initialVelocity.isFinite ||
        !config.mass.isFinite ||
        config.mass <= 0 ||
        !config.stiffness.isFinite ||
        config.stiffness <= 0 ||
        !config.damping.isFinite ||
        config.damping < 0) {
      throw ArgumentError('Invalid spring parameters.');
    }
    final v = initialVelocity;
    if (t == 0) return OneSpringSample(0, v);
    final a = config.damping / (2 * config.mass);
    final w2 = config.stiffness / config.mass;
    final w = math.sqrt(w2);
    if (a > w) {
      final b = math.sqrt(a - w) * math.sqrt(a + w);
      final slow = -w2 / (a + b);
      final decay = math.exp(slow * t);
      final z = -2 * b * t;
      // Retain the divided difference near a repeated root.
      final s = z.abs() < 1e-5
          ? t * (1 + z / 2 + z * z / 6)
          : (1 - math.exp(z)) / (2 * b);
      final impulse = v + slow;
      final displacement = -decay + decay * s * impulse;
      return OneSpringSample(
        1 + displacement,
        slow * displacement + math.exp(-(a + b) * t) * impulse,
      );
    }
    final decay = math.exp(-a * t);
    if (decay == 0) return const OneSpringSample(1, 0);
    final b = math.sqrt(w - a) * math.sqrt(w + a);
    final c = decay * math.cos(b * t);
    final s = decay * (b == 0 ? t : math.sin(b * t) / b);
    return OneSpringSample(1 - c + (v - a) * s, v * c + (w2 - a * v) * s);
  }
}

abstract final class OnePhysicsMath {
  static double rubberBand(
    double offset,
    double limit, {
    double resistance = 0.55,
  }) {
    if (!offset.isFinite ||
        !limit.isFinite ||
        limit < 0 ||
        !resistance.isFinite ||
        resistance < 0) {
      throw ArgumentError('Invalid rubber-band parameters.');
    }
    if (offset == 0 || limit == 0 || resistance == 0) return 0;
    return offset.sign * (limit / (1 + limit / offset.abs() / resistance));
  }

  static double snapToDetent(double value, int steps, double min, double max) {
    if (!value.isFinite ||
        !min.isFinite ||
        !max.isFinite ||
        max < min ||
        steps < 1) {
      throw ArgumentError('Invalid detent range.');
    }
    if (steps == 1 || max == min || value <= min) return min;
    if (value >= max) return max;
    final index = ((value - min) / (max - min) * (steps - 1)).round();
    return min + (max - min) * (index / (steps - 1));
  }

  static double angularDetent(double degrees, int count) {
    if (!degrees.isFinite || count < 1)
      throw ArgumentError('Invalid angular detent.');
    final index = ((degrees % 360) / 360 * count).round() % count;
    return index * (360 / count);
  }

  static ({double progress, bool confirmed}) swipeProgress(
    double deltaX,
    double trackWidth, {
    double threshold = 0.8,
  }) {
    if (!deltaX.isFinite ||
        !trackWidth.isFinite ||
        trackWidth < 0 ||
        !(threshold > 0 && threshold <= 1)) {
      throw ArgumentError('Invalid swipe track or threshold.');
    }
    final progress = trackWidth == 0
        ? 0.0
        : (deltaX / trackWidth).clamp(0.0, 1.0).toDouble();
    return (progress: progress, confirmed: progress >= threshold);
  }
}
