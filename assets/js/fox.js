const SPRITE_FOLDER = "assets/image/fox/";

class Fox {
  constructor(element, color, initialOffset) {
    this.element = element;
    this.sprite = element.querySelector(".fox-sprite");
    this.color = color;
    this.currentState = "idle";
    this.position = {
      x: window.innerWidth / 2 + initialOffset,
      y: parseInt(window.getComputedStyle(element).bottom),
    };
    this.states = {
      idle: `${SPRITE_FOLDER}${color}_idle_8fps.gif`,
      lie: `${SPRITE_FOLDER}${color}_lie_8fps.gif`,
      run: `${SPRITE_FOLDER}${color}_run_8fps.gif`,
      swipe: `${SPRITE_FOLDER}${color}_swipe_8fps.gif`,
      walk: `${SPRITE_FOLDER}${color}_walk_8fps.gif`,
      walkFast: `${SPRITE_FOLDER}${color}_walk_fast_8fps.gif`,
      withBall: `${SPRITE_FOLDER}${color}_with_ball_8fps.gif`,
    };
    this.expressions = [
      "is happy",
      "is excited",
      "wants to play",
      "is curious",
      "looks playful",
      "is energetic",
      "wants treats",
      "is friendly",
      "looks sleepy",
      "is running fast",
      "wants attention",
      "is jumping around",
      "is exploring",
      "feels adventurous",
      "is having fun",
    ];
    this.facingRight = true;
    this.isMoving = false;
    this.isRunning = false;
    this.speed = 0;
    this.init();
  }

  init() {
    this.setState("idle");
    this.updatePosition();
    this.startBehaviorLoop();
    this.startExpressionUpdate();
    this.setupClickHandler();

    window.addEventListener("resize", () => {
      if (this.position.x > window.innerWidth) {
        this.position.x = window.innerWidth - 55;
      }
      this.updatePosition();
    });
  }

  setupClickHandler() {
    this.element.addEventListener("click", async () => {
      if (!this.isRunning) {
        this.isRunning = true;
        this.isMoving = true;
        await this.runFast();
        this.isRunning = false;
        this.isMoving = false;
        this.setState("idle");
      }
    });
  }

  async runFast() {
    this.setState("run");
    const duration = 2000;
    const startTime = Date.now();
    const speed = 5;
    const direction = this.facingRight ? 1 : -1;

    while (Date.now() - startTime < duration) {
      this.move(direction * speed);
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
  }

  setState(state) {
    this.currentState = state;
    this.sprite.style.backgroundImage = `url('${this.states[state]}')`;
    this.sprite.style.transform = `scaleX(${this.facingRight ? 1 : -1})`;
  }

  updatePosition() {
    if (this.position.x > window.innerWidth) {
      this.position.x = -55;
    } else if (this.position.x < -55) {
      this.position.x = window.innerWidth;
    }

    this.element.style.left = `${this.position.x}px`;
    this.element.style.bottom = `${this.position.y}px`;
  }

  updateExpression() {
    const tooltip = this.element.querySelector(".tooltip");
    const randomExpression =
      this.expressions[Math.floor(Math.random() * this.expressions.length)];
    const name = this.color === "red" ? "Kuro" : "Shiro";
    tooltip.textContent = `${name} ${randomExpression}`;
  }

  startExpressionUpdate() {
    setInterval(() => {
      if (!this.isRunning && Math.random() < 0.3) {
        this.updateExpression();
      }
    }, 3000);
  }

  move(dx) {
    this.position.x += dx;
    this.updatePosition();

    if (dx > 0) this.facingRight = true;
    if (dx < 0) this.facingRight = false;
    this.sprite.style.transform = `scaleX(${this.facingRight ? 1 : -1})`;
  }

  async performAction(action, duration) {
    if (this.isRunning) return;
    const originalState = this.currentState;
    this.setState(action);
    await new Promise((resolve) => setTimeout(resolve, duration));
    if (!this.isMoving && !this.isRunning) {
      this.setState(originalState);
    }
  }

  getRandomDuration(min, max) {
    return Math.random() * (max - min) + min;
  }

  async startBehaviorLoop() {
    while (true) {
      if (this.isRunning) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const behaviors = [
        // Idle behavior
        async () => {
          if (this.isRunning) return;
          this.isMoving = false;
          await new Promise((resolve) =>
            setTimeout(resolve, this.getRandomDuration(2000, 4000))
          );
        },
        // Walking behavior
        async () => {
          if (this.isRunning) return;
          this.isMoving = true;
          this.setState("walk");
          const duration = this.getRandomDuration(4000, 8000);
          const startTime = Date.now();
          const direction = Math.random() > 0.5 ? 1 : -1;
          const speed = 1.5;

          while (Date.now() - startTime < duration && !this.isRunning) {
            this.move(direction * speed);
            await new Promise((resolve) => setTimeout(resolve, 16));
          }

          if (!this.isRunning) {
            this.isMoving = false;
            this.setState("idle");
          }
        },
        // Running behavior
        async () => {
          if (this.isRunning) return;
          this.isMoving = true;
          this.setState("run");
          const duration = this.getRandomDuration(2000, 4000);
          const startTime = Date.now();
          const direction = Math.random() > 0.5 ? 1 : -1;
          const speed = 3;

          while (Date.now() - startTime < duration && !this.isRunning) {
            this.move(direction * speed);
            await new Promise((resolve) => setTimeout(resolve, 16));
          }

          if (!this.isRunning) {
            this.isMoving = false;
            this.setState("idle");
          }
        },
        // Other behaviors
        async () => {
          if (this.isRunning) return;
          this.isMoving = false;
          await this.performAction("lie", this.getRandomDuration(3000, 6000));
        },
        async () => {
          if (this.isRunning) return;
          this.isMoving = false;
          await this.performAction(
            "withBall",
            this.getRandomDuration(2000, 4000)
          );
        },
        async () => {
          if (this.isRunning) return;
          this.isMoving = false;
          await this.performAction("swipe", this.getRandomDuration(1000, 2000));
        },
      ];

      const weightedBehaviors = [
        ...new Array(3).fill(behaviors[0]),
        ...new Array(4).fill(behaviors[1]),
        ...new Array(2).fill(behaviors[2]),
        ...new Array(2).fill(behaviors[3]),
        ...new Array(2).fill(behaviors[4]),
        ...new Array(1).fill(behaviors[5]),
      ];

      const randomBehavior =
        weightedBehaviors[Math.floor(Math.random() * weightedBehaviors.length)];
      await randomBehavior();

      if (!this.isRunning && Math.random() < 0.3) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.getRandomDuration(1000, 3000))
        );
      }
    }
  }
}

// Create fox instances
const redFox = new Fox(document.getElementById("red-fox"), "red", -100);
const whiteFox = new Fox(document.getElementById("white-fox"), "white", 100);

// Splash screen
document.addEventListener("DOMContentLoaded", function () {
  const splashScreen = document.getElementById("splash-screen");
  const redFox = document.querySelector(".red-fox");
  const whiteFox = document.querySelector(".white-fox");

  // Set fox sprite images
  redFox.style.backgroundImage = "url('assets/image/fox/red_run_8fps.gif')";
  whiteFox.style.backgroundImage = "url('assets/image/fox/white_run_8fps.gif')";

  // Hide splash screen after 3 seconds
  setTimeout(() => {
    splashScreen.classList.add("fade-out");
    setTimeout(() => {
      splashScreen.classList.add("hidden");
    }, 500);
  }, 4000);
});
