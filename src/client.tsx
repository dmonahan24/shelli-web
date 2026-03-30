/// <reference types="vinxi/types/client" />
import { StartClient } from "@tanstack/react-start";
import { hydrateRoot } from "react-dom/client";

function ClientApp() {
  return <StartClient />;
}

hydrateRoot(document, <ClientApp />);

export default ClientApp;
