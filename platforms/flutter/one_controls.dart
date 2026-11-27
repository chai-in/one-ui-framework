// SPDX-License-Identifier: AGPL-3.0-only
import 'package:flutter/material.dart';
import 'one_design_tokens.g.dart';
import 'one_spring_physics.dart';

enum OneActionRole { action, accept, decline, destructive, neutral }

OnePalette onePaletteOf(BuildContext context) => OneTokens.colors(
  Theme.of(context).brightness,
  preset: MediaQuery.highContrastOf(context) ? 'high-contrast' : 'default',
);

class OneButton extends StatelessWidget {
  const OneButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.role = OneActionRole.action,
    this.loading = false,
    this.bordered = false,
    this.leading,
    this.semanticLabel,
    this.semanticValue,
  });

  final String label;
  final VoidCallback? onPressed;
  final OneActionRole role;
  final bool loading;
  final bool bordered;
  final Widget? leading;
  final String? semanticLabel;
  final String? semanticValue;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    final (fill, hover, active, ink) = switch (role) {
      OneActionRole.action => (
        p.action,
        p.actionHover,
        p.actionActive,
        p.onAction,
      ),
      OneActionRole.accept => (
        p.accept,
        p.acceptHover,
        p.acceptActive,
        p.onAccept,
      ),
      OneActionRole.decline => (
        p.decline,
        p.declineHover,
        p.declineActive,
        p.onDecline,
      ),
      OneActionRole.destructive => (
        p.destructive,
        p.destructiveHover,
        p.destructiveActive,
        p.onDestructive,
      ),
      OneActionRole.neutral => (
        p.neutral,
        p.neutralHover,
        p.neutralActive,
        p.onNeutral,
      ),
    };
    final callback = loading ? null : onPressed;
    final reduceMotion = OneMotionProfile.of(context) == OneMotionMode.reduced;
    final highContrast = MediaQuery.highContrastOf(context);
    return FilledButton(
      onPressed: callback,
      style: ButtonStyle(
        minimumSize: const WidgetStatePropertyAll(Size(48, 48)),
        visualDensity: VisualDensity.standard,
        tapTargetSize: MaterialTapTargetSize.padded,
        padding: const WidgetStatePropertyAll(
          EdgeInsets.symmetric(
            horizontal: OneTokens.spaceLg,
            vertical: OneTokens.spaceXs,
          ),
        ),
        shape: WidgetStatePropertyAll(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(OneTokens.radiusControl),
          ),
        ),
        overlayColor: const WidgetStatePropertyAll(Colors.transparent),
        side: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.focused) && callback != null) {
            return BorderSide(color: ink, width: highContrast ? 3 : 2);
          }
          return bordered || role == OneActionRole.neutral
              ? BorderSide(color: p.borderStrong)
              : BorderSide.none;
        }),
        foregroundColor: WidgetStatePropertyAll(
          callback == null && !loading ? p.disabledText : ink,
        ),
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          if (loading) return fill;
          if (states.contains(WidgetState.disabled)) return p.disabledFill;
          if (states.contains(WidgetState.pressed)) return active;
          if (states.contains(WidgetState.hovered)) return hover;
          return fill;
        }),
        animationDuration: reduceMotion ? Duration.zero : null,
        backgroundBuilder: !loading
            ? null
            : (context, states, child) => Stack(
                alignment: Alignment.center,
                children: [
                  child!,
                  PositionedDirectional(
                    start: 0,
                    child: ExcludeSemantics(
                      child: SizedBox(
                        width: OneTokens.spaceLg,
                        child: Center(
                          child: reduceMotion
                              ? Icon(
                                  Icons.hourglass_top,
                                  size: OneTokens.spaceSm,
                                  color: ink,
                                )
                              : SizedBox.square(
                                  dimension: OneTokens.spaceSm,
                                  child: CircularProgressIndicator(
                                    color: ink,
                                    strokeWidth: 2,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
      ),
      child: Semantics(
        label: semanticLabel ?? label,
        value: loading ? 'Loading' : semanticValue,
        excludeSemantics: true,
        child: Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: OneTokens.spaceXs,
          children: [
            if (leading != null) leading!,
            Text(label, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class OneChoiceGroup extends StatelessWidget {
  const OneChoiceGroup({
    super.key,
    required this.label,
    required this.options,
    required this.selected,
    required this.onChanged,
  });
  final String label;
  final List<String> options;
  final int selected;
  final ValueChanged<int>? onChanged;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: RadioGroup<int>(
        groupValue: selected,
        onChanged: (index) {
          if (index != null) onChanged?.call(index);
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ExcludeSemantics(
              child: Text(label, style: TextStyle(color: p.textPrimary)),
            ),
            for (var index = 0; index < options.length; index++)
              ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 48),
                child: RadioListTile<int>(
                  value: index,
                  enabled: onChanged != null,
                  activeColor: p.accept,
                  title: Text(
                    options[index],
                    style: TextStyle(
                      color: onChanged == null ? p.disabledText : p.textPrimary,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class OneField extends StatelessWidget {
  const OneField({
    super.key,
    required this.label,
    this.controller,
    this.onChanged,
    this.enabled = true,
    this.error,
  });
  final String label;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    final high = MediaQuery.highContrastOf(context);
    OutlineInputBorder border(Color color, double width) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(OneTokens.radiusControl),
      borderSide: BorderSide(color: color, width: width),
    );
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 48),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        enabled: enabled,
        style: TextStyle(color: enabled ? p.textPrimary : p.disabledText),
        decoration: InputDecoration(
          filled: true,
          fillColor: enabled ? p.surface : p.disabledFill,
          labelText: label,
          errorText: error,
          enabledBorder: border(
            high ? p.borderHighContrast : p.borderControl,
            high ? 2 : 1,
          ),
          focusedBorder: border(p.focus, high ? 3 : 2),
          disabledBorder: border(p.borderControl, 1),
          errorBorder: border(p.dangerText, 2),
          focusedErrorBorder: border(p.dangerText, 2),
        ),
      ),
    );
  }
}

class OneBadge extends StatelessWidget {
  const OneBadge(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    final p = onePaletteOf(context);
    return Semantics(
      label: label,
      excludeSemantics: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: p.infoFill,
          borderRadius: BorderRadius.circular(OneTokens.radiusPill),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: OneTokens.spaceXs,
            vertical: OneTokens.spaceXxs,
          ),
          child: Text(label, style: TextStyle(color: p.infoText)),
        ),
      ),
    );
  }
}
