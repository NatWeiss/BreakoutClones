
var MenuScene = cc.Scene.extend({
	layer: null,
	
	onEnter: function() {
		this._super();
		this.layer = new MenuLayer();
		this.layer.init();
		this.addChild(this.layer);
	}
});

var MenuLayer = cc.Layer.extend({
	bg: null,
	logo: null,
	logoLabel: null,
	menu: null,
	playButton: null,
	exitButton: null,
	
	init: function() {
		var self = this,
			font = "Dolce Vita",
			logoText,
			winSize = cc.director.getWinSize(),
			x, y;

		this._super();

		// Determine state
		if (typeof cc.game.score === "undefined") {
			logoText = "Arkazoid";
			cc.audioEngine.playEffect("res/Intro.mp3");
		} else if (cc.game.lives === 0) {
			logoText = "Game Over";
			cc.audioEngine.playEffect("res/Lose.mp3");
		} else {
			logoText = "You Won!";
			cc.audioEngine.playEffect("res/Win.mp3");
		}

		// Actual background
		this.bg = cc.LayerColor.create(cc.color(218, 214, 212, 255));
		this.addChild(this.bg, 0);
		
		// Logo
		y = 24;
		this.logo = cc.Sprite.create("res/Logo.png");
		this.logo.setPosition(winSize.width * .5, winSize.height * .5 + 228);
		this.addChild(this.logo, 1);
		this.logo.y -= y * .5;
		this.logo.runAction(cc.RepeatForever.create(cc.Sequence.create(
			cc.EaseInOut.create(cc.MoveBy.create(2, cc.p(0, y)), 1.2),
			cc.EaseInOut.create(cc.MoveBy.create(2, cc.p(0, -y)), 1.2)
		)));

		// Title
		this.logoLabel = cc.LabelTTF.create(
			logoText,
			font,
			200
		);
		this.logoLabel.setColor(cc.color(128, 128, 128));
		this.logoLabel.setPosition(winSize.width * .5, winSize.height * .5 + 228);
		this.addChild(this.logoLabel, 1);

		// Menu
		this.menu = cc.Menu.create();
		this.menu.setPosition(cc.p());
		this.addChild(this.menu, 1);

		// Buttons
		this.playLabel = cc.MenuItemFont.create("Play", this.onPlayButton, this);
		this.playLabel.setPosition(winSize.width * .5 - 300, winSize.height * .5 - 400);
		this.playLabel.setFontSize(120);
		this.playLabel.setFontName(font);
		this.playLabel.setColor(cc.color(196, 196, 196));
		this.menu.addChild(this.playLabel);

		this.exitLabel = cc.MenuItemFont.create("Exit", this.onExitButton, this);
		this.exitLabel.setPosition(winSize.width * .5 + 300, winSize.height * .5 - 400);
		this.exitLabel.setFontSize(120);
		this.exitLabel.setFontName(font);
		this.exitLabel.setColor(cc.color(196, 196, 196));
		this.menu.addChild(this.exitLabel);
		
		return true;
	},
	
	onPlayButton: function() {
		var scene = new GameScene;
		scene.init();
		cc.director.runScene(scene);
	},
	
	onExitButton: function() {
		cc.log("Pressed exit button");
	}

});

