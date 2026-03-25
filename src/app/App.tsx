import { RouterProvider } from "react-router";
import { router } from "./routes";

// AppProvider est maintenant à l'intérieur du router (dans Root @ routes.tsx)
// pour éviter les problèmes de contexte avec createBrowserRouter + HMR.
export default function App() {
  return <RouterProvider router={router} />;
}