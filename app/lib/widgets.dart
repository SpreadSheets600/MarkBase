import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';
import 'library.dart';

const _hues = [262.0, 190.0, 152.0, 38.0, 350.0, 320.0, 220.0, 90.0];
double hueOf(String s) {
  var h = 0;
  for (final c in s.runes) {
    h = (h * 31 + c) % _hues.length;
  }
  return _hues[h];
}

Color tint(String name, {double l = .58, double a = 1}) => HSLColor.fromAHSL(a, hueOf(name), .65, l).toColor();

String shortFolder(String p) => p.split(' / ').last;

/// Thumbnail with a graceful fallback (tinted gradient + favicon + host).
class Thumb extends StatelessWidget {
  const Thumb(this.b, {super.key, this.radius = 14});
  final Bookmark b;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: const Alignment(-.6, -1),
          radius: 1.4,
          colors: [tint(b.host, l: .4, a: .35), const Color(0xFF0C0C10)],
        ),
      ),
      alignment: Alignment.center,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: Image.network(MarkBaseApi.faviconFor(b.host), width: 30, height: 30,
              errorBuilder: (_, _, _) => const Icon(Icons.language_rounded, size: 26, color: Colors.white38)),
        ),
        const SizedBox(height: 8),
        Text(b.host, style: GoogleFonts.robotoMono(fontSize: 11, color: Colors.white54)),
      ]),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: b.image.isEmpty
          ? fallback
          : Image.network(b.image, fit: BoxFit.cover, width: double.infinity, height: double.infinity,
              loadingBuilder: (c, child, p) => p == null ? child : const ColoredBox(color: Color(0xFF0C0C10)),
              errorBuilder: (_, _, _) => fallback),
    );
  }
}

class BookmarkCard extends StatelessWidget {
  const BookmarkCard({super.key, required this.bookmark});
  final Bookmark bookmark;

  Future<void> _open() => launchUrl(Uri.parse(bookmark.url), mode: LaunchMode.externalApplication);

  void _menu(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: scheme.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: 8),
          Container(width: 36, height: 4, decoration: BoxDecoration(color: scheme.border, borderRadius: BorderRadius.circular(4))),
          ListTile(
            leading: const Icon(Icons.open_in_new_rounded),
            title: const Text('Open'),
            onTap: () { Navigator.pop(ctx); _open(); },
          ),
          ListTile(
            leading: const Icon(Icons.copy_rounded),
            title: const Text('Copy link'),
            onTap: () { Clipboard.setData(ClipboardData(text: bookmark.url)); Navigator.pop(ctx); },
          ),
          ListTile(
            leading: Icon(Icons.delete_outline_rounded, color: scheme.destructive),
            title: Text('Move to trash', style: TextStyle(color: scheme.destructive)),
            onTap: () { Navigator.pop(ctx); library.trash(bookmark); },
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    final b = bookmark;
    return Container(
      decoration: BoxDecoration(
        color: scheme.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: scheme.border),
      ),
      padding: const EdgeInsets.all(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: _open,
        onLongPress: () => _menu(context),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AspectRatio(aspectRatio: 16 / 10, child: Thumb(b)),
          Padding(
            padding: const EdgeInsets.fromLTRB(6, 10, 2, 4),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(b.title.isNotEmpty ? b.title : b.host,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w500, color: scheme.foreground)),
                  const SizedBox(height: 2),
                  Text(
                    b.snippet.isNotEmpty ? b.snippet : (b.folder.isEmpty ? b.host : '${b.host}  ·  ${shortFolder(b.folder)}'),
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 11.5, color: scheme.mutedForeground),
                  ),
                ]),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: Icon(Icons.more_horiz_rounded, color: scheme.mutedForeground),
                onPressed: () => _menu(context),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// Dark folder tile (same illustration as the web dashboard).
class FolderTile extends StatelessWidget {
  const FolderTile({super.key, required this.name, required this.count, required this.onTap});
  final String name;
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        AspectRatio(aspectRatio: 160 / 120, child: CustomPaint(painter: _FolderPainter(tint(name, a: .55)), size: Size.infinite)),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(children: [
            Expanded(child: Text(shortFolder(name), maxLines: 1, overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w500, color: scheme.foreground))),
            Text('$count', style: GoogleFonts.robotoMono(fontSize: 11, color: scheme.mutedForeground)),
          ]),
        ),
      ]),
    );
  }
}

class _FolderPainter extends CustomPainter {
  _FolderPainter(this.tab);
  final Color tab;

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / 160, sy = size.height / 120;
    canvas.scale(sx, sy);
    final back = Path()
      ..moveTo(10, 24)
      ..arcToPoint(const Offset(20, 14), radius: const Radius.circular(10))
      ..lineTo(58, 14)
      ..lineTo(70, 26)
      ..lineTo(140, 26)
      ..arcToPoint(const Offset(150, 36), radius: const Radius.circular(10))
      ..lineTo(150, 102)
      ..arcToPoint(const Offset(140, 112), radius: const Radius.circular(10))
      ..lineTo(20, 112)
      ..arcToPoint(const Offset(10, 102), radius: const Radius.circular(10))
      ..close();
    canvas.drawPath(back, Paint()..color = tab);
    final front = RRect.fromRectAndRadius(const Rect.fromLTWH(10, 34, 140, 76), const Radius.circular(10));
    canvas.drawShadow(Path()..addRRect(front), Colors.black, 10, true);
    canvas.drawRRect(
      front,
      Paint()..shader = const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF2B2B33), Color(0xFF15151A)]).createShader(front.outerRect),
    );
    canvas.drawRRect(front, Paint()..style = PaintingStyle.stroke..color = const Color(0xFF383842));
  }

  @override
  bool shouldRepaint(_FolderPainter old) => old.tab != tab;
}

/// Text field used everywhere (search, add sheet) - same look as the web inputs.
class MbField extends StatefulWidget {
  const MbField({super.key, required this.controller, required this.hint, this.icon, this.keyboardType, this.trailing, this.autofocus = false, this.onSubmitted});
  final TextEditingController controller;
  final String hint;
  final IconData? icon;
  final TextInputType? keyboardType;
  final Widget? trailing;
  final bool autofocus;
  final ValueChanged<String>? onSubmitted;

  @override
  State<MbField> createState() => _MbFieldState();
}

class _MbFieldState extends State<MbField> {
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    final on = _focus.hasFocus;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: scheme.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: on ? scheme.primary : scheme.input, width: on ? 1.4 : 1),
        boxShadow: on ? [BoxShadow(color: scheme.primary.withValues(alpha: .22), blurRadius: 0, spreadRadius: 3)] : null,
      ),
      child: Row(children: [
        if (widget.icon != null) ...[Icon(widget.icon, size: 19, color: scheme.mutedForeground), const SizedBox(width: 10)],
        Expanded(
          child: TextField(
            controller: widget.controller,
            focusNode: _focus,
            autofocus: widget.autofocus,
            keyboardType: widget.keyboardType,
            onSubmitted: widget.onSubmitted,
            cursorColor: scheme.primary,
            style: GoogleFonts.inter(fontSize: 14.5, color: scheme.foreground),
            decoration: InputDecoration.collapsed(hintText: widget.hint, hintStyle: GoogleFonts.inter(fontSize: 14.5, color: scheme.mutedForeground)),
          ),
        ),
        ?widget.trailing,
      ]),
    );
  }
}

/// "Save a link" sheet - used by the dock's + button and the Android share target.
Future<void> showAddSheet(BuildContext context, {String url = '', String title = ''}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ShadTheme.of(context).colorScheme.card,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(26))),
    builder: (_) => _AddSheet(url: url, title: title),
  );
}

class _AddSheet extends StatefulWidget {
  const _AddSheet({required this.url, required this.title});
  final String url, title;

  @override
  State<_AddSheet> createState() => _AddSheetState();
}

class _AddSheetState extends State<_AddSheet> {
  late final _url = TextEditingController(text: widget.url);
  late final _title = TextEditingController(text: widget.title);
  final _custom = TextEditingController();
  String _folder = 'Bookmarks bar';
  bool _creating = false, _busy = false;
  String? _err;

  @override
  void initState() {
    super.initState();
    if (widget.url.isEmpty) {
      // A copied link is the common case - offer it straight away.
      Clipboard.getData(Clipboard.kTextPlain).then((d) {
        final m = RegExp(r'^https?://\S+$').firstMatch((d?.text ?? '').trim());
        if (m != null && mounted && _url.text.isEmpty) setState(() => _url.text = m.group(0)!);
      });
    }
  }

  @override
  void dispose() {
    _url.dispose();
    _title.dispose();
    _custom.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final u = _url.text.trim();
    if (!RegExp(r'^https?://\S+\.\S+').hasMatch(u)) {
      setState(() => _err = 'Enter a valid link starting with http(s)://');
      return;
    }
    final folder = _creating && _custom.text.trim().isNotEmpty ? _custom.text.trim() : _folder;
    setState(() { _busy = true; _err = null; });
    try {
      await library.add(u, _title.text.trim(), folder);
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      setState(() { _busy = false; _err = e.message; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    final folders = ['Bookmarks bar', ...library.folders.keys.where((f) => f != 'Bookmarks bar')];

    Widget chip(String label, bool on, VoidCallback tap, {Color? dot, IconData? icon}) => GestureDetector(
          onTap: tap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
            decoration: BoxDecoration(
              color: on ? scheme.accent : Colors.transparent,
              borderRadius: BorderRadius.circular(11),
              border: Border.all(color: on ? scheme.primary.withValues(alpha: .6) : scheme.border),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              if (dot != null) ...[Container(width: 7, height: 7, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)), const SizedBox(width: 8)],
              if (icon != null) ...[Icon(icon, size: 15, color: scheme.foreground), const SizedBox(width: 6)],
              Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: on ? scheme.foreground : scheme.mutedForeground)),
            ]),
          ),
        );

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.of(context).viewInsets.bottom + MediaQuery.of(context).padding.bottom),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('New bookmark', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w600, letterSpacing: -.5, color: scheme.foreground)),
          const SizedBox(height: 3),
          Text('Saved to your library and synced everywhere.', style: GoogleFonts.inter(fontSize: 13, color: scheme.mutedForeground)),
          const SizedBox(height: 20),
          MbField(controller: _url, hint: 'Paste a link', icon: Icons.link_rounded, keyboardType: TextInputType.url, autofocus: widget.url.isEmpty),
          const SizedBox(height: 10),
          MbField(controller: _title, hint: 'Title (optional)', icon: Icons.title_rounded),
          const SizedBox(height: 20),
          Text('COLLECTION', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.1, color: scheme.mutedForeground)),
          const SizedBox(height: 10),
          SizedBox(
            height: 38,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              for (final f in folders) Padding(
                padding: const EdgeInsets.only(right: 8),
                child: chip(shortFolder(f), !_creating && _folder == f, () => setState(() { _folder = f; _creating = false; }), dot: tint(f)),
              ),
              chip('New', _creating, () => setState(() => _creating = true), icon: Icons.add_rounded),
            ]),
          ),
          if (_creating) ...[
            const SizedBox(height: 10),
            MbField(controller: _custom, hint: 'Collection name', icon: Icons.folder_outlined, autofocus: true),
          ],
          if (_err != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_err!, style: GoogleFonts.inter(color: scheme.destructive, fontSize: 13))),
          const SizedBox(height: 22),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15),
                gradient: const LinearGradient(colors: [Color(0xFF9B6CF8), Color(0xFF7C4DFF)]),
                boxShadow: [BoxShadow(color: const Color(0xFF8B5CF6).withValues(alpha: .45), blurRadius: 22, offset: const Offset(0, 8))],
              ),
              child: TextButton(
                onPressed: _busy ? null : _save,
                style: TextButton.styleFrom(foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                child: _busy
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Save bookmark', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
