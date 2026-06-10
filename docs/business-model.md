# LegalHub — Modelo de negocio y pricing

**Fecha:** 2026-06-10 · Basado en investigación de competidores (Encuadrado, AgendaPro, Doctoralia) y comisiones reales de MercadoPago.

---

## 1. El modelo: Freemium SaaS + comisión en free + extras de demanda

**Cobramos al profesional, nunca al cliente final.** Tres fuentes de ingreso, en este orden de madurez:

1. **Suscripción mensual/anual** (núcleo, desde el día 1)
2. **Comisión del 5% solo en el plan Gratuito** (monetiza a quien aún no paga + empuja el upgrade)
3. **Extras de demanda** (destacados en directorio, storage, IA) — alta margen, se activan cuando el directorio tenga tráfico

### Por qué suscripción y no comisión pura

- Los honorarios legales son **altos y variables** (una consulta $U 2.400, un caso completo miles de dólares). Una comisión pura del 10-15% sobre eso se siente confiscatoria e **incentiva la desintermediación**: el abogado conoce al cliente en la primera consulta y saca la relación de la plataforma.
- Los tres comparables convergieron en suscripción: [Encuadrado](https://www.encuadrado.com/precio) (0,6–6 UF/mes + comisión de pasarela), [AgendaPro](https://agendapro.com/mx/planes) (US$ 19–59/mes) y Doctoralia (suscripción premium por visibilidad).
- La suscripción hace el ingreso **predecible** (MRR) y alinea: nosotros ganamos si el profesional se queda, no si le exprimimos cada transacción.

### Por qué comisión solo en el gratuito

- El free generoso es la **máquina de adquisición** del lado oferta (70% juniors sin presupuesto). El 5% hace que los activos-gratis paguen algo proporcional al valor que reciben.
- Es el **gancho del upgrade**: "0% de comisión en planes pagos" — con 2-3 turnos al mes, el plan Esencial ya se paga solo. El upgrade es matemática, no marketing.
- Referencia de mercado: la pasarela ya cobra ~4-6%+IVA (MercadoPago [UY](https://www.mercadopago.com.uy/ayuda/custo-receber-pagamentos_453) ~3,99%+IVA, [AR](https://www.mercadopago.com.ar/ayuda/recibir-pagos-costos_220) crédito 6,29%+IVA). Nuestro 5% adicional en free deja un total ~10-11%: aceptable para volumen bajo, incómodo para volumen alto — exactamente el comportamiento que queremos.

### La métrica de valor

**Turnos cobrados por mes + profundidad de herramientas.** A más consultas, más valor recibido → el límite de 10 turnos/mes del free y el 0% de comisión de los pagos escalan el precio con el valor. (Per-seat solo aplica en Estudio: 5 perfiles.)

---

## 2. Cuánto cobramos y por qué cada número

| Plan | Precio | Ancla de valor | Referencia competitiva |
|------|--------|----------------|------------------------|
| **Gratuito** | $0 + 5% comisión, 10 turnos/mes | "Tu primera oficina" | Doctoralia free profile |
| **Esencial** | **US$ 9/mes** ($90/año) | **Menos de media consulta** | 53% más barato que AgendaPro entry ($19) |
| **Profesional** ⭐ | **US$ 19/mes** ($180/año) | **Una consulta al mes lo paga** | = AgendaPro entry, pero con directorio + reviews + video; ~55% bajo Encuadrado Profesional (1 UF ≈ $42) |
| **Estudio** | **US$ 49/mes** ($490/año) | US$ 9,8 por profesional | AgendaPro premium $59; Encuadrado Premium 6 UF ≈ $250 |
| **Enterprise** | A consultar | White-label, ilimitado | — |

**Cambio aplicado:** Estudio sube de $39 → **$49**. A $39 con 5 perfiles éramos $7,8/asiento — regalado contra cualquier comparable y canibaliza 2×Profesional. A $49 sigue siendo la mitad que la referencia y mantiene el incentivo de consolidar el equipo.

**Por qué Esencial queda en $9 (no sube):** es el plan-puente del junior. El objetivo del primer año no es maximizar ARPU sino **llenar el directorio de oferta verificada** — la liquidez del marketplace es el foso defensivo. Un junior que paga $9 hoy es el estudio de $49 en tres años.

**Por qué Profesional queda en $19 (por ahora):** la lección de Doctoralia es que los profesionales pagan caro por **captación de clientes**, no por herramientas. Hoy vendemos herramientas (el directorio aún no tiene tráfico) → precio de herramientas. Cuando el directorio genere consultas reales, el precio para *nuevos* usuarios sube a $29 con grandfathering a los existentes (la subida se comunica como "los primeros mil precios fundadores quedan congelados" — recompensa a los early adopters y crea urgencia).

**Psicología aplicada en la página de precios:**
- Anclaje: Estudio $49 hace ver barato a Profesional $19 (el decoy es Esencial).
- "Se paga con una consulta" — convertimos el precio a la unidad mental del abogado.
- Cobro en **moneda local vía MercadoPago** (en AR el precio en USD es fricción y problema de pago).
- Anual = 2 meses gratis (estándar 17%).
- Trial 14 días sin tarjeta (ya implementado).

---

## 3. Extras (fase 2, cuando haya tráfico)

| Extra | Precio | Racional |
|-------|--------|----------|
| Destacado en directorio | **US$ 15/mes** por especialidad+ciudad, máx. 3 slots | Modelo Doctoralia: pagar por aparecer primero. Escasez deliberada (3 slots) sostiene el precio. |
| Storage adicional | US$ 5 / 10 GB | Costo + margen estándar. |
| IA (resumen de reviews, borrador de artículos) | incluido en Profesional+; por uso en free | La IA retiene, no convierte: mejor como razón para quedarse. |
| Publicidad contextual (solo free) | CPM/CPC a definir | Editoriales jurídicas, seguros de praxis. Nunca en planes pagos. |

---

## 4. Unit economics (escenario base: 1.000 registros)

Supuestos conservadores de freemium prosumer LATAM (conversión free→pago 5-7%):

- 1.000 profesionales registrados → ~60 de pago (6%):
  - 35 Esencial × $9 = $315
  - 20 Profesional × $19 = $380
  - 5 Estudio × $49 = $245
- **MRR suscripciones ≈ US$ 940**
- Comisiones free: ~250 free activos × 1,5 turnos/mes × US$ 45 promedio × 5% ≈ **US$ 840/mes**
- Destacados (fase 2): 10 × $15 = $150
- **Total ≈ US$ 1.900 MRR por cada 1.000 registros** (ARPU blend ≈ $1,9; ARPU de pago ≈ $15,7)

Métricas a vigilar: churn mensual de pago (<5% objetivo), conversión free→pago (≥5%), % de turnos que se fugan de la plataforma (proxy: turnos repetidos con el mismo cliente que desaparecen).

CAC objetivo: orgánico-primero (SEO programático especialidad+ciudad, perfiles indexados, contenido). Con LTV Profesional ≈ $19 × 18 meses ≈ **$342**, hay margen para CAC pago de hasta ~$80-100 cuando se active growth.

---

## 5. Secuencia estratégica (resumen ejecutivo)

1. **Hoy (oferta):** free generoso + Esencial $9 → llenar el directorio de juniors verificados. Ingreso real: Profesional $19 de los establecidos que quieren video + reputación.
2. **6-12 meses (demanda):** SEO + perfiles → tráfico de clientes → se activan destacados y el argumento "LegalHub te trae clientes".
3. **12+ meses (pricing power):** Profesional $29 para nuevos (grandfathering), Estudio empuja consolidación, Enterprise para colegios/facultades. El precio sigue al valor: primero herramientas, después captación.

> **La regla de oro:** nunca cobrar por lo que crea liquidez (perfil, reseñas, directorio básico); siempre cobrar por lo que captura valor (cero comisión, video, visibilidad premium, equipo).
