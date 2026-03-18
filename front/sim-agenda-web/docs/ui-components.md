# UI Component Library Documentation

## 📚 Component Library Overview

Internal UI component library for the dental clinic management system. All components use design tokens and follow accessibility best practices.

---

## 🎨 Components

### 1. Button

Premium button component with multiple variants, sizes, and loading state.

**Props:**

- `variant`: `'primary'` | `'secondary'` | `'ghost'` | `'danger'` (default: `'primary'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `loading`: `boolean` - Shows loading spinner
- `disabled`: `boolean` - Disables button
- `className`: `string` - Additional classes

**Example:**

```jsx
import { Button } from '../components/ui';

// Primary button
<Button variant="primary" size="md">
  Guardar
</Button>

// Loading state
<Button variant="primary" loading={isSubmitting}>
  Guardando...
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  Eliminar
</Button>

// Ghost button (outline)
<Button variant="ghost">
  Cancelar
</Button>
```

---

### 2. Input

Text input with label, helper text, error states, and optional icon.

**Props:**

- `label`: `string` - Label text
- `helper`: `string` - Helper text below input
- `error`: `string` - Error message
- `icon`: `React.ReactNode` - Optional icon (left side)
- `className`: `string` - Additional classes
- All standard input props (`type`, `placeholder`, `value`, `onChange`, etc.)

**Example:**

```jsx
import { Input } from '../components/ui';
import { FaUser, FaEnvelope } from 'react-icons/fa';

// Basic input
<Input
  label="Nombre"
  placeholder="Ingresa tu nombre"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With icon
<Input
  label="Email"
  type="email"
  icon={<FaEnvelope />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With helper text
<Input
  label="Teléfono"
  helper="Formato: 3001234567"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>

// With error
<Input
  label="Usuario"
  error="Este campo es requerido"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

---

### 3. Select

Dropdown select with label, helper text, and error states.

**Props:**

- `label`: `string` - Label text
- `helper`: `string` - Helper text below select
- `error`: `string` - Error message
- `options`: `Array<{value, label}>` - Options array
- `children`: `React.ReactNode` - Alternative to options prop
- `className`: `string` - Additional classes

**Example:**

```jsx
import { Select } from '../components/ui';

// With options array
<Select
  label="Ciudad"
  options={[
    { value: 'bog', label: 'Bogotá' },
    { value: 'med', label: 'Medellín' },
    { value: 'cal', label: 'Cali' }
  ]}
  value={city}
  onChange={(e) => setCity(e.target.value)}
/>

// With children
<Select
  label="Tipo de Servicio"
  value={serviceType}
  onChange={(e) => setServiceType(e.target.value)}
>
  <option value="">Seleccione uno</option>
  <option value="pbs">PBS</option>
  <option value="particular">Particular</option>
</Select>

// With error
<Select
  label="Profesional"
  error="Debe seleccionar un profesional"
  options={professionals}
  value={professional}
  onChange={(e) => setProfessional(e.target.value)}
/>
```

---

### 4. Textarea

Multi-line text input with label, helper text, and error states.

**Props:**

- `label`: `string` - Label text
- `helper`: `string` - Helper text below textarea
- `error`: `string` - Error message
- `rows`: `number` - Number of rows (default: 4)
- `className`: `string` - Additional classes

**Example:**

```jsx
import { Textarea } from '../components/ui';

// Basic textarea
<Textarea
  label="Observaciones"
  placeholder="Ingresa observaciones adicionales"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
/>

// With helper
<Textarea
  label="Motivo de Consulta"
  helper="Describe brevemente el motivo de la consulta"
  rows={6}
  value={reason}
  onChange={(e) => setReason(e.target.value)}
/>

// With error
<Textarea
  label="Diagnóstico"
  error="Este campo es requerido"
  value={diagnosis}
  onChange={(e) => setDiagnosis(e.target.value)}
/>
```

---

### 5. Card

Container component with optional header and footer.

**Props:**

- `title`: `string` - Title (shorthand for header)
- `header`: `React.ReactNode` - Custom header content
- `footer`: `React.ReactNode` - Footer content
- `className`: `string` - Additional classes

**Example:**

```jsx
import { Card, Button } from '../components/ui';

// Simple card with title
<Card title="Información del Paciente">
  <p>Nombre: Juan Pérez</p>
  <p>Edad: 35 años</p>
</Card>

// Card with custom header and footer
<Card
  header={
    <div className="flex items-center justify-between">
      <h3>Citas Programadas</h3>
      <Badge variant="info">5 citas</Badge>
    </div>
  }
  footer={
    <div className="flex gap-2 justify-end">
      <Button variant="ghost">Cancelar</Button>
      <Button variant="primary">Guardar</Button>
    </div>
  }
>
  {/* Card content */}
</Card>
```

---

### 6. Badge

Status indicator with different color variants.

**Props:**

- `variant`: `'success'` | `'warning'` | `'danger'` | `'info'` | `'neutral'` (default: `'neutral'`)
- `size`: `'sm'` | `'md'` (default: `'md'`)
- `className`: `string` - Additional classes

**Example:**

```jsx
import { Badge } from '../components/ui';

// Status badges
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Cancelado</Badge>
<Badge variant="info">En proceso</Badge>
<Badge variant="neutral">Inactivo</Badge>

// Small size
<Badge variant="success" size="sm">Nuevo</Badge>
```

---

### 7. Table

Premium table component with zebra striping, hover states, and empty state.

**Props:**

- `columns`: `Array<{key, label, render?}>` - Column definitions
- `data`: `Array<Object>` - Data array
- `emptyMessage`: `string` - Message when no data (default: "No hay datos para mostrar")
- `hoverable`: `boolean` - Enable row hover (default: `true`)
- `className`: `string` - Additional classes

**Example:**

```jsx
import { Table, Badge, Button } from "../components/ui";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nombre" },
  {
    key: "status",
    label: "Estado",
    render: (value) => (
      <Badge variant={value === "active" ? "success" : "neutral"}>
        {value === "active" ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
  {
    key: "actions",
    label: "Acciones",
    render: (_, row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
          Editar
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
          Eliminar
        </Button>
      </div>
    ),
  },
];

const data = [
  { id: 1, name: "Juan Pérez", status: "active" },
  { id: 2, name: "María García", status: "inactive" },
];

<Table
  columns={columns}
  data={data}
  emptyMessage="No hay pacientes registrados"
/>;
```

---

### 8. Modal

Modal dialog with animations, keyboard support, and customizable sizes.

**Props:**

- `open`: `boolean` - Control visibility
- `onClose`: `function` - Callback when modal should close
- `title`: `string` - Modal title
- `footer`: `React.ReactNode` - Footer content
- `size`: `'sm'` | `'md'` | `'lg'` | `'xl'` (default: `'md'`)
- `closeOnOverlay`: `boolean` - Close when clicking overlay (default: `true`)
- `className`: `string` - Additional classes

**Example:**

```jsx
import { Modal, Button } from '../components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmar Acción"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={handleConfirm}>
        Confirmar
      </Button>
    </>
  }
>
  <p>¿Estás seguro de que deseas eliminar este registro?</p>
  <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
    Esta acción no se puede deshacer.
  </p>
</Modal>

// Large modal
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Detalles del Paciente"
  size="lg"
>
  {/* Modal content */}
</Modal>
```

---

## 🎯 Complete Example: Form with All Components

```jsx
import {
  Card,
  Input,
  Select,
  Textarea,
  Button,
  Badge,
  Table,
  Modal,
} from "../components/ui";
import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import { useState } from "react";

function PatientForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Submit logic
    setLoading(false);
  };

  return (
    <Card
      title="Registro de Paciente"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            Guardar Paciente
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre Completo"
          icon={<FaUser />}
          placeholder="Ej: Juan Pérez"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Teléfono"
          type="tel"
          icon={<FaPhone />}
          placeholder="3001234567"
          helper="Formato: 10 dígitos sin espacios"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <Input
          label="Email"
          type="email"
          icon={<FaEnvelope />}
          placeholder="ejemplo@correo.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <Select
          label="Ciudad de Residencia"
          options={[
            { value: "", label: "Seleccione una ciudad" },
            { value: "bog", label: "Bogotá" },
            { value: "med", label: "Medellín" },
            { value: "cal", label: "Cali" },
          ]}
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />

        <Textarea
          label="Observaciones"
          placeholder="Notas adicionales sobre el paciente"
          rows={4}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </form>
    </Card>
  );
}
```

---

## ✅ Accessibility Features

All components include:

- ✅ Proper ARIA attributes (`aria-invalid`, `aria-describedby`, `aria-label`)
- ✅ Focus states with visible rings
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Semantic HTML elements
- ✅ Error announcements with `role="alert"`

---

## 🎨 Design Token Usage

All components use design tokens from `index.css`:

```css
/* Colors */
var(--color-brand-primary)
var(--color-brand-accent)
var(--color-status-success)
var(--color-text-primary)

/* Spacing */
var(--spacing-4)
var(--spacing-6)

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-focus)

/* Border Radius */
var(--radius-md)
var(--radius-lg)
var(--radius-xl)

/* Transitions */
var(--transition-base)
```

---

## 📦 Import

All components can be imported from a single entry point:

```jsx
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  Badge,
  Table,
  Modal,
} from "../components/ui";
```

Or individually:

```jsx
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
```
