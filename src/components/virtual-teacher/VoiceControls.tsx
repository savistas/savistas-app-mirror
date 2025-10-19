import { Mic, MicOff, Volume2, VolumeX, Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface VoiceControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
  hasPermission?: boolean | null;
}

/**
 * Contrôles pour l'enregistrement vocal et le volume
 */
export function VoiceControls({
  isRecording,
  isPaused,
  duration,
  volume,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onVolumeChange,
  disabled = false,
  hasPermission = null,
}: VoiceControlsProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Bouton principal d'enregistrement */}
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <Button
              size="lg"
              variant="default"
              className="flex-1"
              onClick={onStartRecording}
              disabled={disabled || hasPermission === false}
            >
              <Mic className="mr-2 h-5 w-5" />
              {hasPermission === false ? 'Microphone non autorisé' : 'Parler au professeur'}
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={onPauseRecording}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={onResumeRecording}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Reprendre
                </Button>
              )}

              <Button
                size="lg"
                variant="destructive"
                onClick={onStopRecording}
              >
                <Square className="mr-2 h-4 w-4" />
                Arrêter
              </Button>
            </>
          )}
        </div>

        {/* Indicateur d'enregistrement */}
        {isRecording && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              {!isPaused && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              <span className="text-sm font-medium">
                {isPaused ? 'En pause' : 'Enregistrement...'}
              </span>
            </div>
            <Badge variant="secondary">{formatDuration(duration)}</Badge>
          </div>
        )}

        {/* Contrôle du volume */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 50)}
          >
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <Slider
            value={[volume]}
            onValueChange={(values) => onVolumeChange(values[0])}
            max={100}
            step={1}
            className="flex-1"
          />

          <span className="text-xs text-muted-foreground w-8 text-right">
            {volume}%
          </span>
        </div>

        {/* Message d'aide */}
        {!isRecording && hasPermission === true && (
          <p className="text-xs text-muted-foreground text-center">
            Cliquez sur le bouton pour parler avec votre professeur virtuel
          </p>
        )}

        {hasPermission === false && (
          <p className="text-xs text-destructive text-center">
            Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur
          </p>
        )}
      </div>
    </Card>
  );
}
