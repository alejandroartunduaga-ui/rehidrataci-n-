# Revisión técnica: arquitectura de rehidratación de formularios

## Veredicto

**No del todo.** La regla de negocio (rehidratación gana sobre local) se cumple *solo si* la instancia de `loadExistingData` que termina último es la que tiene `initialValues` en su closure. Hoy hay una **carrera entre dos fuentes de actualización** (efecto de inicialización + `loadExistingData` con dependencia en `initialValues`) que puede hacer que los datos locales pisemos la rehidratación. Además, el orden conceptual **defaults → local → rehidratación** no está explícito en un solo lugar: está repartido entre el efecto y `loadExistingData`, con rehidratación aplicada dos veces (en el efecto y dentro de `loadExistingData`), lo que hace el flujo frágil y difícil de razonar.

---

## Problemas detectados

1. **Carrera entre efecto y `loadExistingData`**  
   El efecto de inicialización depende de `[formData, loadExistingData, initialValues]`. Cuando `visitDetail` llega y `initialValues` pasa de `undefined` a un objeto, `loadExistingData` se recrea (está en sus deps) y el efecto se vuelve a ejecutar. Quedan **dos** llamadas a `loadExistingData` en vuelo. La que termina **último** es la que fija el estado. Si gana la primera (sin `initialValues` en la closure), hace `setFormValues(prev => ({ ...prev, ...validatedFields }))` y **no** reaplica rehidratación → los valores locales pisan a los de backend para las keys compartidas.

2. **Orden de prioridad no centralizado**  
   La regla deseada es: `defaults → local → rehidratación`. En código:
   - “Defaults” = `computedInitialValues` (formData.selected_value, schema/API).
   - “Local” = solo dentro de `loadExistingData` (getFormSubmission).
   - “Rehidratación” = se aplica en el efecto (merge con computed) y otra vez dentro de `loadExistingData`.  
   Eso implica que el orden real es: schema → rehidratación (efecto) → luego local (loadExistingData) → luego rehidratación otra vez (loadExistingData). Conceptual y correcto sería: un solo merge explícito `defaults + local + rehidratación` (rehidratación última).

3. **Doble aplicación de rehidratación**  
   `initialValues` se aplica (a) en el efecto sobre `computedInitialValues` y (b) de nuevo en el `setFormValues` de `loadExistingData`. No es incorrecto per se, pero refuerza la dependencia del resultado final de que la última escritura sea la de la callback que tiene `initialValues`, y hace el flujo más frágil ante cambios (p. ej. más efectos o más llamadas async).

4. **`loadExistingData` con `initialValues` en deps**  
   Incluir `initialValues` en las dependencias de `useCallback(loadExistingData)` hace que la función cambie cuando llega la rehidratación, lo que dispara de nuevo el efecto y la segunda llamada a `loadExistingData`. Es lo que abre la carrera. Mejor: un solo flujo de carga y un solo merge final donde rehidratación tenga prioridad, sin depender de “qué callback termina último”.

5. **Fuente de “base” poco clara**  
   `computedInitialValues` sale de `formData` (getFormById), no de la persistencia local. La “base” del formulario es entonces schema + lo que venga en el schema (selected_value), no “defaults + local”. Para alinear con la regla de negocio, conviene dejar explícito: base = defaults del form; luego local (DB); luego rehidratación.

6. **FormsPage como lugar del merge**  
   FormsPage está bien para *armar* `initialValues` (tiene formData, visitDetail, isRevertAct). No debe orquestar el orden de aplicación (defaults/local/rehidratación); eso debe vivir en un solo sitio dentro de DynamicForm.

---

## Arquitectura recomendada

**Orden exacto de carga y prioridad:**

1. **Base (defaults del formulario)**  
   Valores por defecto del schema (formData), p. ej. `field.selected_value` o `default_value` cuando no hay nada más. Fuente: `formData` (getFormById).

2. **Local (persistencia en dispositivo)**  
   Lo guardado en ANSWERS/DB local para esta visita y página. Fuente: `getFormSubmission(activity_id, page_code)`.

3. **Rehidratación (solo REVERT_ACT)**  
   Valores que vienen del backend (activities/descriptions). Fuente: `initialValues` prop.  
   Regla: para cada key, si existe en rehidratación, ese valor gana; si no, se mantiene lo que haya de base + local.

**Fuente de verdad por etapa:**

- Base: `formData` (schema + selected_value del API del form).
- Local: resultado de `getFormSubmission`.
- Rehidratación: prop `initialValues` (FormsPage lo construye desde visitDetail.descriptions, filtrado por formData).

**Un solo merge final:**

```
formValues = { ...base, ...local, ...rehydration }
```

Así no hay dos escrituras compitiendo; la prioridad es explícita y estable.

---

## Implementación recomendada

- **DynamicForm** debe ser el único lugar que aplica las tres capas y hace el merge final. No debe depender de “qué callback async termina último” para respetar la prioridad.

- **Orden recomendado:**
  1. En un único efecto (o en una función de “inicialización” que se llame una vez cuando tengamos todo):
     - Calcular `base` desde `formData` (computedInitialValues como hoy).
     - Llamar a `loadExistingData()` que **solo** lee local y devuelve (o guarda en estado) `localFields`.
  2. Cuando tengamos `base` y `local` (y opcionalmente `initialValues` ya disponible), calcular en un solo sitio:
     - `merged = { ...base, ...local, ...(initialValues || {}) }`
     - `setFormValues(merged)` una vez.

- **Evitar la carrera:** no incluir `initialValues` en las dependencias de `loadExistingData`. En su lugar:
  - Opción A: usar un **ref** para `initialValues` y, cuando `loadExistingData` termine, leer `initialValuesRef.current` y hacer el merge final (base + local + rehydration) en un solo `setFormValues`.
  - Opción B: no llamar `loadExistingData` desde el efecto que ya hace merge con `initialValues`. Hacer una secuencia explícita: primero cargar local (ej. estado `localFields`), y en un efecto que dependa de `[formData, localFields, initialValues]` hacer el merge único y un solo `setFormValues`.

Pseudocódigo (Opción A, ref):

```ts
// DynamicForm
const initialValuesRef = useRef(initialValues);
useEffect(() => { initialValuesRef.current = initialValues; }, [initialValues]);

const loadExistingData = useCallback(async () => {
  if (!activity_id || !page_code) return;
  const existingData = await getFormSubmission(activity_id, page_code);
  const localFields = existingData?.normalFields ?? {};
  setFormValues((prev) => {
    const rehydration = initialValuesRef.current ?? {};
    return { ...prev, ...localFields, ...rehydration };
  });
  // ... fotos, builders, visibleFields
}, [activity_id, page_code, getFormSubmission, formData, ...]); // sin initialValues

useEffect(() => {
  const base = computeBaseFromFormData(formData);
  setFormValues(base);
  loadExistingData();
}, [formData, loadExistingData]); // sin initialValues
```

Ajuste fino: si quieres que “base” ya incluya rehidratación cuando esté disponible sin esperar a que termine `loadExistingData`, se puede hacer un único efecto que dependa de `[formData, initialValues]`, espere a que `loadExistingData` resuelva (ej. con un estado `localData`), y entonces haga un solo merge `base + localData + initialValues` y un solo `setFormValues`. La clave es **un solo merge final** y **una sola escritura** que refleje la prioridad.

- **FormsPage:** mantener aquí la construcción de `initialValues` a partir de `visitDetail.descriptions` y `formData` está bien (tiene el contexto de REVERT_ACT y las dos fuentes). Opcional: extraer a un hook `useRevertActInitialValues(activity_id, formData, visitDetail, isRevertAct)` para claridad y tests.

- **Keys distintas entre descriptions y formData:** ya se mitiga en FormsPage al tomar solo keys que existen en `formData.dataForms`. Si el backend usa otras keys, no se pisan campos del form; si formData tiene keys que descriptions no trae, se mantienen base/local. No asumir misma estructura; el filtro por formData es correcto.

---

## Riesgos a validar en pruebas

1. **REVERT_ACT, visitDetail llega después de formData:**  
   Verificar que cuando `initialValues` pasa de `undefined` a con datos, el formulario termina mostrando los valores de rehidratación y no los locales (ni vacío).

2. **REVERT_ACT, hay datos locales y de backend para las mismas keys:**  
   Debe ganar siempre el valor de backend (descriptions). Probar con al menos un campo que exista en ambos.

3. **REVERT_ACT, backend no trae una key que sí está en local:**  
   Debe mostrarse el valor local para esa key.

4. **OT normal (no REVERT_ACT):**  
   No debe aplicarse rehidratación; solo base + local. Comprobar que el comportamiento no cambia respecto a antes.

5. **Dos cargas seguidas (navegar fuera y volver, o cambio de page_code):**  
   No debe quedar un estado mezclado de una visita anterior; el último merge debe ser coherente con la visita/página actual.

6. **loadExistingData falla o devuelve null:**  
   El formulario debe quedar con base + rehidratación (si aplica), sin romper la UI.

7. **Race explícita:**  
   Simular que la respuesta de `getFormSubmission` tarda más que la llegada de `visitDetail` y comprobar que el valor final mostrado es el de descriptions para keys compartidas.
