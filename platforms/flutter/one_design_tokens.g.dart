// Generated from one.tokens.json by generate_tokens.py.
import 'dart:ui' show Brightness, Color;
import 'package:flutter/physics.dart' show SpringDescription;

class OnePalette {
  final Map<String, Color> _colors;
  const OnePalette._(this._colors);

  Color get canvas => _colors['canvas']!;
  Color get surface => _colors['surface']!;
  Color get surfaceSubtle => _colors['surfaceSubtle']!;
  Color get surfaceRaised => _colors['surfaceRaised']!;
  Color get textPrimary => _colors['textPrimary']!;
  Color get textSecondary => _colors['textSecondary']!;
  Color get textMuted => _colors['textMuted']!;
  Color get placeholder => _colors['placeholder']!;
  Color get borderSubtle => _colors['borderSubtle']!;
  Color get borderControl => _colors['borderControl']!;
  Color get borderStrong => _colors['borderStrong']!;
  Color get borderHighContrast => _colors['borderHighContrast']!;
  Color get action => _colors['action']!;
  Color get actionHover => _colors['actionHover']!;
  Color get actionActive => _colors['actionActive']!;
  Color get onAction => _colors['onAction']!;
  Color get accept => _colors['accept']!;
  Color get acceptHover => _colors['acceptHover']!;
  Color get acceptActive => _colors['acceptActive']!;
  Color get onAccept => _colors['onAccept']!;
  Color get decline => _colors['decline']!;
  Color get declineHover => _colors['declineHover']!;
  Color get declineActive => _colors['declineActive']!;
  Color get onDecline => _colors['onDecline']!;
  Color get destructive => _colors['destructive']!;
  Color get destructiveHover => _colors['destructiveHover']!;
  Color get destructiveActive => _colors['destructiveActive']!;
  Color get onDestructive => _colors['onDestructive']!;
  Color get neutral => _colors['neutral']!;
  Color get neutralHover => _colors['neutralHover']!;
  Color get neutralActive => _colors['neutralActive']!;
  Color get onNeutral => _colors['onNeutral']!;
  Color get selected => _colors['selected']!;
  Color get onSelected => _colors['onSelected']!;
  Color get focus => _colors['focus']!;
  Color get focusGap => _colors['focusGap']!;
  Color get disabledFill => _colors['disabledFill']!;
  Color get disabledText => _colors['disabledText']!;
  Color get categoryBlue => _colors['categoryBlue']!;
  Color get categoryLavender => _colors['categoryLavender']!;
  Color get categoryGreen => _colors['categoryGreen']!;
  Color get onCategory => _colors['onCategory']!;
  Color get successText => _colors['successText']!;
  Color get successFill => _colors['successFill']!;
  Color get warningText => _colors['warningText']!;
  Color get warningFill => _colors['warningFill']!;
  Color get dangerText => _colors['dangerText']!;
  Color get dangerFill => _colors['dangerFill']!;
  Color get infoText => _colors['infoText']!;
  Color get infoFill => _colors['infoFill']!;
  Color get overlay => _colors['overlay']!;
}

class OneTokens {
  OneTokens._();
  static const _light = <String, Color>{
    'canvas': Color(0xFFFFFFFF),
    'surface': Color(0xFFFFFFFF),
    'surfaceSubtle': Color(0xFFF4F4F4),
    'surfaceRaised': Color(0xFFEAEAEA),
    'textPrimary': Color(0xFF000000),
    'textSecondary': Color(0xFF595959),
    'textMuted': Color(0xFF595959),
    'placeholder': Color(0xFF595959),
    'borderSubtle': Color(0xFFDEDEDE),
    'borderControl': Color(0xFF828282),
    'borderStrong': Color(0xFF595959),
    'borderHighContrast': Color(0xFF000000),
    'action': Color(0xFFDFD49A),
    'actionHover': Color(0xFFE7DFAF),
    'actionActive': Color(0xFFCFC184),
    'onAction': Color(0xFF000000),
    'accept': Color(0xFF3F7057),
    'acceptHover': Color(0xFF4A7A62),
    'acceptActive': Color(0xFF345E49),
    'onAccept': Color(0xFFFFFFFF),
    'decline': Color(0xFFD99090),
    'declineHover': Color(0xFFE1A4A4),
    'declineActive': Color(0xFFCB7F7F),
    'onDecline': Color(0xFF000000),
    'destructive': Color(0xFFAD4648),
    'destructiveHover': Color(0xFFB94F51),
    'destructiveActive': Color(0xFF983D40),
    'onDestructive': Color(0xFFFFFFFF),
    'neutral': Color(0xFFFFFFFF),
    'neutralHover': Color(0xFFF4F4F4),
    'neutralActive': Color(0xFFEAEAEA),
    'onNeutral': Color(0xFF000000),
    'selected': Color(0xFFFBF5CE),
    'onSelected': Color(0xFF000000),
    'focus': Color(0xFF000000),
    'focusGap': Color(0xFFFFFFFF),
    'disabledFill': Color(0xFFEAEAEA),
    'disabledText': Color(0xFF595959),
    'categoryBlue': Color(0xFF5AB8FF),
    'categoryLavender': Color(0xFF9D8AFF),
    'categoryGreen': Color(0xFF30B588),
    'onCategory': Color(0xFF000000),
    'successText': Color(0xFF166534),
    'successFill': Color(0xFFF0FDF4),
    'warningText': Color(0xFF854D0E),
    'warningFill': Color(0xFFFFFBEA),
    'dangerText': Color(0xFFB91C1C),
    'dangerFill': Color(0xFFFFF1F2),
    'infoText': Color(0xFF1D4ED8),
    'infoFill': Color(0xFFEFF6FF),
    'overlay': Color(0x73000000),
  };
  static const light = OnePalette._(_light);
  static const _dark = <String, Color>{
    'canvas': Color(0xFF000000),
    'surface': Color(0xFF191919),
    'surfaceSubtle': Color(0xFF191919),
    'surfaceRaised': Color(0xFF212121),
    'textPrimary': Color(0xFFFFFFFF),
    'textSecondary': Color(0xFFC8C8C8),
    'textMuted': Color(0xFF959595),
    'placeholder': Color(0xFF959595),
    'borderSubtle': Color(0xFF323232),
    'borderControl': Color(0xFF828282),
    'borderStrong': Color(0xFF959595),
    'borderHighContrast': Color(0xFFFFFFFF),
    'action': Color(0xFFDFD49A),
    'actionHover': Color(0xFFE7DFAF),
    'actionActive': Color(0xFFCFC184),
    'onAction': Color(0xFF000000),
    'accept': Color(0xFF3F7057),
    'acceptHover': Color(0xFF4A7A62),
    'acceptActive': Color(0xFF345E49),
    'onAccept': Color(0xFFFFFFFF),
    'decline': Color(0xFFD99090),
    'declineHover': Color(0xFFE1A4A4),
    'declineActive': Color(0xFFCB7F7F),
    'onDecline': Color(0xFF000000),
    'destructive': Color(0xFFAD4648),
    'destructiveHover': Color(0xFFB94F51),
    'destructiveActive': Color(0xFF983D40),
    'onDestructive': Color(0xFFFFFFFF),
    'neutral': Color(0xFF191919),
    'neutralHover': Color(0xFF212121),
    'neutralActive': Color(0xFF323232),
    'onNeutral': Color(0xFFFFFFFF),
    'selected': Color(0xFF464029),
    'onSelected': Color(0xFFFFFFFF),
    'focus': Color(0xFFDFD49A),
    'focusGap': Color(0xFF000000),
    'disabledFill': Color(0xFF212121),
    'disabledText': Color(0xFFB8B8B8),
    'categoryBlue': Color(0xFF5AB8FF),
    'categoryLavender': Color(0xFF9D8AFF),
    'categoryGreen': Color(0xFF30B588),
    'onCategory': Color(0xFF000000),
    'successText': Color(0xFF86EFAC),
    'successFill': Color(0xFF143322),
    'warningText': Color(0xFFFDE68A),
    'warningFill': Color(0xFF332B12),
    'dangerText': Color(0xFFFF6666),
    'dangerFill': Color(0xFF3B1717),
    'infoText': Color(0xFF93C5FD),
    'infoFill': Color(0xFF17283B),
    'overlay': Color(0x99000000),
  };
  static const dark = OnePalette._(_dark);

  static final _presets = {
    'default': {
      Brightness.light: OnePalette._({
        ..._light,
      }),
      Brightness.dark: OnePalette._({
        ..._dark,
      }),
    },
    'high-contrast': {
      Brightness.light: OnePalette._({
        ..._light,
        'textSecondary': Color(0xFF191919),
        'textMuted': Color(0xFF222222),
        'placeholder': Color(0xFF222222),
        'borderSubtle': Color(0xFF555555),
        'borderControl': Color(0xFF000000),
        'borderStrong': Color(0xFF000000),
      }),
      Brightness.dark: OnePalette._({
        ..._dark,
        'textSecondary': Color(0xFFFFFFFF),
        'textMuted': Color(0xFFEEEEEE),
        'placeholder': Color(0xFFEEEEEE),
        'borderSubtle': Color(0xFFAAAAAA),
        'borderControl': Color(0xFFFFFFFF),
        'borderStrong': Color(0xFFFFFFFF),
        'focus': Color(0xFFFFFFFF),
      }),
    },
    'obsidian-studio': {
      Brightness.light: OnePalette._({
        ..._light,
        'surfaceSubtle': Color(0xFFF1F2F5),
        'surfaceRaised': Color(0xFFE8EAF0),
        'textSecondary': Color(0xFF414550),
        'borderControl': Color(0xFF737680),
      }),
      Brightness.dark: OnePalette._({
        ..._dark,
        'canvas': Color(0xFF0C0E13),
        'surface': Color(0xFF171A22),
        'surfaceSubtle': Color(0xFF191C24),
        'surfaceRaised': Color(0xFF222632),
        'textPrimary': Color(0xFFF5F6FA),
        'borderControl': Color(0xFF898E9C),
      }),
    },
    'paper-editorial': {
      Brightness.light: OnePalette._({
        ..._light,
        'canvas': Color(0xFFFAF7EF),
        'surface': Color(0xFFFFFDF8),
        'surfaceSubtle': Color(0xFFF5F0E7),
        'surfaceRaised': Color(0xFFEBE5D9),
        'textPrimary': Color(0xFF29251F),
        'textSecondary': Color(0xFF5D564A),
        'borderControl': Color(0xFF776F61),
      }),
      Brightness.dark: OnePalette._({
        ..._dark,
        'canvas': Color(0xFF161410),
        'surface': Color(0xFF1C1915),
        'surfaceSubtle': Color(0xFF211E19),
        'surfaceRaised': Color(0xFF2B2720),
        'textPrimary': Color(0xFFF8F2E5),
        'borderControl': Color(0xFF928775),
      }),
    },
  };

  static OnePalette colors(Brightness brightness, {String preset = 'default'}) =>
      (_presets[preset] ?? _presets['default']!)[brightness]!;
  static const double spaceZero = 0;
  static const double spaceXxs = 4;
  static const double spaceXs = 8;
  static const double spaceSm = 12;
  static const double spaceMd = 16;
  static const double spaceLg = 20;
  static const double spaceXl = 24;
  static const double spaceSection = 32;
  static const double spaceDisplay = 40;
  static const double spaceHero = 48;
  static const double spacePage = 64;
  static const double radiusSmall = 6;
  static const double radiusControl = 12;
  static const double radiusWorkingPanel = 12;
  static const double radiusReadingDialog = 18;
  static const double radiusCategoryPanel = 24;
  static const double radiusPill = 9999;
}

class OneSprings {
  OneSprings._();
  static const snappy = SpringDescription(mass: 1, stiffness: 420, damping: 32);
  static const tactile = SpringDescription(mass: 1, stiffness: 360, damping: 24);
  static const elastic = SpringDescription(mass: 1, stiffness: 300, damping: 20);
  static const gentle = SpringDescription(mass: 1, stiffness: 220, damping: 26);
  static const detent = SpringDescription(mass: 1, stiffness: 520, damping: 38);
}
