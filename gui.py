import os
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

import numpy as np
import matplotlib

matplotlib.use("TkAgg")
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure

from signal_io import generate_test_signal, load_wav, save_wav
from fourier_filter import process_band, compute_spectrum
from audio_effects import scale_amplitude, time_shift, convolution_echo, get_echo_impulse_response
from signal_analysis import rms, peak_amplitude, dominant_frequency

try:
    import sounddevice as sd
    AUDIO_PLAYBACK_AVAILABLE = True
except Exception:
    AUDIO_PLAYBACK_AVAILABLE = False


# =============================================================================
# Signal Scissors — visual design tokens matched to the approved interface mockup
# =============================================================================
FONT = "Segoe UI"
APP_BG = "#070B12"
HEADER_BG = "#08111A"
SIDEBAR_BG = "#0B1022"
CARD_BG = "#0D1520"
PLOT_BG = "#07101A"
INPUT_BG = "#0A1320"
BORDER = "#263648"
GRID = "#203043"
TEXT = "#F4F7FB"
TEXT_MUTED = "#8492A7"
TEXT_DARK = "#5B6B7E"
CYAN = "#20D6F2"
BLUE = "#397CFF"
PURPLE = "#A855F7"
MAGENTA = "#F23EBE"
GREEN = "#26D07C"


class StableActionButton(tk.Canvas):
    """Fixed-size canvas button used for primary actions in the dashboard.

    Canvas-rendered controls avoid native-widget theme and geometry changes while
    the Matplotlib canvases refresh after a processing command.
    """

    def __init__(self, parent, text, command, *, width, height, background, foreground,
                 border, hover_background=None, font=(FONT, 10, "bold")):
        self._parent_background = parent.cget("bg")
        super().__init__(
            parent,
            width=width,
            height=height,
            bg=self._parent_background,
            highlightthickness=0,
            bd=0,
            cursor="hand2",
            takefocus=1,
        )
        self._text = text
        self._command = command
        self._width = width
        self._height = height
        self._background = background
        self._foreground = foreground
        self._border = border
        self._hover_background = hover_background or background
        self._font = font
        self._hovered = False
        self.bind("<Configure>", self._draw)
        self.bind("<Enter>", self._on_enter)
        self.bind("<Leave>", self._on_leave)
        self.bind("<Button-1>", self._on_click)
        self.bind("<Return>", self._on_key)
        self._draw()

    def _draw(self, _event=None):
        self.delete("all")
        width = max(self.winfo_width(), self._width)
        height = max(self.winfo_height(), self._height)
        fill = self._hover_background if self._hovered else self._background
        # Layered rectangles create a crisp rounded-card impression that is
        # stable on every Tk theme and closely follows the mockup's actions.
        self.create_rectangle(1, 1, width - 2, height - 2, fill=fill, outline=self._border, width=1)
        self.create_text(width / 2, height / 2, text=self._text, fill=self._foreground, font=self._font)

    def _on_enter(self, _event):
        self._hovered = True
        self._draw()

    def _on_leave(self, _event):
        self._hovered = False
        self._draw()

    def _on_click(self, _event):
        self.focus_set()
        self._command()

    def _on_key(self, _event):
        self._command()


class SignalScissorsApp:
    """Tkinter implementation of the approved Signal Scissors dashboard visual."""

    def __init__(self, root):
        self.root = root
        self.root.title("Signal Scissors")
        self.root.geometry("1580x940")
        self.root.minsize(1240, 760)
        self.root.configure(bg=APP_BG)

        # Original application data model: retained and extended only where the
        # reference interface requires a Frequency Shift control.
        self.t = None
        self.signal = None
        self.freq_processed = None
        self.processed = None
        self.fs = None
        self.num_channels = 1
        self.source_name = "Demo Signal"
        self._last_band = None
        self._freq_info = None
        self._ops_info = None
        self._selection = (0.25, 0.50)
        self._knob_canvases = []

        self._configure_ttk()
        self._build_interface()
        self._load_test_signal()

    # ------------------------------------------------------------------
    # Styling primitives
    # ------------------------------------------------------------------
    def _configure_ttk(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure(
            "Signal.TCombobox",
            fieldbackground=INPUT_BG,
            background=INPUT_BG,
            foreground=TEXT,
            selectbackground=BLUE,
            selectforeground=TEXT,
            bordercolor=BORDER,
            lightcolor=INPUT_BG,
            darkcolor=INPUT_BG,
            arrowsize=10,
            padding=4,
            font=(FONT, 8),
        )
        style.map(
            "Signal.TCombobox",
            fieldbackground=[("readonly", INPUT_BG)],
            foreground=[("readonly", TEXT)],
        )

    def _label(self, parent, text=None, *, bg=CARD_BG, fg=TEXT, size=9, weight="normal", **kwargs):
        return tk.Label(
            parent,
            text=text,
            bg=bg,
            fg=fg,
            font=(FONT, size, weight),
            **kwargs,
        )

    def _button(self, parent, text, command, variant="quiet", **kwargs):
        palettes = {
            "quiet": ("#111C2A", TEXT, "#1C2B40"),
            "outline": ("#0B1420", TEXT, "#16263A"),
            "play": ("#0B1420", TEXT, "#152C4B"),
            "apply": (MAGENTA, "#FFFFFF", "#D82DA7"),
            "filter": ("#153560", "#F2FAFF", "#1C4B88"),
            "effects": ("#3B195B", "#FDF3FF", "#63298D"),
            "nav": (SIDEBAR_BG, TEXT_MUTED, "#172446"),
        }
        bg, fg, active = palettes[variant]
        return tk.Button(
            parent,
            text=text,
            command=command,
            bg=bg,
            fg=fg,
            activebackground=active,
            activeforeground=fg,
            relief=tk.FLAT,
            bd=0,
            highlightthickness=0,
            cursor="hand2",
            padx=kwargs.pop("padx", 12),
            pady=kwargs.pop("pady", 7),
            font=kwargs.pop("font", (FONT, 9, "bold")),
            **kwargs,
        )

    def _stable_action(self, parent, text, command, variant="outline", *, width, height=40, font=None):
        palettes = {
            "outline": ("#0B1420", TEXT, "#2C5E91", "#14263D"),
            "play": ("#0B1420", TEXT, CYAN, "#10294A"),
            "filter": ("#123B67", "#F2FAFF", "#2B78B5", "#1A578C"),
            "effects": ("#452064", "#FFF4FE", "#8E43B7", "#632B88"),
            "apply": (MAGENTA, "#FFFFFF", "#FF8CD7", "#D42BA6"),
        }
        bg, fg, border, hover = palettes[variant]
        return StableActionButton(
            parent,
            text,
            command,
            width=width,
            height=height,
            background=bg,
            foreground=fg,
            border=border,
            hover_background=hover,
            font=font or (FONT, 10, "bold"),
        )

    def _input(self, parent, variable, width=7):
        return tk.Entry(
            parent,
            textvariable=variable,
            width=width,
            bg=INPUT_BG,
            fg=TEXT,
            insertbackground=TEXT,
            relief=tk.FLAT,
            bd=0,
            justify="right",
            highlightthickness=1,
            highlightbackground=BORDER,
            highlightcolor=BLUE,
            font=(FONT, 8),
        )

    def _card(self, parent, title, *, badge=None, fill=True):
        card = tk.Frame(parent, bg=CARD_BG, highlightbackground=BORDER, highlightthickness=1)
        header = tk.Frame(card, bg=CARD_BG, height=39)
        header.pack(fill=tk.X, padx=14, pady=(7, 0))
        header.pack_propagate(False)
        self._label(header, title, bg=CARD_BG, fg=TEXT, size=11, weight="bold").pack(side=tk.LEFT, pady=8)
        if badge:
            self._label(
                header,
                badge,
                bg="#152044",
                fg=PURPLE,
                size=8,
                weight="bold",
                padx=8,
                pady=3,
            ).pack(side=tk.RIGHT, pady=6)
        else:
            self._label(header, "ⓘ", bg=CARD_BG, fg=TEXT_MUTED, size=10).pack(side=tk.RIGHT, pady=7)
        card.header = header
        body = tk.Frame(card, bg=CARD_BG)
        if fill:
            body.pack(fill=tk.BOTH, expand=True, padx=14, pady=(2, 12))
        else:
            body.pack(fill=tk.X, padx=14, pady=(2, 12))
        return card, body

    def _panel_header_controls(self, parent, include_expand=False):
        controls = tk.Frame(parent.header, bg=CARD_BG)
        controls.pack(side=tk.RIGHT, pady=6)
        for text in (["⌕"] + (["⛶"] if include_expand else []) + ["•••"]):
            self._label(controls, text, bg=CARD_BG, fg=TEXT, size=11).pack(side=tk.LEFT, padx=5)

    # ------------------------------------------------------------------
    # Main layout: same hierarchy as the approved generated interface
    # ------------------------------------------------------------------
    def _build_interface(self):
        self._build_header()

        shell = tk.Frame(self.root, bg=APP_BG)
        shell.pack(fill=tk.BOTH, expand=True)
        shell.grid_columnconfigure(0, minsize=170)
        shell.grid_columnconfigure(1, weight=1)
        shell.grid_columnconfigure(2, minsize=350)
        shell.grid_rowconfigure(0, weight=1)

        self._build_sidebar(shell).grid(row=0, column=0, sticky="nsew")

        workspace = tk.Frame(shell, bg=APP_BG)
        workspace.grid(row=0, column=1, sticky="nsew", padx=12, pady=12)
        workspace.grid_columnconfigure(0, weight=1)
        workspace.grid_rowconfigure(0, weight=10)
        workspace.grid_rowconfigure(1, weight=9)

        upper = tk.Frame(workspace, bg=APP_BG)
        upper.grid(row=0, column=0, sticky="nsew", pady=(0, 12))
        upper.grid_columnconfigure(0, weight=1)
        upper.grid_columnconfigure(1, weight=1)
        upper.grid_rowconfigure(0, weight=1)

        self._build_original_panel(upper).grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        self._build_spectrum_panel(upper).grid(row=0, column=1, sticky="nsew", padx=(6, 0))
        self._build_processed_panel(workspace).grid(row=1, column=0, sticky="nsew")

        controls = tk.Frame(shell, bg=APP_BG)
        controls.grid(row=0, column=2, sticky="nsew", padx=(0, 12), pady=12)
        self._build_right_controls(controls)
        self._build_status_bar()

    def _build_header(self):
        header = tk.Frame(self.root, bg=HEADER_BG, height=82, highlightbackground=BORDER, highlightthickness=1)
        header.pack(fill=tk.X)
        header.pack_propagate(False)

        # macOS-like dots copied from the reference visual
        dots = tk.Frame(header, bg=HEADER_BG)
        dots.pack(side=tk.LEFT, padx=(20, 18), pady=28)
        for color in ("#FF5F57", "#FFBD2E", "#28C840"):
            tk.Canvas(dots, width=15, height=15, bg=HEADER_BG, highlightthickness=0).pack(side=tk.LEFT, padx=4)
            canvas = dots.winfo_children()[-1]
            canvas.create_oval(2, 2, 13, 13, fill=color, outline=color)

        self._label(header, "Signal Scissors", bg=HEADER_BG, fg=TEXT, size=24, weight="bold").pack(
            side=tk.LEFT, pady=23
        )
        self._label(
            header,
            "●  READY",
            bg="#0C2B25",
            fg=GREEN,
            size=9,
            weight="bold",
            padx=10,
            pady=5,
        ).pack(side=tk.LEFT, padx=26, pady=23)

        # A fixed-width action group prevents the two required text labels from
        # being squeezed out of view on narrower laptop screens.
        header_actions = tk.Frame(header, bg=HEADER_BG, width=460, height=52)
        header_actions.pack(side=tk.RIGHT, padx=18, pady=14)
        header_actions.pack_propagate(False)
        self._stable_action(
            header_actions, "Load Audio", self.on_load_file, "outline",
            width=138, height=44, font=(FONT, 10, "bold")
        ).pack(side=tk.LEFT, padx=5)
        self._stable_action(
            header_actions, "Export WAV", self.on_save, "outline",
            width=138, height=44, font=(FONT, 10, "bold")
        ).pack(side=tk.LEFT, padx=5)
        self._stable_action(
            header_actions, "▶", lambda: self.on_play(self.processed), "play",
            width=56, height=48, font=(FONT, 15, "bold")
        ).pack(side=tk.LEFT, padx=(13, 0))

    def _build_sidebar(self, parent):
        bar = tk.Frame(parent, bg=SIDEBAR_BG, highlightbackground=BORDER, highlightthickness=1)
        nav = tk.Frame(bar, bg=SIDEBAR_BG)
        nav.pack(fill=tk.X, padx=9, pady=(12, 0))
        self._nav_item(nav, "▥", "Workspace", True)
        self._nav_item(nav, "☆", "Presets", False)
        self._nav_item(nav, "◴", "History", False)
        self._nav_item(nav, "⚙", "Settings", False)

        # Decorative spectrum trace at the base of the reference side rail.
        rail_spacer = tk.Frame(bar, bg=SIDEBAR_BG)
        rail_spacer.pack(fill=tk.BOTH, expand=True)
        self.sidebar_trace = tk.Canvas(bar, bg=SIDEBAR_BG, height=82, highlightthickness=0)
        self.sidebar_trace.pack(fill=tk.X, padx=12, pady=(0, 9))
        self.sidebar_trace.bind("<Configure>", self._draw_sidebar_trace)
        return bar

    def _nav_item(self, parent, icon, label, active):
        bg = "#202A78" if active else SIDEBAR_BG
        fg = TEXT if active else TEXT_MUTED
        item = tk.Frame(parent, bg=bg, height=60)
        item.pack(fill=tk.X, pady=2)
        item.pack_propagate(False)
        if active:
            tk.Frame(item, bg=CYAN, width=3).pack(side=tk.LEFT, fill=tk.Y)
        self._label(item, icon, bg=bg, fg=fg, size=22).pack(side=tk.LEFT, padx=(14, 10), pady=13)
        self._label(item, label, bg=bg, fg=fg, size=11, weight="bold" if active else "normal").pack(side=tk.LEFT, pady=19)

    def _draw_sidebar_trace(self, event=None):
        canvas = self.sidebar_trace
        canvas.delete("all")
        width = max(canvas.winfo_width(), 10)
        height = max(canvas.winfo_height(), 10)
        x = np.linspace(0, width, 80)
        y = height / 2 + (np.sin(x * 0.12) * 10 + np.sin(x * 0.4) * 16) * np.exp(-((x - width * 0.52) ** 2) / (width * 0.45) ** 2)
        points = [coord for point in zip(x, y) for coord in point]
        canvas.create_line(points, fill=PURPLE, width=1, smooth=True)

    # ------------------------------------------------------------------
    # Centre signal panels
    # ------------------------------------------------------------------
    def _build_original_panel(self, parent):
        card, body = self._card(parent, "Original Signal")
        self._panel_header_controls(card, include_expand=False)
        self.fig_original = Figure(facecolor=CARD_BG, dpi=100)
        self.ax_original = self.fig_original.add_subplot(111)
        self.canvas_original = FigureCanvasTkAgg(self.fig_original, master=body)
        self.canvas_original.get_tk_widget().configure(bg=CARD_BG, highlightthickness=0)
        self.canvas_original.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        self._build_original_transport(body)
        return card

    def _build_original_transport(self, parent):
        line = tk.Frame(parent, bg=BORDER, height=1)
        line.pack(fill=tk.X, pady=(4, 6))
        row = tk.Frame(parent, bg=CARD_BG)
        row.pack(fill=tk.X)
        self._button(row, "▶", lambda: self.on_play(self.signal), "quiet", padx=9, pady=5, font=(FONT, 10, "bold")).pack(side=tk.LEFT)
        self.original_time_label = self._label(row, "0:00.000 / 0:00.000", bg=CARD_BG, fg=CYAN, size=8, weight="bold")
        self.original_time_label.pack(side=tk.LEFT, padx=12)
        self.original_seek = tk.Canvas(row, bg=CARD_BG, height=22, highlightthickness=0)
        self.original_seek.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(3, 8))
        self.original_seek.bind("<Configure>", lambda _event: self._draw_seekbar(self.original_seek, CYAN, 0.48))
        self._label(row, "⌕", bg=CARD_BG, fg=TEXT, size=12).pack(side=tk.RIGHT)

    def _build_spectrum_panel(self, parent):
        card, body = self._card(parent, "Fourier Transform")
        self._panel_header_controls(card, include_expand=True)
        self.fig_spectrum = Figure(facecolor=CARD_BG, dpi=100)
        self.ax_spectrum = self.fig_spectrum.add_subplot(111)
        self.canvas_spectrum = FigureCanvasTkAgg(self.fig_spectrum, master=body)
        self.canvas_spectrum.get_tk_widget().configure(bg=CARD_BG, highlightthickness=0)
        self.canvas_spectrum.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        self._build_spectral_range(body)
        return card

    def _build_spectral_range(self, parent):
        divider = tk.Frame(parent, bg=BORDER, height=1)
        divider.pack(fill=tk.X, pady=(4, 7))
        row = tk.Frame(parent, bg=CARD_BG)
        row.pack(fill=tk.X)
        self.band_enabled_var = tk.BooleanVar(value=False)
        tk.Checkbutton(
            row,
            text="",
            variable=self.band_enabled_var,
            command=self._toggle_band_filter,
            bg=CARD_BG,
            activebackground=CARD_BG,
            selectcolor=INPUT_BG,
            highlightthickness=0,
        ).pack(side=tk.LEFT)
        self.low_freq_var = tk.DoubleVar(value=20.0)
        self.high_freq_var = tk.DoubleVar(value=20000.0)
        self.operation_var = tk.StringVar(value="Keep")
        self.low_entry = self._input(row, self.low_freq_var, 6)
        self.low_entry.pack(side=tk.LEFT, padx=(3, 5), ipady=3)
        self._label(row, "Hz", bg=CARD_BG, fg=TEXT_MUTED, size=8).pack(side=tk.LEFT)
        self.range_bar = tk.Canvas(row, bg=CARD_BG, height=24, width=150, highlightthickness=0)
        self.range_bar.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=8)
        self.range_bar.bind("<Configure>", self._draw_range_bar)
        self.high_entry = self._input(row, self.high_freq_var, 7)
        self.high_entry.pack(side=tk.LEFT, padx=(5, 3), ipady=3)
        self._label(row, "Hz", bg=CARD_BG, fg=TEXT_MUTED, size=8).pack(side=tk.LEFT)
        self.operation_combo = ttk.Combobox(
            row,
            textvariable=self.operation_var,
            values=["Keep", "Cut", "Attenuate", "Amplify"],
            width=9,
            state="readonly",
            style="Signal.TCombobox",
        )
        self.operation_combo.pack(side=tk.LEFT, padx=(7, 0))
        self._stable_action(
            row, "Apply Filter", self.on_apply_frequency_processing, "filter",
            width=102, height=32, font=(FONT, 8, "bold")
        ).pack(side=tk.LEFT, padx=(7, 0))
        self._toggle_band_filter()

    def _build_processed_panel(self, parent):
        card, body = self._card(parent, "Processed Output", badge="●  Live Preview")
        self.fig_processed = Figure(facecolor=CARD_BG, dpi=100)
        self.ax_processed = self.fig_processed.add_subplot(111)
        self.canvas_processed = FigureCanvasTkAgg(self.fig_processed, master=body)
        self.canvas_processed.get_tk_widget().configure(bg=CARD_BG, highlightthickness=0)
        self.canvas_processed.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        self._build_output_transport(body)
        return card

    def _build_output_transport(self, parent):
        line = tk.Frame(parent, bg=BORDER, height=1)
        line.pack(fill=tk.X, pady=(4, 6))
        row = tk.Frame(parent, bg=CARD_BG)
        row.pack(fill=tk.X)
        self._button(row, "▶", lambda: self.on_play(self.processed), "quiet", padx=9, pady=5, font=(FONT, 10, "bold")).pack(side=tk.LEFT)
        self.processed_time_label = self._label(row, "0:00.000 / 0:00.000", bg=CARD_BG, fg=MAGENTA, size=8, weight="bold")
        self.processed_time_label.pack(side=tk.LEFT, padx=12)
        self.processed_seek = tk.Canvas(row, bg=CARD_BG, height=22, highlightthickness=0)
        self.processed_seek.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(3, 14))
        self.processed_seek.bind("<Configure>", lambda _event: self._draw_seekbar(self.processed_seek, MAGENTA, 0.37))
        self.output_meter = tk.Canvas(row, bg=CARD_BG, width=200, height=31, highlightthickness=0)
        self.output_meter.pack(side=tk.RIGHT)
        self.output_meter.bind("<Configure>", lambda _event: self._draw_meter())

    def _draw_seekbar(self, canvas, color, position):
        canvas.delete("all")
        width = max(canvas.winfo_width(), 20)
        height = max(canvas.winfo_height(), 12)
        y = height // 2
        canvas.create_line(4, y, width - 4, y, fill="#344155", width=3)
        filled = 4 + (width - 8) * position
        canvas.create_line(4, y, filled, y, fill=color, width=3)
        canvas.create_oval(filled - 5, y - 5, filled + 5, y + 5, fill=color, outline="#EAF7FF", width=1)

    def _draw_range_bar(self, event=None):
        canvas = self.range_bar
        canvas.delete("all")
        width = max(canvas.winfo_width(), 40)
        y = 12
        left, right = int(width * 0.12), int(width * 0.82)
        canvas.create_line(4, y, width - 4, y, fill="#374358", width=4)
        canvas.create_line(left, y, right, y, fill=PURPLE, width=4)
        canvas.create_oval(left - 6, y - 6, left + 6, y + 6, fill=CYAN, outline="#EAF7FF", width=1)
        canvas.create_oval(right - 6, y - 6, right + 6, y + 6, fill=MAGENTA, outline="#EAF7FF", width=1)

    def _draw_meter(self):
        canvas = self.output_meter
        canvas.delete("all")
        width = max(canvas.winfo_width(), 120)
        bands = 26
        for row, letter in enumerate(("L", "R")):
            y = 8 + row * 12
            canvas.create_text(4, y, text=letter, fill=TEXT_MUTED, font=(FONT, 7), anchor="w")
            for band in range(bands):
                x0 = 22 + band * ((width - 28) / bands)
                color = CYAN if band < 18 else (PURPLE if band < 23 else MAGENTA)
                canvas.create_rectangle(x0, y - 3, x0 + 4, y + 2, fill=color, outline="")

    # ------------------------------------------------------------------
    # Right-hand controls: card order, labels, controls and colours match image
    # ------------------------------------------------------------------
    def _build_right_controls(self, parent):
        # This command strip remains visible at the top of the control column,
        # even when a smaller screen cannot display the final bottom button.
        command_strip = tk.Frame(parent, bg="#101B2B", highlightbackground=BORDER, highlightthickness=1)
        command_strip.pack(fill=tk.X, pady=(0, 8))
        self._label(command_strip, "PROCESS", bg="#101B2B", fg=TEXT_MUTED, size=8, weight="bold").pack(
            side=tk.LEFT, padx=(10, 7), pady=9
        )
        self._stable_action(command_strip, "Filter", self.on_apply_frequency_processing, "filter", width=67, height=31, font=(FONT, 8, "bold")).pack(side=tk.LEFT, padx=2, pady=4)
        self._stable_action(command_strip, "Effects", self.on_apply_processing, "effects", width=70, height=31, font=(FONT, 8, "bold")).pack(side=tk.LEFT, padx=2, pady=4)
        self._stable_action(command_strip, "Apply All", self.on_apply_all, "apply", width=80, height=31, font=(FONT, 8, "bold")).pack(side=tk.RIGHT, padx=6, pady=4)

        self._build_scale_card(parent).pack(fill=tk.X, pady=(0, 8))
        self._build_delay_card(parent).pack(fill=tk.X, pady=(0, 8))
        self._build_shift_card(parent).pack(fill=tk.X, pady=(0, 8))
        self._build_echo_card(parent).pack(fill=tk.X, pady=(0, 8))
        self._build_chain_card(parent).pack(fill=tk.X, pady=(0, 12))
        # Exact mockup equivalent: a large, full-width magenta primary action.
        apply_button = self._stable_action(
            parent, "▥  Apply Processing", self.on_apply_all, "apply",
            width=322, height=56, font=(FONT, 13, "bold")
        )
        apply_button.pack(fill=tk.X)

    def _build_scale_card(self, parent):
        card, body = self._card(parent, "Signal Scale", fill=False)
        self.gain_var = tk.DoubleVar(value=1.25)
        self._stage_control(body, "Gain", self.gain_var, 0.25, 4.0, CYAN, lambda value: f"{value:.2f}×", 0.05, "0.25×", "4×")
        return card

    def _build_delay_card(self, parent):
        card, body = self._card(parent, "Delay", fill=False)
        self.delay_var = tk.DoubleVar(value=280.0)
        self._stage_control(body, "Time", self.delay_var, 1, 2000, CYAN, lambda value: f"{value:.0f} ms", 5, "1 ms", "2000 ms")
        self.feedback_var = tk.DoubleVar(value=32.0)
        self._stage_control(body, "Feedback", self.feedback_var, 0, 95, CYAN, lambda value: f"{value:.0f}%", 1, "0%", "100%", compact=True)
        return card

    def _build_shift_card(self, parent):
        card, body = self._card(parent, "Frequency Shift", fill=False)
        self.frequency_shift_var = tk.DoubleVar(value=440.0)
        self._stage_control(body, "", self.frequency_shift_var, -2000, 2000, PURPLE, lambda value: f"{value:+.0f} Hz", 10, "−2000 Hz", "+2000 Hz")
        return card

    def _build_echo_card(self, parent):
        card, body = self._card(parent, "Echo", fill=False)
        self.echo_mix_var = tk.DoubleVar(value=45.0)
        self._stage_control(body, "Mix", self.echo_mix_var, 0, 100, MAGENTA, lambda value: f"{value:.0f}%", 1, "0%", "100%")
        self.echo_enabled_var = tk.BooleanVar(value=True)
        echo_row = tk.Frame(body, bg=CARD_BG)
        echo_row.pack(fill=tk.X, pady=(0, 2))
        self._label(echo_row, "Enabled", bg=CARD_BG, fg=TEXT, size=9, weight="bold").pack(side=tk.LEFT)
        self._toggle(echo_row, self.echo_enabled_var, MAGENTA).pack(side=tk.RIGHT)
        return card

    def _build_chain_card(self, parent):
        card, body = self._card(parent, "Processing Chain", fill=False)
        items = [("Scale", CYAN), ("Delay", BLUE), ("Frequency Shift", PURPLE), ("Echo", MAGENTA)]
        chain = tk.Frame(body, bg=CARD_BG)
        chain.pack(fill=tk.X)
        for index, (name, color) in enumerate(items):
            part = tk.Frame(chain, bg=CARD_BG)
            part.pack(side=tk.LEFT, expand=True)
            self._label(part, "●", bg=CARD_BG, fg=color, size=18).pack()
            self._label(part, name, bg=CARD_BG, fg=TEXT, size=7).pack()
            if index < len(items) - 1:
                self._label(chain, "→", bg=CARD_BG, fg=TEXT_MUTED, size=12).pack(side=tk.LEFT, pady=8)
        return card

    def _stage_control(self, parent, label, variable, minimum, maximum, color, formatter, resolution, left_text, right_text, compact=False):
        row = tk.Frame(parent, bg=CARD_BG)
        row.pack(fill=tk.X, pady=(0, 7 if compact else 9))
        knob = self._knob(row, variable, minimum, maximum, color)
        knob.pack(side=tk.LEFT, padx=(0, 10))
        details = tk.Frame(row, bg=CARD_BG)
        details.pack(side=tk.LEFT, fill=tk.X, expand=True, pady=3)
        title = self._label(details, label, bg=CARD_BG, fg=TEXT, size=9, weight="bold")
        title.pack(side=tk.LEFT)
        value_label = self._label(details, "", bg="#0B1724", fg=color, size=10, weight="bold", padx=8, pady=4)
        value_label.pack(side=tk.RIGHT)
        slider = tk.Scale(
            details,
            from_=minimum,
            to=maximum,
            orient=tk.HORIZONTAL,
            variable=variable,
            resolution=resolution,
            showvalue=False,
            bg=CARD_BG,
            fg=TEXT_MUTED,
            activebackground=color,
            highlightthickness=0,
            bd=0,
            troughcolor="#233245",
            sliderrelief=tk.FLAT,
            sliderlength=14,
            length=185,
        )
        slider.pack(fill=tk.X, pady=(8, 0))
        scale_labels = tk.Frame(details, bg=CARD_BG)
        scale_labels.pack(fill=tk.X)
        self._label(scale_labels, left_text, bg=CARD_BG, fg=TEXT_MUTED, size=7).pack(side=tk.LEFT)
        self._label(scale_labels, right_text, bg=CARD_BG, fg=TEXT_MUTED, size=7).pack(side=tk.RIGHT)

        def update_value(*_):
            value_label.config(text=formatter(variable.get()))

        variable.trace_add("write", update_value)
        update_value()

    def _knob(self, parent, variable, minimum, maximum, color):
        canvas = tk.Canvas(parent, width=62, height=62, bg=CARD_BG, highlightthickness=0)
        self._knob_canvases.append((canvas, variable, minimum, maximum, color))

        def redraw(*_):
            canvas.delete("all")
            value = float(variable.get())
            ratio = max(0.0, min(1.0, (value - minimum) / (maximum - minimum)))
            canvas.create_oval(5, 5, 57, 57, fill="#111B28", outline="#28374B", width=2)
            canvas.create_arc(7, 7, 55, 55, start=130, extent=280, style=tk.ARC, outline=color, width=3)
            angle = np.deg2rad(130 + 280 * ratio)
            cx, cy = 31, 31
            x2, y2 = cx + 17 * np.cos(angle), cy + 17 * np.sin(angle)
            canvas.create_line(cx, cy, x2, y2, fill=TEXT, width=2)
            canvas.create_oval(28, 28, 34, 34, fill="#172437", outline="")

        variable.trace_add("write", redraw)
        redraw()
        return canvas

    def _toggle(self, parent, variable, color):
        canvas = tk.Canvas(parent, width=43, height=24, bg=CARD_BG, highlightthickness=0, cursor="hand2")

        def redraw(*_):
            canvas.delete("all")
            enabled = bool(variable.get())
            track = color if enabled else "#2C3A50"
            canvas.create_oval(1, 3, 42, 22, fill=track, outline=track)
            x = 31 if enabled else 12
            canvas.create_oval(x - 8, 4, x + 8, 20, fill="#FFFFFF", outline="#DDE6F2")

        def flip(_event):
            variable.set(not variable.get())

        canvas.bind("<Button-1>", flip)
        variable.trace_add("write", redraw)
        redraw()
        return canvas

    # ------------------------------------------------------------------
    # File, playback, reset and processing actions retained from gui.py
    # ------------------------------------------------------------------
    def _get_default_audio_dir(self):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        for path in (os.path.join(script_dir, "audio"), os.path.expanduser("~/Music"), os.path.expanduser("~/Downloads"), os.path.expanduser("~")):
            if os.path.isdir(path):
                return path
        return os.getcwd()

    def _load_test_signal(self):
        self.t, self.signal, self.fs, self.num_channels = generate_test_signal(freqs=(200, 1000, 2500))
        self.freq_processed = np.array(self.signal, copy=True)
        self.processed = np.array(self.signal, copy=True)
        self.source_name = "Demo multi-tone signal"
        self._reset_processing_state()
        self.status_var.set("Loaded synthetic signal: 200 Hz, 1000 Hz, 2500 Hz.")
        self._redraw()

    def on_load_file(self):
        path = filedialog.askopenfilename(
            title="Select audio file",
            initialdir=self._get_default_audio_dir(),
            filetypes=[("WAV audio", "*.wav"), ("All files", "*.*")],
        )
        if not path:
            return
        try:
            self.t, self.signal, self.fs, self.num_channels = load_wav(path)
            self.freq_processed = np.array(self.signal, copy=True)
            self.processed = np.array(self.signal, copy=True)
            self.source_name = os.path.basename(path)
            self._reset_processing_state()
            self.status_var.set(f"Loaded {self.source_name}")
            self._redraw()
        except Exception as exc:
            messagebox.showerror("Unable to load audio", str(exc))

    def on_save(self):
        if self.processed is None:
            return
        path = filedialog.asksaveasfilename(
            title="Export processed audio",
            defaultextension=".wav",
            filetypes=[("WAV audio", "*.wav")],
        )
        if path:
            try:
                save_wav(path, self.processed, self.fs)
                self.status_var.set(f"Exported processed audio: {os.path.basename(path)}")
            except Exception as exc:
                messagebox.showerror("Export Error", str(exc))

    def on_play(self, signal):
        if signal is None:
            return
        if not AUDIO_PLAYBACK_AVAILABLE:
            messagebox.showwarning("Playback unavailable", "Install sounddevice to play audio from Signal Scissors.")
            return
        try:
            sd.stop()
            sd.play(signal, self.fs)
            self.status_var.set("Playing audio preview…")
        except Exception as exc:
            messagebox.showerror("Playback Error", str(exc))

    def on_stop(self):
        if AUDIO_PLAYBACK_AVAILABLE:
            sd.stop()
            self.status_var.set("Playback stopped.")

    def on_reset(self):
        if self.signal is None:
            return
        self.freq_processed = np.array(self.signal, copy=True)
        self.processed = np.array(self.signal, copy=True)
        self._reset_processing_state()
        self.status_var.set("Reset to original source audio.")
        self._redraw()

    def _reset_processing_state(self):
        self._last_band = None
        self._freq_info = None
        self._ops_info = None

    def _toggle_band_filter(self):
        state = tk.NORMAL if self.band_enabled_var.get() else tk.DISABLED
        self.low_entry.config(state=state)
        self.high_entry.config(state=state)
        self.operation_combo.config(state="readonly" if state == tk.NORMAL else "disabled")

    def _apply_frequency_filter(self):
        if not self.band_enabled_var.get():
            self.freq_processed = np.array(self.signal, copy=True)
            self._last_band = None
            self._freq_info = None
            return True
        try:
            low = float(self.low_freq_var.get())
            high = float(self.high_freq_var.get())
            operation = self.operation_var.get().lower()
            nyquist = self.fs / 2.0
            if low < 0 or high <= low:
                raise ValueError("Use a valid frequency band where high frequency is greater than low frequency.")
            if high > nyquist:
                raise ValueError(f"High frequency must be at most the Nyquist frequency ({nyquist:.0f} Hz).")
            if operation == "keep":
                from fourier_filter import band_filter
                self.freq_processed = band_filter(self.signal, self.fs, low, high, mode="keep")
                strength = None
            else:
                strength = 0.30 if operation == "attenuate" else 1.50 if operation == "amplify" else 1.0
                self.freq_processed = process_band(self.signal, self.fs, low, high, operation=operation, strength=strength)
            self._last_band = (low, high)
            self._freq_info = {"band": (low, high), "operation": operation.capitalize(), "strength": strength}
            return True
        except Exception as exc:
            messagebox.showerror("Frequency Filter Error", str(exc))
            return False

    def on_apply_frequency_processing(self):
        if self._apply_frequency_filter():
            self.processed = np.array(self.freq_processed, copy=True)
            self._ops_info = None
            self.status_var.set("Frequency filter applied.")
            self._redraw()

    @staticmethod
    def _frequency_shift_channel(data, sample_rate, shift_hz):
        """Real-audio frequency translation through an FFT-derived analytic signal."""
        data = np.asarray(data, dtype=float)
        count = data.size
        if count == 0 or abs(shift_hz) < 1e-9:
            return np.array(data, copy=True)
        spectrum = np.fft.fft(data)
        mask = np.zeros(count)
        if count % 2 == 0:
            mask[0] = mask[count // 2] = 1.0
            mask[1: count // 2] = 2.0
        else:
            mask[0] = 1.0
            mask[1: (count + 1) // 2] = 2.0
        analytic = np.fft.ifft(spectrum * mask)
        time_axis = np.arange(count) / float(sample_rate)
        return np.real(analytic * np.exp(2j * np.pi * shift_hz * time_axis))

    def _frequency_shift(self, data, shift_hz):
        data = np.asarray(data)
        if data.ndim == 1:
            return self._frequency_shift_channel(data, self.fs, shift_hz)
        if data.ndim == 2:
            return np.column_stack([self._frequency_shift_channel(data[:, channel], self.fs, shift_hz) for channel in range(data.shape[1])])
        raise ValueError("Frequency shifting needs mono or multi-channel audio data.")

    @staticmethod
    def _pad_to_length(data, length):
        data = np.asarray(data)
        if data.shape[0] >= length:
            return data[:length]
        return np.pad(data, [(0, length - data.shape[0])] + [(0, 0)] * (data.ndim - 1), mode="constant")

    def _blend_echo(self, dry, wet, mix):
        length = max(np.asarray(dry).shape[0], np.asarray(wet).shape[0])
        return self._pad_to_length(dry, length) * (1.0 - mix) + self._pad_to_length(wet, length) * mix

    def on_apply_processing(self):
        if self.freq_processed is None:
            return
        try:
            result = np.array(self.freq_processed, copy=True)
            gain = float(self.gain_var.get())
            result = scale_amplitude(result, gain)
            delay_ms = float(self.delay_var.get())
            if delay_ms > 0:
                result = time_shift(result, self.fs, delay_ms)
            shift_hz = float(self.frequency_shift_var.get())
            if abs(shift_hz) > 1e-9:
                result = self._frequency_shift(result, shift_hz)
            echo_info = None
            if self.echo_enabled_var.get():
                feedback = float(self.feedback_var.get()) / 100.0
                wet_mix = float(self.echo_mix_var.get()) / 100.0
                if not 0 <= feedback <= 0.95:
                    raise ValueError("Feedback must stay between 0% and 95%.")
                echoed = convolution_echo(result, self.fs, delay_ms=delay_ms, decay=feedback, num_echoes=3)
                result = self._blend_echo(result, echoed, wet_mix)
                echo_info = (delay_ms, feedback * 100.0, 3, wet_mix * 100.0)
            self.processed = result
            self._ops_info = {"gain": gain, "delay": delay_ms, "shift": shift_hz, "echo": echo_info}
            self.status_var.set("Processing complete: Scale → Delay → Frequency Shift → Echo.")
            self._redraw()
        except Exception as exc:
            messagebox.showerror("Audio Effects Error", str(exc))

    def on_apply_all(self):
        if self.signal is not None and self._apply_frequency_filter():
            self.on_apply_processing()

    def on_show_impulse_response(self):
        if self.fs is None:
            return
        try:
            delay = float(self.delay_var.get())
            feedback = float(self.feedback_var.get()) / 100.0
            t_h, h = get_echo_impulse_response(self.fs, delay_ms=delay, decay=feedback, num_echoes=3)
        except Exception as exc:
            messagebox.showerror("Impulse Response Error", str(exc))
            return
        window = tk.Toplevel(self.root)
        window.title("Echo Impulse Response h[n]")
        window.geometry("690x450")
        window.configure(bg=APP_BG)
        self._label(window, "Convolution Filter System Response: y[n] = x[n] ∗ h[n]", bg=HEADER_BG, fg=TEXT, size=11, weight="bold", pady=14).pack(fill=tk.X)
        figure = Figure(facecolor=CARD_BG, dpi=100)
        axis = figure.add_subplot(111)
        self._style_axis(axis, "Time (ms)", "Amplitude")
        marker, stems, baseline = axis.stem(t_h * 1000, h, linefmt="-", markerfmt="o", basefmt=" ")
        marker.set_color(MAGENTA)
        stems.set_color(MAGENTA)
        axis.set_title("Echo Impulse Response", color=TEXT, fontsize=11, pad=10)
        axis.set_ylim(-0.08, 1.12)
        figure.tight_layout(pad=2)
        canvas = FigureCanvasTkAgg(figure, master=window)
        canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True, padx=14, pady=14)
        canvas.draw_idle()

    # ------------------------------------------------------------------
    # Plotting and visible signal-analysis feedback
    # ------------------------------------------------------------------
    @staticmethod
    def _display_channel(data):
        data = np.asarray(data)
        return data if data.ndim == 1 else np.mean(data, axis=1)

    @staticmethod
    def _reduce(time_axis, values, maximum=1500):
        if len(values) <= maximum:
            return time_axis, values
        step = max(1, len(values) // maximum)
        return time_axis[::step], values[::step]

    def _style_axis(self, axis, xlabel, ylabel):
        axis.set_facecolor(PLOT_BG)
        axis.tick_params(colors=TEXT_MUTED, labelsize=7)
        axis.set_xlabel(xlabel, color=TEXT_MUTED, fontsize=8, labelpad=6)
        axis.set_ylabel(ylabel, color=TEXT_MUTED, fontsize=8, labelpad=6)
        axis.grid(True, color=GRID, linewidth=0.6, alpha=0.85)
        for spine in axis.spines.values():
            spine.set_color(BORDER)
        axis.margins(x=0)

    def _draw_waveform(self, axis, audio, colour, selection=False):
        values = self._display_channel(audio)
        time_axis = np.arange(len(values)) / float(self.fs)
        time_axis, values = self._reduce(time_axis, values)
        self._style_axis(axis, "Time (s)", "Amplitude")
        axis.plot(time_axis, values, color=colour, linewidth=0.65, alpha=0.98)
        axis.fill_between(time_axis, values, 0, color=colour, alpha=0.11, linewidth=0)
        if selection and len(time_axis) > 0:
            start = time_axis[-1] * self._selection[0]
            end = time_axis[-1] * self._selection[1]
            axis.axvspan(start, end, color=BLUE, alpha=0.16)
            axis.axvline(start, color=CYAN, linewidth=1.1)
            axis.axvline(end, color=CYAN, linewidth=1.1)
            axis.plot([start, end], [1.05, 1.05], transform=axis.get_xaxis_transform(), color=CYAN, linewidth=2)
        axis.set_ylim(min(-1.05, float(np.min(values)) * 1.2), max(1.05, float(np.max(values)) * 1.2))

    def _draw_spectrum(self):
        self._style_axis(self.ax_spectrum, "Hz", "Magnitude (dB)")
        source = self._display_channel(self.signal)
        output = self._display_channel(self.processed)
        freqs, magnitude, _ = compute_spectrum(source, self.fs)
        p_freqs, p_magnitude, _ = compute_spectrum(output, self.fs)
        # Transform to dB for the visual scale used by the reference interface.
        source_db = 20 * np.log10(np.maximum(np.abs(magnitude), 1e-9))
        output_db = 20 * np.log10(np.maximum(np.abs(p_magnitude), 1e-9))
        # Decimate spectrum for smooth canvas blitting
        if len(freqs) > 1200:
            step = max(1, len(freqs) // 1200)
            freqs = freqs[::step]
            source_db = source_db[::step]
            p_freqs = p_freqs[::step]
            output_db = output_db[::step]
        self.ax_spectrum.plot(freqs, source_db, color=CYAN, linewidth=0.75, alpha=0.9)
        self.ax_spectrum.plot(p_freqs, output_db, color=PURPLE, linewidth=0.75, alpha=0.88)
        if self._last_band:
            self.ax_spectrum.axvspan(*self._last_band, color=PURPLE, alpha=0.10)
        self.ax_spectrum.set_xlim(0, self.fs / 2)
        self.ax_spectrum.set_title("", color=TEXT)

    def _redraw(self):
        if self.signal is None or self.processed is None:
            return
        self.ax_original.clear()
        self.ax_spectrum.clear()
        self.ax_processed.clear()
        self._draw_waveform(self.ax_original, self.signal, CYAN, selection=True)
        self._draw_spectrum()
        self._draw_waveform(self.ax_processed, self.processed, MAGENTA)
        if not getattr(self, "_layout_initialized", False):
            for figure in (self.fig_original, self.fig_spectrum, self.fig_processed):
                figure.tight_layout(pad=1.2)
            self._layout_initialized = True
        self.canvas_original.draw_idle()
        self.canvas_spectrum.draw_idle()
        self.canvas_processed.draw_idle()
        self._update_readouts()


    def _update_readouts(self):
        source = self._display_channel(self.signal)
        output = self._display_channel(self.processed)
        source_time = len(source) / float(self.fs)
        output_time = len(output) / float(self.fs)
        self.original_time_label.config(text=f"0:{source_time:06.3f} / 0:{source_time:06.3f}")
        self.processed_time_label.config(text=f"0:{min(source_time, output_time):06.3f} / 0:{output_time:06.3f}")
        try:
            summary = f"RMS {rms(output):.4f}   ·   Peak {peak_amplitude(output):.4f}   ·   Dominant {dominant_frequency(output, self.fs):.0f} Hz"
        except Exception:
            summary = f"{self.fs:.0f} Hz sample rate"
        self.stats_label.config(text=summary)

    def _build_status_bar(self):
        bar = tk.Frame(self.root, bg="#060A10", height=27)
        bar.pack(fill=tk.X, side=tk.BOTTOM)
        bar.pack_propagate(False)
        self.status_var = tk.StringVar(value="Ready.")
        self._label(bar, "●", bg="#060A10", fg=GREEN, size=8).pack(side=tk.LEFT, padx=(17, 5), pady=6)
        self._label(bar, bg="#060A10", fg=TEXT_MUTED, size=8, textvariable=self.status_var).pack(side=tk.LEFT, pady=6)
        self.stats_label = self._label(bar, "", bg="#060A10", fg=TEXT_DARK, size=8)
        self.stats_label.pack(side=tk.RIGHT, padx=17, pady=6)


def main():
    root = tk.Tk()
    SignalScissorsApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
