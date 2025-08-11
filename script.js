// 1. Obtener el canvas y los elementos del DOM
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuScreen = document.getElementById('menuScreen');
const startButton = document.getElementById('startButton');
const volumeSlider = document.getElementById('volumeSlider');

// 2. Variables del juego
let score = 0;
let hits = 0;
let misses = 0;
const totalClicksNeeded = 40;
let target = null;
let targetRadius = 30;

// Variables para los efectos de explosión
let particles = [];
const particleCount = 20;

// Variables de estado y tiempo
let gameState = 'menu';
let startTime = 0;
let finalTime = 0;
let finalMisses = 0;

// Variables de audio
const hitSound = new Audio('hit.mp3');
const backgroundMusic = new Audio('musica-de-fondo.mp3');
const menuMusic = new Audio('musica-del-menu-principal.mp3');
backgroundMusic.loop = true;
menuMusic.loop = true;
backgroundMusic.volume = 0.5;
menuMusic.volume = 0.5;

// 3. --- DEFINICIÓN DE FUNCIONES ---

// Ajustar el tamaño del canvas a la ventana
function resizeCanvas() {
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
}

// Efecto de temblor de pantalla (activado por fallos)
let shakeDuration = 0;
const shakeIntensity = 5;

function startShake(duration = 100) {
    shakeDuration = duration;
}

function applyShake() {
    if (shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.save();
        ctx.translate(dx, dy);
        shakeDuration -= 10;
    } else {
        ctx.restore();
    }
}

// Crear, actualizar y dibujar partículas para el efecto de explosión
function createParticles(x, y) {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        const velocity = {
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5
        };
        particles.push({
            x: x, y: y, radius: Math.random() * 3, color: '#ffcccc', velocity: velocity
        });
    }
}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.velocity.x;
        p.y += p.velocity.y;
        p.radius -= 0.1;
        if (p.radius < 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Función para crear un objetivo
function createTarget() {
    const x = Math.random() * (canvas.width - targetRadius * 2) + targetRadius;
    const y = Math.random() * (canvas.height - targetRadius * 2) + targetRadius;
    return { x: x, y: y, radius: targetRadius };
}

// Dibujar el único objetivo con un degradado radial
function drawTarget() {
    if (!target) return;
    const gradient = ctx.createRadialGradient(
        target.x - 10, target.y - 10, 0,
        target.x, target.y, target.radius
    );
    gradient.addColorStop(0, '#ff9999');
    gradient.addColorStop(1, '#cc0000');
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
}

// Lógica de fin de juego
function endGame() {
    const endTime = Date.now();
    finalTime = (endTime - startTime) / 1000;
    finalMisses = misses;
    gameState = 'results';
    target = null;
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    menuMusic.play();
}

// Dibuja el texto de los resultados directamente en el canvas
function drawResultsOnCanvas() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡Objetivo completado!', canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = '36px sans-serif';
    const minutes = Math.floor(finalTime / 60);
    const seconds = (finalTime % 60).toFixed(2);
    ctx.fillText(`Tiempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(5, '0')}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Fallos: ${finalMisses}`, canvas.width / 2, canvas.height / 2 + 50);

    // Dibuja el botón "Jugar de nuevo"
    ctx.fillStyle = '#007BFF';
    const buttonWidth = 250;
    const buttonHeight = 60;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 100;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText('JUGAR DE NUEVO', canvas.width / 2, buttonY + buttonHeight / 2 + 8);

    // Guarda las coordenadas del botón para el clic
    canvas.playAgainButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
}

// Función para dibujar el cronómetro en tiempo real
function drawTimer() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = (elapsedTime % 60).toFixed(2);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(5, '0')}`, canvas.width - 20, 30);
}

// Función principal de dibujo y animación
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        applyShake();
        drawTarget();
        updateParticles();
        drawParticles();
        drawTimer();
        
        ctx.fillStyle = 'white';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Clics: ${hits + misses} / ${totalClicksNeeded}`, canvas.width / 2, 30);
    } else if (gameState === 'results') {
        drawResultsOnCanvas();
    }

    if (shakeDuration <= 0) {
        ctx.restore();
    }
    
    requestAnimationFrame(animate);
}

// --- LÓGICA DEL JUEGO Y EVENTOS ---

// Iniciar el juego
function startGame() {
    gameState = 'playing';
    menuScreen.style.display = 'none';
    canvas.style.display = 'block';
    
    score = 0;
    hits = 0;
    misses = 0;
    startTime = Date.now();
    target = createTarget(); 
    
    menuMusic.pause();
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
}

// Manejar los clics del mouse
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    if (gameState === 'playing') {
        if (!target) return;
        
        const distance = Math.sqrt(Math.pow(mouseX - target.x, 2) + Math.pow(mouseY - target.y, 2));

        if (distance < target.radius) {
            score++;
            hits++;
            createParticles(target.x, target.y);
            hitSound.currentTime = 0;
            hitSound.play();
            target = createTarget();
        } else {
            misses++;
            startShake(150);
        }
        
        if (hits + misses >= totalClicksNeeded) {
            endGame();
        }
    } else if (gameState === 'results') {
        // Lógica para el botón "Jugar de nuevo" en el canvas
        const button = canvas.playAgainButton;
        if (mouseX > button.x && mouseX < button.x + button.width &&
            mouseY > button.y && mouseY < button.y + button.height) {
            startGame();
        }
    }
});

// Manejar el control de volumen
volumeSlider.addEventListener('input', (event) => {
    backgroundMusic.volume = event.target.value;
    menuMusic.volume = event.target.value;
});

// Manejar los clics en los botones del menú
startButton.addEventListener('click', startGame);

// 4. --- INICIO DEL JUEGO ---
// Iniciar el bucle de animación y el ajuste de tamaño
resizeCanvas();
animate();

// Inicia la música del menú automáticamente
menuMusic.play();