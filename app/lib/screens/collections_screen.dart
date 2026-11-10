import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../library.dart';
import '../widgets.dart';

class CollectionsScreen extends StatelessWidget {
  const CollectionsScreen({super.key, required this.onOpen});
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final scheme = ShadTheme.of(context).colorScheme;
    return ListenableBuilder(
      listenable: library,
      builder: (context, _) {
        final folders = library.folders;
        return SafeArea(
          child: CustomScrollView(slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              sliver: SliverToBoxAdapter(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Collections', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w600, letterSpacing: -.6, color: scheme.foreground)),
                  const SizedBox(height: 2),
                  Text('${folders.length} collections', style: GoogleFonts.inter(fontSize: 13, color: scheme.mutedForeground)),
                ]),
              ),
            ),
            if (folders.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Text('Folders from your browser bookmarks appear here after the first sync.',
                      textAlign: TextAlign.center, style: GoogleFonts.inter(color: scheme.mutedForeground)),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 130),
                sliver: SliverGrid.builder(
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 200, mainAxisSpacing: 18, crossAxisSpacing: 14, childAspectRatio: 1.15),
                  itemCount: folders.length,
                  itemBuilder: (_, i) {
                    final e = folders.entries.elementAt(i);
                    return FolderTile(name: e.key, count: e.value, onTap: () { library.folder.value = e.key; onOpen(); });
                  },
                ),
              ),
          ]),
        );
      },
    );
  }
}
