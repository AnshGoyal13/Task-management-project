import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add material icons from CDN
const link = document.createElement("link");
link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
link.rel = "stylesheet";
document.head.appendChild(link);

// Add Inter font from Google fonts
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Add title
const title = document.createElement("title");
title.textContent = "TaskMaster - Task Management Application";
document.head.appendChild(title);

createRoot(document.getElementById("root")!).render(<App />);
