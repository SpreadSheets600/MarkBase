import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'screens/home_screen.dart';
import 'screens/settings_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MarkBaseApp());
}

class MarkBaseApp extends StatelessWidget {
  const MarkBaseApp({super.key});

  static final _materialTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: MarkBaseTheme.violet,
      brightness: Brightness.dark,
    ),
    fontFamily: GoogleFonts.inter().fontFamily,
  );

  @override
  Widget build(BuildContext context) {
    return ShadApp(
      title: 'MarkBase',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: MarkBaseTheme.dark(),
      home: const HomeScreen(),
      routes: {'/settings': (_) => const SettingsScreen()},
      // Material umbrella so RefreshIndicator / InkWell behave nicely
      // inside the shadcn component tree.
      builder: (context, child) => Theme(
        data: _materialTheme,
        child: Material(type: MaterialType.transparency, child: child!),
      ),
    );
  }
}
