import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../api.dart';
import '../theme.dart';

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
    const muted = Color(0xFF9E9EA8);

    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: Color(0xFF08080B)),
        ...MarkBaseTheme.aurora(size),
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
                  Text('Connection',
                      style: GoogleFonts.inter(
                          fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -.8, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 18),
              ShadCard(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _label('API URL'),
                    const SizedBox(height: 7),
                    ShadInput(
                      controller: _endpoint,
                      placeholder: const Text('https://markbase-api.you.workers.dev'),
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 16),
                    _label('SYNC TOKEN'),
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
                        icon: const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF34D399)),
                        description: Text(success!),
                      ),
                    ],
                    if (failure != null) ...[
                      const SizedBox(height: 14),
                      ShadAlert.destructive(
                        icon: const Icon(Icons.error_rounded, size: 16, color: Color(0xFFF43F5E)),
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
                    const Icon(Icons.lock_rounded, size: 16, color: Color(0xFF8B5CF6)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'One token, one private space. The same URL and token go into the Chrome extension — '
                        'only your devices can read this list.',
                        style: GoogleFonts.inter(fontSize: 12.5, height: 1.6, color: muted),
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

  Widget _label(String text) => Text(
        text,
        style: GoogleFonts.inter(
            fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: .09, color: const Color(0xFF71717A)),
      );
}
