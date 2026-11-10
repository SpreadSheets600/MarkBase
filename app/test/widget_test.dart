import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'package:markbase/main.dart';
import 'package:markbase/theme_controller.dart';

void main() {
  testWidgets('app boots into an unconfigured MarkBase', (tester) async {
    SharedPreferences.setMockInitialValues({}); // nothing configured
    await tester.pumpWidget(
      MediaQuery(data: const MediaQueryData(size: Size(400, 900)), child: const MarkBaseApp()),
    );
    await tester.pump();
    expect(find.byType(ShadApp), findsOneWidget);
    expect(find.text('MarkBase'), findsOneWidget);
  });

  test('theme choice is read back and persisted', () async {
    SharedPreferences.setMockInitialValues({'mb_theme_mode': 'dark'});
    await themeController.hydrate();
    expect(themeController.value, ThemeMode.dark);

    await themeController.select(ThemeMode.light);
    expect(themeController.value, ThemeMode.light);

    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('mb_theme_mode'), 'light');

    await themeController.select(ThemeMode.system);
    expect(themeController.value, ThemeMode.system);
  });
}
