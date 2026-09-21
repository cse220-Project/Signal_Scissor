import { AudioFile } from '../../types';

interface AudioFileCardProps {
  file: AudioFile;
  onClick?: () => void;
  selected?: boolean;
}

export default function AudioFileCard({ file, onClick, selected }: AudioFileCardProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={onClick}
      className={`group flex items-center justify-between py-2.5 px-3 rounded-ios-lg transition-all cursor-pointer select-none ${
        selected 
          ? 'bg-lavender text-ink-primary' 
          : 'hover:bg-surface-raised active:scale-[0.99]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-7 h-7 rounded-ios-sm flex items-center justify-center shrink-0 ${
          selected 
            ? 'bg-lavender-ink text-white' 
            : 'bg-surface-raised text-ink-secondary group-hover:bg-surface-muted'
        }`}>
          <span className="material-symbols-outlined text-[15px]">
            {file.file_type === 'original' ? 'audio_file' : 'tune'}
          </span>
        </div>
        <div className="min-w-0">
          <h4 className="text-[13px] font-medium text-ink-primary truncate" title={file.original_filename}>
            {file.original_filename}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-ink-secondary flex-wrap">
            <span>{formatDuration(file.duration_seconds)}</span>
            <span>•</span>
            <span>{(file.sample_rate / 1000).toFixed(1)} kHz</span>
            <span>•</span>
            <span className="uppercase text-[10px] tracking-wider">{file.file_type}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity pr-1">
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </div>
    </div>
  );
}
