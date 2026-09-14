import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Cloud } from "./layout";
import ErrorPage from "./error-page";
import Home from "./routes/home";
import Game from "./routes/game";
import Rooms from "./routes/play";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/play",
      element: <Rooms />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/play/:roomId",
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
