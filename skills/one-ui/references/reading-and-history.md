# One UI v1.0 — Reading Surfaces, Scroll Anchors & Overlay Dismissal Stack

Workspaces with conversations, logs, timelines, or histories lose user trust when background updates yank scroll position, drop loaded records, or close the wrong overlay. These invariants are framework-neutral and apply across Web and Apple SwiftUI.

## 1. Stable Loaded Boundary (Append-Only & Paged History)

- Store the loaded window by **stable record identity** (e.g. oldest loaded ID / cursor), never by a sliding tail count (`items.slice(-50)`) that silently evicts older records when a new item arrives.
- Prepending older pages or appending live updates must retain every already-loaded record unless the user explicitly changes scope/filter or a real deletion event occurs.
- Distinguish an empty page with an older cursor (gap/filtered chunk) from exhausted history—never tell the user "No history" while older records remain loadable.
- Failed page fetches retain all currently loaded records and expose an explicit Retry action scoped to that read.

## 2. Visible Anchor Preservation (`<= 1px` / `<= 1pt` Tolerance)

Never rely on a raw numeric `scrollTop` to hold reading position—items above the viewport can be inserted, removed, or reflowed.

1. **Before structural mutation** (prepend, live append while away from latest, resize, filter refresh): capture `{ id: firstVisibleRecordId, offset: recordTop - scrollerTop }`.
2. **After DOM/view commit:** confirm that exact record ID still exists inside the scroller (and confirm keyed node identity has not remounted unnecessarily).
3. **Restore non-animated:** adjust scroll position by `(newRecordTop - scrollerTop) - anchor.offset` without smooth-scroll animation.
4. **Explicit deletion fallback:** if the anchored record was genuinely deleted, fall back deliberately to the nearest surviving sibling ID and document the fallback in tests. Reject an unexplained missing anchor as a verification failure.

```ts
type ReadingAnchor = { id: string; offset: number };

export function captureAnchor(scroller: HTMLElement, rowSelector: string): ReadingAnchor | null {
  const scrollerTop = scroller.getBoundingClientRect().top;
  for (const row of scroller.querySelectorAll<HTMLElement>(rowSelector)) {
    const rect = row.getBoundingClientRect();
    if (rect.bottom > scrollerTop && row.id) {
      return { id: row.id, offset: rect.top - scrollerTop };
    }
  }
  return null;
}

export function restoreAnchor(scroller: HTMLElement, anchor: ReadingAnchor): boolean {
  const row = document.getElementById(anchor.id);
  if (!row || !scroller.contains(row)) return false;
  const delta = row.getBoundingClientRect().top - scroller.getBoundingClientRect().top - anchor.offset;
  scroller.scrollTop += delta;
  return true;
}
```

## 3. Latest-Edge Following & Scoped Counters

- **At the latest edge** (within `<= 1px` bottom gap): automatically follow newly appended items within the active scope.
- **Away from the latest edge:** hold the reading anchor and preserve active text selection; display a **scoped** new-items count and an explicit **Latest** button.
- An incoming record outside the active participant, profile, or search filter **must not** increment that view's new-items badge.
- A completed jump (to a reply, search match, or Latest) must execute **once**—never replay that jump simply because a subsequent append changes list length.

## 4. In-View Search Scope

- Declare whether search covers the full backend history or only currently loaded records.
- Expose Clear, Previous/Next match controls, explicit `current / total` count, and a distinct no-matches state.
- Bind `Cmd+F` (macOS) / `Ctrl+F` (Windows/Linux) only while the reading surface is active; never hijack global browser find outside the active reading view.
- Never make an entire transcript an `aria-live` region; announce only brief status changes (e.g., match count or error recovery).

## 5. One-Layer-Per-Escape Overlay Dismissal Stack

Nested layers follow a deterministic stack order:

```text
Active listbox / menu  -->  Attachment / media preview  -->  Reading dialog / sheet  -->  Owning workspace
```

- **One Escape (or Back) closes exactly one layer.**
- Closing an open listbox/menu while a preview and dialog are open closes *only* the listbox/menu and restores focus to its trigger.
- Dismissing an attachment preview keeps the reading dialog open and returns focus to that attachment's **Preview** trigger.
- Dismissing the reading dialog returns focus to its exact opener without shifting scroll position in the workspace behind it.
- Closing and reopening a dialog resets transient preview state (reopen starts with preview collapsed), while preserving recoverable user drafts.
- Filtering out a message whose preview was open must close or reconcile that preview so an invisible preview layer never blocks Escape dismissal.
- Keep headers, search bars, and composer/footers outside the sole transcript scroller (`max-width: 56.25rem`, `max-height: 90dvh`).
