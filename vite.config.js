import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function inlineCssPlugin() {
  return {
    name: "inline-css-plugin",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      let css = "";
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (fileName.endsWith(".css")) {
          css += asset.source;
          delete bundle[fileName];
        }
      }
      if (css) {
        for (const [, chunk] of Object.entries(bundle)) {
          if (chunk.type === "chunk" && chunk.isEntry) {
            const injection = `(function(){try{var id="wc-dimensions-editor-styles";if(typeof document!=="undefined"&&!document.getElementById(id)){var s=document.createElement("style");s.id=id;s.textContent=${JSON.stringify(css)};document.head.appendChild(s);}}catch(e){console.error("Failed to inject wc-dimensions-editor styles",e);}})();\n`;
            chunk.code = injection + chunk.code;
            break;
          }
        }
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const isExternal = mode === "external";

  return {
    plugins: [
      react(),
      ...(isExternal ? [inlineCssPlugin()] : [])
    ],
    define: isExternal
      ? {
          "process.env.NODE_ENV": JSON.stringify("production")
        }
      : undefined,
    build: isExternal
      ? {
          lib: {
            entry: "src/external-root.jsx",
            name: "WCDimensionsEditor",
            formats: ["iife"],
            fileName: () => "wc-dimensions-editor.js"
          },
          minify: true,
          rollupOptions: {
            output: {
              inlineDynamicImports: true
            }
          }
        }
      : undefined
  };
});

