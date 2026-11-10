import 'package:flutter/foundation.dart';

import 'api.dart';

/// App-wide library state: bookmarks + notes, with a cached-first refresh.
class LibraryStore extends ChangeNotifier {
  final _api = MarkBaseApi();

  List<Bookmark> bookmarks = [];
  List<Note> notes = [];
  String phase = 'idle'; // idle | loading | ok | error | unconfigured
  String error = '';

  /// Folder selected from the Collections tab ('' = all).
  final ValueNotifier<String> folder = ValueNotifier('');

  Map<String, int> get folders {
    final m = <String, int>{};
    for (final b in bookmarks) {
      if (b.folder.isEmpty) continue;
      m[b.folder] = (m[b.folder] ?? 0) + 1;
    }
    return Map.fromEntries(m.entries.toList()..sort((a, b) => a.key.compareTo(b.key)));
  }

  Future<void> refresh() async {
    if (!await _api.isConfigured()) {
      phase = 'unconfigured';
      bookmarks = [];
      notifyListeners();
      return;
    }
    if (bookmarks.isEmpty) {
      phase = 'loading';
      notifyListeners();
    }
    try {
      bookmarks = await _api.fetchBookmarks();
      phase = 'ok';
      error = '';
    } on ApiException catch (e) {
      error = e.message;
      phase = bookmarks.isEmpty ? 'error' : 'ok';
    }
    notifyListeners();
    // Thumbnails and page text are fetched server-side; nudge it in the background.
    _enrichSoon();
  }

  Future<void> _enrichSoon() async {
    try {
      final r = await _api.enrich();
      if (r > 0) {
        bookmarks = await _api.fetchBookmarks();
        notifyListeners();
      }
    } catch (_) {/* best effort */}
  }

  Future<void> loadNotes() async {
    try {
      notes = await _api.notes();
      notifyListeners();
    } catch (_) {/* shown as empty */}
  }

  Future<void> trash(Bookmark b) async {
    bookmarks = bookmarks.where((x) => x.id != b.id).toList();
    notifyListeners();
    await _api.trash([b.id]);
  }

  Future<void> add(String url, String title, String folder) async {
    await _api.addBookmark(url, title, folder);
    await refresh();
  }

  Future<List<Bookmark>> search(String q) => _api.search(q);

  void notifyListeners_() {
    phase = 'unconfigured';
    notifyListeners();
  }
}

final library = LibraryStore();
