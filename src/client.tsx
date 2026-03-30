/// <reference types="vinxi/types/client" />
import { StartClient } from "@tanstack/react-start";
import { hydrateRoot } from "react-dom/client";

import { createRouter } from "./router";

const router = createRouter();

function ClientApp() {
  return <StartClient router={router} />;
}

hydrateRoot(document, <ClientApp />);

export default ClientApp;
