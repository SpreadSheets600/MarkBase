import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _themeKey = 'mb_theme_mode';

/// Persisted light / dark / system preference.
///
/// A single app-wide instance ([themeController]) keeps the toggle in the
/// header, the one in Settings and the shell in sync without any plumbing.
class ThemeController extends ValueNotifier<ThemeMode> {
  ThemeController([super.value = ThemeMode.system]);

  /// Reads the saved choice once at startup. Failures fall back to "system".
  Future<void> hydrate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      value = _decode(prefs.getString(_themeKey));
    } catch (_) {
      value = ThemeMode.system;
    }
  }

  Future<void> select(ThemeMode mode) async {
    value = mode;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, _encode(mode));
    } catch (_) {
      /* storage unavailable — the in-memory value still applies */
    }
  }

  /// Flips between explicit light and explicit dark.
  Future<void> toggle(Brightness current) =>
      select(current == Brightness.dark ? ThemeMode.light : ThemeMode.dark);

  static ThemeMode _decode(String? raw) => switch (raw) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      };

  static String _encode(ThemeMode mode) => switch (mode) {
        ThemeMode.light => 'light',
        ThemeMode.dark => 'dark',
        ThemeMode.system => 'system',
      };
}

/// Initialised at startup; safe defaults keep widget tests working.
final themeController = ThemeController(ThemeMode.system);
