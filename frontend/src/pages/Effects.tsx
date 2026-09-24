import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import { REAL_LIFE_PRESETS } from '../data/realLifePresets';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ImpulseResponseModal from '../components/studio/ImpulseResponseModal';
import FilterControls from '../components/studio/FilterControls';
import EffectsControls from '../components/studio/EffectsControls';
import InfoBox from '../components/ui/InfoBox';

export default function Effects() {
  const navigate = useNavigate();
  const { applyRealLifePreset, activeRealLifePreset, isLoading } = useAudioStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'real-life' | 'manual'>('real-life');
  const [targetTrack, setTargetTrack] = useState<'original' | 'processed'>('original');

  const categories = ['All', 'Telecommunications', 'Audio Engineering', 'Acoustics', 'Biomedical / Audiology'];

  const filteredPresets = selectedCategory === 'All'
    ? REAL_LIFE_PRESETS
    : REAL_LIFE_PRESETS.filter((p) => p.category === selectedCategory);

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

      <InfoBox title="How this page works" defaultOpen={false}>
        <p>
          Pick a ready-made real-world scenario below (e.g. "Telephone bandwidth"), or switch to{' '}
          <strong className="text-ink-primary font-medium">Manual DSP Controls Rack</strong> to set exact filter/effect values yourself.
          Each preset card applies straight to either the Original or Processed track — pick "Default Target" below to pre-select which one is highlighted.
        </p>
      </InfoBox>

      {/* Mode Switcher Tabs */}
      <div className="page-tabs">
        <button
          onClick={() => setActiveTab('real-life')}
          className={`px-4 py-2 rounded-ios-lg text-[14px] font-medium transition-colors ${
            activeTab === 'real-life'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
          }`}
        >
          Real-Life Application Presets ({REAL_LIFE_PRESETS.length})
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-ios-lg text-[14px] font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
          }`}
        >
          Manual DSP Controls Rack
        </button>
      </div>

      {activeTab === 'real-life' ? (
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
          </div>
        </div>
      ) : (
        /* Manual DSP Controls Rack — same controls as the Studio page, for tuning by hand instead of via a preset */
        <div className="space-y-4">
          <p className="text-[12px] text-ink-tertiary">
            These are the same Filter &amp; Effects controls available in{' '}
            <span className="font-medium text-ink-secondary">DSP Studio</span> — use them here to fine-tune a preset, or build a custom chain from scratch.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterControls />
            <EffectsControls />
          </div>
        </div>
      )}

      {/* Impulse Response Modal */}
      <ImpulseResponseModal />
    </div>
  );
}
