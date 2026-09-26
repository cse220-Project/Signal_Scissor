import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import { REAL_LIFE_PRESETS } from '../data/realLifePresets';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ImpulseResponseModal from '../components/studio/ImpulseResponseModal';
import InfoBox from '../components/ui/InfoBox';
import SignalStatusBar from '../components/ui/SignalStatusBar';

export default function Effects() {
  const navigate = useNavigate();
  const { applyRealLifePreset, activeRealLifePreset, isLoading } = useAudioStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [targetTrack, setTargetTrack] = useState<'original' | 'processed'>('original');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Telecommunications', 'Audio Engineering', 'Acoustics', 'Biomedical / Audiology'];

  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return REAL_LIFE_PRESETS.filter((preset) => {
      const inCategory = selectedCategory === 'All' || preset.category === selectedCategory;
      const searchable = [preset.name, preset.category, preset.badge, preset.description, preset.realLifeUse].join(' ').toLowerCase();
      return inCategory && (!query || searchable.includes(query));
    });
  }, [searchQuery, selectedCategory]);

  const handleApplyPreset = async (preset: any, target: 'original' | 'processed' = targetTrack) => {
    await applyRealLifePreset(preset, target);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-ink-primary tracking-tight">
            Real-Life DSP Applications & Effects
          </h1>
          <p className="text-[13px] text-ink-secondary max-w-2xl leading-relaxed">
            Apply industry-standard <span className="trademark-signal">SIGNAL</span> processing workflows solving authentic physical problems: telephone bandwidth conservation, ground loop hum notch, spatial reverberation, and hearing loss compensation.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon="science"
          onClick={() => navigate('/studio')}
        >
          View in Studio
        </Button>
      </div>

      <SignalStatusBar />

      <InfoBox title="How this page works" defaultOpen={false}>
        <p>
          Pick a ready-made real-world scenario below (e.g. "Telephone bandwidth") and apply it straight to the Original or Processed track.
          Need exact filter/effect values instead of a preset? Use <strong className="text-ink-primary font-medium">View in Studio</strong> above —
          the same Filter &amp; Effects panels used here live there for manual tuning, so there's one place for hands-on control.
          Pick "Default Target" below to pre-select which button is highlighted per card.
        </p>
      </InfoBox>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink-primary">
          Acoustic FX Engine ({filteredPresets.length}{searchQuery ? ` of ${REAL_LIFE_PRESETS.length}` : ''})
        </h2>
      </div>

      <div className="space-y-4">
          {/* Category & Target Audio Track Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/70 rounded-ios-xl border border-border">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium text-ink-secondary mr-1">Category:</span>
              {categories.map((cat) => {
                const count = cat === 'All' ? REAL_LIFE_PRESETS.length : REAL_LIFE_PRESETS.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[12px] px-3 py-1 rounded-pill transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-surface text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
                    }`}
                  >
                    {cat} <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-muted-foreground font-medium">Default Target:</span>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setTargetTrack('original')}
                  className={`px-2.5 py-1 font-semibold transition-all ${
                    targetTrack === 'original'
                      ? 'bg-sky-500 text-white'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setTargetTrack('processed')}
                  className={`px-2.5 py-1 font-semibold transition-all ${
                    targetTrack === 'processed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Processed
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="fx-search" className="sr-only">Search acoustic effects</label>
            <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-muted-foreground">search</span>
            <input
              id="fx-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search effects by name, category, use case, or DSP method…"
              className="w-full rounded-ios-lg border border-border bg-card py-2.5 pl-10 pr-10 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground hover:text-foreground">Clear</button>}
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPresets.map((preset) => {
              const isActive = activeRealLifePreset === preset.id;
              const cardVariant = preset.category === 'Telecommunications'
                ? 'pastel-blue'
                : preset.category === 'Audio Engineering'
                ? 'pastel-peach'
                : preset.category === 'Acoustics'
                ? 'pastel-lavender'
                : 'pastel-green';

              return (
                <Card
                  key={preset.id}
                  variant={cardVariant as any}
                  className="space-y-3.5 flex flex-col justify-between !p-5"
                >
                  <div className="space-y-2.5">
                    {/* Header: Icon + Title inline on same line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px] text-ink-primary shrink-0">
                          {preset.icon}
                        </span>
                        <h3 className="text-[16px] font-semibold text-ink-primary tracking-tight">
                          {preset.name}
                        </h3>
                      </div>
                      <Badge variant="muted">{preset.badge}</Badge>
                    </div>

                    <p className="text-[13px] text-ink-secondary leading-relaxed">
                      {preset.description}
                    </p>

                    {/* Technical DSP Explanation */}
                    <div className="pt-2 border-t border-hairline/60 space-y-1 text-[12px]">
                      <span className="font-semibold text-ink-primary block">
                        <span className="trademark-signal">SIGNAL</span> Processing Mechanism:
                      </span>
                      <p className="text-ink-secondary leading-relaxed">
                        {preset.dspExplanation}
                      </p>
                    </div>

                    {/* Real Life Usage */}
                    <div className="text-[11px] text-ink-tertiary">
                      <span className="font-medium text-ink-secondary">Where it's used: </span>
                      {preset.realLifeUse}
                    </div>
                  </div>

                  {/* Action Buttons: Dual Target support */}
                  <div className="pt-3 border-t border-hairline/60 flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-[11px] text-ink-tertiary font-mono">
                      {preset.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant={isActive || targetTrack === 'original' ? 'primary' : 'secondary'}
                        size="sm"
                        icon="graphic_eq"
                        loading={isLoading && isActive}
                        onClick={() => handleApplyPreset(preset, 'original')}
                        title="Apply on Original Audio"
                      >
                        On Original
                      </Button>
                      <Button
                        variant={isActive || targetTrack === 'processed' ? 'primary' : 'secondary'}
                        size="sm"
                        icon="auto_fix_high"
                        loading={isLoading && isActive}
                        onClick={() => handleApplyPreset(preset, 'processed')}
                        title="Apply on Processed Audio"
                      >
                        On Processed
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredPresets.length === 0 && (
              <div className="md:col-span-2 rounded-ios-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No effects match “{searchQuery}”. Try another term or clear the search.
              </div>
            )}
          </div>
      </div>

      {/* Impulse Response Modal */}
      <ImpulseResponseModal />
    </div>
  );
}
