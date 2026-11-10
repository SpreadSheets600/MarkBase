import 'package:flutter/material.dart';

import 'screens/home_screen.dart';
import 'screens/settings_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MarkBaseApp());
}

class MarkBaseApp extends StatelessWidget {
  const MarkBaseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MarkBase',
      debugShowCheckedModeBanner: false,
      theme: MarkBaseTheme.dark(),
      home: const HomeScreen(),
      routes: {'/settings': (_) => const SettingsScreen()},
    );
  }
}
