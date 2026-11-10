import 'package:flutter/material.dart';

import '../api.dart';

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
  String testResult = '';

  @override
  void initState() {
    super.initState();
    _api.endpoint().then((v) => _endpoint.text = v ?? '');
    _api.token().then((v) => _token.text = v ?? '');
  }

  @override
  void dispose() {
    _endpoint.dispose();
    _token.dispose();
    super.dispose();
  }

  Future<void> _save({bool testAlso = false}) async {
    await _api.save(endpoint: _endpoint.text, token: _token.text);
    setState(() => testResult = 'Saved ✓');
    if (testAlso) await _test();
  }

  Future<void> _test() async {
    setState(() { testing = true; testResult = ''; });
    try {
      final n = (await _api.fetchBookmarks()).length;
      setState(() => testResult = '✓ Connected — $n bookmarks in the cloud');
    } on ApiException catch (e) {
      setState(() => testResult = '✗ ${e.message}');
    }
    setState(() => testing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Connection')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('MarkBase API URL',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white54)),
          const SizedBox(height: 6),
          TextField(
            controller: _endpoint,
            keyboardType: TextInputType.url,
            autocorrect: false,
            decoration: const InputDecoration(hintText: 'https://markbase-api.<subdomain>.workers.dev'),
          ),
          const SizedBox(height: 18),
          const Text('Sync token',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white54)),
          const SizedBox(height: 6),
          TextField(
            controller: _token,
            obscureText: true,
            autocorrect: false,
            decoration: const InputDecoration(hintText: 'mb_sync_…'),
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: testing ? null : () => _save(testAlso: true),
                  icon: testing
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.rocket_launch_rounded),
                  label: const Text('Save & test'),
                ),
              ),
            ],
          ),
          if (testResult.isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(testResult, style: const TextStyle(fontSize: 13.5)),
          ],
          const SizedBox(height: 30),
          Text(
            'The same URL + token go into the Chrome extension popup. '
            'One token, one private space — only your devices can read this list.',
            style: TextStyle(color: Colors.white.withValues(alpha: .45), fontSize: 12.5, height: 1.5),
          ),
        ],
      ),
    );
  }
}
