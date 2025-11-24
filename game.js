let canva = document.getElementById("juegoCanva");
let ctx = canva.getContext("2d");

const SAVE_KEY_SCORE = "highscore";// save key de highscore
const ASTEROIDES_PUNTS_BIG = 20;
const ASTEROIDES_PUNTS_MED = 40;
const ASTEROIDES_PUNTS_SMA = 60;
const JUEGO_VIDAS = 3;// numero inicial de vidas
const LASER_EXPLODE_DUR = 0.1;//duracion de la explision de asteroides
const LASER_DIST = 0.6; // distancia maxima que un laser pueda viajar en relacion con la el ancho
const LASER_MAX = 10;//maximo de laseres en el juego al mismo tiempo
const LASER_SPEED = 500;
const FPS = 30;
const SHIP_SIZE = 30; // pixeles altura
const TURN_SPEED = 360; // giro de la nave en grados por segundo
const SHIP_EMPUJE = 5; // aceleracion de la nave por pixeles por segundo por segundo 
const FRICCION = 0.7;// coeficiente de friccion
const ASTEROIDES_NUM = 1;// numero inicial de asteroides
const ASTEROIDES_SPEED = 50;
const ASTEROIDES_SIZE = 100;
const ASTEROIDES_VERT = 10;//numero random de vertices
const ASTEROIDES_BORDE = 0.3; //constante de borde dentado de los asteroides 0 ninguno 1 mucho
const SHOW_ALREDEDOR = false;
const INVULNERABILIDAD_TIEMP = 3;// 3 segundos
const BLINK_DUR = 0.1;
const SHIP_EXPLOTE_DUR = 0.3; // duracion de la explision
const TEXT_FADE_TIEMP = 2.5; // tiempo de desaparacion del texto
const TEXT_SIZE = 40; // tamano del texto
const SOUNDS_ON = true; // habilitado los sonidos
const MUSIC_ON = false;

let level, asteroides, ship, text, textAlpha, vidas, score, highscore;
let celeron = "TEAM CELERON";

//estableces los sonidos 
let fxExplode = new Sound("./sounds/explode.m4a");
let fxLaser = new Sound("./sounds/laser.m4a", 5, 0.5);
let fxHit = new Sound("./sounds/hit.m4a", 5)
let fxThrust = new Sound("./sounds/thrust.m4a")
// establecer la musica
let music = new Music("./sounds/music-low.m4a", "./sounds/music-high.m4a")
let asteroidesTotal, asteroidesQuedan;
nuevoJuego();

function Music(srcLow, srchHigh) {
  this.soundLow = new Audio(srcLow);
  this.soundHigh = new Audio(srchHigh);
  this.low = true;
  this.tempo = 1.0; // segundos por beat
  this.beatTime = 0;
  this.play = function () {
    if (MUSIC_ON) {
      if (this.low) {
        this.soundLow.play();
      } else {
        this.soundHigh.play();
      }
      this.low = !this.low;
    }
  }
  this.setAsteroidRatio = function (ratio) {
    this.tempo = 1.0 - 0.75 * (1.0 - ratio);
  }
  this.tick = function () {
    if (this.beatTime == 0) {
      this.play();
      this.beatTime = Math.ceil(this.tempo * FPS);
    } else {
      this.beatTime--;
    }
  }
}

function Sound(src, maxStreams = 1, vol = 1.0) {
  this.streamNum = 0;
  this.streams = [];
  for (let i = 0; i < maxStreams; i++) {
    this.streams.push(new Audio(src));
    this.streams[i].volume = vol;
  }
  this.play = function () {
    if (SOUNDS_ON) {
      this.streamNum = (this.streamNum + 1) % maxStreams;
      this.streams[this.streamNum].play();
    }
  }
  this.stop = function () {
    this.streams[this.streamNum].pause();
    this.streams[this.streamNum].currentTime = 0;
  }
}

function newShip() {
  return {
    x: canva.width / 2,
    y: canva.height / 2,
    r: SHIP_SIZE / 2,
    a: 90 / 180 * Math.PI,//conversion a radianes angulo de 90 grados
    rot: 0,
    empujando: false,
    empuje: {
      x: 0,
      y: 0
    },
    tiempoExplosion: 0,
    blinkTiempo: Math.ceil(BLINK_DUR * FPS),
    blinkNumber: Math.ceil(INVULNERABILIDAD_TIEMP / BLINK_DUR),
    puedeDisparar: true,
    lasers: [],
    dead: false,

  }
}

function dispararLaser() {
  if (ship.puedeDisparar && ship.lasers.length < LASER_MAX) {
    ship.lasers.push(//from the nose of the ship
      {
        x: ship.x + ship.r * Math.cos(ship.a),
        y: ship.y - ship.r * Math.sin(ship.a),
        xv: LASER_SPEED * Math.cos(ship.a) / FPS,
        yv: -LASER_SPEED * Math.sin(ship.a) / FPS,
        dist: 0,
        tiempoExplosion: 0,
      }
    )
    fxLaser.play();
  }
  ship.puedeDisparar = false;

}

function TeamCeleron() {

}

function nuevoJuego() {
  //obejtener el puntaje mas alto 

  let tempScore = localStorage.getItem(SAVE_KEY_SCORE);
  if (tempScore == null) {
    highscore = 0;
  } else { highscore = parseInt(tempScore) }
  level = 0;
  score = 0;
  vidas = JUEGO_VIDAS;
  ship = newShip();
  asteroides = [];
  
  nuevoNivel();

}
function nuevoNivel() {
  text = "Nivel " + (level + 1);
  textAlpha = 1.0;
  createAsteroidsBelt();

}

function createAsteroidsBelt() {
  asteroides = [];
  asteroidesTotal = (ASTEROIDES_NUM + level) * 7;
  asteroidesQuedan = asteroidesTotal
  let x, y;
  for (let i = 0; i < ASTEROIDES_NUM + level * 2; i++) {
    do {
      x = Math.floor(Math.random() * canva.width);
      y = Math.floor(Math.random() * canva.height);
    } while (distanceEntrePuntos(ship.x, ship.y, x, y) < ASTEROIDES_SIZE * 2 + ship.r);
    asteroides.push(nuevoAsteroide(x, y, Math.ceil((ASTEROIDES_SIZE / 2))));
  }
}

function destruirAsteroide(i) {
  let a = asteroides[i]; // obtener asteroide

  // tamaño grande → dividir a medianos
  if (a.r === Math.ceil(ASTEROIDES_SIZE / 2)) {
    asteroides.push(nuevoAsteroide(a.x, a.y, Math.ceil(ASTEROIDES_SIZE / 4)));
    asteroides.push(nuevoAsteroide(a.x, a.y, Math.ceil(ASTEROIDES_SIZE / 4)));
    score += ASTEROIDES_PUNTS_BIG;
  }
  // tamaño mediano → dividir a pequeños
  else if (a.r === Math.ceil(ASTEROIDES_SIZE / 4)) {
    asteroides.push(nuevoAsteroide(a.x, a.y, Math.ceil(ASTEROIDES_SIZE / 8)));
    asteroides.push(nuevoAsteroide(a.x, a.y, Math.ceil(ASTEROIDES_SIZE / 8)));
    score += ASTEROIDES_PUNTS_MED;
  } else {
    score += ASTEROIDES_PUNTS_SMA;
  }
  //check highscore
  if (score > highscore) {
    highscore = score
    localStorage.setItem(SAVE_KEY_SCORE, highscore);
  }

  // eliminar asteroide original
  asteroides.splice(i, 1);
  fxHit.play();

  // calcular el ratio de los asteroide para determinar el tempo de la musica
  asteroidesQuedan--;
  music.setAsteroidRatio(asteroidesQuedan == 0 ? 1 : asteroidesQuedan / asteroidesTotal);
  //nuevo nivel cuando no hay mas asteroides
  if (asteroides.length == 0) {
    level++;
    nuevoNivel();
  }
}
function distanceEntrePuntos(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}
function dibujarNave(x, y, a, color = "white") {
  ctx.strokeStyle = color;
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo(//nariz de la nave
    x + ship.r * Math.cos(a),
    y - ship.r * Math.sin(a)
  );
  ctx.lineTo(
    x - ship.r * (Math.cos(a) + Math.sin(a)),
    y + ship.r * (Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo(
    x - ship.r * (Math.cos(a) - Math.sin(a)),
    y + ship.r * (Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();
  ctx.stroke();

}

function explotarNave() {
  ship.tiempoExplosion = Math.ceil(SHIP_EXPLOTE_DUR * FPS);
  fxExplode.play();
}

function gameOver() {
  ship.dead = true;
  text = "GAME OVER"
  textAlpha = 1.0;
}

function nuevoAsteroide(x, y, r) {
  let nivelMultiplicador = 1 + 0.1 * level;
  let asteroide = {
    x: x,
    y: y,
    xv: Math.random() * ASTEROIDES_SPEED * nivelMultiplicador / FPS * (Math.random() < 0.05 ? 1 : -1),
    yv: Math.random() * ASTEROIDES_SPEED * nivelMultiplicador / FPS * (Math.random() < 0.05 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2,
    vert: Math.floor(Math.random() * (ASTEROIDES_VERT + 1) + ASTEROIDES_VERT / 2),
    offs: []

  };
  for (let i = 0; i < asteroide.vert; i++) {
    asteroide.offs.push(Math.random() * ASTEROIDES_BORDE * 2 + 1 - ASTEROIDES_BORDE);
  }
  return asteroide;
}

// manejadores de eventos
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

setInterval(update, 1000 / FPS); // 1000 significa 1 segundo y por lo tanto lo
// divide en 30 para tener la tasa de actualizacion de 30 veces por sengundo


function keyDown(e) {
  if (ship.dead) {
    return;
  }
  switch (e.keyCode) {
    case 37:// rotar nave a la izquierda
      ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
      break;
    case 38:// empujede de la nave
      ship.empujando = true;
      break;
    case 39://rotar nave a la derecha
      ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
      break;
    case 32://disparar laser
      dispararLaser();

      break;
  }
}
function keyUp(e) {
  if (ship.dead) {
    return;
  }
  switch (e.keyCode) {
    case 37:// rotar nave a la izquierda
      ship.rot = 0;
      break;
    case 38:// no empuje
      ship.empujando = false;
      break;
    case 39://rotar nave a la derecha
      ship.rot = 0;
      break;
    case 32:// lock disparo
      ship.puedeDisparar = true;
      break;
  }
}

function update() {
  let explotando = ship.tiempoExplosion > 0;
  let blinkOn = ship.blinkNumber % 2 == 0;

  //tick music
  music.tick();
  //dibujo del espacio 
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canva.width, canva.height);

  //dibujo de la nave

  if (!explotando) {
    if (blinkOn && !ship.dead) {
      dibujarNave(ship.x, ship.y, ship.a);
    }
    if (ship.blinkNumber > 0) {
      ship.blinkTiempo--;

      if (ship.blinkTiempo == 0) {
        ship.blinkTiempo = Math.ceil(BLINK_DUR * FPS)
        ship.blinkNumber--;
      }
    }
  } else {
    // explosion
    ctx.fillStyle = "red"
    ctx.strokeStyle = "yellow"
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI * 2, false)
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = "yellow"
    ctx.strokeStyle = "white"
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.7, 0, Math.PI * 2, false)
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = "white"
    ctx.strokeStyle = "gray"
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.3, 0, Math.PI * 2, false)
    ctx.stroke();
    ctx.fill();

  }
  if (SHOW_ALREDEDOR) {
    ctx.strokeStyle = "green"
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false)
    ctx.stroke();
  }

  //colision
  for (let i = 0; i < asteroides.length; i++) {
    const e = asteroides[i];

    // Ignorar colisiones si la nave está explotando o si está en período de invulnerabilidad (parpadeando)
    if (!explotando && ship.blinkNumber === 0 && !ship.dead &&
      distanceEntrePuntos(ship.x, ship.y, e.x, e.y) < ship.r + e.r) {
      explotarNave();
      destruirAsteroide(i);
      break;
    }
  }

  //dibujo de los lasers
  for (let e of ship.lasers) {
    if (e.tiempoExplosion == 0) {
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(e.x, e.y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
      ctx.fill();
    } else {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(e.x, e.y, ship.r * 0.75, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(e.x, e.y, ship.r * 0.5, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "pink";
      ctx.beginPath();
      ctx.arc(e.x, e.y, ship.r * 0.25, 0, Math.PI * 2, false);
      ctx.fill();
    }
    //evaluar la distancia del laser
    if (e.dist > LASER_DIST * canva.width) {
      ship.lasers.shift()
    }

    if (e.tiempoExplosion > 0) {
      e.tiempoExplosion--;

    } else {
      //movelos los laseres
      e.x += e.xv;
      e.y += e.yv;

      //calcular la distancia de viajes
      e.dist += Math.sqrt(Math.pow(e.xv, 2) + Math.pow(e.yv, 2));

    }
    if (e.x < 0) {
      e.x = canva.width;
    } else if (e.x > canva.width) {
      e.x = 0;
    }
    if (e.y < 0) {
      e.y = canva.width;
    } else if (e.y > canva.height) {
      e.y = 0;
    }


  }


  //rotacion de la nave
  ship.a += ship.rot;

  //empuje de la nave
  if (ship.empujando && !ship.dead) {
    ship.empuje.x += SHIP_EMPUJE * Math.cos(ship.a) / FPS;
    ship.empuje.y -= SHIP_EMPUJE * Math.sin(ship.a) / FPS;
    fxThrust.play();
    // DIBUJAR EMPUJE DETRÁS DE LA NAVE
    if (!explotando) {
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = SHIP_SIZE / 20;

      // punto base izquierdo
      ctx.moveTo(
        ship.x - ship.r * (Math.cos(ship.a) - 0.3 * Math.sin(ship.a)),
        ship.y + ship.r * (Math.sin(ship.a) + 0.3 * Math.cos(ship.a))
      );

      // punto base derecho
      ctx.lineTo(
        ship.x - ship.r * (Math.cos(ship.a) + 0.3 * Math.sin(ship.a)),
        ship.y + ship.r * (Math.sin(ship.a) - 0.3 * Math.cos(ship.a))
      );

      // punta del fuego (más atrás)
      ctx.lineTo(
        ship.x - ship.r * 2 * Math.cos(ship.a),
        ship.y + ship.r * 2 * Math.sin(ship.a)
      );

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

  } else {
    ship.empuje.x -= FRICCION * ship.empuje.x / FPS;
    ship.empuje.y -= FRICCION * ship.empuje.y / FPS;
    fxThrust.stop();
  }

  //manejar el borde de la pantalla
  if (ship.x < 0 - ship.r) {
    ship.x = canva.width + ship.r;
  } else if (ship.x > canva.width + ship.r) {
    ship.x = 0 - ship.r;
  }
  if (ship.y < 0 - ship.r) {
    ship.y = canva.height + ship.r;
  } else if (ship.y > canva.height + ship.r) {
    ship.y = 0 - ship.r;
  }
  //movimientio de la nave
  if (!explotando) {
    ship.x += ship.empuje.x;
    ship.y += ship.empuje.y;
  } else {
    ship.tiempoExplosion--;
    if (ship.tiempoExplosion == 0) {
      vidas--;
      if (vidas == 0) {
        gameOver();
      } else {
        ship = newShip();
      }
    }
  }
  //dibujar los asteroides
  let x, y, r, a, vert, offs;
  for (let e of asteroides) {
    ctx.strokeStyle = "gray";
    ctx.lineWidth = SHIP_SIZE / 20;
    x = e.x;
    y = e.y;
    r = e.r;
    a = e.a;
    vert = e.vert;
    offs = e.offs;
    //dibujar un ruta
    ctx.beginPath();
    ctx.moveTo(
      x + r * offs[0] * Math.cos(a),
      y + r * offs[0] * Math.sin(a)
    );
    //dibuajr un poligono
    for (let i = 1; i < vert; i++) {
      ctx.lineTo(
        x + r * offs[i] * Math.cos(a + i * Math.PI * 2 / vert),
        y + r * offs[i] * Math.sin(a + i * Math.PI * 2 / vert)
      )
    }
    ctx.closePath();
    ctx.stroke();

    if (SHOW_ALREDEDOR) {
      ctx.strokeStyle = "blue"
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke();
    }

    //mover el asteroide
    e.x += e.xv;
    e.y += e.yv;

    //manejar los finales de pantalla
    if (e.x < 0 - e.r) {
      e.x = canva.width + e.r;
    } else if (e.x > canva.width + e.r) {
      e.x = 0 - e.r
    }
    if (e.y < 0 - e.r) {
      e.y = canva.height + e.r;
    } else if (e.y > canva.height + e.r) {
      e.y = 0 - e.r
    }
  }

  // colision laseres y asteroides
  for (let i = asteroides.length - 1; i >= 0; i--) {
    const e = asteroides[i];

    for (let j = ship.lasers.length - 1; j >= 0; j--) {
      const u = ship.lasers[j];

      if (u.tiempoExplosion == 0 && distanceEntrePuntos(e.x, e.y, u.x, u.y) < e.r) {
        // borrar el laser correcto

        // borrar el asteroide correcto
        u.tiempoExplosion = Math.ceil(LASER_EXPLODE_DUR * FPS);
        // asteroides.splice(i, 1);

        destruirAsteroide(i);
        break;
      }
    }
  }
  // dibujat el texto del nivel
  if (textAlpha >= 0) {
    ctx.textAlign = "center";
    ctx.textBaseLine = "middle";
    ctx.fillStyle = "rgba(255,255,255," + textAlpha + ")"
    ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono"
    ctx.fillText(text, canva.width / 2, canva.height * 3 / 4);
    textAlpha -= (1.0 / TEXT_FADE_TIEMP / FPS);
  } else if (ship.dead) {
    nuevoJuego()
  }
  //dibujar el score
  ctx.textAlign = "right";
  ctx.textBaseLine = "middle";
  ctx.fillStyle = "white";
  ctx.font = TEXT_SIZE + "px dejavu sans mono"
  ctx.fillText(score, canva.width - SHIP_SIZE / 2, SHIP_SIZE);

  //dibujar highscore
  ctx.textAlign = "center";
  ctx.textBaseLine = "middle";
  ctx.fillStyle = "white";
  ctx.font = (TEXT_SIZE * 0.75) + "px dejavu sans mono"
  ctx.fillText("MEJOR: " + highscore, canva.width / 2, SHIP_SIZE);

  // dibujar las vidad 
  let vidaColor;
  for (let i = 0; i < vidas; i++) {
    vidaColor = explotando && i == vidas ? "red" : "white";
    dibujarNave(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, Math.PI / 2, vidaColor);
  }
  //dibujo del texto de TEAM CELERON
  if (textAlpha >= 0) {
    ctx.textAlign = "center";
    ctx.textBaseLine = "middle";
    ctx.fillStyle = "rgba(255,255,255," + textAlpha + ")"
    ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono"
    ctx.fillText(celeron, canva.width / 2, canva.height * 1 / 4);
    textAlpha -= (1.0 / TEXT_FADE_TIEMP / FPS);
  } else if (ship.dead) {
    nuevoJuego()
  }
}
