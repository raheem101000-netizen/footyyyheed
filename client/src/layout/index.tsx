import React from "react";
import CloudImgLeft from "/assets/images/cloud_1.png";
import CloudImgRight from "/assets/images/cloud_2.png";

export function Title(props: React.PropsWithChildren) {
  return <div className="title honk-font">{props.children}</div>;
}

export function Button(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <button
      type="submit"
      className={`button--pandora honk-font ${props?.className ?? ""}`}
      {...props}
    >
      <span>{props.children}</span>
    </button>
  );
}

export function Border(props: React.PropsWithChildren) {
  return <div className="border">{props.children}</div>;
}

export function Cloud({ direction }: { direction: "left" | "right" }) {
  return direction === "left" ? (
    <img className="cloud-left" src={CloudImgLeft} />
  ) : (
    <img className="cloud-right" src={CloudImgRight} />
  );
}

export function Player({ player, flip }: { player: number; flip: boolean }) {
  const buildPath = (player: number) => `./assets/images/${player}.png`;
  return (
    <div className={"spin"}>
      <img className={`player ${flip ? "flip" : ""}`} src={buildPath(player)} />
    </div>
  );
}
