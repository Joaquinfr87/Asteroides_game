# 🚀 Asteroides — Team Celeron

Asteroides es una recreación mejorada del clásico arcade. Controlas una nave espacial en un campo lleno de asteroides y enemigos inteligentes. Sobrevive, destruye, recolecta buffs y alcanza la mayor puntuación posible. La pantalla posee efecto de bucle: si sales por un borde, reapareces en el opuesto.

---

## 🎮 Cómo jugar

1. Abre `game.html` en cualquier navegador moderno.
2. La partida inicia automáticamente.
3. Sobrevive, destruye asteroides y enemigos, y recoge buffs.
4. Cuando pierdas tus vidas, vuelve a intentarlo.

---

## ⌨️ Controles

| Tecla | Acción |
|-------|--------|
| ↑     | Impulso hacia adelante |
| ←     | Girar a la izquierda |
| →     | Girar a la derecha |
| Espacio | Disparar |

---

## 🏆 Sistema de Puntaje

| Acción | Puntos |
|--------|--------|
| Asteroide grande | 20 |
| Asteroide mediano | 50 |
| Asteroide pequeño | 100 |
| Nave enemiga | 200 |
| Tomar buff de disparo múltiple | +10 s de poder |

---

## 📜 Reglas

- Comienzas con **3 vidas**.
- Chocar con un asteroide o enemigo resta una vida.
- Los niveles son **infinitos** y progresivamente más difíciles.
- Asteroides grandes → medianos → pequeños al destruirlos.
- La nave reaparece por el lado opuesto al salir de pantalla.
- Desde el **nivel 3** aparecen naves enemigas inteligentes.
- Tras perder una vida, tienes **inmunidad temporal**.

---

## 🔥 Buffs

**Disparo múltiple**
- Aparición: orbe brillante energético
- Duración: **10 segundos**
- Efecto: disparos en **8 direcciones simultáneas**
- Activación: pasar sobre el buff
- El tiempo restante aparece sobre la nave

---

## 👾 Enemigos

- Aparecen desde el **nivel 3**
- Comportamientos inteligentes:
  - Perseguir
  - Atacar
  - Esquivar
  - Merodear
- Esquivan asteroides dinámicamente
- Disparos predictivos
- **3 puntos de vida** — requieren varios impactos
- Barra de vida visible
- Colores según estado:
  - 🔴 pánico
  - 🟠 esquiva
  - 🟡 persecución
  - 🟦 ataque
  - 🟢 merodeo

---

## 🛠️ Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Canvas API
- Módulos JavaScript (`game.js`, `enemigos.js`, `buffs.js`)

---

## ▶️ Ejecución local

1. Clona o descarga el proyecto
2. Abre `game.html` con tu navegador
   - O usa un servidor local (recomendado):
     ```bash
     npx serve
     ```
3. ¡Juega!

---

## 📂 Estructura del proyecto

