import Phaser from "phaser";

const TILE = 64;
const MOVE_COOLDOWN = 150;

interface GameSceneConfig {
    mapWidth: number;
    mapHeight: number;
    onMoveRequest: (x: number, y: number) => void;
}

interface PlayerSprite {
    rect: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
    private mapWidth = 0;
    private mapHeight = 0;
    private onMoveRequest: ((x: number, y: number) => void) | null = null;

    private myX = 0;
    private myY = 0;
    private mySprite: PlayerSprite | null = null;

    private otherPlayers = new Map<string, { x: number; y: number; sprite: PlayerSprite }>();

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private wasd: Record<string, Phaser.Input.Keyboard.Key> = {};
    private lastMoveTime = 0;

    constructor() {
        super({ key: "GameScene" });
    }

    configure(cfg: GameSceneConfig) {
        this.mapWidth = cfg.mapWidth;
        this.mapHeight = cfg.mapHeight;
        this.onMoveRequest = cfg.onMoveRequest;
    }

    create() {
        // White background
        this.cameras.main.setBackgroundColor("#ffffff");

        // Draw grid lines
        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0xcccccc, 1);

        for (let x = 0; x <= this.mapWidth; x++) {
            gfx.moveTo(x * TILE, 0);
            gfx.lineTo(x * TILE, this.mapHeight * TILE);
        }
        for (let y = 0; y <= this.mapHeight; y++) {
            gfx.moveTo(0, y * TILE);
            gfx.lineTo(this.mapWidth * TILE, y * TILE);
        }
        gfx.strokePath();

        // Set world bounds
        this.cameras.main.setBounds(0, 0, this.mapWidth * TILE, this.mapHeight * TILE);

        // Create my player sprite
        this.mySprite = this.createPlayerSprite(this.myX, this.myY, 0x22cc44, "You");
        this.cameras.main.startFollow(this.mySprite.rect, true, 0.1, 0.1);

        // Keyboard input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
                W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            };
        }
    }

    update(_time: number, _delta: number) {
        const now = Date.now();
        if (now - this.lastMoveTime < MOVE_COOLDOWN) return;

        let dx = 0;
        let dy = 0;

        if (this.cursors?.left.isDown || this.wasd.A?.isDown) dx = -1;
        else if (this.cursors?.right.isDown || this.wasd.D?.isDown) dx = 1;
        else if (this.cursors?.up.isDown || this.wasd.W?.isDown) dy = -1;
        else if (this.cursors?.down.isDown || this.wasd.S?.isDown) dy = 1;

        if (dx === 0 && dy === 0) return;

        const newX = this.myX + dx;
        const newY = this.myY + dy;

        // Bounds check
        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) return;

        this.lastMoveTime = now;

        // Optimistic move
        this.myX = newX;
        this.myY = newY;
        this.updateSpritePosition(this.mySprite!, newX, newY);

        if (this.onMoveRequest) {
            this.onMoveRequest(newX, newY);
        }
    }

    // --- Methods called from React ---

    setMyPosition(x: number, y: number) {
        this.myX = x;
        this.myY = y;
        if (this.mySprite) {
            this.updateSpritePosition(this.mySprite, x, y);
        }
    }

    addUser(userId: string, x: number, y: number) {
        if (this.otherPlayers.has(userId)) {
            this.moveUser(userId, x, y);
            return;
        }
        const shortId = userId.length > 6 ? userId.slice(0, 6) : userId;
        const sprite = this.createPlayerSprite(x, y, 0x4488cc, shortId);
        this.otherPlayers.set(userId, { x, y, sprite });
    }

    moveUser(userId: string, x: number, y: number) {
        const player = this.otherPlayers.get(userId);
        if (!player) return;
        player.x = x;
        player.y = y;
        this.updateSpritePosition(player.sprite, x, y);
    }

    removeUser(userId: string) {
        const player = this.otherPlayers.get(userId);
        if (!player) return;
        player.sprite.rect.destroy();
        player.sprite.label.destroy();
        this.otherPlayers.delete(userId);
    }

    getMyPosition() {
        return { x: this.myX, y: this.myY };
    }

    // --- Internal helpers ---

    private createPlayerSprite(x: number, y: number, color: number, labelText: string): PlayerSprite {
        const px = x * TILE + TILE / 2;
        const py = y * TILE + TILE / 2;

        const rect = this.add.rectangle(px, py, TILE - 4, TILE - 4, color);
        const label = this.add.text(px, py - TILE / 2 - 10, labelText, {
            fontSize: "12px",
            color: "#000000",
            align: "center",
        });
        label.setOrigin(0.5, 0.5);

        return { rect, label };
    }

    private updateSpritePosition(sprite: PlayerSprite, x: number, y: number) {
        const px = x * TILE + TILE / 2;
        const py = y * TILE + TILE / 2;
        sprite.rect.setPosition(px, py);
        sprite.label.setPosition(px, py - TILE / 2 - 10);
    }
}
