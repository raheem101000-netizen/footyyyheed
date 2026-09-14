import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "../game/PhaserGame";
import { useBlocker, useLocation, useParams } from "react-router-dom";
import { EventBus } from "../game/EventBus";

export function Game() {
  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const { roomId } = useParams();
  // `pin` arrives via router state from the lobby's room:game:start handoff
  // (RoomLobby generates it and passes it along with the roomId).
  const { pin } = (useLocation().state as { pin: string }) || {};

  // Block navigating elsewhere when data has been entered into the input
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname
  );
  
  const onCurrentActiveScene = (scene: Phaser.Scene) => {
    if (scene.scene.key == "Preloader") {
      EventBus.emit("room-ready", { pin, roomId });
    }
  };

  return (
    <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
  );
}

export default Game;
