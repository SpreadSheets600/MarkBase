import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api.dart';

String _ago(int t) {
  final m = DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(t)).inMinutes;
  if (m < 1) return 'just now';
  if (m < 60) return '$m min ago';
  if (m < 1440) return '${m ~/ 60} h ago';
  return '${m ~/ 1440} d ago';
}

String _dur(int s) => s >= 60 ? '${s ~/ 60}m ${s % 60}s' : '${s}s';

/// Pages you actually read (captured by the browser extension), kept 60 days and searchable.
class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _api = MarkBaseApi();
  List<PageEntry>? _pages;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await _api.pages();
      if (mounted) setState(() { _pages = p; _error = null; });
    } on ApiException catch (e) {
      if (mounted) setState(() { _error = e.message; _pages ??= []; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    final pages = _pages;
    return SafeArea(
      child: RefreshIndicator.adaptive(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 130),
          children: [
            Text('History', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w600, letterSpacing: -.6, color: scheme.foreground)),
            const SizedBox(height: 2),
            Text('Pages you read, kept 60 days', style: GoogleFonts.inter(fontSize: 13, color: scheme.mutedForeground)),
            const SizedBox(height: 16),
            if (pages == null)
              const Padding(padding: EdgeInsets.only(top: 60), child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
            else if (pages.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 50, 20, 0),
                child: Text(
                  _error ?? 'Nothing remembered yet. Turn on Smart history in the browser extension and the pages you read show up here.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 13.5, height: 1.5, color: scheme.mutedForeground),
                ),
              )
            else
              for (final p in pages)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => HistoryDetail(entry: p))).then((_) => _load()),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: scheme.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: scheme.border)),
                      child: Row(children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(MarkBaseApi.faviconFor(p.host), width: 28, height: 28,
                              errorBuilder: (_, _, _) => Icon(Icons.language_rounded, color: scheme.mutedForeground)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(p.title.isEmpty ? p.url : p.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: scheme.foreground)),
                            const SizedBox(height: 2),
                            Text('${p.host}  ·  ${_ago(p.visited)}', maxLines: 1, overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(fontSize: 12, color: scheme.mutedForeground)),
                          ]),
                        ),
                        Icon(Icons.chevron_right_rounded, color: scheme.mutedForeground),
                      ]),
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

/// The reader: status of the page plus the text that was extracted from it.
class HistoryDetail extends StatefulWidget {
  const HistoryDetail({super.key, required this.entry});
  final PageEntry entry;

  @override
  State<HistoryDetail> createState() => _HistoryDetailState();
}

class _HistoryDetailState extends State<HistoryDetail> {
  final _api = MarkBaseApi();
  late final Future<PageInfo> _info = _api.pageInfo(widget.entry.url);

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    final e = widget.entry;
    Widget row(String l, String v, bool on) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 11),
          child: Row(children: [
            Expanded(child: Text(l, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: scheme.foreground))),
            Container(width: 7, height: 7, margin: const EdgeInsets.only(right: 8), decoration: BoxDecoration(color: on ? const Color(0xFF34D399) : scheme.mutedForeground, shape: BoxShape.circle)),
            Text(v, style: GoogleFonts.inter(fontSize: 12.5, color: scheme.mutedForeground)),
          ]),
        );

    return Scaffold(
      backgroundColor: scheme.background,
      appBar: AppBar(backgroundColor: scheme.background, elevation: 0, title: Text(e.host, style: GoogleFonts.inter(fontSize: 15, color: scheme.mutedForeground))),
      body: FutureBuilder<PageInfo>(
        future: _info,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          final i = snap.data;
          return ListView(padding: const EdgeInsets.fromLTRB(18, 4, 18, 40), children: [
            Text(e.title.isEmpty ? e.url : e.title, style: GoogleFonts.inter(fontSize: 21, fontWeight: FontWeight.w600, height: 1.25, letterSpacing: -.4, color: scheme.foreground)),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(color: scheme.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: scheme.border)),
              child: Column(children: [
                row('Bookmark', i?.bookmarked == true ? 'Saved' : 'Not saved', i?.bookmarked == true),
                Divider(height: 1, color: scheme.border),
                row('Content', (i?.words ?? 0) > 0 ? '${i!.words} words extracted' : 'Not captured', (i?.words ?? 0) > 0),
                Divider(height: 1, color: scheme.border),
                row('History', i?.dwell != null ? 'read ${_dur(i!.dwell!)} · ${_ago(i.visited ?? e.visited)}' : 'Not remembered', i?.dwell != null),
              ]),
            ),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(
                child: ShadButton(
                  onPressed: () => launchUrl(Uri.parse(e.url), mode: LaunchMode.externalApplication),
                  leading: const Icon(Icons.open_in_new_rounded, size: 16),
                  child: const Text('Open page'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ShadButton.outline(
                  onPressed: () async {
                    await _api.forgetPage(e.url);
                    if (context.mounted) Navigator.pop(context);
                  },
                  child: const Text('Forget'),
                ),
              ),
            ]),
            if (i != null && i.content.isNotEmpty) ...[
              const SizedBox(height: 22),
              Row(children: [
                Expanded(child: Text('EXTRACTED CONTENT', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.1, color: scheme.mutedForeground))),
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: i.content));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied as markdown')));
                  },
                  child: Text('Copy', style: GoogleFonts.inter(fontSize: 12.5, color: scheme.primary)),
                ),
              ]),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: scheme.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: scheme.border)),
                child: MarkdownBody(
                  data: i.content,
                  selectable: true,
                  imageBuilder: (uri, title, alt) => const SizedBox.shrink(),
                  onTapLink: (text, href, title) { if (href != null) launchUrl(Uri.parse(href), mode: LaunchMode.externalApplication); },
                  styleSheet: MarkdownStyleSheet(
                    p: GoogleFonts.inter(fontSize: 14, height: 1.6, color: const Color(0xFFD4D4D8)),
                    h1: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: scheme.foreground),
                    h2: GoogleFonts.inter(fontSize: 16.5, fontWeight: FontWeight.w600, color: scheme.foreground),
                    h3: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: scheme.foreground),
                    a: TextStyle(color: scheme.primary),
                    code: GoogleFonts.robotoMono(fontSize: 12.5, backgroundColor: scheme.muted),
                    codeblockDecoration: BoxDecoration(color: scheme.background, borderRadius: BorderRadius.circular(10), border: Border.all(color: scheme.border)),
                  ),
                ),
              ),
            ] else
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Text('No text was extracted from this page.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: scheme.mutedForeground)),
              ),
          ]);
        },
      ),
    );
  }
}
