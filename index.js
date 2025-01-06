const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1920x1484
// make the width and height to fit width or height of the screen
// and keep the aspect ratio
const aspectRatio = 1920 / 1484;
const width = window.innerWidth;
const height = window.innerHeight;
canvas.height = height;
canvas.width = height * aspectRatio;

// Load assets
const warriorIdleSprite = new Image();
warriorIdleSprite.src = 'assets/images/warrior/Sprites/Idle.png';

const warriorAttack1Sprite = new Image();
warriorAttack1Sprite.src = 'assets/images/warrior/Sprites/Attack1.png';

const warriorAttack2Sprite = new Image();
warriorAttack2Sprite.src = 'assets/images/warrior/Sprites/Attack2.png';

const wizardIdleSprite = new Image();
wizardIdleSprite.src = 'assets/images/wizard/Sprites/Idle.png';

const wizardAttack1Sprite = new Image();
wizardAttack1Sprite.src = 'assets/images/wizard/Sprites/Attack1.png';

const wizardAttack2Sprite = new Image();
wizardAttack2Sprite.src = 'assets/images/wizard/Sprites/Attack2.png';

const victoryImg = new Image();
victoryImg.src = 'assets/images/icons/victory.png';

const swordSound = new Audio('assets/audio/sword.wav');
const magicSound = new Audio('assets/audio/magic.wav');
const backgroundMusic = new Audio('assets/audio/music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

// Wait for user interaction
const startOverlay = document.getElementById('startOverlay');
const replayOverlay = document.getElementById('replayOverlay');
const countdownOverlay = document.getElementById('countdownOverlay');
const replayButton = document.getElementById('replayButton');

let warriorScore = 0;
let wizardScore = 0;

function startGame() {
    backgroundMusic.play().catch((err) => {
        console.warn('Autoplay failed:', err);
    });

    startOverlay.style.display = 'none';
    startCountdown();

    // Remove event listeners
    window.removeEventListener('click', startGame);
    window.removeEventListener('keydown', startGame);
}

function resetGame() {
    replayOverlay.style.display = 'none';
    warrior.health = 100;
    wizard.health = 100;
    warrior.alive = true;
    wizard.alive = true;
    warrior.resetBoost(); // Reset boost control
    wizard.resetBoost(); // Reset boost control
    gameOver = false;
    startCountdown();
}

replayButton.addEventListener('click', resetGame);

window.addEventListener('click', startGame, { once: true });
window.addEventListener('keydown', startGame, { once: true });

// Game variables
const FPS = 60;
const gravity = 1.5;
let gameOver = false;

const imagesPadding = 250;
const wizardStartPadding = 500;

class Fighter {
    constructor(
        x,
        y,
        idleSprite,
        attack1Sprite,
        attack2Sprite,
        healthBarX,
        healthBarY,
        frameWidth,
        frameHeight,
        frameCount,
        scale,
        attackSound,
        isWizard
    ) {
        this.x = x;
        this.y = y;
        this.idleSprite = idleSprite;
        this.attack1Sprite = attack1Sprite;
        this.attack2Sprite = attack2Sprite;
        this.currentSprite = idleSprite;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.currentFrame = 0;
        this.animationSpeed = 5;
        this.animationCounter = 0;
        this.health = 100;
        this.isJumping = false;
        this.velocityY = 0;
        this.healthBarX = healthBarX;
        this.healthBarY = healthBarY;
        this.alive = true;
        this.scale = scale;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.boostGiven = false; // Control for health boost
        this.setHitBox();
        this.attackSound = attackSound;
        this.isWizard = isWizard;
        this.direction = 'right';
    }

    setHitBox() {
        const x = this.x;
        const y = this.y;
        const frameWidth = this.frameWidth;
        const frameHeight = this.frameHeight;

        if (this.isWizard) {
            this.hitbox = {
                x: x + frameWidth / 1.25,
                y: y + frameHeight / 1.25,
                width: frameWidth * 1.5,
                height: frameHeight * 1.5,
            };
        } else {
            this.hitbox = {
                x: x + frameWidth * 1.25,
                y: y + frameHeight * 1.25,
                width: frameWidth * 1.5,
                height: frameHeight * 1.5,
            };
        }
    }

    draw() {
        const frameX = this.currentFrame * this.frameWidth;
        ctx.save();

        if (this.direction === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.currentSprite,
                frameX,
                0,
                this.frameWidth,
                this.frameHeight,
                -this.x - this.frameWidth * this.scale,
                this.y,
                this.frameWidth * this.scale,
                this.frameHeight * this.scale
            );
        } else {
            ctx.drawImage(
                this.currentSprite,
                frameX,
                0,
                this.frameWidth,
                this.frameHeight,
                this.x,
                this.y,
                this.frameWidth * this.scale,
                this.frameHeight * this.scale
            );
        }

        ctx.restore();
        this.drawHealthBar();
        this.setHitBox();
        this.animate();
    }

    drawHealthBar() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.healthBarX, this.healthBarY, 200, 20);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(
            this.healthBarX,
            this.healthBarY,
            2 * this.health,
            20
        );
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText(
            `${this.health}%`,
            this.healthBarX + 80,
            this.healthBarY + 15
        );

        ctx.fillStyle = 'white';
        if (this.isWizard) {
            ctx.fillText(
                `Score: ${wizardScore}`,
                canvas.width - 220,
                this.healthBarY + 40
            );
        } else {
            ctx.fillText(
                `Score: ${warriorScore}`,
                this.healthBarX,
                this.healthBarY + 40
            );
        }
    }

    animate() {
        this.animationCounter++;
        if (this.animationCounter >= this.animationSpeed) {
            this.currentFrame =
                (this.currentFrame + 1) % this.frameCount;
            this.animationCounter = 0;
        }
    }

    move(left, right, jumpKey) {
        if (!this.alive) return;

        if (keys[left] && this.x + imagesPadding > 0) {
            this.x -= 5;
            this.direction = 'left';
        }
        if (
            keys[right] &&
            this.x - imagesPadding <
            canvas.width - this.frameWidth * this.scale
        ) {
            this.x += 5;
            this.direction = 'right';
        }
        if (keys[jumpKey] && !this.isJumping) {
            this.velocityY = -20;
            this.isJumping = true;
        }

        this.y += this.velocityY;
        this.velocityY += gravity;

        if (
            this.y + this.frameHeight * this.scale >=
            canvas.height + 190
        ) {
            this.y =
                canvas.height + 190 - this.frameHeight * this.scale;
            this.isJumping = false;
        }
    }

    attack(target, attackType) {
        if (!this.alive || this.attackCooldown > 0) return;

        this.isAttacking = true;
        this.currentSprite =
            attackType === 1
                ? this.attack1Sprite
                : this.attack2Sprite;

        if (
            this.hitbox.x + this.hitbox.width > target.hitbox.x &&
            this.hitbox.x < target.hitbox.x + target.hitbox.width &&
            this.hitbox.y + this.hitbox.height > target.hitbox.y &&
            this.hitbox.y < target.hitbox.y + target.hitbox.height
        ) {
            target.health -= 10;
            this.attackSound.play();
            if (target.health <= 0) {
                target.alive = false;
            }
        }

        setTimeout(() => {
            this.isAttacking = false;
            this.currentSprite = this.idleSprite;
        }, 500);

        this.attackCooldown = 30;
    }

    updateCooldown() {
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    checkHealthBoost() {
        if (this.health === 30 && !this.boostGiven) {
            this.health += Math.ceil(10 );
            this.boostGiven = true;
            alert(`${this.isWizard ? 'Wizard' : 'Warrior'}'s health boosted by 10%!`);
        }
    }

    resetBoost() {
        this.boostGiven = false;
    }
}

const warrior = new Fighter(
    100,
    400,
    warriorIdleSprite,
    warriorAttack1Sprite,
    warriorAttack2Sprite,
    20,
    20,
    162,
    162,
    8,
    4,
    swordSound,
    false
);
const wizard = new Fighter(
    canvas.width - wizardStartPadding,
    400,
    wizardIdleSprite,
    wizardAttack1Sprite,
    wizardAttack2Sprite,
    canvas.width - 220,
    20,
    250,
    250,
    8,
    3,
    magicSound,
    true
);

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'r') warrior.attack(wizard, 1);
    if (e.key === 'e') warrior.attack(wizard, 2);
    if (e.key === '1') wizard.attack(warrior, 1);
    if (e.key === '2') wizard.attack(warrior, 2);
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function startCountdown() {
    let countdown = 3;
    countdownOverlay.style.display = 'flex';

    countdownOverlay.innerHTML = '';

    const countdownTextEl = document.createElement('p');
    countdownTextEl.style.color = 'red';
    countdownTextEl.style.fontSize = '300px';
    countdownTextEl.textContent = countdown;
    countdownOverlay.appendChild(countdownTextEl);

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownTextEl.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            countdownOverlay.style.display = 'none';
            gameLoop();
        }
    }, 1000);
}

function gameLoop() {
    if (gameOver) {
        const winner = warrior.alive ? 'Warrior' : 'Wizard';
        
        if (warrior.alive) {
            warriorScore++; // Warrior kazandıysa skoru artır
        } else {
            wizardScore++; // Wizard kazandıysa skoru artır
        }

        replayOverlay.innerHTML = `
              <div>
                <p>${winner} Wins!</p>
                <button id="replayButton">Next Round</button>
              </div>
            `;
        replayOverlay.style.display = 'flex';

        document
            .getElementById('replayButton')
            .addEventListener('click', resetGame);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    warrior.updateCooldown();
    wizard.updateCooldown();

    warrior.move('a', 'd', 'w');
    wizard.move('ArrowLeft', 'ArrowRight', 'ArrowUp');

    warrior.draw();
    warrior.checkHealthBoost();

    wizard.draw();
    wizard.checkHealthBoost();

    if (!warrior.alive || !wizard.alive) {
        gameOver = true;
    }

    requestAnimationFrame(gameLoop);
}

