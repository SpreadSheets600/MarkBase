import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// MarkBase visual language — shadcn (zinc + violet) with a soft aurora.
abstract final class MarkBaseTheme {
  static const violet = Color(0xFF8B5CF6);

  /// A custom zinc/violet shadcn scheme tuned for MarkBase.
  static const scheme = ShadColorScheme(
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

  static ShadThemeData dark() => ShadThemeData(
        brightness: Brightness.dark,
        colorScheme: scheme,
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

  /// The brand gradient — used for the logo and a few highlights.
  static LinearGradient get brand => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899)],
      );

  /// Soft aurora blobs painted behind the content.
  static List<Widget> aurora(Size size) => [
        _blob(size.width * 1.0, Offset(-size.width * .4, -size.height * .12),
            const Color(0xFF6D28D9), .30),
        _blob(size.width * .9, Offset(size.width * .55, size.height * .22),
            const Color(0xFF7C3AED), .20),
        _blob(size.width * .8, Offset(size.width * .05, size.height * 1.02),
            const Color(0xFFDB2777), .14),
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
