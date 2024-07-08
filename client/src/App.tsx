import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Cloud } from "./layout";
import ErrorPage from "./error-page";
import Home from "./routes/home";
import Game from "./routes/game";
import Play from "./routes/play";
import { action as playAction } from "./actions/play";
import { loader as gameLoader } from "./loaders/game";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/play",
      action: playAction,
      element: <Play />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/play/:pin",
      loader: gameLoader,
      element: <Game />,
      errorElement: <ErrorPage />,
    },
  ]);

  return (
    <div id="app">
      <RouterProvider router={router} />
      <Cloud direction="left" />
      <Cloud direction="right" />
    </div>
  );
}

export default App;
