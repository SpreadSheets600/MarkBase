import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../api.dart';
import '../library.dart';

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});

  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  @override
  void initState() {
    super.initState();
    library.loadNotes();
  }

  Future<void> _open(Note n) async {
    await Navigator.push(context, MaterialPageRoute<void>(builder: (_) => NoteEditor(note: n)));
    library.loadNotes();
  }

  Future<void> _create() async {
    final api = MarkBaseApi();
    try {
      final n = Note(id: '');
      n.id = await api.saveNote(n);
      if (mounted) await _open(n);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    return ListenableBuilder(
      listenable: library,
      builder: (context, _) => SafeArea(
        child: RefreshIndicator.adaptive(
          onRefresh: library.loadNotes,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 130),
            children: [
              Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Notes', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w600, letterSpacing: -.6, color: scheme.foreground)),
                    Text('Synced everywhere, searchable', style: GoogleFonts.inter(fontSize: 13, color: scheme.mutedForeground)),
                  ]),
                ),
                ShadButton.outline(size: ShadButtonSize.sm, onPressed: _create, leading: const Icon(Icons.add_rounded, size: 16), child: const Text('New')),
              ]),
              const SizedBox(height: 16),
              if (library.notes.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 60),
                  child: Text('No notes yet. Jot something down.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: scheme.mutedForeground)),
                ),
              for (final n in library.notes)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => _open(n),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: scheme.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: scheme.border)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(n.title.isEmpty ? 'Untitled' : n.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: scheme.foreground)),
                        if (n.body.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(n.body, maxLines: 2, overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(fontSize: 12.5, height: 1.4, color: scheme.mutedForeground)),
                        ],
                      ]),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class NoteEditor extends StatefulWidget {
  const NoteEditor({super.key, required this.note});
  final Note note;

  @override
  State<NoteEditor> createState() => _NoteEditorState();
}

class _NoteEditorState extends State<NoteEditor> {
  late final _title = TextEditingController(text: widget.note.title);
  late final _body = TextEditingController(text: widget.note.body);
  final _api = MarkBaseApi();
  Timer? _t;

  void _schedule() {
    _t?.cancel();
    _t = Timer(const Duration(milliseconds: 700), _save);
  }

  Future<void> _save() async {
    widget.note.title = _title.text;
    widget.note.body = _body.text;
    try { await _api.saveNote(widget.note); } catch (_) {/* retried on next edit */}
  }

  @override
  void dispose() {
    if (_t?.isActive ?? false) { _t!.cancel(); _save(); }
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.background,
      appBar: AppBar(
        backgroundColor: scheme.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded),
            onPressed: () async {
              _t?.cancel();
              await _api.deleteNote(widget.note.id);
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
        child: Column(children: [
          TextField(
            controller: _title,
            onChanged: (_) => _schedule(),
            style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w600, color: scheme.foreground),
            decoration: InputDecoration(border: InputBorder.none, hintText: 'Title', hintStyle: TextStyle(color: scheme.mutedForeground)),
          ),
          Expanded(
            child: TextField(
              controller: _body,
              onChanged: (_) => _schedule(),
              maxLines: null,
              expands: true,
              textAlignVertical: TextAlignVertical.top,
              style: GoogleFonts.inter(fontSize: 15, height: 1.55, color: scheme.foreground),
              decoration: InputDecoration(border: InputBorder.none, hintText: 'Start writing…', hintStyle: TextStyle(color: scheme.mutedForeground)),
            ),
          ),
        ]),
      ),
    );
  }
}
