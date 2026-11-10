import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class Bookmark {
  Bookmark.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String? ?? '',
        title = j['title'] as String? ?? '',
        url = j['url'] as String? ?? '',
        folder = j['folder_path'] as String? ?? '',
        image = j['image'] as String? ?? '',
        description = j['description'] as String? ?? '',
        snippet = j['snippet'] as String? ?? '',
        added = (j['date_added'] as num?)?.toInt() ?? 0;

  final String id, title, url, folder, image, description, snippet;
  final int added;

  String get host {
    try {
      final u = Uri.parse(url);
      return u.host.startsWith('www.') ? u.host.substring(4) : u.host;
    } catch (_) {
      return url;
    }
  }
}

/// Thin client over the MarkBase API with token persistence.
class MarkBaseApi {
  static const _kEndpoint = 'endpoint', _kToken = 'token', _kName = 'name', _kEmail = 'email';

  /// Bumped whenever credentials change (e.g. a Google sign-in deep link lands).
  static final ValueNotifier<int> authChanged = ValueNotifier(0);

  /// Opens the dashboard's Google sign-in in the browser. After login the site
  /// bounces back to `markbase://auth?...`, handled by [handleAuthLink].
  Future<bool> signInWithGoogle() async {
    final saved = await endpoint();
    final base = (saved == null || saved.isEmpty ? endpointBase : saved).replaceAll(RegExp(r'/+$'), '');
    return launchUrl(Uri.parse('$base/?app=1'), mode: LaunchMode.externalApplication);
  }

  /// Returns true when [uri] was a valid sign-in hand-off and credentials were stored.
  Future<bool> handleAuthLink(Uri uri) async {
    if (uri.scheme != 'markbase' || uri.host != 'auth') return false;
    final token = uri.queryParameters['token'] ?? '';
    if (token.isEmpty) return false;
    final endpoint = uri.queryParameters['endpoint'] ?? endpointBase;
    await save(endpoint: endpoint, token: token);
    final p = await SharedPreferences.getInstance();
    await p.setString(_kName, uri.queryParameters['name'] ?? '');
    await p.setString(_kEmail, uri.queryParameters['email'] ?? '');
    authChanged.value++;
    return true;
  }

  Future<({String name, String email})> profile() async {
    final p = await SharedPreferences.getInstance();
    return (name: p.getString(_kName) ?? '', email: p.getString(_kEmail) ?? '');
  }

  Future<void> signOut() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_kToken);
    await p.remove(_kName);
    await p.remove(_kEmail);
    authChanged.value++;
  }

  /// Last endpoint we talked to, so widgets can build same-origin URLs
  /// (the favicon proxy) without awaiting storage in `build`.
  static String endpointBase = 'https://markbase-api.spreadsheets600.workers.dev';

  /// CanvasKit can't decode a cross-origin icon without CORS, so icons go
  /// through our own Worker proxy.
  static String faviconFor(String host) =>
      '${endpointBase.replaceAll(RegExp(r'/+$'), '')}/v1/favicon?domain=${Uri.encodeComponent(host)}';

  Future<String?> endpoint() async =>
      (await SharedPreferences.getInstance()).getString(_kEndpoint);
  Future<String?> token() async =>
      (await SharedPreferences.getInstance()).getString(_kToken);

  Future<void> save({required String endpoint, required String token}) async {
    final p = await SharedPreferences.getInstance();
    final clean = endpoint.trim().replaceAll(RegExp(r'/+$'), '');
    await p.setString(_kEndpoint, clean);
    await p.setString(_kToken, token.trim());
    if (clean.isNotEmpty) endpointBase = clean;
  }

  bool _configured(String? e, String? t) =>
      e != null && e.isNotEmpty && t != null && t.isNotEmpty;

  Future<bool> isConfigured() async {
    final p = await SharedPreferences.getInstance();
    return _configured(
      p.getString(_kEndpoint),
      p.getString(_kToken),
    );
  }

  /// Returns bookmarks, throws [ApiException] with a friendly message.
  Future<List<Bookmark>> fetchBookmarks() async {
    final p = await SharedPreferences.getInstance();
    final e = p.getString(_kEndpoint), t = p.getString(_kToken);
    if (!_configured(e, t)) throw const ApiException('Not configured - add your URL and token first.');
    if (e != null && e.isNotEmpty) endpointBase = e;
    try {
      final r = await http
          .get(
            Uri.parse('$e/v1/bookmarks'),
            headers: {'Authorization': 'Bearer $t'},
          )
          .timeout(const Duration(seconds: 15));
      if (r.statusCode == 401) throw const ApiException('That token was rejected (401). Check it in settings.');
      if (r.statusCode != 200) throw ApiException('API error ${r.statusCode}');
      final body = jsonDecode(r.body) as Map<String, dynamic>;
      final list = (body['bookmarks'] as List?) ?? const [];
      return list.map((j) => Bookmark.fromJson(j as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (err) {
      throw const ApiException('Network error - check the URL and your connection.');
    }
  }

  Future<Map<String, dynamic>> _req(String method, String path, [Map<String, dynamic>? body]) async {
    final p = await SharedPreferences.getInstance();
    final e = p.getString(_kEndpoint), t = p.getString(_kToken);
    if (!_configured(e, t)) throw const ApiException('Sign in to continue.');
    final uri = Uri.parse('$e$path');
    final headers = {'Authorization': 'Bearer $t', if (body != null) 'Content-Type': 'application/json'};
    try {
      final r = await (switch (method) {
        'POST' => http.post(uri, headers: headers, body: jsonEncode(body ?? {})),
        'DELETE' => http.delete(uri, headers: headers),
        _ => http.get(uri, headers: headers),
      }).timeout(const Duration(seconds: 20));
      if (r.statusCode == 401) throw const ApiException('Session expired. Sign in again.');
      if (r.statusCode >= 400) throw ApiException('API error ${r.statusCode}');
      return jsonDecode(r.body) as Map<String, dynamic>;
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException('Network error - check your connection.');
    }
  }

  Future<int> enrich() async => ((await _req('POST', '/v1/enrich', {'limit': 8}))['done'] as num?)?.toInt() ?? 0;
  Future<List<PageEntry>> pages() async =>
      ((await _req('GET', '/v1/pages'))['pages'] as List? ?? []).map((j) => PageEntry.fromJson(j as Map<String, dynamic>)).toList();
  Future<PageInfo> pageInfo(String url) async => PageInfo.fromJson(await _req('GET', '/v1/page?url=${Uri.encodeComponent(url)}'));
  Future<void> forgetPage(String url) => _req('DELETE', '/v1/pages?url=${Uri.encodeComponent(url)}');
  Future<void> addBookmark(String url, String title, String folder) =>
      _req('POST', '/v1/bookmarks', {'url': url, 'title': title, 'folder_path': folder});
  Future<void> trash(List<String> ids) => _req('POST', '/v1/bookmarks/trash', {'ids': ids});
  Future<List<Note>> notes() async =>
      ((await _req('GET', '/v1/notes'))['notes'] as List? ?? []).map((j) => Note.fromJson(j as Map<String, dynamic>)).toList();
  Future<String> saveNote(Note n) async =>
      ((await _req('POST', '/v1/notes', {'id': n.id, 'title': n.title, 'body': n.body}))['id'] as String? ?? n.id);
  Future<void> deleteNote(String id) => _req('DELETE', '/v1/notes?id=${Uri.encodeComponent(id)}');
  Future<List<Bookmark>> search(String q) async =>
      ((await _req('GET', '/v1/search?q=${Uri.encodeComponent(q)}'))['bookmarks'] as List? ?? [])
          .map((j) => Bookmark.fromJson(j as Map<String, dynamic>))
          .toList();
}

class PageEntry {
  PageEntry.fromJson(Map<String, dynamic> j)
      : url = j['url'] as String? ?? '',
        title = j['title'] as String? ?? '',
        description = j['description'] as String? ?? '',
        dwell = (j['dwell_sec'] as num?)?.toInt() ?? 0,
        visited = (j['visited_at'] as num?)?.toInt() ?? 0;
  final String url, title, description;
  final int dwell, visited;
  String get host {
    try {
      final h = Uri.parse(url).host;
      return h.startsWith('www.') ? h.substring(4) : h;
    } catch (_) {
      return url;
    }
  }
}

class PageInfo {
  PageInfo.fromJson(Map<String, dynamic> j)
      : bookmarked = j['bookmarked'] == true,
        title = j['title'] as String? ?? '',
        content = j['content'] as String? ?? '',
        words = (j['words'] as num?)?.toInt() ?? 0,
        retentionDays = (j['retention_days'] as num?)?.toInt() ?? 60,
        dwell = ((j['history'] as Map?)?['dwell_sec'] as num?)?.toInt(),
        visited = ((j['history'] as Map?)?['visited_at'] as num?)?.toInt();
  final bool bookmarked;
  final String title, content;
  final int words, retentionDays;
  final int? dwell, visited;
}

class Note {
  Note({required this.id, this.title = '', this.body = '', this.updated = 0});
  Note.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String? ?? '',
        title = j['title'] as String? ?? '',
        body = j['body'] as String? ?? '',
        updated = (j['updated_at'] as num?)?.toInt() ?? 0;
  String id, title, body;
  int updated;
}

class ApiException implements Exception {
  const ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}
