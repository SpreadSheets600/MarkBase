import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'package:markbase/main.dart';

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
}
