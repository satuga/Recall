/**
 * @author Dylan
 */
var DEBUGMODE = false;

// Constant Declarations
var PHYSICS_SCALE = 100.0;
var KEY_E = 69;
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;
var KEY_SPACE = 32;
var KEY_ESC = 27;
var VIEWPORT_WIDTH = document.getElementById("recall").width;
var VIEWPORT_HEIGHT = document.getElementById("recall").height;

// PLAYER CONSTANTS
var PLAYER_WIDTH_STANDING = 63;
var PLAYER_HEIGHT_STANDING = 100;
var PLAYER_WIDTH_RUNNING = 125;
var PLAYER_HEIGHT_RUNNING = 100;
var PLAYER_WIDTH_SLIDING = 100;
var PLAYER_HEIGHT_SLIDING = 40;
var PLAYER_STATE_NORMAL = 0;
var PLAYER_STATE_RUNNER = 1;
var PLAYER_STATE_CLIMBING = 2;
var PLAYER_WALK_SPEED = 1;
var PLAYER_RUN_SPEED = 4;
var PLAYER_DASH_SPEED = 10;
var PLAYER_DASH_DURATION = 30;
var PLAYER_SLIDE_DURATION = 60;

var SPRITES = {
	PLAYER_WALK: "sprites/player_walk_cycle.png",
	PLAYER_RUN: "sprites/player_run_cycle.png",
	LEFT_WALL: "sprites/roof_left.png",
	MIDDLE_WALL: "sprites/roof_middle.png",
	RIGHT_WALL: "sprites/roof_right.png",
	LEFT_DOOR: "sprites/door_left.png",
	RIGHT_DOOR: "sprites/door_right.png",
	MIDDLE_DOOR: "sprites/door_middle.png",
	ROOF_AC: "sprites/rooftop_ac.png",
	ROOF_CHIMNEY: "sprites/rooftop_chimney.png",
	ROOF_CONTAINER: "sprites/rooftop_container.png",
	ROOF_DOOR: "sprites/rooftop_door.png",
};

var SPRITE_W = 
{
	WALL: 200,
	CHIMNEY: 31,
	CONTAINER: 177,
	AC: 127,
	DOOR: 130,
};

var SPRITE_H = 
{
	WALL: 360,
	CHIMNEY: 89,
	CONTAINER: 234,
	AC: 48,
	DOOR: 107,
};
//
// Initialization
// Set up physics engine and brine engine
//
(function() {
	use2D = true;
	showConsole = DEBUGMODE;
	
	// Global Variables
	var physics;
	var player;
	
	gInput.addBool(KEY_LEFT, "left");
	gInput.addBool(KEY_UP, "up");
	gInput.addBool(KEY_RIGHT, "right");
	gInput.addBool(KEY_DOWN, "down");
	gInput.addBool(KEY_SPACE, "space");
	gInput.addBool(KEY_E, "E");
	gInput.addBool(KEY_ESC, "esc");
	
	initGame("recall");
	
	var pause = new State();
	pause.alwaysDraw = false;
	pause.alwaysUpdate = false;
	
	var game = new State();
	game.alwaysDraw = true;
	game.alwaysUpdate = false;
	physics = new b2.World(new b2.Vec2(0, 10), true);
	
	var chat = new State();
	chat.alwaysDraw = false;
	chat.alwaysUpdate = false;
	
	
	// Initiates all levels
	new StoryOne();
	new StoryTwo();
	new StoryThree();
	new LevelOne();
	new LevelTwo();
	new StoryFour();
	new LevelThree();
	new LevelFour();
	new LevelFive();
	
	game.init = function() {
		
		var listener = new b2.ContactListener();
		listener.BeginContact = beginContactListen;
		listener.EndContact = endContactListen;
		physics.SetContactListener(listener);
		
		if(DEBUGMODE) {
			CanvasDebugDraw._extend(b2.Draw);
			var debugDraw = new CanvasDebugDraw();
			debugDraw.context = ctx;
			debugDraw.scale = PHYSICS_SCALE;
			debugDraw.width = VIEWPORT_WIDTH;
			debugDraw.height = VIEWPORT_HEIGHT;
			debugDraw.SetFlags(b2.Draw.e_shapeBit | b2.Draw.e_jointBit);
			physics.SetDebugDraw(debugDraw);
		}
		
		println("World Initialized");
		
		player = CreatePlayer(00, 500);//TODO
		this.level = StoryOne();
		this.level.Construct();
	};
	
	game.world.update = function(d) {
		physics.Step(1/60, 10, 10);
		physics.ClearForces();
		
		if(player.state == PLAYER_STATE_NORMAL) {
			this.x = VIEWPORT_WIDTH / 2 - player.x;
			//this.y = VIEWPORT_HEIGHT * 0.75 - player.y;
		} else {
			var deltaX = (VIEWPORT_WIDTH / 5 - player.x) - this.x;
			var deltaY = (VIEWPORT_HEIGHT * 0.75 - player.y) - this.y;
			var accel = deltaX < VIEWPORT_WIDTH / 2 ? 10 : 1;
			this.x += deltaX / accel;
			this.y += deltaY / accel;
		}
				
		this.updateChildren(d);
	};
	
	game.world.draw = function(ctx) {
		if(DEBUGMODE) {
			physics.DrawDebugData();
			this.alpha = 0.5;
		}
		Sprite.prototype.draw.call(this, ctx);
	};
	
	States.push(game);
	
	println("Game Initialized");
	
	//
	// Level objects
	//
	
	/* LEVEL TEMPLATE
	function LEVEL_NAME_HERE() {
		if(arguments.callee._singletonInstance)
			return arguments.callee._singletonInstance;
		arguments.callee._singletonInstance = this;
		this.constructed = false;
		
		this.Construct = function() {
	  		if(this.constructed) return;
	  		this.fill = []; // Shouldn't need to use this after Rahil changes the wall size to reflect the image size
	  		this.floor = [];
	  		this.interactive = [];
	  		this.obstacle = [];
	  		this.scenery = [];
	  		
	  		this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  		this.constructed = true;
	  	};
	  	
	  	this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.fill.length; i++) this.fill[i].Destroy();
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacle.length; i++) this.obstacle[i].Destroy();
	  		for(var i = 0; i < this.scenery.length; i++) this.scenery[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
	 
	 */
	
	function StoryOne() {
		if (arguments.callee._singletonInstance)
	    return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	    	   
	   
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.floor = [];
	  		this.interactive = [];
	  		this.obstacle = [];
	  		this.scenery = [];
	  		
	  		var x = -400;
	  		for(var i=0; i<15; i++)
			{
				this.floor[i] = CreateFloorElement(x, 550, 100, 100, "", 0, false);
				x += 100;
			}
			
			/*var sensor = CreateWorldElement(150, 370, 100, 500,"", true, true, 400);
	        this.interactive.push(sensor);
	        sensor.Enter = function(){
   	    		States.push(chat);
   	    		this.dialogue = [];
				var text_image = CreateWorldElement(675,275, 173,225,"sprites/Right_text.png", false, false, 1);
				var text = CreateText(620,255, "Hey \n Bill");
				this.dialogue.push(text);
				States.current().world.addChild(this.dialogue[0]);
				chat.world.update = function(d) {
					if(gInput.E) States.pop();
				};
       	    };
	        sensor.update = function(d){
       		///SCENE DIALOGUE
       		///if(player.near){
       			//var i = 0;
				///end of chat section
				//}
	        };*/
	        
			var background = CreateWorldElement(250,400,1275,420,"sprites/Labratory.png", false, false, 3);
			this.scenery.push(background);
			var fore_desk = CreateWorldElement(300,500,442,214,"sprites/Labratory_bottom_desk.png", false, false,-1);
			this.scenery.push(fore_desk);
			//var text_image = CreateSprite(675,275, 173,225,"sprites/Right_text.png",100);
			//var text = CreateText(620,255, "Hey Bill");
			var left_door = CreateDoorElement(-335, 370, 72, 280, SPRITES["LEFT_DOOR"], 2, true);
			this.interactive.push(left_door);
			var middle_door = CreateDoorElement(252 , 360, 146, 210,SPRITES["MIDDLE_DOOR"], 2, false);
			this.interactive.push(middle_door);
			var right_door = CreateDoorElement(827, 370, 72, 280, SPRITES["RIGHT_DOOR"], 2, false);
			right_door.action = function() {
				States.current().level.Destruct();
				States.current().level = LevelOne(); ///change back to one after test
				States.current().level.Construct();
			};
       		this.interactive.push(right_door);
       		//DIALOGUE
       		/*chat.update = function(d) { //TODO, player in the air while chat is up
       			if(gInput.E){
       				//console.log(i);
       				States.pop();
       			}
       	    };
       		States.push(chat);
       		this.dialogue = [];
			var text_image = CreateWorldElement(675,275, 173,225,"sprites/Right_text.png", false, false, 1);
			var text = CreateText(620,255, "Hey \n Bill");
			this.dialogue.push(text);
			States.current().world.addChild(this.dialogue[0]);*/
       	    	
			this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  		this.constructed = true;
	  	};
	  	
	  	this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacle.length; i++) this.obstacle[i].Destroy();
	  		for(var i = 0; i < this.scenery.length; i++) this.scenery[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
    	
	function LevelOne() {
		if (arguments.callee._singletonInstance)
	    	return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  	
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.checkpoint = [];
	  		this.floor = [];
	  		this.fill = [];
	  		this.interactive = [];
	  		this.obstacles = [];
	  		////work after this
	  		var x = 100;
			var y = 450;
			var tracker = 0;
			var buildingLength = 0;
			var xbuild = 0;
			var xobstacle = 0;
			var obstacleCount = 0;
			var obstacle1offset = 210;
			var obstacle2offset = 300;
			var obstacle3offset = 230;
			var obstacle4offset = 238;
			var obstacle5offset = 220;
			
			this.checkpoint[0] = CreateCheckpoint(x, 200, true);
			
			//Floors
			//1
			x = 100;
			y = 450;
			tracker = 0;
			xbuild = 10;
			buildingLength = 10 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			
			//2
			tracker += 12;
			x += (183*xbuild) + 500;
			y = 450;
			xbuild = 8;
			buildingLength = 8 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			
			//3
			tracker += 10;
			x += (183*xbuild) + 500;
			y = 450;
			xbuild = 2;
			buildingLength = 2 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			
			//4
			tracker += 4;			
			x += (183*xbuild) + 500;
			y = 450;
			xbuild = 20;
			buildingLength = 20 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 4 obstacles
			xobstacle = 8500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, SPRITE_W["CONTAINER"], SPRITE_H["CONTAINER"], SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 1400;
			obstacleCount++;
			
			//5
			tracker += 22;
			x += (183*xbuild) + 500;
			y = 450;
			xbuild = 6;
			buildingLength = 6 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 5 obstacles
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, SPRITE_W["CONTAINER"], SPRITE_H["CONTAINER"], SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 1000;
			obstacleCount++;
			
			//6
			tracker += 8;
			x += (183*xbuild) + 500;
			y = 450;
			xbuild = 10;
			buildingLength = 10 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 6 obstacles
			xobstacle += 1300;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, SPRITE_W["DOOR"], SPRITE_H["DOOR"], SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			
			//7
			tracker += 12;
			x += (183*xbuild) + 500;
			y = 350;
			xbuild = 6;
			buildingLength = 6 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 7 obstacles
			xobstacle += 1450;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, SPRITE_W["DOOR"], SPRITE_H["DOOR"], SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			
			//8
			tracker += 8;
			x += (183*xbuild) + 500;
			y = 250;
			xbuild = 6;
			buildingLength = 6 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 8 obstacles
			xobstacle += 1500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle3offset, SPRITE_W["CHIMNEY"], SPRITE_H["CHIMNEY"], SPRITES["ROOF_CHIMNEY"], true, false, 0);
			obstacleCount++;
			
			//9
			tracker += 8;
			x += (183*xbuild) + 700;
			y = 450;
			xbuild = 10;
			buildingLength = 10 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 9 obstacle
			xobstacle += 2500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle3offset, SPRITE_W["CHIMNEY"], SPRITE_H["CHIMNEY"], SPRITES["ROOF_CHIMNEY"], true, false, 0);
			obstacleCount++;
			
			//10
			tracker += 12;
			x += (183*xbuild) + 500;
			y = 450;
			xbuild = 5;
			buildingLength = 5 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			
			//11
			tracker += 7;
			x += (183*xbuild) + 500;
			y = 300;
			xbuild = 5;
			buildingLength = 5 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 11 obstacles
			xobstacle += 3300;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, SPRITE_W["CONTAINER"], SPRITE_H["CONTAINER"], SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			
			//12
			tracker += 7;
			x += (183*xbuild) + 500;
			y = 475;
			xbuild = 7;
			buildingLength = 7 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			//floor 12 obstacles
			xobstacle += 2100;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, SPRITE_W["DOOR"], SPRITE_H["DOOR"], SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			
			//13
			tracker += 9;
			x += (183*xbuild) + 500;
			y = 450;
			xbuild = 10;
			buildingLength = 10 + tracker;
			makeBuilding.call(this, x, y, tracker, buildingLength);
			fillBuilding.call(this, x, y, tracker, buildingLength);
			
				        
			///////work before this
			this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  		this.constructed = true;
	  		player.checkpoint = this.checkpoint[0];
	  		player.body.SetTransform(player.checkpoint.body.GetPosition(), 0);
		};
		
		this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.fill.length; i++) this.fill[i].Destroy();
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacles.length; i++) this.obstacles[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
	
	function StoryTwo() {
		if (arguments.callee._singletonInstance)
	    return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.floor = [];
	  		this.interactive = [];
	  		var x = -400;
	  		for(var i=0; i<15; i++)
			{
				this.floor[i] = CreateFloorElement(x, 550, 100, 100, "", 0, false);
				x += 100;
			}
			
			var background = CreateSprite(400,400,1055.33,560,"sprites/Office.png", 500);
		    var boss = CreateSprite(550,440,900,582,"sprites/boss.png",100);
		    this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  	    this.constructed = true;
	  	    player.body.SetTransform(new b2.Vec2(300/PHYSICS_SCALE,475/PHYSICS_SCALE), 0);
	  	};	
	};
	
	function StoryThree() {//TODO
		if (arguments.callee._singletonInstance)
	    return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.floor = [];
	  		this.interactive = [];
	  		var x = -400;
	  		for(var i=0; i<15; i++)
			{
				this.floor[i] = CreateFloorElement(x, 550, 100, 100, "", 0, false);
				x += 100;
			}
			
			var background = CreateSprite(250,400,1275,420,"sprites/Labratory.png", 500);
			var fore_desk = CreateSprite(300,500,442,214,"sprites/Labratory_bottom_desk.png",-9995);
			var right_door = CreateSprite(828, 370, 825, 942, "sprites/Right_door.png", 400);
			var left_door = CreateSprite(-337, 362, 825, 942, "sprites/Left_door.png", 400);
			var middle_door = CreateSprite(250 , 362, 925, 1042,"sprites/Middle_door.png", 400);
			var female = CreateSprite(100,450,900,582,"sprites/female_teammate.png",400);
			var male = CreateSprite(400,475,900,582,"sprites/male_teammate.png",400);
		    this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  	    this.constructed = true;
	  	    player.body.SetTransform(new b2.Vec2(275/PHYSICS_SCALE,475/PHYSICS_SCALE), 0);
	  	};	
	};
	
	function LevelTwo() {
		if (arguments.callee._singletonInstance)
	    	return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  	
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.checkpoint = [];
	  		this.floor = [];
	  		this.fill = [];
	  		this.interactive = [];
	  		this.obstacles = [];
	  		////work after this
	  		var x = 100;
			var y = 450;
			var tracker = 0;
			var buildingLength = tracker;
			var xobstacle;
			var obstacleCount = 0;
			var obstacle1offset = 210;
			var obstacle2offset = 300;
			var obstacle3offset = 230;
			var obstacle4offset = 238;
			var obstacle5offset = 220;
	  		
			
			//FLOOR 1///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +40;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 1 obstacles
			xobstacle = 1198;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 1830;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			//END FLOOR1//////////////////////////////////////////////////////////////////
			
			y = 550;
			//FLOOR 2///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 2 obstacles
			xobstacle += 2500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle3offset, 73, 108, SPRITES["ROOF_CHIMNEY"], true, false, 0);
			xobstacle += 500;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle1offset, 155, 113, SPRITES["ROOF_AC"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			//END FLOOR2//////////////////////////////////////////////////////////////////
			
			y= 500;
			//FLOOR 3///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +60;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 3 obstacles
			xobstacle += 915;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 880;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			//END FLOOR3//////////////////////////////////////////////////////////////////
			
			y = 450;
			//FLOOR 4///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 4 obstacles
			xobstacle += 915;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle1offset, 155, 113, SPRITES["ROOF_AC"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			//END FLOOR4//////////////////////////////////////////////////////////////////
			
			y = 500;
			//FLOOR 5///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 5 obstacles
			xobstacle += 915;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			//END FLOOR5//////////////////////////////////////////////////////////////////
			
			y = 550;
			//FLOOR 6///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 6 obstacles
			//END FLOOR6//////////////////////////////////////////////////////////////////
			
			y = 600;
			//FLOOR 7///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//END FLOOR7//////////////////////////////////////////////////////////////////
			
			
			y = 450;
			//FLOOR 8///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +20;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 8 obstacles
			xobstacle += 1830;
			xobstacle += 1830;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle3offset, 73, 108, SPRITES["ROOF_CHIMNEY"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle1offset, 155, 113, SPRITES["ROOF_AC"], true, false, 0);
			xobstacle += 915;
			obstacleCount++;
			//END FLOOR8//////////////////////////////////////////////////////////////////
			
			
			//OBJ
	        door = CreateRunnerElement(400, 218, 80, 100, "sprites/door.png", true, true, 0);
	        door.action = printWords;//give it a function if the player interacts
	        this.interactive.push(door);
	        
			///////work before this
			this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  		this.constructed = true;
	  		player.body.SetTransform(new b2.Vec2(400/PHYSICS_SCALE,100/PHYSICS_SCALE), 0);
		};
		
		this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.fill.length; i++) this.fill[i].Destroy();
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacles.length; i++) this.obstacles[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
	
	function StoryFour(){
		if (arguments.callee._singletonInstance)
	    return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  
	  	this.Construct = function() {//TODO
	  		if(this.constructed) return;
	  		this.floor = [];
	  		this.interactive = [];
	  		this.obstacle = [];
	  		
	  		var x = -400;
	  		for(var i=0; i<15; i++)
			{
				this.floor[i] = CreateFloorElement(x, 550, 100, 100, "", 0, false);
				x += 100;
			}
			
			var background = CreateSprite(250,400,1275,420,"sprites/Hallway.png", 500);
			var left_door = CreateSprite(-337, 362, 825, 942, "sprites/Left_door.png", 400);
			var right_door = CreateWorldElement(828, 370, 825, 942, "sprites/Right_door.png", true, true, 400);
			right_door.action = function() {
				States.current().level.Destruct();
				States.current().level = StoryThree();
				States.current().level.Construct();
				States.current().world.removeChild(background);
			};
       		this.interactive.push(right_door);
			
			this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  		this.constructed = true;
	  		player.body.SetTransform(new b2.Vec2(-100/PHYSICS_SCALE,475/PHYSICS_SCALE), 0);
	  	};
	  	
	  	this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.checkpoint.length; i++) this.checkpoint[i].Destroy();
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacle.length; i++) this.obstacle[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
	
	function LevelThree() {
		if (arguments.callee._singletonInstance)
	    	return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  	
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.checkpoint = [];
	  		this.floor = [];
	  		this.fill = [];
	  		this.interactive = [];
	  		this.obstacles = [];
	  		////work after this
	  		var x = 100;
			var y = 350;
			var tracker = 0;
			var buildingLength = tracker;
			var xobstacle;
			var obstacleCount = 0;
			var obstacle1offset = 210;
			var obstacle2offset = 300;
			var obstacle3offset = 230;
			var obstacle4offset = 238;
			var obstacle5offset = 220;
	  		
			
			//FLOOR 1///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x-10, y, 210, 371, SPRITES["LEFT_WALL"], 0, true);
	  		this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				this.fill[i] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x+10, y, 210, 371, SPRITES["RIGHT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 383;
			///////////////////////////////////////////////////////////////////////////
			
			y = 700;
			//FLOOR 2///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 2 obstacles
			xobstacle = 3500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			xobstacle += 1200;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle1offset, 155, 113, SPRITES["ROOF_AC"], true, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			y = 550;
			//FLOOR 3///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 550;
			//floor 3 obstacles
			xobstacle += 1500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			xobstacle += 2550;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 4///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 200;
			//floor 4 obstacles
			xobstacle += 1500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			y = 400;
			//FLOOR 5///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x-10, y, 210, 371, SPRITES["LEFT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				this.fill[i] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x+10, y, 210, 371, SPRITES["RIGHT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 200;
			//floor 5 obstacles
			xobstacle += 700;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle5offset, 86, 72, "sprites/rooftop_crate.png", false, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			y = 550;
			//FLOOR 6///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +7;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 200;
			///////////////////////////////////////////////////////////////////////////
			
			y = 400;
			//FLOOR 7///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x-10, y, 210, 371, SPRITES["LEFT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				this.fill[i] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x+10, y, 210, 371, SPRITES["RIGHT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 583;
			//floor 7 obstacles
			xobstacle += 3000;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			xobstacle += 800;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			xobstacle += 900;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle5offset, 86, 72, "sprites/rooftop_crate.png", false, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			y = 800;
			//FLOOR 8///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 200;
			//floor 8 obstacles
			xobstacle += 3000;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle1offset, 155, 113, SPRITES["ROOF_AC"], true, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			
			y = 635;
			//FLOOR 9///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +6;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 583;
			///////////////////////////////////////////////////////////////////////////
			
			//PART 2 OF SKETCH//////////////////////////////////////////////////////////
			
			
			//FLOOR 10///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 583;
			///////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 11///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 583;
			///////////////////////////////////////////////////////////////////////////
			
			 y = 700;
			//FLOOR 12///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 483;
			//floor 12 obstacles
			xobstacle += 5000;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;

			///////////////////////////////////////////////////////////////////////////
			
			y = 750;
			//FLOOR 13///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 400;
			//floor 13 obstacles
			xobstacle += 950;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			xobstacle += 600;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle5offset, 86, 72, "sprites/rooftop_crate.png", false, false, 0);
			obstacleCount++;
			xobstacle += 1200;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle1offset, 155, 113, SPRITES["ROOF_AC"], true, false, 0);
			obstacleCount++;
			xobstacle += 600;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			y = 600;
			//FLOOR 14///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 14 obstacles
			xobstacle += 1800;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			xobstacle += 700;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			y = 500;
			//FLOOR 15//////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor 15 obstacles
			xobstacle += 1000;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle5offset, 86, 72, "sprites/rooftop_crate.png", false, false, 0);
			obstacleCount++;
			xobstacle += 1000;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			///////////////////////////////////////////////////////////////////////////
			
			y = 350;
			//FLOOR 16///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x-10, y, 210, 371, SPRITES["LEFT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +15;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				this.fill[i] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x+10, y, 210, 371, SPRITES["RIGHT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 383;
			///////////////////////////////////////////////////////////////////////////
			
			
			//OBJ
	        door = CreateRunnerElement(400, 140, 80, 100, "sprites/door.png", true, true, 0);
	        door.action = printWords;//give it a function if the player interacts
	        this.interactive.push(door);
	        
			///////work before this
			this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  		this.constructed = true;
	  		player.body.SetTransform(new b2.Vec2(400/PHYSICS_SCALE,140/PHYSICS_SCALE), 0);
		};
		
		this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.fill.length; i++) this.fill[i].Destroy();
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacles.length; i++) this.obstacles[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
	
	function LevelFour() {
		if (arguments.callee._singletonInstance)
	    	return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  	
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.floor = [];
	  		this.fill = [];
	  		this.interactive = [];
	  		this.obstacle = [];
	  		////work after this
	  		var x = 100;
			var y = 450;
			var tracker = 0;
			var buildingLength = tracker;
			var xobstacle;
			var obstacleCount = 0;
			var obstacle1offset = 210;
			var obstacle2offset = 300;
			var obstacle3offset = 230;
			var obstacle4offset = 238;
			var obstacle5offset = 220;
			
			
			//FLOOR 1///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x-10, y, 210, 371, SPRITES["LEFT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				this.fill[i] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x+10, y, 210, 371, SPRITES["RIGHT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
	  		
			y= 550; 
			//FLOOR 2///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle = 3200;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 3///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 200;
			//floor obstacles
			xobstacle += 1600;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			y =600;
			//FLOOR 4///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +3;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 5///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 2400;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			xobstacle += 500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			y = 500;
			//FLOOR 6///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 7///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 3715;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle5offset, 86, 72, "sprites/rooftop_crate.png", false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			y = 550;
			//FLOOR 8///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +2;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			y = 600;
			//FLOOR 9///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 1190;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle3offset, 73, 108, SPRITES["ROOF_CHIMNEY"], true, false, 0);
			obstacleCount++;
			xobstacle += 1233;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle3offset, 73, 108, SPRITES["ROOF_CHIMNEY"], true, false, 0);
			obstacleCount++;
			
			////////////////////////////////////////////////////////////////////////////
			
			y = 650;
			//FLOOR 10///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +4;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 850;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			
			y = 700;
			//FLOOR 11///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +6;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 1170;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			xobstacle += 470;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle4offset, 147, 142, SPRITES["ROOF_DOOR"], true, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			y = 600;
			//FLOOR 12///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +3;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 13///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +3;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 2500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			y = 500;
			//FLOOR 14///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +7;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			y = 550;
			//FLOOR 15///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 2800;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			y = 600;
			//FLOOR 16///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			y = 650;
			//FLOOR 17///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +4;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 200;
			//floor obstacles
			xobstacle += 2925;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle2offset, 211, 246, SPRITES["ROOF_CONTAINER"], false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			y = 525;
			//FLOOR 18///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			y = 500;
			//FLOOR 19///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +2;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			y = 450;
			//FLOOR 20///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x-10, y, 210, 371, SPRITES["LEFT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +2;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				this.fill[i] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x+10, y, 210, 371, SPRITES["RIGHT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 21///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x-10, y, 210, 371, SPRITES["LEFT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				this.fill[i] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x+10, y, 210, 371, SPRITES["RIGHT_WALL"], 0, true);
			this.fill[tracker] = CreateFloorElement(x, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 383;
			//floor obstacles
			xobstacle += 5500;
			this.obstacles[obstacleCount] = CreateRunnerElement(xobstacle, y-obstacle5offset, 86, 72, "sprites/rooftop_crate.png", false, false, 0);
			obstacleCount++;
			////////////////////////////////////////////////////////////////////////////
			
			
			
			
			
			//OBJ
	        door = CreateRunnerElement(400, 218, 80, 100, "sprites/door.png", true, true, 0);
	        door.action = printWords;//give it a function if the player interacts
	        this.interactive.push(door);
	        
			///////work before this
			this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
	  		this.constructed = true;
	  		player.body.SetTransform(new b2.Vec2(400/PHYSICS_SCALE,100/PHYSICS_SCALE), 0);
		};
		
		this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.fill.length; i++) this.fill[i].Destroy();
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacles.length; i++) this.obstacles[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
	
	function LevelFive() {
		if (arguments.callee._singletonInstance)
	    	return arguments.callee._singletonInstance;
	  	arguments.callee._singletonInstance = this;
	  	this.constructed = false;
	  	
	  	this.Construct = function() {
	  		if(this.constructed) return;
	  		this.floor = [];
	  		this.fill = [];
	  		this.interactive = [];
	  		this.obstacles = [];
	  		////work after this
	  		var x = 100;
			var y = 200;
			var tracker = 0;
			var buildingLength = tracker;
			var xobstacle;
			var obstacleCount = 0;
			var obstacle1offset = 210;
			var obstacle2offset = 300;
			var obstacle3offset = 230;
			var obstacle4offset = 238;
			var obstacle5offset = 220;
	  		
			
			//FLOOR 1///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +7;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 2///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 3///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 4///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 5///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 6///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 7///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 8///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 9///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 10///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 11///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +3;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 12///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +2;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 13///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +3;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 14///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +3;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 15///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 16///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 17///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +1;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 18///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 19///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 20///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 21///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +5;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 22///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +4;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 23///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +4;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 24///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 25///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +3;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 26///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +2;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			//FLOOR 27///////////////////////////////////////////////////////////////////
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			buildingLength = tracker +10;
			for(var i=tracker; i<buildingLength; i++) //middle
			{
				this.floor[i] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
				tracker++;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
			x += 383;
			//floor obstacles
			
			////////////////////////////////////////////////////////////////////////////
			
			
			
			
			
			//OBJ
	        door = CreateRunnerElement(400, 0, 80, 100, "sprites/door.png", true, true, 0);
	        door.action = printWords;//give it a function if the player interacts
	        this.interactive.push(door);
	        
			///////work before this
			this.width = this.floor[0].width/2 + this.floor[this.floor.length-1].x - this.floor[0].x + this.floor[this.floor.length-1].width/2;
			this.width += 600;
	  		this.constructed = true;
	  		player.body.SetTransform(new b2.Vec2(400/PHYSICS_SCALE,10/PHYSICS_SCALE), 0);
		};
		
		this.Destruct = function() {
	  		if(!this.constructed) return;
	  		for(var i = 0; i < this.checkpoint.length; i++) this.checkpoint[i].Destroy();
	  		for(var i = 0; i < this.fill.length; i++) this.fill[i].Destroy();
	  		for(var i = 0; i < this.floor.length; i++) this.floor[i].Destroy();
	  		for(var i = 0; i < this.interactive.length; i++) this.interactive[i].Destroy();
	  		for(var i = 0; i < this.obstacle.length; i++) this.obstacle[i].Destroy();
	  		this.width = 0;
	  		this.constructed = false;
	  	};
	}
	
	
	
	
	
	//////////////////////////////////////
	// Function definitions
	//
	
	//
	// Event that triggers when any contact begins
	//////////////////////////////////////
	function beginContactListen(contact) {
		var fixtureA = contact.GetFixtureA();
		var fixtureB = contact.GetFixtureB();
		if(fixtureA.IsSensor() && fixtureB.IsSensor()) return;
		if(fixtureA == player.foot || fixtureB == player.foot) {
			player.foot.numContacts++;
			return;
		}
		if(fixtureA == player.climbUpper || fixtureB == player.climbUpper) {
			player.climbUpper.numContacts++;
			return;
		}
		if(fixtureA == player.climbMiddle || fixtureB == player.climbMiddle) {
			player.climbMiddle.numContacts++;
			return;
		}
		if(fixtureA == player.climbLower || fixtureB == player.climbLower) {
			player.climbLower.numContacts++;
			return;
		}
		var objectA = fixtureA.GetBody().GetUserData();
		var objectB = fixtureB.GetBody().GetUserData();
		if(objectA == player || objectB == player) {
			var other;
			if(objectA == player) other = objectB;
			if(objectB == player) other = objectA;
			//OBJ
			var interactives = States.current().level.interactive;
			if(interactives.indexOf(other) != -1) {
				player.near = true;
				player.interact = other;
				println("near");
				if(other.Enter) other.Enter();
			}
	        /////
	        if(other.type == "checkpoint") player.checkpoint = other;
	        if(other.fixture.IsSensor()) return;
         	var position = player.body.GetPosition();
         	var end = new b2.Vec2(position.x, position.y + 5);
         	var ray = new b2.RayCastCallback();
			ray.ReportFixture = RayCallback;
			player.aboveGround = false;
			physics.RayCast(ray, position, end);
         	if(player.y > other.y - player.height && player.onGround && player.aboveGround) {
         		/*var direction = 1;
         		if(player.x < other.x) direction = -1;
				var deltaVelocity = (direction * player.maxSpeed);
				position.x += direction * .5;
				var impulse = new b2.Vec2(player.body.GetMass() * deltaVelocity, player.body.GetMass() * -2);
				player.body.SetLinearVelocity(new b2.Vec2(0, 0));
				player.body.SetTransform(position, 0);
				player.body.ApplyLinearImpulse(impulse, player.body.GetWorldCenter(), true);*/
         	}
      	}
	}
	
	//
	// Event triggers when any contacts end
	//
	function endContactListen(contact) {
		var fixtureA = contact.GetFixtureA();
		var fixtureB = contact.GetFixtureB();
		if(fixtureA.IsSensor() && fixtureB.IsSensor()) return;
		if(fixtureA == player.foot || fixtureB == player.foot) {
			player.foot.numContacts--;
		}
		if(fixtureA == player.climbUpper|| fixtureB == player.climbUpper) {
			player.climbUpper.numContacts--;
		}
		if(fixtureA == player.climbMiddle|| fixtureB == player.climbMiddle) {
			player.climbMiddle.numContacts--;
		}
		if(fixtureA == player.climbLower || fixtureB == player.climbLower) {
			player.climbLower.numContacts--;
		}
		var objectA = fixtureA.GetBody().GetUserData();
		var objectB = fixtureB.GetBody().GetUserData();
		if(objectA == player || objectB == player) {
			var other;
			if(objectA == player) other = objectB;
			if(objectB == player) other = objectA;
			var interactives = States.current().level.interactive;
			if(interactives.indexOf(other) != -1) {
				player.near = false;
				player.interact = undefined;
				println("away");
				if(other.Exit) other.Exit();
			}
		}	
	}
	
	//
	// Ray cast callback function
	//
	function RayCallback(fixture, point, normal, fraction) {
		if(fixture == player.foot) return -1;
		player.aboveGround = true;
		return 0;
	}
	
	//
	// CreateSprite - function to create a basic sprite to be displayed
	//
	function CreateSprite(x, y, width, height, image, index) {
		var sprite = new Sprite();
		sprite.x = x;
		sprite.y = y;
		sprite.width = width;
		sprite.height = height;
		sprite.offsetX = -width/2;
		sprite.offsetY = -height/2;
		sprite.image = Textures.load(image);
		sprite.index = index;
		States.current().world.addChild(sprite);
		return sprite;
	}
	
	//
	// CreateText - function to create a basic text to be displayed
	//
	function CreateText(x, y, text) {
		var Text = new TextBox();
		Text.x = x;
		Text.y = y;
		Text.fontSize = 32;
		Text.text = text;
		//States.current().world.addChild(Text);
		return Text;
	}
	
	//
	// CreatePlayer - creates the player sprite, physics body, and update functions
	//
	function CreatePlayer(x, y) {
		var player = CreateSprite(x, y, PLAYER_WIDTH_STANDING, PLAYER_HEIGHT_STANDING, "sprites/player_walk_cycle.png", 0);
		CreateNormalAnimation(player);
		player.offsetY = -player.height;
		player.onGround = true;
		player.aboveGround = true;
		player.near = false;//check for whether or not the player is near an interactable obj
		
		var bodyDef = new b2.BodyDef();
		bodyDef.type = b2.Body.b2_dynamicBody;
		bodyDef.position.Set(player.x / PHYSICS_SCALE, (player.y - PLAYER_HEIGHT_RUNNING / 2) / PHYSICS_SCALE);
		player.body = physics.CreateBody(bodyDef);
		
		// Creates the foot sensor
		var fixDef = CreateFixtureDef(0, 0, 0);
		fixDef.shape = new b2.PolygonShape();
		fixDef.shape.SetAsBox(PLAYER_WIDTH_RUNNING / 2.1 / PHYSICS_SCALE, 15 / PHYSICS_SCALE, new b2.Vec2(0, PLAYER_HEIGHT_RUNNING / 2 / PHYSICS_SCALE), 0);
		player.foot = player.body.CreateFixture(fixDef);
		player.foot.SetSensor(true);
		player.foot.numContacts = 0;
		
		// Creates the climb sensors
		fixDef.shape.SetAsBox(5 / PHYSICS_SCALE, 5 / PHYSICS_SCALE, new b2.Vec2(PLAYER_WIDTH_RUNNING / 1.8 / PHYSICS_SCALE, -PLAYER_HEIGHT_RUNNING / 1.2 / PHYSICS_SCALE), 0);
		player.climbUpper = player.body.CreateFixture(fixDef);
		player.climbUpper.SetSensor(true);
		player.climbUpper.numContacts = 0;
		
		fixDef.shape.SetAsBox(5 / PHYSICS_SCALE, 5 / PHYSICS_SCALE, new b2.Vec2(PLAYER_WIDTH_RUNNING / 1.8 / PHYSICS_SCALE, -PLAYER_HEIGHT_RUNNING / 4 / PHYSICS_SCALE), 0);
		player.climbMiddle = player.body.CreateFixture(fixDef);
		player.climbMiddle.SetSensor(true);
		player.climbMiddle.numContacts = 0;
		
		fixDef.shape.SetAsBox(5 / PHYSICS_SCALE, 5 / PHYSICS_SCALE, new b2.Vec2(PLAYER_WIDTH_RUNNING / 1.8 / PHYSICS_SCALE, PLAYER_HEIGHT_RUNNING / 2 / PHYSICS_SCALE), 0);
		player.climbLower = player.body.CreateFixture(fixDef);
		player.climbLower.SetSensor(true);
		player.climbLower.numContacts = 0;
		
		CreateStandingFixture(player);
		
		player.body.SetUserData(player);
		player.body.SetFixedRotation(true);
		
		player.state = PLAYER_STATE_NORMAL;
		player.maxSpeed = PLAYER_WALK_SPEED;
		player.dashing = false;
		player.sliding = false;
		player.cooldown = 0;
		player.latency = 0;
		player.update = function(d) { 
			// Move the sprite according to the physics body
			var pos = this.body.GetPosition();
			this.x = pos.x * PHYSICS_SCALE;
			this.y = pos.y * PHYSICS_SCALE + this.height / 2;
			this.rotation = this.body.GetAngle();
			if(this.y > VIEWPORT_HEIGHT + this.height / 2) this.Respawn();
			if(this.climbMiddle.numContacts > 0 && this.onGround) this.Respawn();
			//OBJ
			if(this.near && gInput.E && this.latency < 0){
				this.latency = 15;
				if(this.interact.action) this.interact.action();
				//println("E");
			} 
			//
			// Movement code
			var velocity = this.body.GetLinearVelocity();
			this.latency--;
			this.cooldown--;
			this.onGround = this.foot.numContacts > 0;
			this.climbing = !this.climbing && this.climbMiddle.numContacts > 0 && this.climbUpper.numContacts == 0;
			if(this.climbing) this.state = PLAYER_STATE_CLIMBING;
			switch(this.state) {
				case PLAYER_STATE_NORMAL:
					if(this.onGround) {
						if(gInput.right) {
							var deltaVelocity = this.maxSpeed - velocity.x;
							var impulse = new b2.Vec2(this.body.GetMass() * deltaVelocity, 0);
							this.body.ApplyLinearImpulse(impulse, this.body.GetWorldCenter(), true);
							player.animation = "walk";
							this.scaleX = 1;
							this.frameRate = 3;
						}
						if(gInput.left) {
							var deltaVelocity = -this.maxSpeed - velocity.x;
							var impulse = new b2.Vec2(this.body.GetMass() * deltaVelocity, 0);
							this.body.ApplyLinearImpulse(impulse, this.body.GetWorldCenter(), true);
							player.animation = "walk";
							this.scaleX = -1;
							this.frameRate = 3;
						}
						if(!gInput.right && !gInput.left) {
							player.animation = "idle";
							this.frameRate = 1;
						}
						if(gInput.space) {
							this.state = PLAYER_STATE_RUNNER;
							this.maxSpeed = PLAYER_RUN_SPEED;
							CreateRunnerAnimation(this);
							this.body.DestroyFixture(this.fixture);
							CreateRunningFixture(this);
						}
					}
					break;
				case PLAYER_STATE_RUNNER:
					if(this.onGround) {
						var deltaVelocity = this.maxSpeed - velocity.x;
						var impulse = new b2.Vec2(this.body.GetMass() * deltaVelocity, 0);
						this.body.ApplyLinearImpulse(impulse, this.body.GetWorldCenter(), true);
						if(gInput.right && !this.dashing && this.cooldown < 0) {
							this.dashing = true;
							this.maxSpeed = PLAYER_DASH_SPEED;
							this.cooldown = PLAYER_DASH_DURATION;
							this.frameRate = this.maxSpeed / PLAYER_RUN_SPEED * 7.5;
						}
						if(this.dashing && this.cooldown < PLAYER_DASH_DURATION / 2) {
							var deltaMax = PLAYER_RUN_SPEED - this.maxSpeed;
							this.maxSpeed += deltaMax / PLAYER_DASH_DURATION;
							this.frameRate = this.maxSpeed / PLAYER_RUN_SPEED * 7.5;
							if(Math.abs(deltaMax) < .25) {
								this.maxSpeed = PLAYER_RUN_SPEED;
								this.dashing = false;
								this.cooldown = 15;
								this.frameRate = 7.5;
							}
						}
						if(gInput.up && !this.sliding && this.latency < 0) {
							this.onGround = false;
							this.latency = 15;
							var deltaVelocity = velocity.y - 6;
							var impulse = new b2.Vec2(0, this.body.GetMass() * deltaVelocity);
							this.body.ApplyLinearImpulse(impulse, this.body.GetWorldCenter(), true);
						}
						if(gInput.down && !this.sliding && this.cooldown < 0) {
							this.body.DestroyFixture(this.fixture);
							CreateSlidingFixture(this);
							this.sliding = true;
							this.cooldown = PLAYER_SLIDE_DURATION;
						} else if(!gInput.down && this.sliding || this.cooldown < 0) {
							this.body.DestroyFixture(this.fixture);
							CreateRunningFixture(this);
							this.sliding = false;
							this.cooldown = 15;
						}
					}
					break;
				case PLAYER_STATE_CLIMBING:
					var deltaVelocity = -2 - velocity.y;
					var impulse = new b2.Vec2(this.body.GetMass() * 1, this.body.GetMass() * deltaVelocity);
					this.body.ApplyLinearImpulse(impulse, this.body.GetWorldCenter(), true);
					if(this.climbLower.numContacts == 0) {
						this.state = PLAYER_STATE_RUNNER;
						this.body.ApplyLinearImpulse(new b2.Vec2(this.body.GetMass() * 1, 0), this.body.GetWorldCenter(), true);
					}
					break;
			}
		};
		
		player.Respawn = function() {
			pos = this.checkpoint.body.GetPosition();
			this.body.SetTransform(pos, 0);
		};
		return player;
	}
	
	function CreateNormalAnimation(sprite) {
		for(name in sprite.animations) sprite.animations[name] = null;
		sprite.image = Textures.load(SPRITES["PLAYER_WALK"]);
		sprite.frame = 0;
		sprite.frameHeight = 240;
		sprite.frameWidth = 150;
		sprite.frameCount = 7;
		sprite.frameRate = 1;
		sprite.addAnimation("idle", 0, 3);
		sprite.addAnimation("walk", 3, 4);
		sprite.animation = "idle";
	}
	
	function CreateRunnerAnimation(sprite) {
		for(name in sprite.animations) sprite.animations[name] = null;
		sprite.image = Textures.load(SPRITES["PLAYER_RUN"]);
		sprite.frame = 0;
		sprite.frameHeight = 220;
		sprite.frameWidth = 275;
		sprite.frameCount = 6;
		sprite.frameRate = 7.5;
		//sprite.addAnimation("run", 0, 6);
		//sprite.animation = "run";
	}
	
	//
	// CreateRunningFixture - creates the standing body for player
	//
	function CreateStandingFixture(sprite) {
		sprite.width = PLAYER_WIDTH_STANDING;
		sprite.height = PLAYER_HEIGHT_STANDING;
		sprite.offsetX = -sprite.width / 2;
		sprite.offsetY = -sprite.height;
		var fixDef = CreateFixtureDef(10.0, 1.0, 0);
		var scaled_width = sprite.width / PHYSICS_SCALE;
		var scaled_height = sprite.height / PHYSICS_SCALE;
		fixDef.shape = new b2.PolygonShape();
		fixDef.shape.SetAsBox(scaled_width / 2, scaled_height / 2);
		sprite.fixture = sprite.body.CreateFixture(fixDef);
	}
	
	//
	// CreateRunningFixture - creates the running body for player
	//
	function CreateRunningFixture(sprite) {
		sprite.width = PLAYER_WIDTH_RUNNING;
		sprite.height = PLAYER_HEIGHT_RUNNING;
		sprite.offsetX = -sprite.width / 2;
		sprite.offsetY = -sprite.height;
		var fixDef = CreateFixtureDef(10.0, 1.0, 0);
		var scaled_width = sprite.width / PHYSICS_SCALE;
		var scaled_height = sprite.height / PHYSICS_SCALE;
		fixDef.shape = new b2.PolygonShape();
		fixDef.shape.SetAsBox(scaled_width / 2, scaled_height / 2);
		sprite.fixture = sprite.body.CreateFixture(fixDef);
	}
	
	//
	// CreateSlidingFixture - creates the sliding body for player
	//
	function CreateSlidingFixture(sprite) {
		sprite.width = PLAYER_WIDTH_SLIDING;
		sprite.height = PLAYER_HEIGHT_SLIDING;
		sprite.offsetX = -sprite.width / 2;
		sprite.offsetY = -sprite.height;
		var fixDef = CreateFixtureDef(10.0, 1.0, 0);
		var scaled_width = sprite.width / PHYSICS_SCALE;
		var scaled_height = sprite.height / PHYSICS_SCALE;
		fixDef.shape = new b2.PolygonShape();
		fixDef.shape.SetAsBox(scaled_width / 2, scaled_height / 2);
		sprite.fixture = sprite.body.CreateFixture(fixDef);
	}
	
	//
	// CreateWorldElement - creates a world element that is always there
	// 						float x, float y, float width, float height, image, bool solid, bool sensor, int index
	//						Note: Sensor can't be true and not be solid
	//						Note: Use this for creating hub worlds (i.e. non runner levels)
	//
	function CreateWorldElement(x, y, width, height, image, solid, sensor, index) {
		var element = CreateSprite(x, y, width, height, image, index);
		if(solid) ApplyRectBBox(element, b2.Body.b2_staticBody, 1.0, 1, 0);
		if(sensor && solid) element.fixture.SetSensor(true);
		element.Destroy = function() {
			if(typeof(this.body) !== "undefined") physics.DestroyBody(this.body);
			States.current().world.removeChild(this);
		};
		return element;
	}
	
	//
	// CreateRunnerElement - creates a world element that will spawn and despawn based on visibility
	// 						float x, float y, float width, float height, image, bool solid, bool sensor, int index
	//						Note: Sensor can't be true and not be solid
	//
	function CreateRunnerElement(x, y, width, height, image, solid, sensor, index) {
		var element = CreateSprite(x, y, width, height, image, index);
		if(solid) ApplyRectBBox(element, b2.Body.b2_staticBody, 1.0, 1, 0);
		if(sensor && solid) element.fixture.SetSensor(true);
		element.update = function(d) {
			var xpos = this.x + States.current().world.x;
			if(xpos + this.width/2 < -States.current().level.width / 2) {
				this.x += States.current().level.width;
				if(typeof(this.body) !== "undefined") {
					var pos = this.body.GetPosition();
					pos.x += States.current().level.width / PHYSICS_SCALE;
					this.body.SetTransform(pos, 0);
				}
			}
			if(xpos - this.width/2 > States.current().level.width / 2) {
				this.x -= States.current().level.width;
				if(typeof(this.body) !== "undefined") {
					var pos = this.body.GetPosition();
					pos.x -= States.current().level.width / PHYSICS_SCALE;
					this.body.SetTransform(pos, 0);
				}
			}
		};
		if(typeof(this.body) !== "undefined") {
			element.Destroy = function() {
				physics.DestroyBody(this.body);
				States.current().world.removeChild(this);
			};
		}
		return element;
	}
	
	//
	// CreateFloorElement - creates a world element, if respawn is true, when it goes offscreen, it will be moved
	//						to create and infinite level
	// 						NOTE: Defines a different type of shape for floor tiles
	//
	function CreateFloorElement(x, y, width, height, image, index, respawn) {
		var element = CreateSprite(x, y, width, height, image, index);
		var fixDef = CreateFixtureDef(1.0, 1, 0);
		var scaled_width = width / PHYSICS_SCALE;
		var scaled_height = height / PHYSICS_SCALE;
		fixDef.shape = new b2.ChainShape();
		var vertices = [];
		vertices.push(new b2.Vec2(-scaled_width / 2, -scaled_height / 2));
		vertices.push(new b2.Vec2(scaled_width / 2, -scaled_height / 2));
		vertices.push(new b2.Vec2(scaled_width / 2, scaled_height / 2));
		vertices.push(new b2.Vec2(-scaled_width / 2, scaled_height / 2));
		fixDef.shape.CreateLoop(vertices, 4);
		ApplyBBox(element, b2.Body.b2_staticBody, fixDef);
		if(respawn) {
			element.update = function(d) {
				var xpos = this.x + States.current().world.x;
				if(xpos + this.width/2 < -States.current().level.width / 2) {
					this.x += States.current().level.width;
					var pos = this.body.GetPosition();
					pos.x += States.current().level.width / PHYSICS_SCALE;
					this.body.SetTransform(pos, 0);
				}
				if(xpos - this.width/2 > States.current().level.width / 2) {
					this.x -= States.current().level.width;
					var pos = this.body.GetPosition();
					pos.x -= States.current().level.width / PHYSICS_SCALE;
					this.body.SetTransform(pos, 0);
				}
			};
		}
		element.Destroy = function() {
			physics.DestroyBody(this.body);
			States.current().world.removeChild(this);
		};
		return element;
	}
	
	//
	// CreateDoorElement - creates a door element that opens and closes when player is near
	//                     NOTE: Always a sensor
	//
	function CreateDoorElement(x, y, width, height, image, index, locked) {
		var door = CreateWorldElement(x, y, width, height, image, true, true, index);
		if(image == SPRITES["MIDDLE_DOOR"]) {
			door.frameWidth = 500;
			door.frameHeight = 750;
			door.frameCount = 6;
			door.frameRate = 0;
		} else {
			door.frameWidth = 300;
			door.frameHeight = 1120;
			door.frameCount = 5;
			door.frameRate = 0;
		}
		if(!locked) {
			door.update = function(d) {
				if(this.frameRate > 0 && Math.floor(this.frame) == this.frameCount - 1) {
					this.frameRate = 0;
				}
				if(this.frameRate < 0 && Math.floor(this.frame) == 0) {
					this.frameRate = 0;
				}
			};
			door.Enter = function() {
				this.frameRate = 30;
			};
			door.Exit = function() {
				this.frameRate = -30;
			};
		}
		return door;
	}
	
	//
	// CreateCheckpoint - creates a checkpoint to respawn the player
	//
	function CreateCheckpoint(x, y, respawn) {
		var checkpoint = CreateSprite(x, y, 10, 300, "", 9998);
		ApplyRectBBox(checkpoint, b2.Body.b2_staticBody);
		checkpoint.fixture.SetSensor(true);
		checkpoint.type = "checkpoint";
		if(respawn) {
			checkpoint.update = function(d) {
				var xpos = this.x + States.current().world.x;
				if(xpos + this.width/2 < -States.current().level.width / 2) {
					this.x += States.current().level.width;
					var pos = this.body.GetPosition();
					pos.x += States.current().level.width / PHYSICS_SCALE;
					this.body.SetTransform(pos, 0);
				}
				if(xpos - this.width/2 > States.current().level.width / 2) {
					this.x -= States.current().level.width;
					var pos = this.body.GetPosition();
					pos.x -= States.current().level.width / PHYSICS_SCALE;
					this.body.SetTransform(pos, 0);
				}
			};
		}
		checkpoint.Destroy = function() {
			physics.DestroyBody(this.body);
			States.current().world.removeChild(this);
		};
		return checkpoint;
	}
	
	//
	// applyBBox - takes sprite and fixture definition and applies the bounding box to sprite
	//
	function ApplyBBox(sprite, type, fixDef) {
		var bodyDef = CreateBodyDef(sprite, type);
		
		sprite.body = physics.CreateBody(bodyDef);
		sprite.fixture = sprite.body.CreateFixture(fixDef);
		sprite.body.SetUserData(sprite);
		
		if(type == b2.Body.b2_dynamicBody) {
			sprite.update = function(d) {
				var pos = sprite.body.GetPosition();
				sprite.x = pos.x * PHYSICS_SCALE;
				sprite.y = pos.y * PHYSICS_SCALE;
				sprite.rotation = sprite.body.GetAngle();
			};
		}
	}
	
	//
	// applyRectBBox - creates and links a rectanglular bounding box to the specified sprite
	//
	function ApplyRectBBox(sprite, type, density, friction, restitution) {
		var fixDef = CreateFixtureDef(density, friction, restitution);
		fixDef.shape = new b2.PolygonShape();
		fixDef.shape.SetAsBox(sprite.width / 2 / PHYSICS_SCALE, sprite.height / 2 / PHYSICS_SCALE);
		ApplyBBox(sprite, type, fixDef);
	}
	
	//
	// CreateBodyDef - Creates a body definition for the input sprite
	//
	function CreateBodyDef(sprite, type) {
		var bodyDef = new b2.BodyDef();
		bodyDef.type = type;
		bodyDef.position.Set(sprite.x / PHYSICS_SCALE, sprite.y / PHYSICS_SCALE);
		return bodyDef;
	}
	
	//
	// CreateFixtureDef - Creates a basic fixture definition without a shape
	//
	function CreateFixtureDef(density, friction, restitution) {
		var fixDef = new b2.FixtureDef();
		fixDef.density = typeof density !== 'undefined' ? density : 1.0;
		fixDef.friction = typeof friction !== 'undefined' ? friction : 0.5;
		fixDef.restitution = typeof restitution !== 'undefined' ? restitution : 0.2;
		return fixDef;
	}
	
function makeBuilding(x, y, tracker, buildingLength)
{
	  		//left side
	  		this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["LEFT_WALL"], 0, true);
			x += 183;
			tracker++;
			for(tracker; tracker<buildingLength; tracker++) //middle
			{
				this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
			}
			//right side
			tracker++;
			this.floor[tracker] = CreateFloorElement(x, y, 183, 371, SPRITES["RIGHT_WALL"], 0, true);
}
function fillBuilding(x, y, tracker, buildingLength)
{
			//left side
	  		this.fill[tracker] = CreateFloorElement(x+20, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
			x += 183;
			tracker++;
			for(tracker; tracker<buildingLength; tracker++) //middle
			{
				this.fill[tracker] = CreateFloorElement(x, y+369, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
				x += 183;
			}
			//right side
			tracker++;
			this.fill[tracker] = CreateFloorElement(x-20, y+371, 183, 371, SPRITES["MIDDLE_WALL"], 0, true);
}
}());