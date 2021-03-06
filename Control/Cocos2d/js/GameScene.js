
var GameScene = cc.Scene.extend({
	layer: null,
	
	onEnter: function() {
		this._super();
		this.layer = new GameLayer();
		this.layer.init();
		this.addChild(this.layer);
	}
});

var GameLayer = (function(){
	var paddleSpeed = .8,
		maxBallAngle = 75,
		numOfRows = 4,
		numOfCols = 11,
		collisionTypePaddle = 1,
		collisionTypeBall = 2,
		collisionTypeBrick = 3,
		collisionTypeBottom = 4,
		ballSpeed, ballPadding, labelPadding, wallThickness, brickPadding,
		bg, paddle, ball, bricks, brickCount, scoreLabel, livesLabel,
		isHeld, touchX, x1, x2, y1, y2, space, walls, debugNode, postStepCallbacks,
		accumulator;
	
	var clear = function() {
		var winSize = cc.director.getWinSize();
		cc.game.lives = 3;
		cc.game.score = 0;
		ballSpeed = 1000;
		ballPadding = 4;
		wallThickness = 40;
		brickPadding = 16;
		labelPadding = 60;
		x1 = wallThickness;
		x2 = x1 + winSize.width - wallThickness * 2;
		y1 = wallThickness;
		y2 = y1 + winSize.height - wallThickness * 2;
		bg = null;
		paddle = null;
		ball = null;
		bricks = [];
		brickCount = 0;
		scoreLabel = null;
		livesLabel = null;
		isHeld = false;
		touchX = 0;
		space = null;
		walls = [];
		debugNode = null;
		postStepCallbacks = [];
		accumulator = 0;
	};
	
	var makeWall = function(_x1,_y1,_x2,_y2,collisionType) {
		var w = (_x2 - _x1) || 2,
			h = (_y2 - _y1) || 2,
			wall = new cp.BoxShape(space.staticBody, Math.abs(w), Math.abs(h));
		wall.body.setPos(cp.v(_x1 + w * .5, _y1 + h * .5));
		wall.setElasticity(1);
		wall.setFriction(0);
		wall.setCollisionType(collisionType || 0);
		space.addStaticShape(wall);
		return wall;
	};

	var createPhysicsSprite = function(filename, elasticity, friction, static, collisionType) {
		var sprite = cc.Sprite.create(filename),
			body,
			shape,
			w, h;
		
		w = sprite.width || 1;
		h = sprite.height || 1;

		if (static) {
			body = cp.StaticBody();
		} else {
			body = new cp.Body(1, cp.momentForBox(1, w, h))
			space.addBody(body);
		}

		if (collisionType === collisionTypeBall) {
			shape = new cp.CircleShape(body, w * .5, cp.v(0,0));
		} else {
			shape = new cp.BoxShape(body, w, h);
		}
		shape.setElasticity(elasticity);
		shape.setFriction(friction);
		shape.setCollisionType(collisionType || 0);
		space.addShape(shape);

		sprite.body = body;

		return sprite;
	};

	var touchHandler = function(type, touches, event) {
		if (touches) {
			isHeld = (type !== "ended" && type !== "cancelled");
			touchX = touches[0].getLocation().x;
			//cc.log("isHeld " + isHeld + " touchX " + touchX);
			if (!isHeld) {
				if (ball) {
					// Launch ball
					var v = ball.body.getVel();
					if (!v.x && !v.y) {
						ball.body.setVel(cp.v(0, ballSpeed));
					}
				}
			}
		}
	};
	
	var createBrickExplosion = function(self, x, y) {
		var i,
			xRange = 400,
			yRange = 100,
			xMin = xRange * -.5,
			yMin = yRange * -.5,
			sprite,
			t;

		for (i = 0; i < 15; i += 1) {
			t = (250 + cc.rand() % 250) / 1000;
			sprite = cc.Sprite.create("res/Particle.png");
			sprite.setPosition(x, y);
			sprite.runAction(cc.Sequence.create(
				cc.Spawn.create(
					cc.FadeOut.create(t),
					cc.EaseOut.create(cc.MoveBy.create(t, cc.p(xMin + cc.rand() % xRange, yMin + cc.rand() % yRange)), 1.2)
				),
				cc.DelayTime.create(t),
				cc.RemoveSelf.create()
			));
			self.addChild(sprite, 1);
		}
	};
	
	return cc.Layer.extend({
		init: function() {
			var self = this, i, x, y, w, h,
				winSize = cc.director.getWinSize(),
				font = "Dolce Vita",
				debugPhysics = false,
				playMusic = true;
			this._super();

			clear();

			// Preload particle
			i = cc.Sprite.create("res/Particle.png");
			i = null;
			
			// Preload sounds
			cc.loader.load(["res/Brick.mp3", "res/Paddle.mp3", "res/Die.mp3", "res/Wall.mp3"]);
			
			// Actual background
			bg = cc.LayerColor.create(cc.color(218, 214, 212, 255));
			this.addChild(bg, 0);
			
			// Labels
			scoreLabel = cc.LabelTTF.create("Score: " + cc.game.score.toString(), font, 45);
			scoreLabel.setAnchorPoint(0, 1);
			scoreLabel.setPosition(x1 + labelPadding, y2 - labelPadding);
			scoreLabel.setColor(cc.color(128, 128, 128));
			this.addChild(scoreLabel, 1);

			livesLabel = cc.LabelTTF.create("Lives: " + cc.game.lives.toString(), font, 45);
			livesLabel.setAnchorPoint(1, 1);
			livesLabel.setPosition(x2 - labelPadding, y2 - labelPadding);
			livesLabel.setColor(cc.color(128, 128, 128));
			this.addChild(livesLabel, 1);
			
			// Start physics
			space = new cp.Space();
			space.gravity = cp.v(0, 0);
			if (debugPhysics) {
				debugNode = cc.PhysicsDebugNode.create(space);
				this.addChild(debugNode, 100);
			}
			
			if (playMusic) {
				cc.audioEngine.playMusic("res/Song.mp3", true);
			}
			
			// Walls
			walls = [
				makeWall(x1,0,x2,-wallThickness,collisionTypeBottom), // bottom
				makeWall(x1,y2,x2,y2 + wallThickness), // top
				makeWall(0,0,x1,y2 + wallThickness), // left
				makeWall(x2,0,x2 + wallThickness,y2 + wallThickness) // right
			];
		
			// Paddle
			paddle = createPhysicsSprite("res/Paddle.png", 1, 0, false, collisionTypePaddle);
			paddle.body.setMass(Infinity);
			paddle.body.setMoment(Infinity);
			paddle.body.setPos(cp.v(winSize.width * .5, 50));
			this.addChild(paddle, 1);
            
			// Ball
			ball = createPhysicsSprite("res/Ball.png", 1, 0, false, collisionTypeBall);
			ball.body.setPos(cp.v(paddle.x, paddle.y));
			this.addChild(ball, 1);
			
			// Bricks
			i = cc.Sprite.create("res/Brick.png");
			w = i.width + brickPadding;
			h = i.height + brickPadding;
			i = null;
			for (y = 0; y < numOfRows; y += 1) {
				for (x = 0; x < numOfCols; x += 1) {
					i = createPhysicsSprite("res/Brick.png", 1, 0, false, collisionTypeBrick);
					i.x = winSize.width * .5 + ((x + .5 + numOfCols * -.5) * w);
					i.y = winSize.height * .5 + ((y + numOfRows * -.5) * h) + 40;
					i.body.setPos(cp.v(
						i.x,
						i.y
					));
					i.body.setMass(Infinity);
					i.body.setMoment(Infinity);
					this.addChild(i, 1);
					bricks.push(i);
					brickCount += 1;
					i = null;
				}
			}

			// Handle collision events
			space.addCollisionHandler(collisionTypeBall, collisionTypeBrick, null, null, null, function(arbiter, space){
				// Get brick shape and remove
				var shape = arbiter.getShapes()[1];
				postStepCallbacks.push(function(){
					for (var i = 0; i < numOfRows * numOfCols; i += 1) {
						if (bricks[i] && bricks[i].body === shape.body) {
							createBrickExplosion(self, bricks[i].x, bricks[i].y);
							bricks[i].removeFromParent();
							bricks[i] = null;
							brickCount -= 1;
							cc.game.score += 10;
							scoreLabel.setString("Score: " + cc.game.score);
							cc.audioEngine.playEffect("res/Brick.mp3");
							break;
						}
					}
					//space.removeBody(shape.body);
					space.removeShape(shape);
				});
			});
			space.addCollisionHandler(collisionTypeBall, collisionTypePaddle, null, null, null, function(arbiter, space){
				var v = ball.body.getVel();
				if (!v.x && !v.y) {
					return;
				}
				
				// Bounce at an angle
				var angle = (ball.x - paddle.x) / (paddle.width * paddle.scale);
				angle *= 180;
				angle = cc.clampf(angle, -maxBallAngle, maxBallAngle);
				//cc.log("Angle " + angle);
				angle *= Math.PI / 180;
			
				// Compute new ball velocity based on angle
				v.x = Math.sin(angle) * ballSpeed;
				v.y = Math.abs(Math.cos(angle) * ballSpeed);
				ball.body.setVel(v);

				cc.audioEngine.playEffect("res/Paddle.mp3");
			});
			space.addCollisionHandler(collisionTypeBall, collisionTypeBottom, function(arbiter, space){
				ball.body.setVel(cp.v(0,0));
				cc.game.lives -= 1;
				livesLabel.setString("Lives: " + cc.game.lives);
				if (cc.game.lives <= 0) {
					var scene = new MenuScene;
					scene.init();
					cc.director.runScene(scene);
				} else {
					cc.audioEngine.playEffect("res/Die.mp3");
				}
			}, null, null, null);
			space.addCollisionHandler(collisionTypeBall, 0, null, null, null, function(arbiter, space){
				cc.audioEngine.playEffect("res/Wall.mp3");
			});
			
			// Handle touch events
			cc.eventManager.addListener({
				event: cc.EventListener.TOUCH_ALL_AT_ONCE,
				onTouchesBegan: function(touches, event) {touchHandler("began", touches, event);},
				onTouchesMoved: function(touches, event) {touchHandler("moved", touches, event);},
				onTouchesEnded: function(touches, event) {touchHandler("ended", touches, event);},
				onTouchesCancelled: function(touches, event) {touchHandler("cancelled", touches, event);}
			}, this);
			
			// World update
			this.scheduleUpdate();

			return true;
		},
		
		update: function(delta) {
			var i, v, w, destX;
			
			// Callbacks
			for (i = 0; i < postStepCallbacks.length; i += 1) {
				postStepCallbacks[i]();
			}
			postStepCallbacks = [];

			// Move paddle
			if (paddle) {
				v = paddle.body.getPos();
				if (isHeld) {
					w = paddle.width * .5 * paddle.scale;
					v.x += (touchX - paddle.x) * paddleSpeed;
					v.x = cc.clampf(v.x, x1 + w, x2 - w);
				}
				paddle.body.setPos(cp.v(v.x, 50));
			}

			// Move ball with paddle
			if (ball) {
				v = ball.body.getVel();
				if (!v.x && !v.y) {
					ball.body.setPos(cp.v(
						paddle.x,
						paddle.y + (ball.height * ball.scale) + ballPadding
					));
				} else {
					// Keep velocity consistent
					v = cc.pMult(cc.pNormalize(v), ballSpeed);
					ball.body.setVel(v);
				}
			}

			var step = 1 / 60;
			accumulator += delta;
			while(accumulator > step) {
				space.step(step);
				accumulator -= step;
			}
			
			// Move sprites with bodies (workaround for Cocos2D JS bug)
			if (paddle) {
				v = paddle.body.getPos();
				v = cp.v(v.x, v.y);
				paddle.setPosition(v);
			}
			if (ball) {
				v = ball.body.getPos();
				v = cp.v(v.x, v.y);
				ball.setPosition(v);
			}
		},
		
		onExit: function() {
			this.unscheduleUpdate();
			space.removeCollisionHandler(space, collisionTypeBall, collisionTypeBrick);
			space.removeCollisionHandler(space, collisionTypeBall, collisionTypePaddle);
			space.removeCollisionHandler(space, collisionTypeBall, collisionTypeBottom);
			space.removeCollisionHandler(space, collisionTypeBall, 0);
			//spaceFree(space);
		}

	});
}());
