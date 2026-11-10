import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../api.dart';
import '../library.dart';
import '../theme_controller.dart';

/// Account + appearance. Sign-in is Google only - no tokens or URLs to type on the phone.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _api = MarkBaseApi();
  ({String name, String email}) me = (name: '', email: '');
  bool signedIn = false;

  @override
  void initState() {
    super.initState();
    _load();
    MarkBaseApi.authChanged.addListener(_load);
  }

  @override
  void dispose() {
    MarkBaseApi.authChanged.removeListener(_load);
    super.dispose();
  }

  Future<void> _load() async {
    final p = await _api.profile();
    final ok = await _api.isConfigured();
    if (mounted) setState(() { me = p; signedIn = ok; });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    Widget section(String t) => Padding(
          padding: const EdgeInsets.fromLTRB(4, 22, 0, 8),
          child: Text(t.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.1, color: scheme.mutedForeground)),
        );
    Widget card(Widget child) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: scheme.card, borderRadius: BorderRadius.circular(18), border: Border.all(color: scheme.border)),
          child: child,
        );

    final name = me.name.isNotEmpty ? me.name : (signedIn ? 'Signed in' : '');
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 130),
        children: [
          Text('Settings', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w600, letterSpacing: -.6, color: scheme.foreground)),
          section('Account'),
          card(signedIn
              ? Row(children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: scheme.accent,
                    child: Text((name.isNotEmpty ? name : '?')[0].toUpperCase(), style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: scheme.foreground)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(name, style: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w600, color: scheme.foreground)),
                      if (me.email.isNotEmpty) Text(me.email, style: GoogleFonts.inter(fontSize: 12.5, color: scheme.mutedForeground)),
                    ]),
                  ),
                  ShadButton.outline(
                    size: ShadButtonSize.sm,
                    onPressed: () async {
                      await _api.signOut();
                      library.bookmarks = [];
                      library.notifyListeners_();
                    },
                    child: const Text('Sign out'),
                  ),
                ])
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Sign in to sync your library across your browsers and this phone.',
                      style: GoogleFonts.inter(fontSize: 13, height: 1.5, color: scheme.mutedForeground)),
                  const SizedBox(height: 14),
                  ShadButton(
                    width: double.infinity,
                    onPressed: _api.signInWithGoogle,
                    leading: const Icon(Icons.login_rounded, size: 16),
                    child: const Text('Continue with Google'),
                  ),
                ])),
          section('Appearance'),
          card(Row(children: [
            for (final (label, icon, mode) in [
              ('System', Icons.brightness_auto_rounded, ThemeMode.system),
              ('Light', Icons.light_mode_rounded, ThemeMode.light),
              ('Dark', Icons.dark_mode_rounded, ThemeMode.dark),
            ])
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: ListenableBuilder(
                    listenable: themeController,
                    builder: (_, _) {
                      final on = themeController.value == mode;
                      return GestureDetector(
                        onTap: () => themeController.select(mode),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          height: 42,
                          decoration: BoxDecoration(
                            color: on ? scheme.accent : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: on ? scheme.primary.withValues(alpha: .5) : scheme.border),
                          ),
                          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(icon, size: 15, color: on ? scheme.foreground : scheme.mutedForeground),
                            const SizedBox(width: 6),
                            Text(label, style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w500, color: on ? scheme.foreground : scheme.mutedForeground)),
                          ]),
                        ),
                      );
                    },
                  ),
                ),
              ),
          ])),
          section('About'),
          card(Text(
            'Bookmarks sync when your browser opens and every 15 minutes. Pages you read in the extension are kept for 60 days and searchable by content.',
            style: GoogleFonts.inter(fontSize: 12.5, height: 1.55, color: scheme.mutedForeground),
          )),
        ],
      ),
    );
  }
}
