import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'api.dart';
import 'screens/shell.dart';
import 'theme.dart';
import 'theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await themeController.hydrate();
  final api = MarkBaseApi();
  final links = AppLinks();
  try {
    final first = await links.getInitialLink();
    if (first != null) await api.handleAuthLink(first);
  } catch (_) {}
  links.uriLinkStream.listen(api.handleAuthLink, onError: (_) {});
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
        home: const Shell(),
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
