import React from "react";
import { Link } from "react-router-dom";

import { Border, Button, Player, Title } from "../layout";

function Home() {
  const players: React.JSX.Element[] = [];
  const NUM_PLAYERS = 4;

  for (
    let i = 0, pCache: Map<number, boolean> = new Map();
    i < NUM_PLAYERS;
    i++
  ) {
    const player = 100 + Math.floor(Math.random() * 30);
    if (!pCache.has(player)) {
      const flip = i % 2 != 0;
      pCache.set(player, true);
      players.push(<Player key={player} player={player} flip={flip} />);
    } else {
      i--;
    }
  }

  return (
    <>
      <Title>Footy Head</Title>
      <Border>{players}</Border>
      <Link to="play">
        <Button>Play</Button>
      </Link>
    </>
  );
}

export default Home;
