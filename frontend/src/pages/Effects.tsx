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

export default function Effects() {
  const navigate = useNavigate();
  const { applyRealLifePreset, activeRealLifePreset, isLoading } = useAudioStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'real-life' | 'manual'>('real-life');

  const categories = ['All', 'Telecommunications', 'Audio Engineering', 'Acoustics', 'Biomedical / Audiology'];

  const filteredPresets = selectedCategory === 'All'
    ? REAL_LIFE_PRESETS
    : REAL_LIFE_PRESETS.filter((p) => p.category === selectedCategory);

  const handleApplyPreset = async (preset: any) => {
    await applyRealLifePreset(preset);
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
            Apply industry-standard signal processing workflows solving authentic physical problems: telephone bandwidth conservation, ground loop hum notch, spatial reverberation, and hearing loss compensation.
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

      {/* Mode Switcher Tabs */}
      <div className="page-tabs">
        <button
          onClick={() => setActiveTab('real-life')}
          className={`px-4 py-2 rounded-ios-lg text-[14px] font-medium transition-colors ${
            activeTab === 'real-life'
              ? 'bg-[#26211c] text-white font-semibold'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
          }`}
        >
          Real-Life Application Presets ({REAL_LIFE_PRESETS.length})
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-ios-lg text-[14px] font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-[#26211c] text-white font-semibold'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
          }`}
        >
          Manual DSP Controls Rack
        </button>
      </div>

      {activeTab === 'real-life' ? (
        <div className="space-y-5 bg-pastel-cream rounded-ios-2xl p-4 md:p-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-ink-secondary mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[12px] px-3 py-1 rounded-pill transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#26211c] text-white font-semibold'
                    : 'bg-surface text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
                }`}
              >
                {cat}
              </button>
            ))}
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
                        Signal Processing Mechanism:
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

                  {/* Action Button */}
                  <div className="pt-3 border-t border-hairline/60 flex flex-wrap gap-3 items-center justify-between">
                    <span className="text-[11px] text-ink-tertiary font-mono">
                      {preset.category}
                    </span>
                    <Button
                      variant={isActive ? 'primary' : 'secondary'}
                      size="sm"
                      icon={isActive ? 'check' : 'play_arrow'}
                      loading={isLoading && isActive}
                      onClick={() => handleApplyPreset(preset)}
                    >
                      {isActive ? 'Applied (Active)' : 'Apply Application'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Manual DSP Controls Rack */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FilterControls />
          <EffectsControls />
        </div>
      )}

      {/* Impulse Response Modal */}
      <ImpulseResponseModal />
    </div>
  );
}
