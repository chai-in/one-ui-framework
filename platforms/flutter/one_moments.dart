// SPDX-License-Identifier: AGPL-3.0-only
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'one_controls.dart';
import 'one_spring_physics.dart';

enum OneMomentId {
  barsFade(
    1,
    'bars-fade',
    'Bars Fade',
    'feedback',
    OneSpringPreset.gentle,
    'Show a static progress indicator and its accessible label.',
  ),
  bloomToggle(
    2,
    'bloom-toggle',
    'Bloom Toggle',
    'selection',
    OneSpringPreset.tactile,
    'Swap the checked marker instantly.',
  ),
  snapGrid(
    3,
    'snap-grid',
    'Snap Grid',
    'layout',
    OneSpringPreset.detent,
    'Place the selection on its final grid cell.',
  ),
  cardFan(
    4,
    'card-fan',
    'Card Fan',
    'selection',
    OneSpringPreset.gentle,
    'Keep cards stationary and mark the selected card.',
  ),
  gooeyTabBar(
    5,
    'gooey-tab-bar',
    'Gooey Tab Bar',
    'navigation',
    OneSpringPreset.elastic,
    'Move the active tab marker immediately.',
  ),
  blocksScale(
    6,
    'blocks-scale',
    'Blocks Scale',
    'feedback',
    OneSpringPreset.snappy,
    'Show the current block count without scaling.',
  ),
  stretchToggle(
    7,
    'stretch-toggle',
    'Stretch Toggle',
    'selection',
    OneSpringPreset.elastic,
    'Set the final thumb position on change.',
  ),
  mergeDrops(
    8,
    'merge-drops',
    'Merge Drops',
    'feedback',
    OneSpringPreset.elastic,
    'Present the merged state and its text immediately.',
  ),
  paperPlane(
    9,
    'paper-plane',
    'Paper Plane',
    'action',
    OneSpringPreset.snappy,
    'Show the send result without flight.',
  ),
  detentDial(
    10,
    'detent-dial',
    'Detent Dial',
    'input',
    OneSpringPreset.detent,
    'Set the indicated detent directly.',
  ),
  dominoRow(
    11,
    'domino-row',
    'Domino Row',
    'feedback',
    OneSpringPreset.tactile,
    'Set all completed segments at once.',
  ),
  pebbleRating(
    12,
    'pebble-rating',
    'Pebble Rating',
    'input',
    OneSpringPreset.tactile,
    'Mark the selected rating immediately.',
  ),
  jellyPad(
    13,
    'jelly-pad',
    'Jelly Pad',
    'action',
    OneSpringPreset.elastic,
    'Use a static pressed state.',
  ),
  swipeConfirm(
    14,
    'swipe-confirm',
    'Swipe Confirm',
    'action',
    OneSpringPreset.detent,
    'Commit immediately on activation and display confirmation.',
  ),
  bookmark(
    15,
    'bookmark',
    'Bookmark',
    'selection',
    OneSpringPreset.snappy,
    'Swap the saved marker immediately.',
  ),
  depthStack(
    16,
    'depth-stack',
    'Depth Stack',
    'layout',
    OneSpringPreset.gentle,
    'Show the selected item without depth travel.',
  ),
  menuMorph(
    17,
    'menu-morph',
    'Menu Morph',
    'disclosure',
    OneSpringPreset.snappy,
    'Switch the icon and menu visibility instantly.',
  ),
  elasticString(
    18,
    'elastic-string',
    'Elastic String',
    'input',
    OneSpringPreset.elastic,
    'Update the value with a stationary track.',
  ),
  ripplePad(
    19,
    'ripple-pad',
    'Ripple Pad',
    'action',
    OneSpringPreset.tactile,
    'Indicate activation without an expanding ripple.',
  ),
  wormDots(
    20,
    'worm-dots',
    'Worm Dots',
    'navigation',
    OneSpringPreset.elastic,
    'Mark the current page without stretching.',
  ),
  downloadRing(
    21,
    'download-ring',
    'Download Ring',
    'feedback',
    OneSpringPreset.gentle,
    'Update the ring to the current value immediately.',
  ),
  leafTabs(
    22,
    'leaf-tabs',
    'Leaf Tabs',
    'navigation',
    OneSpringPreset.tactile,
    'Show the chosen tab and panel immediately.',
  ),
  bellToggle(
    23,
    'bell-toggle',
    'Bell Toggle',
    'selection',
    OneSpringPreset.tactile,
    'Use a stationary notification-state icon.',
  ),
  inkSwitch(
    24,
    'ink-switch',
    'Ink Switch',
    'selection',
    OneSpringPreset.gentle,
    'Show the checked state without spreading ink.',
  ),
  rockerSwitch(
    25,
    'rocker-switch',
    'Rocker Switch',
    'selection',
    OneSpringPreset.detent,
    'Set the labelled switch state immediately.',
  ),
  scrubWave(
    26,
    'scrub-wave',
    'Scrub Wave',
    'input',
    OneSpringPreset.detent,
    'Update the playhead and time directly.',
  ),
  squashPlay(
    27,
    'squash-play',
    'Squash Play',
    'action',
    OneSpringPreset.tactile,
    'Switch playback state without scaling.',
  ),
  rubberSearch(
    28,
    'rubber-search',
    'Rubber Search',
    'input',
    OneSpringPreset.elastic,
    'Keep the search field fixed while editing.',
  ),
  odometer(
    29,
    'odometer',
    'Odometer',
    'feedback',
    OneSpringPreset.snappy,
    'Display and expose the final number once.',
  ),
  tideProgress(
    30,
    'tide-progress',
    'Tide Progress',
    'feedback',
    OneSpringPreset.gentle,
    'Show the current fill level without waves.',
  ),
  eclipseHalf(
    31,
    'eclipse-half',
    'Eclipse Half',
    'selection',
    OneSpringPreset.gentle,
    'Show the chosen appearance immediately.',
  ),
  magnetGrid(
    32,
    'magnet-grid',
    'Magnet Grid',
    'selection',
    OneSpringPreset.tactile,
    'Keep items fixed and show the current selection.',
  ),
  checklist(
    33,
    'checklist',
    'Checklist',
    'selection',
    OneSpringPreset.snappy,
    'Set checkbox markers immediately.',
  ),
  flipCoin(
    34,
    'flip-coin',
    'Flip Coin',
    'action',
    OneSpringPreset.elastic,
    'Expose the chosen face immediately.',
  ),
  radialMenu(
    35,
    'radial-menu',
    'Radial Menu',
    'disclosure',
    OneSpringPreset.snappy,
    'Show all menu items in their final positions.',
  ),
  dotRevolve(
    36,
    'dot-revolve',
    'Dot Revolve',
    'feedback',
    OneSpringPreset.gentle,
    'Use a stationary indicator while the operation is pending.',
  );

  final int number;
  final String slug;
  final String title;
  final String category;
  final OneSpringPreset springPreset;
  final String reducedMotionSummary;
  const OneMomentId(
    this.number,
    this.slug,
    this.title,
    this.category,
    this.springPreset,
    this.reducedMotionSummary,
  );
}

/// Keeps the logical state in the parent. Only the visual value interpolates.
class _MomentValue extends StatefulWidget {
  const _MomentValue(this.id, this.target, this.builder);
  final OneMomentId id;
  final double target;
  final Widget Function(BuildContext, double) builder;

  @override
  State<_MomentValue> createState() => _MomentValueState();
}

class _MomentValueState extends State<_MomentValue>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController.unbounded(
    vsync: this,
    value: widget.target,
  );
  OneMotionMode _mode = OneMotionMode.calm;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final mode = OneMotionProfile.of(context);
    if (mode != _mode) {
      _mode = mode;
      _retarget();
    }
  }

  @override
  void didUpdateWidget(_MomentValue oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.target != widget.target || oldWidget.id != widget.id)
      _retarget();
  }

  void _retarget() {
    final target = widget.target;
    if (_mode == OneMotionMode.reduced || _controller.value == target) {
      _controller.value = target;
    } else if (_mode == OneMotionMode.tactile) {
      final simulation = SpringSimulation(
        widget.id.springPreset.description,
        _controller.value,
        target,
        _controller.velocity,
      );
      _controller.animateWith(simulation).then((_) {
        if (mounted && widget.target == target) _controller.value = target;
      });
    } else {
      _controller.animateTo(
        target,
        duration: const Duration(milliseconds: 200),
        curve: const Cubic(0.3, 0.06, 0.06, 0.79),
      );
    }
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _controller,
    builder: (context, _) => widget.builder(context, _controller.value),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class OnePaperPlaneButton extends StatelessWidget {
  const OnePaperPlaneButton({
    super.key,
    required this.sent,
    required this.onSend,
    this.label = 'Send',
  });
  final bool sent;
  final VoidCallback? onSend;
  final String label;

  @override
  Widget build(BuildContext context) {
    final reduced = OneMotionProfile.of(context) == OneMotionMode.reduced;
    return OneButton(
      label: label,
      semanticValue: sent ? 'Sent' : null,
      onPressed: onSend,
      leading: _MomentValue(
        OneMomentId.paperPlane,
        sent ? 1 : 0,
        (_, travel) => Transform.translate(
          offset: reduced ? Offset.zero : Offset(6 * travel, -4 * travel),
          child: Icon(sent ? Icons.check : Icons.send_outlined),
        ),
      ),
    );
  }
}

class OneSwipeConfirm extends StatefulWidget {
  const OneSwipeConfirm({
    super.key,
    required this.confirmed,
    required this.onConfirm,
    this.label = 'Confirm',
  });
  final bool confirmed;
  final VoidCallback? onConfirm;
  final String label;

  @override
  State<OneSwipeConfirm> createState() => _OneSwipeConfirmState();
}

class _OneSwipeConfirmState extends State<OneSwipeConfirm> {
  double _distance = 0;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    final reduced = OneMotionProfile.of(context) == OneMotionMode.reduced;
    final sign = Directionality.of(context) == TextDirection.rtl ? -1.0 : 1.0;
    final callback = widget.confirmed ? null : widget.onConfirm;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        ExcludeSemantics(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.hasBoundedWidth
                  ? constraints.maxWidth
                  : 180.0;
              const target = 48.0;
              final travel = math.max(0.0, width - target);
              final onSwipe = travel > 0 ? callback : null;
              final swipe = OnePhysicsMath.swipeProgress(_distance, travel);
              final progress = widget.confirmed
                  ? 1.0
                  : (reduced ? 0.0 : swipe.progress);
              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onHorizontalDragStart: onSwipe == null
                    ? null
                    : (_) => setState(() => _distance = 0),
                onHorizontalDragUpdate: onSwipe == null
                    ? null
                    : (details) => setState(() {
                        _distance = (_distance + sign * details.delta.dx)
                            .clamp(0.0, travel)
                            .toDouble();
                      }),
                onHorizontalDragCancel: onSwipe == null
                    ? null
                    : () => setState(() => _distance = 0),
                onHorizontalDragEnd: onSwipe == null
                    ? null
                    : (_) {
                        final commit = OnePhysicsMath.swipeProgress(
                          _distance,
                          travel,
                        ).confirmed;
                        setState(() => _distance = 0);
                        if (commit) onSwipe();
                      },
                child: Container(
                  width: width,
                  height: target,
                  decoration: BoxDecoration(
                    color: p.surfaceRaised,
                    borderRadius: BorderRadius.circular(target / 2),
                  ),
                  alignment: AlignmentDirectional.centerStart,
                  child: _MomentValue(
                    OneMomentId.swipeConfirm,
                    progress,
                    (_, position) => Transform.translate(
                      offset: Offset(
                        sign * travel * position.clamp(0.0, 1.0),
                        0,
                      ),
                      child: Container(
                        width: target,
                        height: target,
                        decoration: BoxDecoration(
                          color: p.action,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          widget.confirmed ? Icons.check : Icons.arrow_forward,
                          color: p.onAction,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        OneButton(
          label: widget.confirmed ? 'Confirmed' : widget.label,
          role: OneActionRole.accept,
          onPressed: callback,
        ),
      ],
    );
  }
}

class OneChecklist extends StatelessWidget {
  const OneChecklist({
    super.key,
    required this.items,
    required this.checked,
    required this.onChanged,
    this.label = 'Checklist',
  });
  final List<String> items;
  final Set<int> checked;
  final void Function(int index, bool checked)? onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      container: true,
      explicitChildNodes: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < items.length; i++)
            Semantics(
              label: items[i],
              checked: checked.contains(i),
              enabled: onChanged != null,
              excludeSemantics: true,
              onTap: onChanged == null
                  ? null
                  : () => onChanged!(i, !checked.contains(i)),
              child: OneButton(
                label: items[i],
                role: OneActionRole.neutral,
                onPressed: onChanged == null
                    ? null
                    : () => onChanged!(i, !checked.contains(i)),
                leading: _MomentValue(
                  OneMomentId.checklist,
                  checked.contains(i) ? 1 : 0,
                  (_, value) => Transform.scale(
                    scale: 1 + 0.08 * value,
                    child: Icon(
                      checked.contains(i)
                          ? Icons.check_box
                          : Icons.check_box_outline_blank,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class OneDetentDial extends StatelessWidget {
  const OneDetentDial({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max = 10,
    this.detents = 11,
    this.label = 'Dial',
  }) : assert(max > min && detents >= 2);
  final double value, min, max;
  final int detents;
  final ValueChanged<double>? onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    final snapped = OnePhysicsMath.snapToDetent(value, detents, min, max);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: TextStyle(color: p.textPrimary)),
        ExcludeSemantics(
          child: _MomentValue(
            OneMomentId.detentDial,
            (snapped - min) / (max - min),
            (_, t) => Transform.rotate(
              angle: math.pi * (1.25 + 1.5 * t),
              child: Container(
                width: 44,
                height: 44,
                alignment: Alignment.topCenter,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: p.borderStrong, width: 2),
                ),
                child: Icon(Icons.arrow_drop_up, color: p.textPrimary),
              ),
            ),
          ),
        ),
        Semantics(
          label: label,
          child: Slider(
            value: snapped,
            min: min,
            max: max,
            divisions: detents - 1,
            activeColor: p.accept,
            semanticFormatterCallback: (v) => v.toString(),
            onChanged: onChanged == null
                ? null
                : (v) => onChanged!(
                    OnePhysicsMath.snapToDetent(v, detents, min, max),
                  ),
          ),
        ),
      ],
    );
  }
}

class OneOdometer extends StatelessWidget {
  const OneOdometer({super.key, required this.value, this.label = 'Count'});
  final int value;
  final String label;

  @override
  Widget build(BuildContext context) => Semantics(
    label: label,
    value: value.toString(),
    liveRegion: true,
    excludeSemantics: true,
    child: _MomentValue(
      OneMomentId.odometer,
      value.toDouble(),
      (context, v) => Text(
        v == value.toDouble() ? value.toString() : v.round().toString(),
        style: TextStyle(
          color: onePaletteOf(context).textPrimary,
          fontFeatures: const [FontFeature.tabularFigures()],
        ),
      ),
    ),
  );
}

class OneRockerSwitch extends StatelessWidget {
  const OneRockerSwitch({
    super.key,
    required this.checked,
    required this.onChanged,
    this.label = 'Power',
  });
  final bool checked;
  final ValueChanged<bool>? onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    final callback = onChanged == null ? null : () => onChanged!(!checked);
    return Semantics(
      label: label,
      toggled: checked,
      enabled: callback != null,
      onTap: callback,
      excludeSemantics: true,
      child: OneButton(
        label: label,
        role: checked ? OneActionRole.accept : OneActionRole.neutral,
        onPressed: callback,
        leading: _MomentValue(
          OneMomentId.rockerSwitch,
          checked ? 1 : 0,
          (_, position) => Transform(
            transform: Matrix4.rotationY((position - 0.5) * 0.65),
            alignment: Alignment.center,
            child: Icon(checked ? Icons.toggle_on : Icons.toggle_off),
          ),
        ),
      ),
    );
  }
}

double? _progressFraction(double? progress) {
  if (progress == null || !progress.isFinite) return null;
  return progress.clamp(0.0, 1.0).toDouble();
}

class OneDownloadRing extends StatelessWidget {
  const OneDownloadRing({super.key, this.progress, this.label = 'Download'});

  /// A fraction in [0, 1], or null while an operation has no known endpoint.
  final double? progress;
  final String label;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    final fraction = _progressFraction(progress);
    final reduced = OneMotionProfile.of(context) == OneMotionMode.reduced;
    Widget ring(double? fill) => SizedBox.square(
      dimension: 44,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: p.borderControl),
        ),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: CircularProgressIndicator(
            value: fill,
            color: p.textPrimary,
            backgroundColor: p.surfaceRaised,
          ),
        ),
      ),
    );
    return Semantics(
      label: label,
      value: fraction == null ? 'In progress' : '${(fraction * 100).round()}%',
      excludeSemantics: true,
      child: fraction == null
          ? (reduced
                ? SizedBox.square(
                    dimension: 44,
                    child: Icon(Icons.hourglass_top, color: p.textPrimary),
                  )
                : ring(null))
          : _MomentValue(
              OneMomentId.downloadRing,
              fraction,
              (_, fill) => ring(fill.clamp(0.0, 1.0).toDouble()),
            ),
    );
  }
}

class OneTideProgress extends StatelessWidget {
  const OneTideProgress({super.key, this.progress, this.label = 'Progress'});
  final double? progress;
  final String label;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    final fraction = _progressFraction(progress);
    final reduced = OneMotionProfile.of(context) == OneMotionMode.reduced;
    Widget paint(double fill, double phase) => CustomPaint(
      size: const Size(144, 44),
      painter: _TidePainter(
        fill.clamp(0.0, 1.0).toDouble(),
        phase,
        reduced,
        p.textPrimary,
        p.surfaceRaised,
        p.borderControl,
      ),
    );
    return Semantics(
      label: label,
      value: fraction == null ? 'In progress' : '${(fraction * 100).round()}%',
      excludeSemantics: true,
      child: fraction == null
          ? (reduced
                ? SizedBox(
                    width: 144,
                    height: 44,
                    child: Icon(Icons.hourglass_top, color: p.textPrimary),
                  )
                : _PendingTide(builder: (phase) => paint(0.5, phase)))
          : _MomentValue(
              OneMomentId.tideProgress,
              fraction,
              (_, fill) => paint(fill, 0),
            ),
    );
  }
}

class _PendingTide extends StatefulWidget {
  const _PendingTide({required this.builder});
  final Widget Function(double phase) builder;
  @override
  State<_PendingTide> createState() => _PendingTideState();
}

class _PendingTideState extends State<_PendingTide>
    with SingleTickerProviderStateMixin {
  late final _phase = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _phase,
    builder: (_, _) => widget.builder(_phase.value),
  );

  @override
  void dispose() {
    _phase.dispose();
    super.dispose();
  }
}

class _TidePainter extends CustomPainter {
  const _TidePainter(
    this.fill,
    this.phase,
    this.still,
    this.ink,
    this.track,
    this.outline,
  );
  final double fill, phase;
  final bool still;
  final Color ink, track, outline;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = track);
    final path = Path()..moveTo(0, size.height);
    for (var i = 0; i <= 32; i++) {
      final x = i / 32;
      final wave = still ? 0 : math.sin(2 * math.pi * (x + phase));
      path.lineTo(
        size.width * x,
        size.height * (1 - fill) + math.min(fill, 1 - fill) * 6 * wave,
      );
    }
    path.lineTo(size.width, size.height);
    path.close();
    canvas.drawPath(path, Paint()..color = ink);
    canvas.drawRect(
      (Offset.zero & size).deflate(0.5),
      Paint()
        ..color = outline
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(_TidePainter old) =>
      fill != old.fill ||
      phase != old.phase ||
      still != old.still ||
      ink != old.ink ||
      track != old.track ||
      outline != old.outline;
}
