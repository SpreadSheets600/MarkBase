import 'package:flutter/material.dart';
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
      final inFolder =
          activeFolder.isEmpty || b.folder == activeFolder || (b.folder.isEmpty && activeFolder == 'Unsorted');
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
      m[b.folder.isEmpty ? 'Unsorted' : b.folder] = (m[b.folder.isEmpty ? 'Unsorted' : b.folder] ?? 0) + 1;
    }
    return Map.fromEntries(m.entries.toList()..sort((a, b) => b.value.compareTo(a.value)));
  }

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
    load();
  }

  Future<void> load() async {
    if (!await _api.isConfigured()) {
      setState(() => phase = 'unconfigured');
      return;
    }
    setState(() => phase = 'loading');
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
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          ...MarkBaseTheme.aurora(size),
          SafeArea(
            child: RefreshIndicator.adaptive(
              onRefresh: load,
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  _header,
                  SliverToBoxAdapter(child: _searchBar),
                  if (phase == 'ok' && bookmarks.isNotEmpty) ...[
                    SliverToBoxAdapter(child: _folderChips),
                    _list,
                  ],
                  SliverToBoxAdapter(child: _stateArea),
                  const SliverToBoxAdapter(child: SizedBox(height: 60)),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: phase == 'ok'
          ? FloatingActionButton.small(
              tooltip: 'Settings',
              backgroundColor: Colors.white10,
              child: const Icon(Icons.tune_rounded),
              onPressed: () => Navigator.pushNamed(context, '/settings'),
            )
          : null,
    );
  }

  SliverAppBar get _header => SliverAppBar.large(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        expandedHeight: 150,
        title: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(
                gradient: MarkBaseTheme.brand,
                borderRadius: BorderRadius.circular(13),
                boxShadow: [BoxShadow(color: const Color(0xFF8B5CF6).withValues(alpha: .45), blurRadius: 18, offset: const Offset(0, 6))],
              ),
              alignment: Alignment.center,
              child: const Text('M', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
            ),
            const SizedBox(width: 12),
            Text('MarkBase', style: Theme.of(context).textTheme.displayLarge),
          ],
        ),
        flexibleSpace: FlexibleSpaceBar(
          background: Padding(
            padding: const EdgeInsets.fromLTRB(16, 108, 16, 0),
            child: Align(
              alignment: Alignment.topLeft,
              child: Text(
                switch (phase) {
                  'ok' when bookmarks.isNotEmpty => '${bookmarks.length} bookmarks · always in sync',
                  'loading' => 'syncing with the cloud…',
                  'unconfigured' => 'let’s set things up',
                  _ => '',
                },
                style: TextStyle(color: Colors.white.withValues(alpha: .55), fontSize: 13.5, fontWeight: FontWeight.w500),
              ),
            ),
          ),
        ),
        actions: phase == 'ok'
            ? [IconButton(icon: const Icon(Icons.settings_rounded), onPressed: () => Navigator.pushNamed(context, '/settings'))]
            : null,
      );

  Widget get _searchBar => Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
        child: TextField(
          controller: _search,
          decoration: InputDecoration(
            hintText: 'Search bookmarks…',
            prefixIcon: const Icon(Icons.search_rounded, size: 22),
            suffixIcon: _search.text.isEmpty
                ? null
                : IconButton(icon: const Icon(Icons.close_rounded, size: 20), onPressed: _search.clear),
          ),
        ),
      );

  Widget get _folderChips => SizedBox(
        height: 52,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          scrollDirection: Axis.horizontal,
          children: [
            _chip('All', ''), 
            ...folderCounts.keys.map((f) => Padding(padding: const EdgeInsets.only(left: 8), child: _chip(f, f))),
          ],
        ),
      );

  Widget _chip(String label, String folder) {
    final on = activeFolder == folder;
    return ChoiceChip(
      label: Text('$label · ${folder.isEmpty ? bookmarks.length : folderCounts[label] ?? 0}'),
      selected: on,
      selectedColor: const Color(0xFFA855F7),
      showCheckmark: false,
      labelStyle: TextStyle(color: on ? Colors.white : null, fontWeight: on ? FontWeight.w700 : FontWeight.w500),
      onSelected: (_) => setState(() => activeFolder = on ? '' : folder),
    );
  }

  SliverList get _list => SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, i) => BookmarkTile(bookmark: visible[i]),
          childCount: visible.length,
        ),
      );

  Widget get _stateArea {
    switch (phase) {
      case 'loading':
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: List.generate(5, (i) => Container(
              height: 74,
              margin: const EdgeInsets.symmetric(vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                color: Colors.white.withValues(alpha: .05),
                border: Border.all(color: Colors.white.withValues(alpha: .08)),
              ),
            )),
          ),
        );
      case 'unconfigured':
        return _UnconfiguredCard(onOpen: () => Navigator.pushNamed(context, '/settings').then((_) => load()));
      case 'error':
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Icon(Icons.cloud_off_rounded, size: 44, color: Colors.redAccent),
              const SizedBox(height: 12),
              Text(errorText, textAlign: TextAlign.center),
              const SizedBox(height: 14),
              FilledButton.tonal(onPressed: load, child: const Text('Retry')),
            ],
          ),
        );
      case 'ok' when bookmarks.isEmpty:
        return const _EmptyCard();
      default:
        return const SizedBox.shrink();
    }
  }
}

class BookmarkTile extends StatelessWidget {
  const BookmarkTile({super.key, required this.bookmark});

  final Bookmark bookmark;

  void _open() => launchUrl(Uri.parse(bookmark.url), mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context) {
    final title = bookmark.title.isNotEmpty ? bookmark.title : bookmark.host;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: _open,
        onLongPress: () => ClipboardHelper.copy(context, bookmark.url),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 40, height: 40,
                  color: Colors.white10,
                  alignment: Alignment.center,
                  child: Image.network(
                    'https://www.google.com/s2/favicons?sz=64&domain=${bookmark.host}',
                    width: 26, height: 26, fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(Icons.language_rounded, size: 22, color: Colors.white54),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(
                      bookmark.folder.isEmpty ? bookmark.host : '${bookmark.host} · ${bookmark.folder}',
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.white.withValues(alpha: .5), fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: Colors.white24),
            ],
          ),
        ),
      ),
    );
  }
}

class ClipboardHelper {
  static void copy(BuildContext context, String text) {
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
      SnackBar(content: Text('Copied: $text'), duration: const Duration(seconds: 1)),
    );
  }
}

class _UnconfiguredCard extends StatelessWidget {
  const _UnconfiguredCard({required this.onOpen});
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(16),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              children: [
                ShaderMask(
                  shaderCallback: (r) => MarkBaseTheme.brand.createShader(r),
                  child: const Icon(Icons.auto_awesome_rounded, size: 46, color: Colors.white),
                ),
                const SizedBox(height: 12),
                Text('Welcome to MarkBase', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text('Point the app at your Cloudflare API and paste your sync token to bring ${'your bookmarks'} everywhere.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white.withValues(alpha: .6), fontSize: 13.5)),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: onOpen,
                  icon: const Icon(Icons.key_rounded),
                  label: const Text('Connect now'),
                ),
              ],
            ),
          ),
        ),
      );
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text('🙂', style: TextStyle(fontSize: 44)),
            const SizedBox(height: 10),
            Text('No bookmarks here yet', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text('Add bookmarks in your browser — the extension syncs them within seconds.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withValues(alpha: .55), fontSize: 13.5)),
          ],
        ),
      );
}
