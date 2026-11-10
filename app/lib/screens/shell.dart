import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../api.dart';
import '../library.dart';
import '../widgets.dart';
import 'collections_screen.dart';
import 'history_screen.dart';
import 'library_screen.dart';
import 'notes_screen.dart';
import 'settings_screen.dart';

/// Bottom-dock shell: Library · Collections · Notes · Settings, plus a round + button.
class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  static const _share = MethodChannel('markbase/share');
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    MarkBaseApi.authChanged.addListener(library.refresh);
    _share.setMethodCallHandler((call) async {
      if (call.method == 'shared') _onShared(call.arguments as String?);
    });
    // Cold start via Share sheet.
    _share.invokeMethod<String>('getInitial').then(_onShared).catchError((_) {});
  }

  @override
  void dispose() {
    MarkBaseApi.authChanged.removeListener(library.refresh);
    super.dispose();
  }

  void _onShared(String? text) {
    final m = RegExp(r'https?://\S+').firstMatch(text ?? '');
    if (m == null || !mounted) return;
    final url = m.group(0)!;
    final title = (text ?? '').replaceFirst(url, '').trim();
    WidgetsBinding.instance.addPostFrameCallback((_) { if (mounted) showAddSheet(context, url: url, title: title); });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    final tabs = <(IconData, IconData, String)>[
      (Icons.bookmark_border_rounded, Icons.bookmark_rounded, 'Bookmarks'),
      (Icons.folder_outlined, Icons.folder_rounded, 'Collections'),
      (Icons.sticky_note_2_outlined, Icons.sticky_note_2_rounded, 'Notes'),
      (Icons.history_rounded, Icons.history_rounded, 'History'),
      (Icons.settings_outlined, Icons.settings_rounded, 'Settings'),
    ];
    return Scaffold(
      backgroundColor: scheme.background,
      extendBody: true,
      body: Stack(children: [
        Positioned(
          top: -MediaQuery.of(context).size.width * .55,
          left: 0,
          right: 0,
          height: MediaQuery.of(context).size.width * 1.1,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(colors: [const Color(0xFF8B5CF6).withValues(alpha: .15), const Color(0x008B5CF6)]),
            ),
          ),
        ),
        IndexedStack(index: _tab, children: [
          const LibraryScreen(),
          CollectionsScreen(onOpen: () => setState(() => _tab = 0)),
          const NotesScreen(),
          const HistoryScreen(),
          const SettingsScreen(embedded: true),
        ]),
        Positioned(
          left: 0, right: 0, bottom: 0,
          child: IgnorePointer(
            ignoring: false,
            child: Container(
              padding: EdgeInsets.fromLTRB(0, 28, 0, 14 + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                gradient: LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [scheme.background, scheme.background.withValues(alpha: 0)], stops: const [.4, 1]),
              ),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF151519).withValues(alpha: .92),
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: scheme.input),
                    boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 26, offset: Offset(0, 10))],
                  ),
                  child: Row(children: [
                    for (final (i, t) in tabs.indexed)
                      GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () { HapticFeedback.selectionClick(); setState(() => _tab = i); },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          width: 46, height: 42,
                          decoration: BoxDecoration(color: _tab == i ? Colors.white.withValues(alpha: .09) : Colors.transparent, borderRadius: BorderRadius.circular(30)),
                          child: Icon(_tab == i ? t.$2 : t.$1, size: 21, color: _tab == i ? scheme.foreground : scheme.mutedForeground),
                        ),
                      ),
                  ]),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: () => showAddSheet(context),
                  child: Container(
                    width: 54, height: 54,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                      boxShadow: [BoxShadow(color: const Color(0xFF8B5CF6).withValues(alpha: .55), blurRadius: 24, offset: const Offset(0, 8))],
                    ),
                    child: const Icon(Icons.add_rounded, color: Colors.white, size: 26),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ]),
    );
  }
}
