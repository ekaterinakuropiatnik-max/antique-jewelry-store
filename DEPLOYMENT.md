# Deployment notes

This project is prepared for Railway deployment.

## Railway settings

Build command:
`npm run build`

Start command:
`npm start`

Required variables:

```env
ADMIN_PASSWORD=replace-with-a-long-random-password
DATA_DIR=/data
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ADMIN_BASE_URL=https://YOUR-DOMAIN
WHATSAPP_NOTIFY_TO=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

Add a Railway volume and mount it to:

```text
/data
```

The application seeds JSON files from the repository on first start if the volume is empty.

## Stripe webhook

After the Railway domain or custom domain is ready, create a Stripe webhook endpoint:

```text
https://YOUR-DOMAIN/api/stripe-webhook
```

Event:

```text
checkout.session.completed
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## WhatsApp notifications

New orders can be sent to WhatsApp through the official Meta WhatsApp Cloud API.

Add these Railway variables:

```env
WHATSAPP_NOTIFY_TO=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
ADMIN_BASE_URL=https://YOUR-DOMAIN
```

`ADMIN_BASE_URL` is used in the admin order link included in the message.
