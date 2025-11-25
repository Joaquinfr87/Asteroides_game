// enemigos
let enemigos = [];

// crear una nueva nave enemiga
function nuevaNaveEnemiga() {
  return {
    x: Math.random() * canva.width,
    y: Math.random() * canva.height,
    r: 15,
    xv: 0,
    yv: 0,
    vida: 3,
    tiempoDisparo: Math.floor(Math.random() * 60) + 30,
    lasers: [],
    a: Math.random() * Math.PI * 2,
    estado: "perseguir",
    tiempoEstado: 0,
    ultimoAsteroideCercano: null,
    tiempoDesdeUltimoMovimiento: 0,
    panico: 0 //estado de panico
  };
}

// evitar bordes
function evitarBordes(enemigo) {
  const margen = 50;
  let fuerza = 0.2;
  
  if (enemigo.x < margen) enemigo.xv += fuerza;
  if (enemigo.x > canva.width - margen) enemigo.xv -= fuerza;
  if (enemigo.y < margen) enemigo.yv += fuerza;
  if (enemigo.y > canva.height - margen) enemigo.yv -= fuerza;
}

// movimiento inteligente
function actualizarIAEnemiga(enemigo) {
  enemigo.tiempoEstado--;
  enemigo.tiempoDesdeUltimoMovimiento++;
  
  // buscar amenazas inmediatas (alta prioridad)
  let asteroideMuyCercano = encontrarAsteroideCercano(enemigo, 60); // muy cerca - esquiva inmediata
  let asteroideCercano = encontrarAsteroideCercano(enemigo, 120);   // cerca - esquiva preventiva
  
  // prioridad 1: esquiva inmediata si hay asteroide muy cercano
  if (asteroideMuyCercano && enemigo.panico < 20) {
    enemigo.estado = "esquivaUrgente";
    enemigo.tiempoEstado = 30; // 1 segundo de esquiva urgente
    enemigo.panico = 45; // 1.5 segundos sin cambiar de estado
    enemigo.ultimoAsteroideCercano = asteroideMuyCercano;
  }
  // prioridad 2: esquiva preventiva si hay asteroide cercano
  else if (asteroideCercano && enemigo.panico === 0 && Math.random() < 0.8) {
    enemigo.estado = "esquivar";
    enemigo.tiempoEstado = 60; // 2 segundos
    enemigo.ultimoAsteroideCercano = asteroideCercano;
  }
  // prioridad 3: comportamiento normal
  else if (enemigo.tiempoEstado <= 0 && enemigo.panico === 0) {
    let estados = ["perseguir", "atacar", "merodear"];
    enemigo.estado = estados[Math.floor(Math.random() * estados.length)];
    enemigo.tiempoEstado = Math.floor(Math.random() * 45) + 45; // 1.5-3 segundos
  }
  
  // reducir contador de panico
  if (enemigo.panico > 0) enemigo.panico--;

  // ejecutar comportamiento
  switch (enemigo.estado) {
    case "perseguir":
      perseguirJugador(enemigo);
      break;
    case "esquivar":
      esquivarAsteroides(enemigo, asteroideCercano);
      break;
    case "esquivaUrgente":
      esquivaUrgente(enemigo, asteroideMuyCercano);
      break;
    case "atacar":
      atacarDesdeDistancia(enemigo);
      break;
    case "merodear":
      merodear(enemigo);
      break;
  }
  
  // evitar bordes (si no esta en panico)
  if (enemigo.panico === 0) {
    evitarBordes(enemigo);
  }
  
  // limitar velocidad maxima
  let velocidad = Math.sqrt(enemigo.xv * enemigo.xv + enemigo.yv * enemigo.yv);
  let velocidadMaxima = enemigo.panico > 0 ? 6 : 3.5;
  if (velocidad > velocidadMaxima) {
    enemigo.xv = (enemigo.xv / velocidad) * velocidadMaxima;
    enemigo.yv = (enemigo.yv / velocidad) * velocidadMaxima;
  }
  
  // aplicar movimiento
  enemigo.x += enemigo.xv;
  enemigo.y += enemigo.yv;
  
  // friccion (menos friccion durante esquivas urgentes)
  let friccion = enemigo.panico > 0 ? 0.97 : 0.93;
  enemigo.xv *= friccion;
  enemigo.yv *= friccion;
  
  // actualizar angulo segun direccion de movimiento
  if (Math.abs(enemigo.xv) > 0.3 || Math.abs(enemigo.yv) > 0.3) {
    enemigo.a = Math.atan2(enemigo.yv, enemigo.xv);
  }
}

// esquiva urgente 
function esquivaUrgente(enemigo, asteroide) {
  if (!asteroide) {
    // si no hay asteroide, moverse aleatoriamente para evitar quedarse quieto
    enemigo.xv += (Math.random() - 0.5) * 0.5;
    enemigo.yv += (Math.random() - 0.5) * 0.5;
    return;
  }
  
  let dx = enemigo.x - asteroide.x;
  let dy = enemigo.y - asteroide.y;
  let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // fuerza de huida proporcional a la cercania del peligro
  let fuerza = Math.max(0.5, (80 - distancia) / 80 * 3);
  
  // vector de huida normalizado
  enemigo.xv += (dx / distancia) * fuerza;
  enemigo.yv += (dy / distancia) * fuerza;
  
  // movimiento lateral adicional para esquivar mejor
  let lateralX = -dy / distancia;
  let lateralY = dx / distancia;
  enemigo.xv += lateralX * 1.5;
  enemigo.yv += lateralY * 1.5;
}

// esquiva preventiva 
function esquivarAsteroides(enemigo, asteroide) {
  if (asteroide) {
    let dx = enemigo.x - asteroide.x;
    let dy = enemigo.y - asteroide.y;
    let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
    
    if (distancia < 120) {
      // fuerza de huida mas suave pero efectiva
      let fuerza = (120 - distancia) / 120 * 1.5;
      enemigo.xv += (dx / distancia) * fuerza;
      enemigo.yv += (dy / distancia) * fuerza;
    }
  }
  
  // movimiento aleatorio moderado durante la esquiva
  if (enemigo.tiempoDesdeUltimoMovimiento > 15) {
    enemigo.xv += (Math.random() - 0.5) * 0.4;
    enemigo.yv += (Math.random() - 0.5) * 0.4;
    enemigo.tiempoDesdeUltimoMovimiento = 0;
  }
}

// merodear 
function merodear(enemigo) {
  // cambio de direccion ocasional
  if (enemigo.tiempoDesdeUltimoMovimiento > 30) {
    enemigo.xv += (Math.random() - 0.5) * 1.2;
    enemigo.yv += (Math.random() - 0.5) * 1.2;
    enemigo.tiempoDesdeUltimoMovimiento = 0;
  }
  
  // suave atraccion hacia el jugador
  let dx = ship.x - enemigo.x;
  let dy = ship.y - enemigo.y;
  let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
  
  if (distancia > 250) {
    enemigo.xv += (dx / distancia) * 0.15;
    enemigo.yv += (dy / distancia) * 0.15;
  } else if (distancia < 100) {
    enemigo.xv -= (dx / distancia) * 0.1;
    enemigo.yv -= (dy / distancia) * 0.1;
  }
}

// comportamientos 
function perseguirJugador(enemigo) {
  let dx = ship.x - enemigo.x;
  let dy = ship.y - enemigo.y;
  let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // perseguir mas agresivamente
  if (distancia > 160) {
    enemigo.xv += (dx / distancia) * 0.35;
    enemigo.yv += (dy / distancia) * 0.35;
  } else if (distancia < 60) {
    enemigo.xv -= (dx / distancia) * 0.25;
    enemigo.yv -= (dy / distancia) * 0.25;
  }
  
  // movimiento lateral ocasional para ser menos predecible
  if (enemigo.tiempoDesdeUltimoMovimiento > 25) {
    let lateralX = -dy / distancia;
    let lateralY = dx / distancia;
    enemigo.xv += lateralX * (Math.random() - 0.5) * 0.3;
    enemigo.yv += lateralY * (Math.random() - 0.5) * 0.3;
    enemigo.tiempoDesdeUltimoMovimiento = 0;
  }
}

function atacarDesdeDistancia(enemigo) {
  let dx = ship.x - enemigo.x;
  let dy = ship.y - enemigo.y;
  let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // mantener distancia optima para disparar
  if (distancia > 160) {
    enemigo.xv += (dx / distancia) * 0.25;
    enemigo.yv += (dy / distancia) * 0.25;
  } else if (distancia < 100) {
    enemigo.xv -= (dx / distancia) * 0.25;
    enemigo.yv -= (dy / distancia) * 0.25;
  }
  
  // movimiento lateral mas pronunciado y frecuente
  if (enemigo.tiempoDesdeUltimoMovimiento > 15) {
    let lateralX = -dy / distancia;
    let lateralY = dx / distancia;
    enemigo.xv += lateralX * (Math.random() - 0.5) * 0.6;
    enemigo.yv += lateralY * (Math.random() - 0.5) * 0.6;
    enemigo.tiempoDesdeUltimoMovimiento = 0;
  }
}

// buscar asteroide cercano 
function encontrarAsteroideCercano(enemigo, maxDistancia) {
  let masCercano = null;
  let distanciaMasCercana = maxDistancia;
  
  for (let ast of asteroides) {
    let dx = ast.x - enemigo.x;
    let dy = ast.y - enemigo.y;
    let distancia = Math.sqrt(dx * dx + dy * dy);
    
    // verificar colision inminente
    if (distancia < distanciaMasCercana) {
      // calcular si se estan moviendo hacia una colision
      let velocidadRelativaX = ast.xv - enemigo.xv;
      let velocidadRelativaY = ast.yv - enemigo.yv;
      let productoPunto = dx * velocidadRelativaX + dy * velocidadRelativaY;
      
      if (productoPunto < 0 || distancia < 40) {
        distanciaMasCercana = distancia;
        masCercano = ast;
      }
    }
  }
  
  return masCercano;
}

// dibujar indicadores de estado
function dibujarNaveEnemiga(x, y, a, color = "red", enemigo = null) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 15 * Math.cos(a), y - 15 * Math.sin(a));
  ctx.lineTo(x - 15 * (Math.cos(a) + 0.5 * Math.sin(a)), y + 15 * (Math.sin(a) - 0.5 * Math.cos(a)));
  ctx.lineTo(x - 15 * (Math.cos(a) - 0.5 * Math.sin(a)), y + 15 * (Math.sin(a) + 0.5 * Math.cos(a)));
  ctx.closePath();
  ctx.stroke();

  // indicador de estado
  if (SHOW_ALREDEDOR && enemigo) {
    let estadoColor = "white";
    switch (enemigo.estado) {
      case "esquivaUrgente": estadoColor = "red"; break;
      case "esquivar": estadoColor = "orange"; break;
      case "perseguir": estadoColor = "yellow"; break;
      case "atacar": estadoColor = "cyan"; break;
      case "merodear": estadoColor = "green"; break;
    }
    ctx.fillStyle = estadoColor;
    ctx.beginPath();
    ctx.arc(x, y - 35, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// disparo hacia el jugador
function enemigoDispara(enemigo) {
  // predecir posicion futura del jugador
  let tiempoPrediccion = 25;
  let predX = ship.x + (ship.empuje.x || 0) * tiempoPrediccion;
  let predY = ship.y + (ship.empuje.y || 0) * tiempoPrediccion;
  
  // limites en la prediccion
  predX = Math.max(0, Math.min(canva.width, predX));
  predY = Math.max(0, Math.min(canva.height, predY));
  
  let dx = predX - enemigo.x;
  let dy = predY - enemigo.y;
  let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
  
  enemigo.lasers.push({
    x: enemigo.x,
    y: enemigo.y,
    xv: (dx / distancia) * 5,
    yv: (dy / distancia) * 5,
    dist: 0,
    tiempoExplosion: 0
  });
}

// crear enemigos segun el nivel
function generarEnemigosPorNivel(nivel) {
  if (nivel < 3) {
    enemigos = [];
    return;
  }

  let cantidad = Math.floor(nivel / 2);
  for (let i = 0; i < cantidad; i++) {
    // crear enemigos en bordes de la pantalla
    let x, y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -20 : canva.width + 20;
      y = Math.random() * canva.height;
    } else {
      x = Math.random() * canva.width;
      y = Math.random() < 0.5 ? -20 : canva.height + 20;
    }
    let nuevoEnemigo = nuevaNaveEnemiga();
    nuevoEnemigo.x = x;
    nuevoEnemigo.y = y;
    
    // tiempo de disparo aumentado para nuevos enemigos
    nuevoEnemigo.tiempoDisparo = Math.floor(Math.random() * 90) + 60;
    
    enemigos.push(nuevoEnemigo);
  }
}

// dibujar, mover y manejar logica de enemigos
function actualizarEnemigos() {
  if (!enemigos || enemigos.length === 0) return;

  for (let i = enemigos.length - 1; i >= 0; i--) {
    let e = enemigos[i];
    
    actualizarIAEnemiga(e);
    if (e.x < -e.r) e.x = canva.width + e.r;
    if (e.x > canva.width + e.r) e.x = -e.r;
    if (e.y < -e.r) e.y = canva.height + e.r;
    if (e.y > canva.height + e.r) e.y = -e.r;

    dibujarNaveEnemiga(e.x, e.y, e.a, "red", e);

    // barra de vida
    ctx.fillStyle = e.vida === 1 ? "red" : e.vida === 2 ? "yellow" : "lime";
    ctx.fillRect(e.x - 15, e.y - 25, 30 * (e.vida / 3), 4);

    // disparo 
    e.tiempoDisparo--;
    // disapara segun el tiempod e aparacion
    let tiempoMinimoInicial = 45; 
    let puedeDisparar = e.tiempoDisparo < -tiempoMinimoInicial;
    
    if (e.tiempoDisparo <= 0 && puedeDisparar && estaEnLineaDeVision(e)) {
      enemigoDispara(e);
      e.tiempoDisparo = Math.floor(Math.random() * 50) + 70; 
    }

    for (let j = e.lasers.length - 1; j >= 0; j--) {
      let l = e.lasers[j];

      if (l.tiempoExplosion == 0) {
        // dibujar laser enemigo
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // mover laser
        l.x += l.xv;
        l.y += l.yv;
        l.dist += Math.sqrt(l.xv * l.xv + l.yv * l.yv);

        // respetar inmunidad
        if (!ship.dead && 
            ship.blinkNumber === 0 && // jugador no esta inmune
            distanceEntrePuntos(ship.x, ship.y, l.x, l.y) < ship.r) {
          explotarNave();
          e.lasers.splice(j, 1);
          continue;
        }

        // colision con jugador
        if (!ship.dead && distanceEntrePuntos(ship.x, ship.y, l.x, l.y) < ship.r) {
          explotarNave();
          e.lasers.splice(j, 1);
          continue;
        }

        // colision con asteroides
        for (let k = asteroides.length - 1; k >= 0; k--) {
          let ast = asteroides[k];
          if (distanceEntrePuntos(l.x, l.y, ast.x, ast.y) < ast.r) {
            destruirAsteroide(k);
            e.lasers.splice(j, 1);
            break;
          }
        }

        // eliminar laser si sale de pantalla o viaja demasiado
        if (l.dist > 500 || l.x < -50 || l.x > canva.width + 50 || 
            l.y < -50 || l.y > canva.height + 50) {
          e.lasers.splice(j, 1);
        }
      }
    }

    //respetar inmunidad
    if (!ship.dead && 
        ship.blinkNumber === 0 &&
        distanceEntrePuntos(e.x, e.y, ship.x, ship.y) < e.r + ship.r) {
      explotarNave();
      let dx = e.x - ship.x;
      let dy = e.y - ship.y;
      let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
      e.xv += (dx / distancia) * 3;
      e.yv += (dy / distancia) * 3;
    }

    // colision enemigo con asteroides
    for (let k = asteroides.length - 1; k >= 0; k--) {
      let a = asteroides[k];
      if (distanceEntrePuntos(e.x, e.y, a.x, a.y) < e.r + a.r) {
        e.vida--;
        // empujon 
        let dx = e.x - a.x;
        let dy = e.y - a.y;
        let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
        e.xv += (dx / distancia) * 3;
        e.yv += (dy / distancia) * 3;
        
        if (e.vida <= 0) {
          score += 200;
          enemigos.splice(i, 1);
          break;
        } else {
          e.estado = "esquivaUrgente";
          e.panico = 30;
          e.tiempoEstado = 20;
        }
      }
    }

    // colision enemigo con laser del jugador
    for (let j = ship.lasers.length - 1; j >= 0; j--) {
      let l = ship.lasers[j];
      if (l.tiempoExplosion == 0 && distanceEntrePuntos(e.x, e.y, l.x, l.y) < e.r) {
        e.vida--;
        l.tiempoExplosion = Math.ceil(LASER_EXPLODE_DUR * FPS);
        
        if (e.vida <= 0) {
          score += 200;
          enemigos.splice(i, 1);
          if (score > highscore) {
            highscore = score;
            localStorage.setItem(SAVE_KEY_SCORE, highscore);
          }
          break;
        } else {
          e.estado = "esquivaUrgente";
          e.panico = 30;
          e.tiempoEstado = 20;
        }
      }
    }
  }
}

// funcion para verificar linea de vision
function estaEnLineaDeVision(enemigo) {
  if (ship.blinkNumber > 0) {
    return false;
  }
  let dx = ship.x - enemigo.x;
  let dy = ship.y - enemigo.y;
  let distancia = Math.sqrt(dx * dx + dy * dy);
  // disparos
  if (distancia > 350 || distancia < 80) return false;
  
  for (let ast of asteroides) {
    if (puntoCercaDeLinea(enemigo.x, enemigo.y, ship.x, ship.y, ast.x, ast.y, ast.r + 10)) {
      return false;
    }
  }
  
  return true;
}

function puntoCercaDeLinea(x1, y1, x2, y2, px, py, radio) {
  let A = px - x1;
  let B = py - y1;
  let C = x2 - x1;
  let D = y2 - y1;

  let dot = A * C + B * D;
  let len_sq = C * C + D * D;
  let param = -1;
  
  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  let dx = px - xx;
  let dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy) < radio;
}