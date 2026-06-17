# Cobros con MercadoPago (split de pagos)

Cómo activar que cada profesional conecte su MercadoPago y cobre, con la
comisión del 5% (solo plan Gratuito) separándose sola hacia la plataforma.

> **Fallback-safe:** mientras esto no esté configurado, o si un profesional no
> conectó su cuenta, las reservas pagas se confirman igual en modo demostración
> (sin cargo real). Nada se rompe.

## 1. Crear la aplicación en MercadoPago Developers

1. [mercadopago.com.uy/developers](https://www.mercadopago.com.uy/developers) →
   **Tus integraciones → Crear aplicación**.
2. Producto: **Pagos online**. Modelo: **Marketplace** (necesario para el split).
3. En la configuración de la app, agregá la **URL de redirección (Redirect URI)**:
   ```
   https://localhub-5am.pages.dev/api/mp/callback
   ```
4. Copiá de la app: **Client ID** (User ID / App ID) y **Client Secret**.
   - Para probar primero, usá las credenciales de **prueba (sandbox)**.

## 2. Variables de entorno en Cloudflare Pages

Workers y Pages → tu proyecto → Settings → Variables (Production):

| Variable | Valor |
|---|---|
| `MP_CLIENT_ID` | Client ID de la app |
| `MP_CLIENT_SECRET` | Client Secret de la app |
| `APP_URL` | `https://localhub-5am.pages.dev` (sin barra final) |

Guardar → **Retry deployment** (las variables aplican en builds nuevos).

## 3. Probar en sandbox

1. Creá **usuarios de prueba** en MercadoPago (un vendedor y un comprador):
   panel de la app → "Cuentas de prueba".
2. En LegalHub, logueado como profesional → **Configuración → Cobros →
   Conectar MercadoPago** → autorizás con el **usuario vendedor de prueba**.
3. Como cliente, reservá una consulta paga → te redirige al checkout de MP →
   pagás con el **usuario comprador de prueba** (tarjetas de prueba de MP).
4. El webhook confirma el turno; volvés a `/reserva/:id` con el estado.

## 4. Pasar a producción

- Reemplazá las credenciales de prueba por las de **producción** en Cloudflare.
- Verificá que el **Redirect URI de producción** esté cargado en la app de MP.
- Si MP pide habilitar el modo Marketplace para tu cuenta, seguí su flujo de
  alta (puede requerir aprobación).

## Cómo funciona (resumen técnico)

- **OAuth**: `GET /api/mp/connect` (autenticado) → URL de autorización →
  `GET /api/mp/callback` canjea el code por tokens y los guarda en
  `mp_credentials` (solo el backend los ve). Estado anti-CSRF firmado con HMAC.
- **Cobro**: `POST /api/payments/create` arma la preferencia con el
  **access_token del profesional** + `marketplace_fee` (5% solo plan free).
  El cobro va a la cuenta del profesional; la comisión se separa automáticamente.
- **Webhook**: `POST /api/mp/webhook?lawyer={id}` (el `?lawyer=` lo preserva MP)
  busca el pago con el token del profesional, confirma el turno e inserta el
  pago. Idempotente: `payments.gateway_payment_id` es UNIQUE.
- **Pendiente Fase 2**: refresh automático del token (expira a los ~180 días),
  emails de confirmación (Resend), reembolsos por cancelación.
