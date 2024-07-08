import { Form, Link, useActionData } from "react-router-dom";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Button, Title } from "../layout";
import { useState } from "react";

const prettyPrint = (str: string) =>
  str && `${str.slice(0, 3)}-${str.slice(3)}`;

function Play() {
  const [copyButtonText, setCopyButtonText] = useState<string>("Copy");
  const { pin } = (useActionData() as { pin: string; roomID: string }) || {};

  return (
    <>
      <Title>Footy Head</Title>
      <div className="lobby-card honk-font">
        <div className="lobby-card--title">Start a new Game</div>
        <div className="lobby-card--desc">Your PIN: </div>
        {pin ? (
          <div className="lobby-card--pin-container">
            <div className="lobby-card--pin">{prettyPrint(pin)}</div>
            <CopyToClipboard
              text={`${window.location.href}/${pin}`}
              onCopy={() => setCopyButtonText("Done!")}
            >
              <Button>{copyButtonText}</Button>
            </CopyToClipboard>
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex" }}>
        <Link to="../">
          <Button>← Go Back</Button>
        </Link>
        <Form id="create-pin" method="post">
          {pin ? (
            <Link to={pin}>
              <Button>Start Game</Button>
            </Link>
          ) : (
            <Button>Create PIN</Button>
          )}
        </Form>
      </div>
    </>
  );
}

export default Play;
