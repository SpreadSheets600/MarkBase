import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../api.dart';
import '../library.dart';
import '../widgets.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  final _q = TextEditingController();
  Timer? _debounce;
  List<Bookmark> _remote = [];

  @override
  void initState() {
    super.initState();
    library.addListener(_changed);
    library.folder.addListener(_changed);
    _q.addListener(_onQuery);
    library.refresh();
  }

  @override
  void dispose() {
    library.removeListener(_changed);
    library.folder.removeListener(_changed);
    _debounce?.cancel();
    _q.dispose();
    super.dispose();
  }

  void _changed() { if (mounted) setState(() {}); }

  void _onQuery() {
    setState(() => _remote = []);
    _debounce?.cancel();
    final q = _q.text.trim();
    if (q.length < 3) return;
    _debounce = Timer(const Duration(milliseconds: 280), () async {
      try {
        final r = await library.search(q);
        if (mounted && _q.text.trim() == q) setState(() => _remote = r);
      } catch (_) {/* local results still show */}
    });
  }

  List<Bookmark> get _visible {
    final q = _q.text.trim().toLowerCase(), folder = library.folder.value;
    final local = library.bookmarks.where((b) =>
        (folder.isEmpty || b.folder == folder) &&
        (q.isEmpty || '${b.title} ${b.url} ${b.folder}'.toLowerCase().contains(q))).toList()
      ..sort((a, b) => b.added.compareTo(a.added));
    if (q.length < 3) return local;
    final have = local.map((b) => b.id).toSet();
    return [...local, ..._remote.where((b) => !have.contains(b.id) && (folder.isEmpty || b.folder == folder))];
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    final list = _visible;
    final folder = library.folder.value;

    return RefreshIndicator.adaptive(
      onRefresh: library.refresh,
      color: scheme.primary,
      backgroundColor: scheme.card,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverSafeArea(
            sliver: SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverList.list(children: [
                Row(children: [
                  Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                    ),
                    child: const Icon(Icons.bookmark_rounded, color: Colors.white, size: 21),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('MarkBase', style: GoogleFonts.inter(fontSize: 19, fontWeight: FontWeight.w600, letterSpacing: -.4, color: scheme.foreground)),
                      Text(
                        switch (library.phase) {
                          'ok' => '${library.bookmarks.length} bookmarks · ${library.folders.length} collections',
                          'loading' => 'syncing…',
                          'unconfigured' => 'sign in to sync',
                          _ => 'your bookmarks, everywhere',
                        },
                        style: GoogleFonts.inter(fontSize: 12, color: scheme.mutedForeground),
                      ),
                    ]),
                  ),
                ]),
                const SizedBox(height: 16),
                MbField(
                  controller: _q,
                  hint: 'Search titles and page contents',
                  icon: Icons.search_rounded,
                  trailing: _q.text.isEmpty
                      ? null
                      : GestureDetector(onTap: _q.clear, child: Icon(Icons.close_rounded, size: 18, color: scheme.mutedForeground)),
                ),
                if (folder.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: InputChip(
                      label: Text(shortFolder(folder)),
                      onDeleted: () => library.folder.value = '',
                      backgroundColor: scheme.accent,
                      side: BorderSide(color: scheme.primary.withValues(alpha: .5)),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
              ]),
            ),
          ),
          ..._body(scheme, list),
          const SliverToBoxAdapter(child: SizedBox(height: 130)),
        ],
      ),
    );
  }

  List<Widget> _body(ShadColorScheme scheme, List<Bookmark> list) {
    Widget msg(IconData icon, String text, {Widget? action}) => SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(32, 48, 32, 0),
            child: Column(children: [
              Icon(icon, size: 38, color: scheme.mutedForeground),
              const SizedBox(height: 12),
              Text(text, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 13.5, height: 1.5, color: scheme.mutedForeground)),
              if (action != null) ...[const SizedBox(height: 16), action],
            ]),
          ),
        );

    switch (library.phase) {
      case 'unconfigured':
        return [
          msg(Icons.lock_outline_rounded, 'Sign in with Google and your bookmarks will follow you to every device.',
              action: ShadButton(
                onPressed: () => MarkBaseApi().signInWithGoogle(),
                leading: const Icon(Icons.login_rounded, size: 16),
                child: const Text('Continue with Google'),
              )),
        ];
      case 'loading':
        return [
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList.separated(
              itemCount: 4,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (_, _) => Container(
                height: 250,
                decoration: BoxDecoration(color: scheme.card, borderRadius: BorderRadius.circular(18), border: Border.all(color: scheme.border)),
              ),
            ),
          ),
        ];
      case 'error':
        return [msg(Icons.cloud_off_rounded, library.error, action: ShadButton(onPressed: library.refresh, child: const Text('Try again')))];
    }
    if (list.isEmpty) {
      return [msg(Icons.bookmark_border_rounded, _q.text.isEmpty ? 'Nothing here yet. Bookmarks sync in a moment.' : 'Nothing matches “${_q.text}”.')];
    }
    return [
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        sliver: SliverList.separated(
          itemCount: list.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (_, i) => BookmarkCard(key: ValueKey(list[i].id), bookmark: list[i]),
        ),
      ),
    ];
  }
}
