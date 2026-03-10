import { useNavigate } from "@solidjs/router";

export default function Home() {
  const navigate = useNavigate();
  navigate("/recipes", { replace: true });
  return null;
}
