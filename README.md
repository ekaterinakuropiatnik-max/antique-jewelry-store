# Antique Treasures

[![React](https://img.shields.io/badge/React-19-20232a?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-native_HTTP-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Live Demo](https://img.shields.io/badge/demo-live-b08d57)](https://antique-jewelry-production.up.railway.app/)

A bilingual editorial e-commerce concept for a curated antique and vintage
jewelry collection. The project combines a premium storefront with a protected
inventory and order-management workspace.

[Live Demo](https://antique-jewelry-production.up.railway.app/)

![Antique Treasures catalog](public/product-images/contact-sheet.jpg)

## Highlights

- Russian and English storefront content
- Responsive editorial catalog with search and multi-criteria filters
- Product detail pages, archive, materials guide, cart, and guided checkout
- Password-protected product, material, and order management
- JSON-backed persistence with optional Railway volume storage
- Optional Stripe Checkout and WhatsApp Cloud API integrations
- Privacy-safe demo data and environment-based credentials

## Stack

React, Vite, Node.js, native HTTP APIs, and JSON persistence.

## What this project demonstrates

- End-to-end ownership of a commercial storefront concept
- Customer journeys from discovery and filtering through checkout
- A separate admin workflow for inventory, materials, and order processing
- Backend API design, file uploads, validation, and protected admin routes
- Deployment-ready configuration without committing production secrets

## Architecture

The Vite-powered React client talks to a lightweight Node.js HTTP server. The
server exposes catalog, checkout, upload, and protected admin endpoints while
persisting demo data as JSON. Runtime credentials are supplied only through
environment variables. Admin credentials are kept in memory for the current
page session and are never persisted in browser storage.

## Run locally

```bash
npm install
copy .env.example .env
npm run build
npm start
```

Open [http://localhost:8791](http://localhost:8791).

To use the admin area, set a strong `ADMIN_PASSWORD` in `.env`, restart the
server, and open [http://localhost:8791/admin](http://localhost:8791/admin).
The email field is a UI identifier; server authorization is based on the
password supplied through the environment.

## Configuration

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port; defaults to `8791` |
| `ADMIN_PASSWORD` | Required for admin API access |
| `DATA_DIR` | Writable runtime data directory |
| `STRIPE_SECRET_KEY` | Enables Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook events |
| `ADMIN_BASE_URL` | Public base URL used in admin links |
| `WHATSAPP_NOTIFY_TO` | Optional order-notification recipient |
| `WHATSAPP_ACCESS_TOKEN` | Optional WhatsApp Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional WhatsApp sender ID |

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway deployment details.

## Demo and privacy notes

This repository is a portfolio concept, not a production shop. Names, addresses,
contact details, tax identifiers, and orders shown in the demo are fictional or
empty. Payment and WhatsApp integrations remain disabled unless valid secrets
are provided at deployment time.

## Author

Designed and developed by
[Ekaterina Kuropiatnik](https://github.com/ekaterinakuropiatnik-max).
