// tipos de buffs disponibles
const TIPOS_BUFF = {
  DISPARO_MULTIPLE: {
    nombre: "disparoMultiple",
    duracion: 10,
    color: "naranja",
    forma: "cuadradoConBolitas",
    tamaño: 19
  }
};

// crear un nuevo buff en una posicion aleatoria
function crearBuff() {
  // solo crear un buff si no hay uno activo y no hay muchos en pantalla
  if (buffs.length >= 1 || buffActivo) return;
  
  const tipoBuff = TIPOS_BUFF.DISPARO_MULTIPLE;
  
  const nuevoBuff = {
    x: Math.random() * (canva.width - 60) + 30,
    y: Math.random() * (canva.height - 60) + 30,
    tipo: tipoBuff,
    radio: tipoBuff.tamaño,
    tiempoVida: 300, // 10 segundos en frames (30 fps)
    recogido: false,
    parpadeo: 0 // contador para efecto de parpadeo
  };
  
  buffs.push(nuevoBuff);
}

// dibujo del buff
function dibujarBuff(buff) {
  if (buff.recogido) return;
  
  const ctx = canva.getContext("2d");
  
  buff.parpadeo = (buff.parpadeo + 1) % 36;
  const visible = buff.parpadeo < 30;
  
  if (visible) {
    const tamaño = buff.radio;
    const pulso = 1 + Math.sin(buff.parpadeo * 0.3) * 0.2; // efecto de pulso
    
    // orbe exterior (energia)
    const gradientExterior = ctx.createRadialGradient(
      buff.x, buff.y, 0,
      buff.x, buff.y, tamaño * pulso
    );
    gradientExterior.addColorStop(0, "#FF00FF");
    gradientExterior.addColorStop(0.7, "#00FFFF");
    gradientExterior.addColorStop(1, "rgba(0, 255, 255, 0)");
    
    ctx.fillStyle = gradientExterior;
    ctx.beginPath();
    ctx.arc(buff.x, buff.y, tamaño * pulso, 0, Math.PI * 2);
    ctx.fill();
    
    // nucleo interior
    const gradientInterior = ctx.createRadialGradient(
      buff.x, buff.y, 0,
      buff.x, buff.y, tamaño * 0.5
    );
    gradientInterior.addColorStop(0, "#FFFFFF");
    gradientInterior.addColorStop(1, "#00FFFF");
    
    ctx.fillStyle = gradientInterior;
    ctx.beginPath();
    ctx.arc(buff.x, buff.y, tamaño * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // efecto vortex/anillos
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < 3; i++) {
      const radioAnillo = tamaño * 0.8 + i * 3;
      const rotacion = (buff.parpadeo * 0.1) + (i * 0.5);
      
      ctx.beginPath();
      ctx.arc(buff.x, buff.y, radioAnillo, rotacion, rotacion + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    
    // particulas de energia
    if (buff.parpadeo % 4 === 0) {
      for (let i = 0; i < 2; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const distancia = tamaño * (0.8 + Math.random() * 0.4);
        const px = buff.x + Math.cos(angulo) * distancia;
        const py = buff.y + Math.sin(angulo) * distancia;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
function dibujarEstrella(ctx, cx, cy, puntas, radioExterno, radioInterno, rotacion) {
  const paso = Math.PI / puntas;
  
  ctx.moveTo(
    cx + Math.cos(rotacion) * radioExterno,
    cy + Math.sin(rotacion) * radioExterno
  );
  
  for (let i = 0; i < puntas * 2; i++) {
    const radio = i % 2 === 0 ? radioExterno : radioInterno;
    const angulo = rotacion + i * paso;
    
    ctx.lineTo(
      cx + Math.cos(angulo) * radio,
      cy + Math.sin(angulo) * radio
    );
  }
  
  ctx.closePath();
}

function actualizarBuffs() {
  // generar buffs
  if (Math.random() < 0.001 && buffs.length === 0 && !buffActivo) {
    crearBuff();
  }
  
  // actualizar buffs
  for (let i = buffs.length - 1; i >= 0; i--) {
    const buff = buffs[i];
    
    // reducir tiempo
    buff.tiempoVida--;
    
    // eliminar buff
    if (buff.tiempoVida <= 0) {
      buffs.splice(i, 1);
      continue;
    }
    dibujarBuff(buff);
    
    // verificar colision con la nave del jugador
    if (!ship.dead && 
        ship.blinkNumber === 0 &&
        !buff.recogido &&
        distanceEntrePuntos(ship.x, ship.y, buff.x, buff.y) < ship.r + buff.radio) {
      aplicarBuff(buff.tipo);
      buff.recogido = true;
      buffs.splice(i, 1);
    }
  }
  
  // actualizar buff activo
  if (buffActivo) {
    tiempoBuffRestante--;
    dibujarTiempoBuff();
    if (tiempoBuffRestante <= 0) {
      desactivarBuff();
    }
  }
}

// aplicar un buff al jugador
function aplicarBuff(tipoBuff) {
  buffActivo = tipoBuff;
  tiempoBuffRestante = tipoBuff.duracion * FPS; 
  
  switch (tipoBuff.nombre) {
    case "disparoMultiple":
      activarDisparoMultiple();
      break;
  }
  if (SOUNDS_ON) {
    fxLaser.play();
  }
}

// desactivar el buff actual
function desactivarBuff() {
  if (!buffActivo) return;
  
  switch (buffActivo.nombre) {
    case "disparoMultiple":
      desactivarDisparoMultiple();
      break;
  }
  
  buffActivo = null;
  tiempoBuffRestante = 0;
}

// activar el buff
let dispararLaserOriginal = null;
function activarDisparoMultiple() {
  // reemplazarla
  dispararLaserOriginal = dispararLaser;
  dispararLaser = function() {
    if (ship.puedeDisparar && ship.lasers.length < LASER_MAX - 4) {
      const direcciones = 8;
      for (let i = 0; i < direcciones; i++) {
        const angulo = ship.a + (i * 2 * Math.PI / direcciones);
        
        ship.lasers.push({
          x: ship.x + ship.r * Math.cos(angulo),
          y: ship.y - ship.r * Math.sin(angulo),
          xv: LASER_SPEED * Math.cos(angulo) / FPS,
          yv: -LASER_SPEED * Math.sin(angulo) / FPS,
          dist: 0,
          tiempoExplosion: 0,
        });
      }
      fxLaser.play();
    }
    ship.puedeDisparar = false;
  };
}

function desactivarDisparoMultiple() {
  // restaura
  if (dispararLaserOriginal) {
    dispararLaser = dispararLaserOriginal;
    dispararLaserOriginal = null;
  }
}

// tiempo restante 
function dibujarTiempoBuff() {
  if (!buffActivo || ship.dead) return;
  
  const ctx = canva.getContext("2d");
  const segundosRestantes = Math.ceil(tiempoBuffRestante / FPS);
  
  // posicion encima de la nave
  const x = ship.x;
  const y = ship.y - 40;
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(x - 25, y - 15, 50, 20);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 25, y - 15, 50, 20);
  
  // texto del tiempo
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "bold 14px Arial";
  ctx.fillText(segundosRestantes + "s", x, y - 5);
  
  // barra debajo del texto
  const porcentaje = tiempoBuffRestante / (buffActivo.duracion * FPS);
  const anchoBarra = 40;
  const altoBarra = 4;
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(x - anchoBarra/2, y + 8, anchoBarra, altoBarra);
  
  // barra de progreso
  ctx.fillStyle = porcentaje > 0.5 ? "lime" : porcentaje > 0.25 ? "yellow" : "red";
  ctx.fillRect(x - anchoBarra/2, y + 8, anchoBarra * porcentaje, altoBarra);
}

// reiniciar buffs nuevo juego
function reiniciarBuffs() {
  buffs = [];
  buffActivo = null;
  tiempoBuffRestante = 0;

  if (dispararLaserOriginal) {
    dispararLaser = dispararLaserOriginal;
    dispararLaserOriginal = null;
  }
}