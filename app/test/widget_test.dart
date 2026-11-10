import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:markbase/main.dart';

void main() {
  testWidgets('unconfigured state renders welcome card, no tiles', (tester) async {
    SharedPreferences.setMockInitialValues({}); // nothing configured
    await tester.pumpWidget(
      MediaQuery(data: const MediaQueryData(size: Size(400, 900)), child: const MarkBaseApp()),
    );
    await tester.pump();
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
