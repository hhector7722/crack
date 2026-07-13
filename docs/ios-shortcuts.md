# Atajos iPhone para Crack

Necesitas el token de Crack → Perfil → Generar token. Cópialo antes de empezar.

Vas a crear **dos atajos distintos** en la app **Atajos**:

| Nombre del atajo | Para qué sirve |
| --- | --- |
| Guardar enlace en Crack | El enlace se queda en Enlaces para siempre |
| Enviar a Drop | El texto o enlace va al chat de Drop (dura 48 h) |

Los pasos son casi iguales. La diferencia está marcada al final.

---

# ATAJO 1: Guardar enlace en Crack

## 1. Crear el atajo vacío

1. Abre la app **Atajos**.
2. Pulsa el **+** de abajo a la derecha.
3. Pulsa **Crear atajo**.
4. Arriba, donde pone **Nuevo atajo**, escribe: `Guardar enlace en Crack`.

## 2. Que salga cuando compartes desde otra app

5. Pulsa el **ⓘ** de arriba a la derecha (pantalla **Detalles**).
6. Activa **Mostrar en el menú Compartir** (en algunos iPhone pone **Mostrar en la hoja para compartir**).
7. Pulsa **Atrás** para volver al atajo.

## 3. Configurar el bloque Recibir (arriba del todo)

Ya en el editor del atajo, arriba verás un bloque que empieza por **Recibir**.

8. Pulsa donde pone el tipo de contenido (puede poner **Apps**, **Ninguno**, etc.).
9. Elige **Compartir** (o **Hoja para compartir**, según tu versión).
10. Activa solo **Texto** y **URLs**. Puedes desactivar el resto.
11. Donde pone **Si no hay datos de entrada**, déjalo en **Continuar**.

## 4. Añadir: Obtener texto de la entrada del atajo

12. Pulsa el **+** de abajo.
13. En el buscador escribe: `texto de la entrada`
14. Pulsa la acción **Obtener texto de la entrada del atajo**.

Verás un bloque gris que dice algo como:

> **Obtener texto de** `Entrada de atajo`

(la palabra azul puede decir **Entrada de atajo** o **Entrada del atajo**).

No toques nada más en ese bloque.

## 5. Añadir: Diccionario

15. Pulsa el **+** de abajo.
16. Busca: `Diccionario`
17. Pulsa la acción **Diccionario**.

Verás un bloque **Diccionario** con **una fila de dos huecos**:

```
[ hueco izquierdo ]    [ hueco derecho ]
```

18. En el **hueco de la izquierda**, escribe con el teclado: `url`
19. En el **hueco de la derecha**, pulsa sobre él.
20. Te sale un menú. Elige la palabra azul **Texto** (la del bloque anterior).

El bloque debe quedar así:

> **Diccionario**
> `url` → `Texto`

## 6. Añadir: Obtener contenido de URL

21. Pulsa el **+** de abajo.
22. Busca: `Obtener contenido de`
23. Pulsa **Obtener contenido de URL**.

24. En la línea **URL**, escribe o pega exactamente:

```
https://crackdecracks.vercel.app/api/share-link
```

25. Pulsa **Mostrar más** (dentro de ese mismo bloque, abajo).

26. En **Método**, cambia a **POST**.

27. Pulsa **Cabeceras** para desplegarlas.

28. Pulsa el botón para añadir una cabecera (suele ser **+** o **Añadir nuevo campo**).
    - En el primer hueco escribe: `Authorization`
    - En el segundo hueco escribe: `Bearer ` y pega tu token (el de Perfil en Crack).
    - Ejemplo: `Bearer gxwppbwXLhjFIIDscBu6pShs5sRa-kE_3iRYFCx-cF-s`

29. Añade otra cabecera igual:
    - Primer hueco: `Content-Type`
    - Segundo hueco: `application/json`

30. Aparece una línea **Solicitar cuerpo**. Púlsala y elige **JSON**.

31. Debajo sale otro campo **Solicitar cuerpo** (o **Cuerpo de solicitud**). Púlsalo.
32. Elige la palabra azul **Diccionario** (la del bloque del paso 17).

## 7. Añadir: Obtener diccionario de

33. Pulsa el **+** de abajo.
34. Busca: `Obtener diccionario de`
35. Pulsa **Obtener diccionario de** (a veces pone **Obtener diccionario de la entrada**).

36. En ese bloque, donde pide el texto o la entrada, pulsa y elige la palabra azul **Contenido de URL** (la del paso 23).

## 8. Añadir: Si

37. Pulsa el **+** de abajo.
38. Busca: `Si`
39. Pulsa la acción **Si**.

40. Pulsa la condición del **Si** (la zona del medio del bloque).
41. Elige **Diccionario** (el del paso 35).
42. Pulsa **Obtener valor del diccionario** (en tu iPhone puede decir **Obtener Valor para**).
43. Escribe la clave: `ok`
44. Pulsa **es** y elige que sea **verdadero** (o **es** → `true`, según lo que te deje elegir).

## 9. Dentro del Si — si ha ido bien

Dentro del bloque **Si**, en la parte de arriba (cuando la condición se cumple):

45. Pulsa el **+** que sale **dentro** del Si.
46. Busca: `Mostrar notificación`
47. Pulsa **Mostrar notificación**.
48. Donde pide el texto, escribe: `Enlace guardado en Crack`

## 10. Si ha fallado

En la parte de abajo del bloque **Si**, donde pone **De lo contrario**:

49. Pulsa el **+** dentro de **De lo contrario**.
50. Busca: `Mostrar resultado`
51. Pulsa **Mostrar resultado**.
52. Donde pide qué mostrar, elige **Contenido de URL** (así ves el mensaje de error).

## 11. Probar

53. Pulsa **▶** (reproducir) abajo del atajo, o comparte un enlace desde Safari → **Compartir** → **Guardar enlace en Crack**.

---

# ATAJO 2: Enviar a Drop

Repite **todo el proceso del Atajo 1**, creando un atajo nuevo llamado `Enviar a Drop`.

Solo cambia esto:

| Paso | Atajo 1 (Enlaces) | Atajo 2 (Drop) |
| --- | --- | --- |
| Nombre del atajo | Guardar enlace en Crack | Enviar a Drop |
| Paso 18 — hueco izquierdo del Diccionario | `url` | `content` |
| Paso 24 — URL del bloque Obtener contenido de | `https://crackdecracks.vercel.app/api/share-link` | `https://crackdecracks.vercel.app/api/drop` |
| Paso 48 — texto de Mostrar notificación | `Enlace guardado en Crack` | `Drop enviado` |

Todo lo demás es **exactamente igual** (Recibir, cabeceras, POST, JSON, Si, etc.).

---

# Si algo falla

| Lo que ves al probar | Qué mirar |
| --- | --- |
| Dice algo de token inválido | Ve a Crack → Perfil → Regenerar token. Cambia el paso 28 con el token nuevo. |
| No sale el atajo al compartir | Paso 6: ¿está activado Mostrar en el menú Compartir? |
| No pasa nada al terminar | ¿Añadiste Mostrar notificación dentro del Si? |
| Error de URL | Atajo 1: en el Diccionario, ¿el hueco izquierdo dice `url`? |
| Error de content | Atajo 2: en el Diccionario, ¿el hueco izquierdo dice `content`? |

---

# Resumen: orden de los bloques

De arriba a abajo, tu atajo debe tener:

1. **Recibir** (configurado en los pasos 8–11)
2. **Obtener texto de la entrada del atajo**
3. **Diccionario**
4. **Obtener contenido de URL**
5. **Obtener diccionario de**
6. **Si** → con **Mostrar notificación** arriba y **Mostrar resultado** en **De lo contrario**
