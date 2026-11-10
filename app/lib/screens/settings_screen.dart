import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../api.dart';
import '../theme.dart';
import '../theme_controller.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _api = MarkBaseApi();
  final _endpoint = TextEditingController();
  final _token = TextEditingController();
  bool testing = false;
  String? success;
  String? failure;

  @override
  void initState() {
    super.initState();
    _api.endpoint().then((v) => setState(() => _endpoint.text = v ?? ''));
    _api.token().then((v) => setState(() => _token.text = v ?? ''));
  }

  @override
  void dispose() {
    _endpoint.dispose();
    _token.dispose();
    super.dispose();
  }

  Future<void> _saveAndTest() async {
    await _api.save(endpoint: _endpoint.text, token: _token.text);
    setState(() {
      testing = true;
      success = null;
      failure = null;
    });
    try {
      final n = (await _api.fetchBookmarks()).length;
      setState(() => success = 'Connected — $n bookmarks in the cloud');
    } on ApiException catch (e) {
      setState(() => failure = e.message);
    }
    if (mounted) setState(() => testing = false);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final scheme = ShadTheme.of(context).colorScheme;
    final dark = MarkBaseTheme.isDark(context);

    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(color: scheme.background),
        ...MarkBaseTheme.aurora(size, dark: dark),
        SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 8, 18, 40),
            children: [
              Row(
                children: [
                  ShadIconButton.ghost(
                    icon: const Icon(Icons.arrow_back_rounded, size: 19),
                    onPressed: () => Navigator.maybePop(context),
                  ),
                  const SizedBox(width: 4),
                  Text('Settings',
                      style: GoogleFonts.inter(
                          fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -.8, color: scheme.foreground)),
                ],
              ),
              const SizedBox(height: 18),

              // ------------------------------------------------------- theme
              _sectionTitle('Appearance', scheme),
              const SizedBox(height: 8),
              ShadCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'MarkBase follows the same palette as the dashboard and the browser extension.',
                      style: GoogleFonts.inter(fontSize: 12.5, height: 1.55, color: scheme.mutedForeground),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _themeChip('System', Icons.brightness_auto_rounded, ThemeMode.system, scheme),
                        const SizedBox(width: 8),
                        _themeChip('Light', Icons.light_mode_rounded, ThemeMode.light, scheme),
                        const SizedBox(width: 8),
                        _themeChip('Dark', Icons.dark_mode_rounded, ThemeMode.dark, scheme),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // -------------------------------------------------- connection
              _sectionTitle('Connection', scheme),
              const SizedBox(height: 8),
              ShadCard(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _label('API URL', scheme),
                    const SizedBox(height: 7),
                    ShadInput(
                      controller: _endpoint,
                      placeholder: const Text('https://markbase-api.you.workers.dev'),
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 16),
                    _label('SYNC TOKEN', scheme),
                    const SizedBox(height: 7),
                    ShadInput(
                      controller: _token,
                      placeholder: const Text('mb_sync_…'),
                      obscureText: true,
                    ),
                    const SizedBox(height: 18),
                    ShadButton(
                      width: double.infinity,
                      onPressed: testing ? null : _saveAndTest,
                      leading: testing
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 1.8, color: Colors.white),
                            )
                          : const Icon(Icons.bolt_rounded, size: 16),
                      child: Text(testing ? 'Testing…' : 'Save & test connection'),
                    ),
                    if (success != null) ...[
                      const SizedBox(height: 14),
                      ShadAlert(
                        icon: const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF16A34A)),
                        description: Text(success!),
                      ),
                    ],
                    if (failure != null) ...[
                      const SizedBox(height: 14),
                      ShadAlert.destructive(
                        icon: Icon(Icons.error_rounded, size: 16, color: scheme.destructive),
                        description: Text(failure!),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 18),
              ShadCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.lock_rounded, size: 16, color: scheme.primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'One token, one private space. The same URL and token go into the Chrome extension — '
                        'only your devices can read this list.',
                        style: GoogleFonts.inter(fontSize: 12.5, height: 1.6, color: scheme.mutedForeground),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(String text, ShadColorScheme scheme) => Padding(
        padding: const EdgeInsets.only(left: 4),
        child: Text(
          text.toUpperCase(),
          style: GoogleFonts.inter(
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
            letterSpacing: .1,
            color: scheme.mutedForeground,
          ),
        ),
      );

  Widget _themeChip(String label, IconData icon, ThemeMode mode, ShadColorScheme scheme) {
    final on = themeController.value == mode;
    return Expanded(
      child: ShadButton.outline(
        height: 38,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        backgroundColor: on ? scheme.accent : scheme.card,
        hoverBackgroundColor: on ? scheme.accent : scheme.muted,
        foregroundColor: on ? scheme.accentForeground : scheme.mutedForeground,
        hoverForegroundColor: on ? scheme.accentForeground : scheme.foreground,
        leading: Icon(icon, size: 15),
        onPressed: () => themeController.select(mode),
        child: Text(
          label,
          style: GoogleFonts.inter(fontSize: 12, fontWeight: on ? FontWeight.w700 : FontWeight.w600),
        ),
      ),
    );
  }

  Widget _label(String text, ShadColorScheme scheme) => Text(
        text,
        style: GoogleFonts.inter(
            fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: .09, color: scheme.mutedForeground),
      );
}
