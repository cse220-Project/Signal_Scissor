import { useState, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { listPresets, processEffectChain, getWaveform, getSpectrogram, getStreamUrl } from '../api/client';
import { useNavigate } from 'react-router-dom';
import AudioPlayer from '../components/audio/AudioPlayer';
import Button from '../components/ui/Button';
import Slider from '../components/ui/Slider';

// Available factory DSP modules that can be added to custom chain
const AVAILABLE_EFFECTS = [
  {
    name: 'Reverb',
    category: 'Spatial',
    description: 'FIR acoustic convolution with exponential reflection decay',
    icon: 'surround_sound',
    parameters: {
      room_size: { value: 0.4, min: 0.1, max: 1.0, step: 0.05, label: 'Room Size', unit: '' },
      wet: { value: 0.3, min: 0.0, max: 1.0, step: 0.05, label: 'Wet Mix', unit: '' }
    }
  },
  {
    name: 'Echo',
    category: 'Time',
    description: 'Discrete delay line with feedback attenuation',
    icon: 'repeat',
    parameters: {
      delay_sec: { value: 0.3, min: 0.05, max: 1.0, step: 0.05, label: 'Delay Time', unit: 's' },
      decay: { value: 0.5, min: 0.1, max: 0.9, step: 0.05, label: 'Decay Factor', unit: '' }
    }
  },
  {
    name: 'Distortion',
    category: 'Dynamic',
    description: 'Hyperbolic tangent soft-clipping overdrive',
    icon: 'electric_bolt',
    parameters: {
      drive: { value: 0.5, min: 0.1, max: 0.95, step: 0.05, label: 'Drive', unit: '' },
      gain: { value: 1.0, min: 0.2, max: 2.0, step: 0.1, label: 'Output Gain', unit: 'x' }
    }
  },
  {
    name: 'LowPass',
    category: 'Filter',
    description: '4th-order Butterworth low-pass frequency isolation',
    icon: 'graphic_eq',
    parameters: {
      cutoff_hz: { value: 3500, min: 200, max: 12000, step: 100, label: 'Cutoff Frequency', unit: 'Hz' }
    }
  },
  {
    name: 'HighPass',
    category: 'Filter',
    description: '4th-order Butterworth high-pass rumble eliminator',
    icon: 'equalizer',
    parameters: {
      cutoff_hz: { value: 300, min: 50, max: 4000, step: 50, label: 'Cutoff Frequency', unit: 'Hz' }
    }
  },
  {
    name: 'BandPass',
    category: 'Filter',
    description: 'Dual Butterworth band-pass passband resonator',
    icon: 'tune',
    parameters: {
      low_hz: { value: 300, min: 100, max: 2000, step: 50, label: 'Low Cutoff', unit: 'Hz' },
      high_hz: { value: 3400, min: 1000, max: 8000, step: 100, label: 'High Cutoff', unit: 'Hz' }
    }
  },
  {
    name: 'Tremolo',
    category: 'Modulation',
    description: 'Low-frequency oscillator amplitude modulation',
    icon: 'vibration',
    parameters: {
      rate: { value: 5.0, min: 0.5, max: 20.0, step: 0.5, label: 'LFO Rate', unit: 'Hz' },
      depth: { value: 0.5, min: 0.1, max: 1.0, step: 0.05, label: 'Depth', unit: '' }
    }
  },
  {
    name: 'RingModulation',
    category: 'Modulation',
    description: 'Carrier wave multiplication producing sidebands',
    icon: 'waves',
    parameters: {
      frequency: { value: 40.0, min: 10.0, max: 200.0, step: 5.0, label: 'Carrier Freq', unit: 'Hz' },
      depth: { value: 0.8, min: 0.1, max: 1.0, step: 0.05, label: 'Depth', unit: '' }
    }
  }
];

const PRESET_ICONS: Record<string, string> = {
  alien: 'pest_control',
  robot: 'smart_toy',
  deep_voice: 'record_voice_over',
  chipmunk: 'cruelty_free',
  telephone: 'call',
  radio: 'podcasts',
  echo: 'repeat',
  reverb: 'surround_sound',
  helium: 'air',
  underwater: 'scuba_diving',
  cave: 'landscape',
  megaphone: 'campaign',
  metallic: 'precision_manufacturing',
};

export default function Effects() {
  const {
    selectedFile,
    isProcessing,
    setIsProcessing,
    setSelectedFile,
    addProcessedFile,
    addFile,
    setWaveformData,
    setSpectrogramData,
    effectChain,
    addToEffectChain,
    removeFromEffectChain,
    toggleEffect,
    updateEffectParam,
    clearEffectChain
  } = useAudioStore();

  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Keep selectedStageIdx valid within bounds
  useEffect(() => {
    if (selectedStageIdx >= effectChain.length && effectChain.length > 0) {
      setSelectedStageIdx(effectChain.length - 1);
    }
  }, [effectChain.length, selectedStageIdx]);

  useEffect(() => {
    listPresets()
      .then(res => {
        if (res.data && res.data.data) {
          setPresets(res.data.data);
        }
      })
      .catch(e => console.error("Failed to load presets", e));
  }, []);

  const handleApplyChain = async (customEffects?: any[]) => {
    if (!selectedFile) {
      alert("Please upload or select an audio file first.");
      navigate('/studio');
      return;
    }

    const effectsToRun = customEffects || effectChain.filter(item => item.enabled).map(item => ({
      name: item.effect.name,
      parameters: Object.entries(item.effect.parameters).reduce((acc: any, [k, v]: any) => {
        acc[k] = v.value;
        return acc;
      }, {})
    }));

    if (effectsToRun.length === 0) {
      alert("No active effects in the chain. Add at least one effect or select a preset.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await processEffectChain({
        file_id: selectedFile.id,
        effects: effectsToRun
      });
      const newFile = res.data.data;
      addFile(newFile);
      addProcessedFile(newFile);
      setSelectedFile(newFile);

      getWaveform(newFile.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(newFile.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
    } catch (e: any) {
      console.error("Effect processing failed:", e);
      alert("Processing failed: " + (e?.response?.data?.error || e?.message || 'unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const [loadedPresetName, setLoadedPresetName] = useState<string | null>(null);

  // Determine active preset (either explicitly loaded or matching the current effect names)
  const activePresetName = (() => {
    if (effectChain.length === 0) return null;
    if (loadedPresetName) return loadedPresetName;
    const currentChainNames = effectChain.map(i => i.effect.name.toLowerCase()).join('|');
    const matched = presets.find(p => 
      (p.effect_chain || []).map((e: any) => e.name.toLowerCase()).join('|') === currentChainNames
    );
    return matched ? matched.name : null;
  })();

  const handleAddModule = (module: typeof AVAILABLE_EFFECTS[0]) => {
    setLoadedPresetName(null);
    const cloned: any = {
      name: module.name,
      description: module.description,
      parameters: JSON.parse(JSON.stringify(module.parameters))
    };
    addToEffectChain(cloned);
    setAddMenuOpen(false);
  };

  const handleLoadPreset = (preset: any) => {
    clearEffectChain();
    setLoadedPresetName(preset.name);
    preset.effect_chain.forEach((e: any) => {
      addToEffectChain({
        name: e.name,
        description: e.description || `${e.name} block`,
        parameters: Object.entries(e.parameters || {}).reduce((acc: any, [k, v]: any) => {
          acc[k] = {
            value: typeof v === 'object' && v !== null ? v.value : v,
            label: k.replace('_', ' '),
            min: 0,
            max: 100,
            step: 1,
            type: 'float'
          };
          return acc;
        }, {})
      });
    });
  };

  const categories = ['all', 'voice', 'spatial', 'classic'];
  const filteredPresets = presets.filter(p => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'voice') return ['alien', 'robot', 'chipmunk', 'deep_voice'].includes(p.name);
    if (selectedCategory === 'spatial') return ['reverb', 'echo', 'cave', 'underwater'].includes(p.name);
    if (selectedCategory === 'classic') return ['telephone', 'radio', 'megaphone', 'metallic'].includes(p.name);
    return true;
  });

  const streamUrl = selectedFile ? getStreamUrl(selectedFile.id) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 select-none pb-48">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(38,33,28,0.08)] pb-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#26211c] tracking-tight">DSP Effects Rack</h1>
          <p className="text-[13px] text-[#57534e]">
            Cascade linear filters, non-linear saturation, time delays, and STFT spectral transforms
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/studio')}
            icon="arrow_back"
          >
            Back to Studio
          </Button>
        </div>
      </div>

      {/* Active Audio Player if file loaded, else prompt */}
      {selectedFile ? (
        <AudioPlayer url={streamUrl} title={selectedFile.original_filename} />
      ) : (
        <div className="p-6 rounded-[24px] bg-[#f0ead8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-semibold text-[#26211c]">No Target Audio Loaded</h3>
            <p className="text-[12px] text-[#57534e]">Select or generate an audio track in Studio or Signals to process through the rack.</p>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate('/studio')} icon="music_note">
            Go to Studio
          </Button>
        </div>
      )}

      {/* Main 2-Column Bento Grid: Effect Pipeline (Left) & Presets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Cascade Pipeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#e3e8e4] rounded-[24px] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h2 className="text-[20px] font-semibold text-[#26211c] tracking-tight">Serial Processing Pipeline</h2>
                <span className="text-[14px] font-medium text-[#57534e]">
                  {activePresetName
                    ? `: ${activePresetName.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} Preset`
                    : ': no preset'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {effectChain.length > 0 && (
                  <button
                    onClick={() => {
                      clearEffectChain();
                      setLoadedPresetName(null);
                    }}
                    className="text-[12px] font-medium text-[#57534e] hover:text-[#26211c] transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-[12px] font-medium text-[#57534e]">
                  {effectChain.length} {effectChain.length === 1 ? 'stage' : 'stages'}
                </span>
              </div>
            </div>

            {/* Pipeline Stages */}
            <div className="space-y-2">
              {effectChain.length === 0 ? (
                <div className="py-6 px-4 text-center text-[12px] text-[#57534e]">
                  No active inline filters in the chain. Pick a preset or add a DSP module.
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {/* Choice Buttons for Stages matching Category Pills style */}
                  <div className="flex flex-wrap items-center gap-2">
                    {effectChain.map((item, idx) => {
                      const isSelected = selectedStageIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedStageIdx(idx)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-150 text-[12.5px] ${
                            isSelected
                              ? 'bg-[#26211c] text-[#ffffff] font-semibold tracking-tight'
                              : 'bg-transparent border border-[rgba(38,33,28,0.2)] text-[#26211c] hover:border-[rgba(38,33,28,0.4)] font-normal'
                          }`}
                        >
                          <span className={isSelected ? 'text-[#ffffff]' : 'text-[#79716b]'}>
                            {idx + 1}.
                          </span>
                          <span>{item.effect.name}</span>
                          {!item.enabled && (
                            <span className={`text-[10px] ml-0.5 ${isSelected ? 'text-[rgba(255,255,255,0.7)]' : 'text-[#79716b]'}`}>
                              (bypassed)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Selected Stage Panel */}
                  {effectChain[selectedStageIdx] && (
                    <div className="pt-2 px-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-[#57534e]">
                              {selectedStageIdx + 1}.
                            </span>
                            <h4 className="text-[14px] font-semibold text-[#26211c]">
                              {effectChain[selectedStageIdx].effect.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-[#57534e]">
                            {effectChain[selectedStageIdx].effect.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleEffect(selectedStageIdx)}
                            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer flex items-center gap-1.5 border hover:scale-[1.04] hover:bg-[rgba(38,33,28,0.06)] ${
                              effectChain[selectedStageIdx].enabled
                                ? 'border-[rgba(38,33,28,0.3)] bg-transparent text-[#26211c] hover:border-[rgba(38,33,28,0.5)]'
                                : 'border-[rgba(38,33,28,0.15)] bg-transparent text-[#79716b] hover:border-[rgba(38,33,28,0.35)] hover:text-[#26211c]'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-[14px] ${effectChain[selectedStageIdx].enabled ? 'text-[#26211c]' : 'text-[#79716b]'}`}>
                              {effectChain[selectedStageIdx].enabled ? 'power_settings_new' : 'power_off'}
                            </span>
                            <span>{effectChain[selectedStageIdx].enabled ? 'Enabled' : 'Bypassed'}</span>
                          </button>
                          <button
                            onClick={() => removeFromEffectChain(selectedStageIdx)}
                            className="text-[#79716b] hover:text-[#26211c] p-1 rounded-full hover:bg-[rgba(38,33,28,0.08)] transition-colors cursor-pointer"
                            title="Remove stage"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>

                      {/* Parameter Sliders for selected stage */}
                      {effectChain[selectedStageIdx].enabled &&
                        effectChain[selectedStageIdx].effect.parameters &&
                        Object.keys(effectChain[selectedStageIdx].effect.parameters).length > 0 && (
                          <div className="pt-2 space-y-2.5">
                            {Object.entries(effectChain[selectedStageIdx].effect.parameters).map(([key, param]: [string, any]) => {
                              const val = typeof param === 'object' ? param.value : param;
                              return (
                                <div key={key} className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-medium text-[#57534e] capitalize">
                                      {key.replace('_', ' ')}
                                    </span>
                                    <span className="text-[#26211c] font-semibold">
                                      {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : String(val)}
                                    </span>
                                  </div>
                                  {typeof val === 'number' && (
                                    <Slider
                                      value={val}
                                      min={param.min ?? (val < 1 ? 0 : 0)}
                                      max={param.max ?? (val > 100 ? val * 2 : (val > 1 ? val * 2 : 1.0))}
                                      step={param.step ?? (val < 1 ? 0.05 : 1)}
                                      onChange={(newVal) => updateEffectParam(selectedStageIdx, key, newVal)}
                                      trackColor="#d9cfc7"
                                      activeColor="#26211c"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pipeline Action Controls */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {/* Add Module Dropdown */}
              <div className="relative w-full sm:w-auto shrink-0">
                <Button
                  variant="secondary"
                  size="md"
                  icon="add"
                  onClick={() => setAddMenuOpen(!addMenuOpen)}
                  className="bg-transparent hover:bg-[rgba(38,33,28,0.06)] whitespace-nowrap shrink-0"
                >
                  DSP Module
                </Button>

                {addMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 max-h-[350px] overflow-y-auto bg-[#f4f3ee] rounded-[20px] shadow-lg border border-[rgba(38,33,28,0.12)] p-2 z-40 space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[#79716b] uppercase tracking-wider">
                      Select Filter Module
                    </div>
                    {AVAILABLE_EFFECTS.map((eff) => (
                      <button
                        key={eff.name}
                        onClick={() => handleAddModule(eff)}
                        className="w-full flex items-center justify-between p-2 rounded-[12px] hover:bg-[rgba(38,33,28,0.05)] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[17px] text-[#57534e]">{eff.icon}</span>
                          <div>
                            <div className="text-[13px] font-medium text-[#26211c]">{eff.name}</div>
                            <div className="text-[10px] text-[#79716b] leading-tight">{eff.category}</div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[15px] text-[#79716b]">add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Render Pipeline Action */}
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon="tune"
                loading={isProcessing}
                disabled={!selectedFile || effectChain.length === 0 || isProcessing}
                onClick={() => handleApplyChain()}
              >
                Render Effect Pipeline
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Factory Presets Library (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#f0ead8] rounded-[24px] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-semibold text-[#26211c] tracking-tight">Factory Presets</h3>
              </div>
              <span className="text-[12px] font-medium text-[#57534e]">
                {presets.length} Presets
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] capitalize transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#26211c] text-[#ffffff] font-semibold tracking-tight'
                      : 'border border-[rgba(38,33,28,0.15)] text-[#57534e] font-normal hover:bg-[rgba(38,33,28,0.06)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Preset Pill Chips Grid matching Checklist design reference */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-[380px] overflow-y-auto pr-1">
              {filteredPresets.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-[#57534e] w-full">
                  No presets found in this category.
                </div>
              ) : (
                filteredPresets.map((preset, idx) => {
                  const isSelected = selectedPreset?.name === preset.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
                      className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] transition-all duration-200 select-none cursor-pointer active:scale-[0.97] shadow-none ${
                        isSelected
                          ? 'bg-[#ffffff] text-[#26211c] scale-[1.04] text-[13.5px] font-semibold tracking-tight'
                          : 'bg-[#f7f4ec] text-[#26211c] text-[13px] hover:text-[13.5px] font-medium hover:bg-[#ffffff] hover:scale-[1.04]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[17px] transition-transform duration-200 ${isSelected ? 'text-[#26211c] scale-105' : 'text-[#57534e] group-hover:scale-105'}`}>
                        {PRESET_ICONS[preset.name] || 'tune'}
                      </span>
                      <span className={`capitalize transition-all duration-200 ${isSelected ? 'font-semibold tracking-tight' : 'group-hover:font-semibold group-hover:tracking-tight'}`}>
                        {preset.name.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Preset Details & Action Buttons at Bottom */}
            <div className="pt-3 border-t border-[rgba(38,33,28,0.08)] space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#57534e]">Selected:</span>
                <span className="font-semibold text-[#26211c] capitalize">
                  {selectedPreset ? selectedPreset.name.replace('_', ' ') : 'None selected'}
                </span>
              </div>

              {selectedPreset && (
                <div className="text-[12px] text-[#57534e] leading-relaxed">
                  {(selectedPreset.effect_chain || []).map((e: any) => e.name).join(', ')}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  disabled={!selectedPreset}
                  onClick={() => selectedPreset && handleLoadPreset(selectedPreset)}
                  className="bg-transparent hover:bg-[rgba(38,33,28,0.06)]"
                >
                  Load to Rack
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={!selectedPreset || !selectedFile || isProcessing}
                  loading={isProcessing}
                  onClick={() => selectedPreset && handleApplyChain(selectedPreset.effect_chain)}
                >
                  Quick Apply
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
