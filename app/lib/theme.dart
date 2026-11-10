import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// MarkBase visual language — Material 3, dark, violet aurora.
abstract final class MarkBaseTheme {
  static const seed = Color(0xFF7C6AF0);
  static const _grad = [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899)];

  static ThemeData dark() {
    final scheme = ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark);
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);

    return base.copyWith(
      textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.sora(
          fontSize: 30,
          fontWeight: FontWeight.w800,
          letterSpacing: -1.2,
          color: Colors.white,
        ),
        titleLarge: GoogleFonts.sora(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
      scaffoldBackgroundColor: const Color(0xFF0B0B14),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: Colors.white.withValues(alpha: .05),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: Colors.white.withValues(alpha: .09)),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      ),
      chipTheme: base.chipTheme.copyWith(
        shape: const StadiumBorder(side: BorderSide(color: Colors.white12)),
        backgroundColor: Colors.white.withValues(alpha: .06),
        labelStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white.withValues(alpha: .07),
        hintStyle: TextStyle(color: Colors.white.withValues(alpha: .35)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFA855F7), width: 1.6),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF1C1B2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  /// The brand gradient — use with a ShaderMask or as a decoration.
  static LinearGradient get brand => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: _grad,
      );

  /// Soft aurora blobs to paint inside a Stack, behind content.
  static List<Widget> aurora(Size size) => [
        _blob(size.width * .9, Offset(-size.width * .3, -size.height * .18),
            const Color(0xFF6366F1), .34),
        _blob(size.width * .8, Offset(size.width * .55, size.height * .28),
            const Color(0xFFA855F7), .30),
        _blob(size.width * .7, Offset(size.width * .1, size.height * 1.05),
            const Color(0xFFEC4899), .28),
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
