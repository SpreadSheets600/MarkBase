import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api.dart';
import '../theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = MarkBaseApi();
  final _search = TextEditingController();

  String phase = 'idle';
  String errorText = '';
  List<Bookmark> bookmarks = [];
  String activeFolder = '';

  List<Bookmark> get visible {
    final q = _search.text.trim().toLowerCase();
    return bookmarks.where((b) {
      final name = b.folder.isEmpty ? 'Unsorted' : b.folder;
      final inFolder = activeFolder.isEmpty || name == activeFolder;
      final hit = q.isEmpty ||
          b.title.toLowerCase().contains(q) ||
          b.url.toLowerCase().contains(q) ||
          b.folder.toLowerCase().contains(q);
      return inFolder && hit;
    }).toList();
  }

  Map<String, int> get folderCounts {
    final m = <String, int>{};
    for (final b in bookmarks) {
      final name = b.folder.isEmpty ? 'Unsorted' : b.folder;
      m[name] = (m[name] ?? 0) + 1;
    }
    return Map.fromEntries(m.entries.toList()..sort((a, b) => b.value.compareTo(a.value)));
  }

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
    load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> load() async {
    if (!await _api.isConfigured()) {
      if (mounted) setState(() => phase = 'unconfigured');
      return;
    }
    if (bookmarks.isEmpty) setState(() => phase = 'loading');
    try {
      final list = await _api.fetchBookmarks();
      if (mounted) setState(() { bookmarks = list; phase = 'ok'; });
    } on ApiException catch (e) {
      if (mounted) setState(() { errorText = e.message; phase = 'error'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final muted = ShadTheme.of(context).colorScheme.mutedForeground;

    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: Color(0xFF08080B)),
        ...MarkBaseTheme.aurora(size),
        SafeArea(
          child: RefreshIndicator.adaptive(
            onRefresh: load,
            color: MarkBaseTheme.violet,
            backgroundColor: const Color(0xFF14141B),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 110),
              children: [
                _header(muted),
                const SizedBox(height: 18),
                _searchField(),
                if (phase == 'ok' && bookmarks.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _stats(),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.only(left: 2, bottom: 10),
                    child: Row(
                      children: [
                        Text(
                          'COLLECTIONS',
                          style: GoogleFonts.inter(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: .1,
                            color: muted.withValues(alpha: .85),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${folderCounts.length}',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w600, color: muted.withValues(alpha: .6)),
                        ),
                      ],
                    ),
                  ),
                  _filters(muted),
                  const SizedBox(height: 6),
                ],
                const SizedBox(height: 8),
                ..._body(muted),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------- header

  Widget _header(Color muted) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: MarkBaseTheme.brand,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF8B5CF6).withValues(alpha: .40),
                blurRadius: 22,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: Text(
            'M',
            style: GoogleFonts.inter(
              fontSize: 21,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'MarkBase',
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1.1,
                  color: Colors.white,
                  height: 1.05,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                switch (phase) {
                  'ok' when bookmarks.isNotEmpty =>
                    '${bookmarks.length} bookmarks · ${folderCounts.length} folders',
                  'loading' => 'syncing with the cloud…',
                  'unconfigured' => 'connect your cloud',
                  _ => 'your bookmarks, everywhere',
                },
                style: GoogleFonts.inter(fontSize: 12.5, color: muted, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        if (phase == 'ok')
          ShadIconButton.ghost(
            icon: const Icon(Icons.tune_rounded, size: 19),
            onPressed: () => Navigator.pushNamed(context, '/settings').then((_) => load()),
          ),
      ],
    );
  }

  Widget _searchField() => ShadInput(
        controller: _search,
        placeholder: const Text('Search bookmarks…'),
        leading: const Padding(
          padding: EdgeInsets.only(right: 8),
          child: Icon(Icons.search_rounded, size: 19, color: Color(0xFF9E9EA8)),
        ),
        trailing: _search.text.isEmpty
            ? null
            : ShadIconButton.ghost(
                width: 26,
                height: 26,
                icon: const Icon(Icons.close_rounded, size: 15),
                onPressed: () => _search.clear(),
              ),
      );

  Widget _stats() {
    final domains = bookmarks.map((b) => b.host).toSet().length;
    final items = [
      ('${bookmarks.length}', 'bookmarks'),
      ('${folderCounts.length}', 'folders'),
      ('$domains', 'domains'),
    ];
    return Row(
      children: [
        for (final (i, item) in items.indexed) ...[
          if (i > 0) const SizedBox(width: 10),
          Expanded(
            child: ShadCard(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.$1,
                    style: GoogleFonts.inter(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -.6,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    item.$2,
                    style: GoogleFonts.inter(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      letterSpacing: .02,
                      color: const Color(0xFF9E9EA8),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _filters(Color muted) {
    final folders = [('All', '', bookmarks.length), ...folderCounts.entries.map((e) => (e.key, e.key, e.value))];
    return SizedBox(
      height: 112,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: folders.length,
        separatorBuilder: (_, _) => const SizedBox(width: 14),
        itemBuilder: (context, i) {
          final (label, folder, count) = folders[i];
          final on = activeFolder == folder;
          return GestureDetector(
            onTap: () => setState(() => activeFolder = on ? '' : folder),
            child: Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  width: 86,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: on
                          ? [const Color(0xFF8B5CF6), const Color(0xFF6D28D9)]
                          : [const Color(0xFF3F3F46), const Color(0xFF18181B)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: on ? .30 : .22),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -5,
                        left: 10,
                        child: Container(
                          width: 30,
                          height: 10,
                          decoration: BoxDecoration(
                            color: on ? const Color(0xFFA78BFA) : const Color(0xFF52525B),
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                          ),
                        ),
                      ),
                      Center(
                        child: Text(
                          folder.isEmpty ? '📚' : _emojiFor(label),
                          style: const TextStyle(fontSize: 20),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 7),
                SizedBox(
                  width: 90,
                  child: Text(
                    label == 'All' ? 'All' : label.split(' / ').last,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: on ? FontWeight.w700 : FontWeight.w600,
                      color: on ? Colors.white : muted,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  static String _emojiFor(String name) {
    final n = name.toLowerCase();
    const map = {
      'ai': '🤖', 'design': '🎨', 'dev': '🧑‍💻', 'code': '🧑‍💻', 'read': '📚',
      'watch': '🎬', 'movie': '🎬', 'anime': '🌸', 'fun': '🎮', 'tool': '🧰',
      'icon': '🧩', 'github': '🧑‍💻', 'news': '📰', 'music': '🎵',
    };
    for (final e in map.entries) {
      if (n.contains(e.key)) return e.value;
    }
    return '📁';
  }

  // ------------------------------------------------------------------ body

  List<Widget> _body(Color muted) {
    switch (phase) {
      case 'loading':
        return [for (var i = 0; i < 6; i++) const Padding(padding: EdgeInsets.only(bottom: 10), child: _SkeletonRow())];
      case 'unconfigured':
        return [_UnconfiguredCard(onOpen: () => Navigator.pushNamed(context, '/settings').then((_) => load()))];
      case 'error':
        return [
          ShadCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Icon(Icons.cloud_off_rounded, size: 38, color: Color(0xFFF43F5E)),
                const SizedBox(height: 12),
                Text(errorText, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 13.5, color: Colors.white70)),
                const SizedBox(height: 16),
                ShadButton(onPressed: load, child: const Text('Try again')),
              ],
            ),
          )
        ];
      case 'ok' when bookmarks.isEmpty:
        return [_EmptyCard(onOpen: () => Navigator.pushNamed(context, '/settings').then((_) => load()))];
    }

    final list = visible;
    if (list.isEmpty) {
      return [
        Padding(
          padding: const EdgeInsets.only(top: 40),
          child: Column(
            children: [
              const Icon(Icons.search_off_rounded, size: 40, color: Color(0xFF52525B)),
              const SizedBox(height: 10),
              Text('Nothing matches “${_search.text}”',
                  style: GoogleFonts.inter(fontSize: 14, color: muted)),
            ],
          ),
        )
      ];
    }
    return [for (final b in list) Padding(padding: const EdgeInsets.only(bottom: 9), child: BookmarkTile(bookmark: b))];
  }
}

// ------------------------------------------------------------------ widgets

class BookmarkTile extends StatefulWidget {
  const BookmarkTile({super.key, required this.bookmark});

  final Bookmark bookmark;

  @override
  State<BookmarkTile> createState() => _BookmarkTileState();
}

class _BookmarkTileState extends State<BookmarkTile> {
  bool copied = false;

  Future<void> _copy() async {
    await Clipboard.setData(ClipboardData(text: widget.bookmark.url));
    if (!mounted) return;
    setState(() => copied = true);
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) setState(() => copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.bookmark;
    final title = b.title.isNotEmpty ? b.title : b.host;
    return ShadCard(
      padding: const EdgeInsets.all(11),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => launchUrl(Uri.parse(b.url), mode: LaunchMode.externalApplication),
        onLongPress: _copy,
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFF16161D),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF22222B)),
              ),
              padding: const EdgeInsets.all(9),
              child: Image.network(
                'https://www.google.com/s2/favicons?sz=64&domain=${b.host}',
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const Icon(Icons.language_rounded, size: 18, color: Color(0xFF71717A)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFFFAFAFA),
                      letterSpacing: -.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    b.folder.isEmpty ? b.host : '${b.host}  ·  ${b.folder}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF8E8E99)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              child: copied
                  ? const Icon(Icons.check_rounded, key: ValueKey('ok'), size: 18, color: Color(0xFF34D399))
                  : const Icon(Icons.north_east_rounded, key: ValueKey('go'), size: 15, color: Color(0xFF52525B)),
            ),
          ],
        ),
      ),
    );
  }
}

class _SkeletonRow extends StatelessWidget {
  const _SkeletonRow();

  @override
  Widget build(BuildContext context) {
    return ShadCard(
      padding: const EdgeInsets.all(11),
      child: Row(
        children: [
          Container(width: 42, height: 42, decoration: BoxDecoration(color: const Color(0xFF16161D), borderRadius: BorderRadius.circular(12))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 11, width: 160, decoration: BoxDecoration(color: const Color(0xFF1C1C24), borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 7),
                Container(height: 9, width: 100, decoration: BoxDecoration(color: const Color(0xFF17171E), borderRadius: BorderRadius.circular(5))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _UnconfiguredCard extends StatelessWidget {
  const _UnconfiguredCard({required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 26),
      child: ShadCard(
        padding: const EdgeInsets.all(26),
        child: Column(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                gradient: MarkBaseTheme.brand,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF8B5CF6).withValues(alpha: .35), blurRadius: 26, offset: const Offset(0, 8)),
                ],
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 26),
            ),
            const SizedBox(height: 16),
            Text('Welcome to MarkBase',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -.5)),
            const SizedBox(height: 7),
            Text(
              'Point the app at your Cloudflare API and paste the sync token. '
              'Your bookmarks will follow you to every device.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 13, height: 1.55, color: const Color(0xFF9E9EA8)),
            ),
            const SizedBox(height: 20),
            ShadButton(
              onPressed: onOpen,
              leading: const Icon(Icons.key_rounded, size: 16),
              child: const Text('Connect your cloud'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 40),
      child: ShadCard(
        padding: const EdgeInsets.all(26),
        child: Column(
          children: [
            const Icon(Icons.bookmark_border_rounded, size: 42, color: Color(0xFF71717A)),
            const SizedBox(height: 12),
            Text('No bookmarks yet',
                style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -.4)),
            const SizedBox(height: 6),
            Text(
              'Add bookmarks in your browser — the extension pushes them here within seconds.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 13, height: 1.55, color: const Color(0xFF9E9EA8)),
            ),
            const SizedBox(height: 18),
            ShadButton.outline(
              onPressed: onOpen,
              leading: const Icon(Icons.settings_rounded, size: 16),
              child: const Text('Open settings'),
            ),
          ],
        ),
      ),
    );
  }
}
