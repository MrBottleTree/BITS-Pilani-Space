import Phaser from "phaser";

const TILE = 64;
const MOVE_COOLDOWN = 100;

interface GameSceneConfig {
    mapWidth: number;
    mapHeight: number;
    onMoveRequest: (x: number, y: number) => void;
    thumbnailUrl?: string;
}

interface PlayerSprite {
    rect: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    image?: Phaser.GameObjects.Image;
}

export class GameScene extends Phaser.Scene {
    private mapWidth = 0;
    private mapHeight = 0;
    private onMoveRequest: ((x: number, y: number) => void) | null = null;
    private thumbnailUrl?: string;

    private myX = 0;
    private myY = 0;
    private mySprite: PlayerSprite | null = null;

    private otherPlayers = new Map<string, { x: number; y: number; sprite: PlayerSprite }>();

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private wasd: Record<string, Phaser.Input.Keyboard.Key> = {};
    private lastMoveTime = 0;

    private elementSprites: Phaser.GameObjects.Image[] = [];

    constructor() {
        super({ key: "GameScene" });
    }

    configure(cfg: GameSceneConfig) {
        this.mapWidth = cfg.mapWidth;
        this.mapHeight = cfg.mapHeight;
        this.onMoveRequest = cfg.onMoveRequest;
        this.thumbnailUrl = cfg.thumbnailUrl;
    }

    preload() {
        if (this.thumbnailUrl) {
            this.load.image("map-thumbnail", this.thumbnailUrl);
        }
    }

    create() {
        // White background
        this.cameras.main.setBackgroundColor("#ffffff");

        // Render map thumbnail as background
        if (this.textures.exists("map-thumbnail")) {
            const totalWidth = this.mapWidth * TILE;
            const totalHeight = this.mapHeight * TILE;
            const bg = this.add.image(totalWidth / 2, totalHeight / 2, "map-thumbnail");
            bg.setDisplaySize(totalWidth, totalHeight);
            bg.setDepth(0);
        }

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

    update() {
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

    updateMyInfo(displayName: string, avatarUrl?: string) {
        if (!this.mySprite) return;

        // Update label
        this.mySprite.label.setText(displayName);

        // Load and set avatar if provided
        if (avatarUrl) {
            this.loadAndSetAvatar(this.mySprite, avatarUrl, this.myX, this.myY);
        }
    }

    addUser(userId: string, x: number, y: number, displayName?: string, avatarUrl?: string) {
        if (this.otherPlayers.has(userId)) {
            this.moveUser(userId, x, y);
            return;
        }
        const shortId = userId.length > 6 ? userId.slice(0, 6) : userId;
        const labelText = displayName || shortId;
        const sprite = this.createPlayerSprite(x, y, 0x4488cc, labelText);
        this.otherPlayers.set(userId, { x, y, sprite });

        // Load avatar if provided
        if (avatarUrl) {
            this.loadAndSetAvatar(sprite, avatarUrl, x, y);
        }
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
        if (player.sprite.image) {
            player.sprite.image.destroy();
        }
        this.otherPlayers.delete(userId);
    }

    getMyPosition() {
        return { x: this.myX, y: this.myY };
    }

    setMapElements(elements: Array<{ x: number; y: number; scale: number; rotation: number; imageUrl: string; width: number; height: number }>) {
        // Clear existing element sprites
        this.elementSprites.forEach(sprite => sprite.destroy());
        this.elementSprites = [];

        if (elements.length === 0) return;

        // Load all element images
        elements.forEach((element, index) => {
            const key = `element-${index}`;
            if (!this.textures.exists(key)) {
                this.load.image(key, element.imageUrl);
            }
        });

        // Start loading and wait for completion
        this.load.once('complete', () => {
            elements.forEach((element, index) => {
                const key = `element-${index}`;
                const px = element.x * TILE + TILE / 2;
                const py = element.y * TILE + TILE / 2;

                const sprite = this.add.image(px, py, key);
                sprite.setDepth(1); // Behind players

                // Scale to fit within the element's tile dimensions
                const targetWidth = element.width * TILE;
                const targetHeight = element.height * TILE;
                const scaleX = targetWidth / sprite.width;
                const scaleY = targetHeight / sprite.height;
                const finalScale = Math.min(scaleX, scaleY) * element.scale;

                sprite.setScale(finalScale);
                sprite.setAngle(element.rotation);

                this.elementSprites.push(sprite);
            });
        });

        this.load.start();
    }

    // --- Internal helpers ---

    private createPlayerSprite(x: number, y: number, color: number, labelText: string): PlayerSprite {
        const px = x * TILE + TILE / 2;
        const py = y * TILE + TILE / 2;

        const rect = this.add.rectangle(px, py, TILE - 4, TILE - 4, color);
        rect.setDepth(10); // Players above elements

        const label = this.add.text(px, py - TILE / 2 - 10, labelText, {
            fontSize: "12px",
            color: "#000000",
            align: "center",
            backgroundColor: "#ffffffcc",
            padding: { x: 2, y: 2 },
        });
        label.setOrigin(0.5, 0.5);
        label.setDepth(11); // Labels above everything

        return { rect, label };
    }

    private updateSpritePosition(sprite: PlayerSprite, x: number, y: number) {
        const px = x * TILE + TILE / 2;
        const py = y * TILE + TILE / 2;
        sprite.rect.setPosition(px, py);
        sprite.label.setPosition(px, py - TILE / 2 - 10);
        if (sprite.image) {
            sprite.image.setPosition(px, py);
        }
    }

    private loadAndSetAvatar(sprite: PlayerSprite, avatarUrl: string, x: number, y: number) {
        const key = `avatar-${avatarUrl}`;

        // Check if already loaded
        if (this.textures.exists(key)) {
            this.setAvatarImage(sprite, key, x, y);
            return;
        }

        // Load the avatar image
        this.load.image(key, avatarUrl);
        this.load.once('complete', () => {
            if (this.textures.exists(key)) {
                this.setAvatarImage(sprite, key, x, y);
            } else {
                console.warn(`Failed to load avatar: ${avatarUrl}`);
            }
        });
        this.load.start();
    }

    private setAvatarImage(sprite: PlayerSprite, textureKey: string, x: number, y: number) {
        const px = x * TILE + TILE / 2;
        const py = y * TILE + TILE / 2;

        // Remove old image if exists
        if (sprite.image) {
            sprite.image.destroy();
        }

        // Create new image sprite
        const image = this.add.image(px, py, textureKey);
        image.setDepth(10);

        // Scale to fit within tile
        const scale = (TILE - 4) / Math.max(image.width, image.height);
        image.setScale(scale);

        sprite.image = image;

        // Hide the fallback rectangle
        sprite.rect.setVisible(false);
    }
}
