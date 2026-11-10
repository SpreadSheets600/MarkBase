import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Bookmark {
  Bookmark.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String? ?? '',
        title = j['title'] as String? ?? '',
        url = j['url'] as String? ?? '',
        folder = j['folder_path'] as String? ?? '';

  final String id, title, url, folder;

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
  static const _kEndpoint = 'endpoint', _kToken = 'token';

  Future<String?> endpoint() async =>
      (await SharedPreferences.getInstance()).getString(_kEndpoint);
  Future<String?> token() async =>
      (await SharedPreferences.getInstance()).getString(_kToken);

  Future<void> save({required String endpoint, required String token}) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kEndpoint, endpoint.trim().replaceAll(RegExp(r'/+$'), ''));
    await p.setString(_kToken, token.trim());
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
    if (!_configured(e, t)) throw const ApiException('Not configured — add your URL and token first.');
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
      throw const ApiException('Network error — check the URL and your connection.');
    }
  }
}

class ApiException implements Exception {
  const ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}
