# Atajos iPhone para Crack

Guía para iOS 26.5.

Antes de empezar: abre Crack, ve a Perfil y pulsa Generar token. Copia el token.

Vas a crear dos atajos:

- Guardar enlace en Crack — el enlace queda en Enlaces
- Enviar a Drop — va al chat de Drop

---

# ATAJO 1: Guardar enlace en Crack

## Crear el atajo

1. Abre Atajos.
2. Pulsa el más de arriba a la derecha.
3. Pulsa Nuevo atajo.
4. Pulsa Renombrar.
5. Escribe Guardar enlace en Crack.
6. Pulsa OK.

## Mostrar al compartir

7. Pulsa Detalles.
8. Activa Mostrar al compartir.
9. Pulsa OK.

Arriba del todo aparece una acción de entrada nueva.

## Qué puede recibir el atajo

10. En esa acción de entrada, pulsa Cualquiera.
11. Deja activado solo Texto y Direcciones URL. Desactiva el resto.
12. Pulsa OK.
13. Pulsa Continuar.
14. Vuelve a pulsar Continuar.
15. Pulsa OK.

## Obtener texto de la entrada del atajo

16. Pulsa Añadir acción.
17. En el buscador escribe texto de la entrada.
18. Pulsa Obtener texto de la entrada del atajo.

Verás un bloque que dice Obtener texto de y una palabra azul Entrada de atajo.

## Diccionario

19. Pulsa Añadir acción.
20. En el buscador escribe Diccionario.
21. Pulsa Diccionario.

Verás una línea que empieza por Texto y dos huecos.

22. En el hueco de la izquierda escribe url.
23. En el hueco de la derecha pulsa y elige la palabra azul Texto del bloque anterior.

## Obtener contenido de URL

24. Pulsa Añadir acción.
25. En el buscador escribe Obtener contenido de.
26. Pulsa Obtener contenido de URL.
27. En URL pega esto:

https://crackdecracks.vercel.app/api/share-link

28. Pulsa Mostrar más.
29. En Método elige POST.
30. Pulsa Cabeceras.
31. Añade una fila. En el primer hueco escribe Authorization. En el segundo hueco escribe Bearer, un espacio, y pega tu token de Perfil.
32. Añade otra fila. En el primer hueco escribe Content-Type. En el segundo hueco escribe application/json.
33. En Cuerpo de la solicitud elige JSON.
34. Pulsa Añadir nuevo campo.
35. En la fila nueva: en el hueco izquierdo escribe url. En el hueco derecho elige la palabra azul Texto.

Si ya ves arriba una fila con url y Texto, salta al paso 36.

Revisa las cabeceras antes de seguir:
- Authorization: debe poner Bearer, un espacio, y tu token (sin pegar Bearer y token juntos).
- Content-Type: debe poner application/json (sin punto delante).

## Obtener diccionario de la entrada

36. Pulsa Añadir acción.
37. En el buscador escribe Obtener diccionario de.
38. Pulsa Obtener diccionario de la entrada.
39. Pulsa el hueco de entrada y elige la palabra azul Contenido de URL.

## Si

40. Pulsa Añadir acción.
41. En el buscador escribe Si.
42. Pulsa Si.

El bloque dirá algo como: Si Diccionario tiene algún valor.

43. Toca la palabra Diccionario (icono naranja a la izquierda). No toques tiene algún valor.
44. Baja en el menú hasta el final.
45. Donde pone Obtener valor de clave, escribe ok.
46. Toca tiene algún valor (la parte derecha del Si).
47. Cámbialo a es.
48. Elige verdadero.

Si no te deja poner verdadero, elige el número 1.

Si esto te resulta muy lioso, borra el bloque Si y pon Mostrar notificación justo después de Obtener diccionario de la entrada.

## Cuando funciona

Dentro del bloque Si, en la parte de arriba:

49. Pulsa Añadir acción.
50. En el buscador escribe Mostrar notificación.
51. Pulsa Mostrar notificación.
52. Escribe Enlace guardado en Crack.

## Cuando falla

En la parte De lo contrario:

53. Pulsa Añadir acción.
54. En el buscador escribe Mostrar resultado.
55. Pulsa Mostrar resultado.
56. Elige Contenido de URL.

## Probar

57. Pulsa OK arriba a la derecha.
58. Abre Safari, comparte un enlace, pulsa Compartir y elige Guardar enlace en Crack.

---

# ATAJO 2: Enviar a Drop

Repite todos los pasos del Atajo 1 creando un atajo nuevo.

Solo cambia esto:

- Paso 5: escribe Enviar a Drop
- Paso 22: en el hueco izquierdo del Diccionario escribe content
- Paso 27: pega esta URL:

https://crackdecracks.vercel.app/api/drop

- Paso 52: escribe Drop enviado

---

# Orden de bloques de arriba a abajo

1. Acción de entrada con Texto y Direcciones URL
2. Obtener texto de la entrada del atajo
3. Diccionario
4. Obtener contenido de URL
5. Obtener diccionario de la entrada
6. Si con Mostrar notificación arriba y Mostrar resultado en De lo contrario

---

# Si algo falla

- Si dice token inválido: regenera el token en Perfil y cambia el paso 31.
- Si no sale al compartir: revisa que Mostrar al compartir esté activado en el paso 8.
- Atajo 1: el hueco izquierdo del Diccionario debe decir url.
- Atajo 2: el hueco izquierdo del Diccionario debe decir content.
