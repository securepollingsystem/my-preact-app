# `create-preact`

<h2 align="center">
  <img height="256" width="256" src="./src/assets/preact.svg">
</h2>

<h3 align="center">Get started using Preact and Vite!</h3>

## todo
- check the server for your own screed?  maybe by requesting a subset of pubkeys containing part of yours (to prevent doxing yourself to the server)
- let you know if you have changes newer than the last time you uploaded to the server (from localstorage)
- can't do TLS unless the collator is also TLS because you get ``` index.jsx:8
  Mixed Content: The page at 'https://localhost:8990/' was loaded over HTTPS,
  but requested an insecure resource
  'http://stemgrid.org:8993/opinions?subset='. This request has been blocked;
  the content must be served over HTTPS.```

## check on phone formatting:
- the long privatekey makes the phone formatting way too wide and then the modal is offscreen

## tls
- using vite-plugin-mkcert creates ~/.vite-plugin-mkcert/dev.pem and cert.pem and you get self-signed TLS
- as seen here https://stackoverflow.com/a/71618444

## Getting Started

-   `npm run dev` - Starts a dev server at http://localhost:5173/ or whatever port is configured in vite.config.js
-   `npm run dev -- --host` - same as above but allows for connections to other than localhost, such as external IP address

-   `npm run build` - Builds for production, emitting to `dist/`

-   `npm run preview` - Starts a server at http://localhost:4173/ to test production build locally
-   `npm run preview -- --port 8990 --host` - same as above but on port 8990 and allows connections from outside localhost
