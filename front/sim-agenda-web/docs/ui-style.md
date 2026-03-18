# UI Style Guide - Sistema Odontológico Premium

## 🎨 Sistema de Diseño

Este documento describe los design tokens y patrones visuales del sistema de gestión odontológica.

---

## 🌈 Paleta de Colores

### Brand Colors - Colores de Marca

#### Primary (Azul Clínico)

Color principal que transmite confianza y profesionalismo médico.

```css
--color-brand-primary: #295080 /* Azul base */
  --color-brand-primary-hover: #3466a1 /* Hover state */
  --color-brand-primary-dark: #1a3a5f /* Variante oscura */
  --color-brand-primary-light: #e8f0f7 /* Variante clara (fondos) */
  --color-brand-primary-50: #f0f5fa /* Tinte muy suave */;
```

**Uso:**

- Botones principales
- Headers y navegación
- Enlaces importantes
- Estados activos

#### Accent (Teal/Menta)

Color de acento fresco y limpio, ideal para destacar elementos secundarios.

```css
--color-brand-accent: #14b8a6 /* Teal base */
  --color-brand-accent-hover: #0d9488 /* Hover state */
  --color-brand-accent-dark: #0f766e /* Variante oscura */
  --color-brand-accent-light: #ccfbf1 /* Variante clara */
  --color-brand-accent-50: #f0fdfa /* Tinte muy suave */;
```

**Uso:**

- Botones secundarios
- Badges y etiquetas
- Elementos de éxito
- Highlights

---

### Surface Colors - Superficies

Grises suaves para fondos y contenedores.

```css
--color-surface-background: #f5f7fa /* Fondo general de la app */
  --color-surface-primary: #ffffff /* Cards y contenedores principales */
  --color-surface-secondary: #f8fafc /* Fondos alternativos */
  --color-surface-elevated: #ffffff /* Elementos elevados (modales) */
  --color-surface-overlay: rgba(30, 42, 65, 0.4) /* Overlay de modales */;
```

**Uso:**

- `background`: Fondo general de páginas
- `primary`: Cards, formularios, tablas
- `secondary`: Secciones alternadas, zebra striping
- `elevated`: Modales, dropdowns
- `overlay`: Backdrop de modales

---

### Text Colors - Jerarquía de Texto

```css
--color-text-primary: #1a202c /* Texto principal (títulos, contenido) */
  --color-text-secondary: #4a5568 /* Texto secundario (subtítulos) */
  --color-text-tertiary: #718096 /* Texto terciario (metadatos) */
  --color-text-muted: #a0aec0 /* Texto desenfatizado (placeholders) */
  --color-text-disabled: #cbd5e0 /* Texto deshabilitado */
  --color-text-inverse: #ffffff /* Texto sobre fondos oscuros */;
```

**Jerarquía:**

1. **Primary**: Títulos principales, contenido importante
2. **Secondary**: Subtítulos, descripciones
3. **Tertiary**: Metadatos, fechas, información auxiliar
4. **Muted**: Placeholders, hints
5. **Disabled**: Elementos deshabilitados
6. **Inverse**: Texto en headers, botones oscuros

---

### Status Colors - Estados del Sistema

#### Success (Verde Clínico)

```css
--color-status-success: #10b981 --color-status-success-bg: #d1fae5
  --color-status-success-border: #6ee7b7;
```

**Uso:** Confirmaciones, operaciones exitosas, estados activos

#### Warning (Amarillo Atención)

```css
--color-status-warning: #f59e0b --color-status-warning-bg: #fef3c7
  --color-status-warning-border: #fcd34d;
```

**Uso:** Advertencias, acciones que requieren atención

#### Danger (Rojo Urgente)

```css
--color-status-danger: #ef4444 --color-status-danger-bg: #fee2e2
  --color-status-danger-border: #fca5a5;
```

**Uso:** Errores, eliminaciones, acciones destructivas

#### Info (Azul Informativo)

```css
--color-status-info: #3b82f6 --color-status-info-bg: #dbeafe
  --color-status-info-border: #93c5fd;
```

**Uso:** Información general, tooltips, ayudas

---

### Border Colors

```css
--color-border-primary: #e2e8f0 /* Bordes por defecto */
  --color-border-secondary: #cbd5e0 /* Bordes más prominentes */
  --color-border-hover: #a0aec0 /* Bordes en hover */
  --color-border-focus: #295080 /* Bordes en focus */;
```

---

## 📝 Tipografía

### Font Family

```css
--font-family-base:
  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif --font-family-fallback: Arial, sans-serif;
```

**Inter** es la fuente principal. Fallback a system fonts si no carga.

### Font Sizes

| Token              | Tamaño | Uso                           |
| ------------------ | ------ | ----------------------------- |
| `--font-size-xs`   | 12px   | Etiquetas pequeñas, metadatos |
| `--font-size-sm`   | 14px   | Texto secundario, labels      |
| `--font-size-base` | 16px   | Texto principal (body)        |
| `--font-size-lg`   | 18px   | Subtítulos                    |
| `--font-size-xl`   | 20px   | Títulos de sección            |
| `--font-size-2xl`  | 24px   | Títulos de página             |
| `--font-size-3xl`  | 30px   | Títulos destacados            |
| `--font-size-4xl`  | 36px   | Hero titles                   |

### Font Weights

```css
--font-weight-normal: 400 /* Texto regular */ --font-weight-medium: 500
  /* Énfasis medio */ --font-weight-semibold: 600 /* Subtítulos, botones */
  --font-weight-bold: 700 /* Títulos principales */;
```

### Line Heights

```css
--line-height-tight: 1.25 /* Títulos */ --line-height-normal: 1.5
  /* Texto general */ --line-height-relaxed: 1.75 /* Párrafos largos */;
```

---

## 📏 Spacing Scale

Sistema de espaciado consistente basado en múltiplos de 4px.

| Token          | Valor | Uso                     |
| -------------- | ----- | ----------------------- |
| `--spacing-0`  | 0     | Sin espacio             |
| `--spacing-1`  | 4px   | Espacios mínimos        |
| `--spacing-2`  | 8px   | Espacios pequeños       |
| `--spacing-3`  | 12px  | Espacios medianos       |
| `--spacing-4`  | 16px  | Espacios estándar       |
| `--spacing-5`  | 20px  | Espacios amplios        |
| `--spacing-6`  | 24px  | Separación de secciones |
| `--spacing-8`  | 32px  | Padding de contenedores |
| `--spacing-10` | 40px  | Separación grande       |
| `--spacing-12` | 48px  | Separación muy grande   |
| `--spacing-16` | 64px  | Separación máxima       |

**Ejemplo de uso:**

```css
.card {
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-4);
}
```

---

## 🔲 Border Radius

Bordes redondeados suaves (12-16px para look premium).

| Token           | Valor  | Uso                      |
| --------------- | ------ | ------------------------ |
| `--radius-none` | 0      | Sin redondeo             |
| `--radius-sm`   | 4px    | Elementos pequeños       |
| `--radius-md`   | 8px    | Inputs, botones pequeños |
| `--radius-lg`   | 12px   | Botones, cards pequeños  |
| `--radius-xl`   | 16px   | Cards, modales           |
| `--radius-2xl`  | 24px   | Elementos destacados     |
| `--radius-full` | 9999px | Círculos, pills          |

**Recomendado:**

- Botones: `--radius-lg` (12px)
- Cards: `--radius-xl` (16px)
- Modales: `--radius-xl` (16px)
- Inputs: `--radius-md` (8px)

---

## 🌫️ Shadows

Sombras suaves y profesionales para dar profundidad.

```css
--shadow-xs:
  0 1px 2px 0 rgba(0, 0, 0, 0.05) --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.08),
  0 1px 2px 0 rgba(0, 0, 0, 0.06) --shadow-md: 0 4px 6px -1px
    rgba(0, 0, 0, 0.08),
  0 2px 4px -1px rgba(0, 0, 0, 0.06) --shadow-lg: 0 10px 15px -3px
    rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.05) --shadow-xl: 0 20px 25px -5px
    rgba(0, 0, 0, 0.08),
  0 10px 10px -5px rgba(0, 0, 0, 0.04) --shadow-2xl: 0 25px 50px -12px
    rgba(0, 0, 0, 0.15) --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
```

**Sombras de focus:**

```css
--shadow-focus: 0 0 0 3px var(--color-brand-primary-light)
  --shadow-focus-accent: 0 0 0 3px var(--color-brand-accent-light);
```

**Uso recomendado:**

- Cards: `--shadow-sm` o `--shadow-md`
- Modales: `--shadow-xl`
- Dropdowns: `--shadow-lg`
- Botones hover: `--shadow-md`
- Inputs focus: `--shadow-focus`

---

## ⚡ Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1) --transition-base: 200ms
  cubic-bezier(0.4, 0, 0.2, 1) --transition-slow: 300ms
  cubic-bezier(0.4, 0, 0.2, 1);
```

**Uso:**

- Hover states: `--transition-base`
- Micro-interacciones: `--transition-fast`
- Animaciones complejas: `--transition-slow`

---

## 🎯 Ejemplos de Uso

### Botón Principal

```css
.btn-primary {
  background: var(--color-brand-primary);
  color: var(--color-text-inverse);
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background: var(--color-brand-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:focus {
  box-shadow: var(--shadow-focus);
}
```

### Card

```css
.card {
  background: var(--color-surface-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-4);
}

.card-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
```

### Input

```css
.input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.input::placeholder {
  color: var(--color-text-muted);
}
```

### Alert Success

```css
.alert-success {
  background: var(--color-status-success-bg);
  border: 1px solid var(--color-status-success-border);
  border-left: 4px solid var(--color-status-success);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  color: var(--color-text-primary);
}
```

### Modal

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-surface-overlay);
  backdrop-filter: blur(4px);
  z-index: var(--z-index-modal-backdrop);
}

.modal-content {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-xl);
  padding: var(--spacing-8);
  box-shadow: var(--shadow-2xl);
  max-width: 500px;
}
```

---

## 📱 Z-Index Scale

```css
--z-index-dropdown: 1000 --z-index-sticky: 1020 --z-index-fixed: 1030
  --z-index-modal-backdrop: 1040 --z-index-modal: 1050 --z-index-popover: 1060
  --z-index-tooltip: 1070;
```

---

## ✅ Checklist de Uso

Al crear nuevos componentes:

- [ ] Usar variables CSS en lugar de valores hardcoded
- [ ] Aplicar spacing consistente (múltiplos de 4px)
- [ ] Usar border-radius entre 12-16px para elementos principales
- [ ] Aplicar sombras suaves (evitar sombras muy oscuras)
- [ ] Agregar transiciones a elementos interactivos
- [ ] Usar jerarquía de colores de texto correcta
- [ ] Aplicar focus states con `--shadow-focus`
- [ ] Mantener consistencia con la paleta de marca

---

## 🎨 Paleta Visual Rápida

**Colores principales:**

- 🔵 Primary: `#295080` (Azul clínico)
- 🟢 Accent: `#14b8a6` (Teal/Menta)
- ⚪ Surface: `#FFFFFF` (Blanco)
- 🌫️ Background: `#f5f7fa` (Gris muy claro)

**Estados:**

- ✅ Success: `#10b981` (Verde)
- ⚠️ Warning: `#f59e0b` (Amarillo)
- ❌ Danger: `#ef4444` (Rojo)
- ℹ️ Info: `#3b82f6` (Azul)

**Texto:**

- Primary: `#1a202c` (Casi negro)
- Secondary: `#4a5568` (Gris oscuro)
- Muted: `#a0aec0` (Gris medio)

---

## 🔄 Compatibilidad

Todas las variables nuevas mantienen compatibilidad con las existentes:

```css
/* Nuevas variables */
--color-brand-primary: #295080 --color-surface-background: #f5f7fa
  /* Variables legacy (siguen funcionando) */ --color-primary: #295080
  --color-background: #f5f7fa;
```

Los componentes existentes seguirán funcionando sin cambios.

---

**Última actualización:** 2026-02-05  
**Versión:** 1.0.0
