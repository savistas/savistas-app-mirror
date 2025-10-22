/**
 * RoomRenderer - Composant pour afficher l'avatar Equos
 * Basé sur l'exemple officiel Equos : https://docs.equos.ai/integration/livekit
 */

import {
  ParticipantTile,
  RoomAudioRenderer,
  TrackLoop,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export interface RoomRendererProps {
  onStop: () => Promise<void>;
  avatarIdentity: string;
  avatarName: string;
}

/**
 * Composant qui affiche l'avatar Equos dans une session LiveKit
 * Suit exactement l'implémentation recommandée par Equos
 */
export function RoomRenderer({
  onStop,
  avatarIdentity,
  avatarName,
}: RoomRendererProps) {
  // Récupérer les tracks vidéo de la session
  // On récupère uniquement la caméra (l'avatar), pas le participant local
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);

  return (
    <>
      <div className="relative flex h-full w-full justify-center">
        {/* Boucle sur tous les tracks vidéo (normalement juste l'avatar) */}
        <TrackLoop tracks={tracks}>
          <div className="relative h-full">
            {/* Affiche le participant (l'avatar Equos) */}
            <ParticipantTile className="relative h-full" />
          </div>
        </TrackLoop>

        {/* Rendu audio séparé pour une meilleure qualité */}
        <RoomAudioRenderer />

        {/* Bouton Hang Up en bas de l'écran */}
        <div className="absolute bottom-4 z-10 flex w-full items-center justify-center gap-2">
          <Button
            onClick={onStop}
            variant="destructive"
            size="lg"
            className="rounded-full bg-red-500/80 hover:bg-red-400/80 px-9"
          >
            <Phone className="h-5 w-5 mr-2" />
            Raccrocher
          </Button>
        </div>

        {/* Overlay avec informations de l'avatar (optionnel) */}
        <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2">
          <p className="text-white text-sm font-medium">{avatarName}</p>
          <p className="text-white/70 text-xs">{avatarIdentity}</p>
        </div>
      </div>
    </>
  );
}
