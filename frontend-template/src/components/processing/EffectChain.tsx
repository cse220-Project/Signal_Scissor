import { useAudioStore } from '../../store/useAudioStore';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';

export default function EffectChain() {
  const { effectChain, removeFromEffectChain, toggleEffect } = useAudioStore();

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-title-md font-bold text-on-surface">Effect Chain</h3>
        <Button variant="secondary" size="sm" icon="add">Add Effect</Button>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2">
        <div className="flex items-center gap-3 text-on-surface-variant font-medium shrink-0 px-2">
          INPUT <span className="material-symbols-outlined text-outline">arrow_forward</span>
        </div>
        
        {effectChain.length === 0 ? (
          <div className="px-8 py-6 border-2 border-dashed border-surface-container-high rounded-2xl text-on-surface-variant text-body-sm flex-1 text-center bg-surface-container-low">
            Chain is empty
          </div>
        ) : (
          effectChain.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <div className={`w-48 p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${
                item.enabled 
                  ? 'bg-surface-container-lowest border-primary shadow-sm' 
                  : 'bg-surface-container-low border-surface-container-high opacity-60'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-bold text-body-lg text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">settings_input_component</span>
                    {item.effect.name}
                  </div>
                  <button onClick={() => removeFromEffectChain(idx)} className="text-on-surface-variant hover:text-error">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Toggle checked={item.enabled} onChange={() => toggleEffect(idx)} />
                  <span className="text-label-caps text-on-surface-variant">
                    {item.enabled ? 'ACTIVE' : 'BYPASSED'}
                  </span>
                </div>
              </div>
              
              <span className="material-symbols-outlined text-outline">arrow_forward</span>
            </div>
          ))
        )}
        
        <div className="flex items-center gap-3 text-primary font-bold shrink-0 px-2">
          OUTPUT
        </div>
      </div>
    </Card>
  );
}
