# Signal Scissors — CSE 220 Final Project Presentation

LaTeX Beamer source for the final-project slide deck (16:9, `metropolis` theme). One `.tex` file per
section under `sections/`, `\input`'d from `main.tex`, so each teammate can edit their own slides without
merge conflicts.

## Compiling on Overleaf (recommended — no local LaTeX install needed)

1. Create a new Overleaf project → **Upload Project** → upload this entire `presentation/` folder as a
   zip (or create a blank project and upload `main.tex`, `sections/`, and `images/` into it, preserving
   the folder structure).
2. Set `main.tex` as the main document (Overleaf usually detects this automatically).
3. Compiler: **pdfLaTeX** (default is fine).
4. Click **Recompile**.

## Compiling locally (if you install LaTeX)

```bash
cd presentation
pdflatex main.tex
pdflatex main.tex   # run twice so the progress bar / page numbers settle
```

Requires a TeX distribution with Beamer, TikZ, and the `metropolis` theme (any reasonably full
install — e.g. MacTeX on macOS via `brew install --cask mactex`, or TeX Live on Linux — has these;
a minimal/BasicTeX install needs `tlmgr install metropolis tikz beamer` first).

## Files

- `main.tex` — preamble (theme, colors) and the list of `\input`s.
- `sections/01_title.tex` … `09_conclusion.tex` — one slide's content per file, in presentation order.
- `images/` — real screenshots captured from the running app (see root `README.md` for what each shows).
- `../speaker_notes.md` — who presents what, talking points, the live-demo script with a backup plan, and
  prepared Q&A answers.

## Editing

Each section file is a self-contained `\begin{frame}...\end{frame}`. To add, remove, or reorder slides,
edit the relevant file(s) under `sections/` and update the `\input` list in `main.tex` if you add or
remove a file entirely.
