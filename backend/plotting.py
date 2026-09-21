import matplotlib.pyplot as plt
from fourier_filter import compute_spectrum

# ---- dark desktop theme visual style constants ----
FONT_FAMILY = "DejaVu Sans"
TITLE_COLOR = "#F5F5F5"
AXIS_COLOR = "#A5A5A5"
GRID_COLOR = "#2E2E38"
FACE_COLOR = "#242424"
SPINE_COLOR = "#383838"


def _style_axis(ax, title):
    ax.set_title(title, fontsize=10, fontweight="bold", color=TITLE_COLOR,
                 fontfamily=FONT_FAMILY, pad=8)
    ax.set_facecolor(FACE_COLOR)
    ax.tick_params(colors=AXIS_COLOR, labelsize=8)
    for spine_name in ("top", "right"):
        ax.spines[spine_name].set_visible(False)
    for spine_name in ("left", "bottom"):
        ax.spines[spine_name].set_color(SPINE_COLOR)
    ax.grid(True, color=GRID_COLOR, alpha=0.6, linewidth=0.6)
    ax.set_axisbelow(True)


def plot_waveform(ax, t, signal, title="Waveform", color="#4F9DFF"):
    """Plot time-domain signal on a given matplotlib axis."""
    ax.plot(t, signal, color=color, linewidth=1.0)
    _style_axis(ax, title)
    ax.set_xlabel("Time (s)", fontsize=8.5, color=AXIS_COLOR)
    ax.set_ylabel("Amplitude", fontsize=8.5, color=AXIS_COLOR)


def plot_spectrum(ax, signal, fs, title="Spectrum", color="#8B7CFF", max_freq=None,
                   highlight_band=None):
    """
    Plot frequency-domain magnitude spectrum on a given matplotlib axis.

    highlight_band: optional (low_freq, high_freq) tuple. When given, that
    region is shaded with a semi-transparent overlay so the user can see
    exactly which band they selected.
    """
    freqs, mag, _ = compute_spectrum(signal, fs)
    ax.plot(freqs, mag, color=color, linewidth=1.0)
    _style_axis(ax, title)
    ax.set_xlabel("Frequency (Hz)", fontsize=8.5, color=AXIS_COLOR)
    ax.set_ylabel("Magnitude", fontsize=8.5, color=AXIS_COLOR)
    if max_freq:
        ax.set_xlim(0, max_freq)

    if highlight_band is not None:
        low, high = highlight_band
        if high > low:
            ax.axvspan(low, high, color="#4F9DFF", alpha=0.25, label="Filtered Band")
            legend = ax.legend(loc="upper right", fontsize=7.5, frameon=True)
            legend.get_frame().set_facecolor("#1E1E22")
            legend.get_frame().set_edgecolor("#383838")
            for text in legend.get_texts():
                text.set_color("#F5F5F5")


def format_signal_info(signal, fs, num_channels=1):
    """
    Build the text shown in the Signal Information panel: sample rate,
    duration, sample count, channel count, and dominant frequency.
    Returns a dict of label -> value strings so the GUI can bind them
    to individual widgets.
    """
    from signal_analysis import dominant_frequency

    num_samples = len(signal)
    duration_sec = num_samples / fs
    dom_freq = dominant_frequency(signal, fs)

    return {
        "Sample Rate": f"{fs} Hz",
        "Duration": f"{duration_sec:.3f} s",
        "Samples": f"{num_samples}",
        "Channels": f"{num_channels}",
        "Dominant Frequency": f"{dom_freq:.1f} Hz",
    }


def plot_before_after(t, original, filtered, fs, save_path=None):
    """
    2x2 grid: original waveform, original spectrum,
              filtered waveform, filtered spectrum.
    This is the key 'before/after' demo view for your project.
    """
    fig, axes = plt.subplots(2, 2, figsize=(12, 7))

    plot_waveform(axes[0, 0], t, original, title="Before - Waveform", color="tab:blue")
    plot_spectrum(axes[0, 1], original, fs, title="Before - Spectrum", color="tab:blue", max_freq=fs/2)

    plot_waveform(axes[1, 0], t, filtered, title="After - Waveform", color="tab:green")
    plot_spectrum(axes[1, 1], filtered, fs, title="After - Spectrum", color="tab:green", max_freq=fs/2)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=120)
        print(f"Saved plot to {save_path}")
    else:
        plt.show()
    return fig


if __name__ == "__main__":
    from signal_io import generate_test_signal
    from fourier_filter import band_filter

    t, signal, fs, ch = generate_test_signal(freqs=(200, 1000, 2500))
    filtered = band_filter(signal, fs, low_freq=900, high_freq=1100, mode="remove")

    plot_before_after(t, signal, filtered, fs, save_path="before_after_demo.png")