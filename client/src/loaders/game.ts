import { redirect } from "react-router-dom";

export async function loader({ params }) {
  const res = await fetch(`http://192.168.0.201:2567/play/${params.pin}`);
  if (res.status === 404) {
    return redirect("/play");
  }
  return res;
}
