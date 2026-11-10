import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'screens/home_screen.dart';
import 'screens/settings_screen.dart';
import 'theme.dart';
import 'theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await themeController.hydrate();
  runApp(const MarkBaseApp());
}

class MarkBaseApp extends StatelessWidget {
  const MarkBaseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeController,
      builder: (context, mode, _) => ShadApp(
        title: 'MarkBase',
        debugShowCheckedModeBanner: false,
        themeMode: mode,
        theme: MarkBaseTheme.light(),
        darkTheme: MarkBaseTheme.dark(),
        home: const HomeScreen(),
        routes: {'/settings': (_) => const SettingsScreen()},
        // Material umbrella so RefreshIndicator / InkWell behave nicely
        // inside the shadcn component tree, in whichever brightness is live.
        builder: (context, child) => Theme(
          data: MarkBaseTheme.material(ShadTheme.of(context).brightness),
          child: Material(type: MaterialType.transparency, child: child!),
        ),
      ),
    );
  }
}
