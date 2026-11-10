import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// MarkBase visual language — shadcn (zinc + violet), light and dark.
///
/// The palettes mirror the dashboard and the extension:
///   light  bg #FBFBFC · card #FFFFFF · border #E7E7EA · ink #141418
///   dark   bg #08080B · card #0D0D12 · border #22222B · ink #FAFAFA
/// Accent is the same violet ramp everywhere (#7C3AED → #8B5CF6).
abstract final class MarkBaseTheme {
  static const violet = Color(0xFF8B5CF6);
  static const violetDeep = Color(0xFF7C3AED);

  /// Zinc/violet scheme for bright rooms.
  static const lightScheme = ShadColorScheme(
    background: Color(0xFFFBFBFC),
    foreground: Color(0xFF141418),
    card: Color(0xFFFFFFFF),
    cardForeground: Color(0xFF141418),
    popover: Color(0xFFFFFFFF),
    popoverForeground: Color(0xFF141418),
    primary: Color(0xFF7C3AED),
    primaryForeground: Color(0xFFFAFAFA),
    secondary: Color(0xFFF1F1F4),
    secondaryForeground: Color(0xFF141418),
    muted: Color(0xFFF4F4F5),
    mutedForeground: Color(0xFF71717A),
    accent: Color(0xFFF3ECFF),
    accentForeground: Color(0xFF4C1D95),
    destructive: Color(0xFFE11D48),
    destructiveForeground: Color(0xFFFAFAFA),
    border: Color(0xFFE7E7EA),
    input: Color(0xFFE4E4E7),
    ring: Color(0xFF7C3AED),
    selection: Color(0xFFC4B5FD),
  );

  /// The original zinc/violet night palette.
  static const darkScheme = ShadColorScheme(
    background: Color(0xFF08080B),
    foreground: Color(0xFFFAFAFA),
    card: Color(0xFF0D0D12),
    cardForeground: Color(0xFFFAFAFA),
    popover: Color(0xFF0D0D12),
    popoverForeground: Color(0xFFFAFAFA),
    primary: Color(0xFF8B5CF6),
    primaryForeground: Color(0xFFFAFAFA),
    secondary: Color(0xFF1C1C24),
    secondaryForeground: Color(0xFFFAFAFA),
    muted: Color(0xFF1C1C24),
    mutedForeground: Color(0xFF9E9EA8),
    accent: Color(0xFF241A3D),
    accentForeground: Color(0xFFFAFAFA),
    destructive: Color(0xFFF43F5E),
    destructiveForeground: Color(0xFFFAFAFA),
    border: Color(0xFF22222B),
    input: Color(0xFF22222B),
    ring: Color(0xFF8B5CF6),
    selection: Color(0xFF8B5CF6),
  );

  static ShadThemeData light() => ShadThemeData(
        brightness: Brightness.light,
        colorScheme: lightScheme,
        radius: const BorderRadius.all(Radius.circular(18)),
        textTheme: ShadTextTheme.fromGoogleFont(GoogleFonts.inter),
        primaryButtonTheme: const ShadButtonTheme(
          height: 44,
          backgroundColor: Color(0xFF7C3AED),
          hoverBackgroundColor: Color(0xFF6D28D9),
          foregroundColor: Color(0xFFFAFAFA),
          hoverForegroundColor: Color(0xFFFAFAFA),
        ),
        outlineButtonTheme: const ShadButtonTheme(
          height: 40,
          backgroundColor: Color(0xFFFFFFFF),
          hoverBackgroundColor: Color(0xFFF4F4F5),
        ),
        cardTheme: const ShadCardTheme(padding: EdgeInsets.all(14)),
        inputTheme: const ShadInputTheme(
          padding: EdgeInsets.symmetric(horizontal: 14),
        ),
      );

  static ShadThemeData dark() => ShadThemeData(
        brightness: Brightness.dark,
        colorScheme: darkScheme,
        radius: const BorderRadius.all(Radius.circular(18)),
        textTheme: ShadTextTheme.fromGoogleFont(GoogleFonts.inter),
        primaryButtonTheme: const ShadButtonTheme(
          height: 44,
          backgroundColor: Color(0xFF8B5CF6),
          hoverBackgroundColor: Color(0xFF9F7AEA),
        ),
        outlineButtonTheme: const ShadButtonTheme(
          height: 40,
          backgroundColor: Color(0xFF0D0D12),
          hoverBackgroundColor: Color(0xFF1C1C24),
        ),
        cardTheme: const ShadCardTheme(padding: EdgeInsets.all(14)),
        inputTheme: const ShadInputTheme(
          padding: EdgeInsets.symmetric(horizontal: 14),
        ),
      );

  /// Material fallback theme, so RefreshIndicator / InkWell match the shell.
  static ThemeData material(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: ColorScheme.fromSeed(
        seedColor: violetDeep,
        brightness: brightness,
      ),
      scaffoldBackgroundColor: dark ? const Color(0xFF08080B) : const Color(0xFFFBFBFC),
      fontFamily: GoogleFonts.inter().fontFamily,
    );
  }

  static bool isDark(BuildContext context) =>
      ShadTheme.of(context).brightness == Brightness.dark;

  /// The brand gradient — used for the logo and a few highlights.
  static LinearGradient get brand => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899)],
      );

  /// Soft aurora blobs painted behind the content. Dialled down in light mode
  /// so the zinc background stays clean instead of muddy.
  static List<Widget> aurora(Size size, {bool dark = true}) => [
        _blob(size.width * 1.0, Offset(-size.width * .4, -size.height * .12),
            const Color(0xFF6D28D9), dark ? .30 : .13),
        _blob(size.width * .9, Offset(size.width * .55, size.height * .22),
            const Color(0xFF7C3AED), dark ? .20 : .09),
        _blob(size.width * .8, Offset(size.width * .05, size.height * 1.02),
            const Color(0xFFDB2777), dark ? .14 : .06),
      ];

  static Widget _blob(double d, Offset at, Color color, double opacity) {
    return Positioned(
      left: at.dx,
      top: at.dy,
      child: Container(
        width: d,
        height: d,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: [
            color.withValues(alpha: opacity),
            color.withValues(alpha: 0),
          ]),
        ),
      ),
    );
  }
}
