(function ($) {
// define variables
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var player, money, stop, ticker;
//vehicle class
var vehicle = [];
var canUseLocalStorage = 'localStorage' in window && window.localStorage !== null;
var playSound;
var splashTimer = 600.00;
//InMenu UI Constansts
var standWidth = 100;
var buttonsPlaceY = 200;
//Player Pos
var PLAYER_XPOS = 50;
var PLAYER_YPOS = 50;
//Bidder Pos
var BIDDER_XPOS = 650;
var BIDDER_YPOS = 250;
var ENEMY_X = 80;

var VEHICLE_XPOS = 200;
var VEHICLE_YPOS = 250;

//Buttons functions
var auctionButton = {};
var auctionBackButton = {};
var repairButton = {};
var bidButton = {};
var inventoryButton = {};
//Repair Shop Buttons
var purchaseButton = {};
var repairBackButton = {};
var addFundsButton = {};
var addFundsBackButoon = {};
//AI
//Create an empty array of Bidders
var bidders = [];
//array of bids
var enemyBids = []; 

//AuctionMode Game HUD bool 
var inAuctionMode = false;
var inRepairMode = false;
var inAddFundsMode = false;

//AI Variables
var playerBid = 0;
//temp
var bidAmount = 200;
var currentBid = 0;
var vehiclePrice = 20000;
var enemyCap = 0.8 * vehiclePrice;
var enemyCap2 = 0.6 * vehiclePrice;
var enemyCap3 = 1.2 * vehiclePrice;
var enemyCap4 = 0.2 * vehiclePrice;
//DT
var timer = 0;
var previousTime = Date.now();

// set the sound preference
if (canUseLocalStorage) 
{
  playSound = (localStorage.getItem('kandi.playSound') === "true")

  if (playSound) 
  {
    $('.sound').addClass('sound-on').removeClass('sound-off');
  }
  else 
  {
    $('.sound').addClass('sound-off').removeClass('sound-on');
  }
}

update();

//Get a random number between range
function rand(low, high) 
{
  return Math.floor( Math.random() * (high - low + 1) + low );
}

/**
 * Bound a number between range
 * @param {integer} num - Number to bound
 * @param {integer}
 * @param {integer}
 */
function bound(num, low, high) 
{
  return Math.max( Math.min(num, high), low);
}

//Asset pre-loader object. Loads all images
var assetLoader = (function() 
{
  // images dictionary
  this.images        = 
  {
 	 //inventory background
    'bg'             : 'images/inventoryMenu.png',
   	 //player
     'avatar_normal'  : 'images/normal_walk.png',
     //enemies
     'slime'         : 'images/slime.png',
     'spikes'        : 'images/slime.png',

   };

  // sounds dictionary
  this.sounds      = 
  {
    'bg'            : 'sounds/D.mp3',
    'jump'          : 'sounds/jump.mp3',
    'gameOver'      : 'sounds/gameOver.mp3'
  };

  var assetsLoaded = 0;                                // how many assets have been loaded
  var numImages      = Object.keys(this.images).length;    // total number of image assets
  var numSounds    = Object.keys(this.sounds).length;  // total number of sound assets
  this.totalAssest = numImages;                          // total number of assets

  
   //Ensure all assets are loaded before using them
   // @param {number} dic  - Dictionary name ('images', 'sounds', 'fonts')
   // @param {number} name - Asset name in the dictionary
  function assetLoaded(dic, name) 
  {
    // don't count assets that have already loaded
    if (this[dic][name].status !== 'loading') 
    {
      return;
    }

    this[dic][name].status = 'loaded';
    assetsLoaded++;

    // progress callback
    if (typeof this.progress === 'function') 
    {
      this.progress(assetsLoaded, this.totalAssest);
    }

    // finished callback
    if (assetsLoaded === this.totalAssest && typeof this.finished === 'function') 
    {
      this.finished();
    }
  }

  /**
   * Check the ready state of an Audio file.
   * @param {object} sound - Name of the audio asset that was loaded.
   */
  function _checkAudioState(sound) 
  {
    if (this.sounds[sound].status === 'loading' && this.sounds[sound].readyState === 4) 
    {
      assetLoaded.call(this, 'sounds', sound);
    }
  }

  //Create assets, set callback for asset loading, set asset source
  this.downloadAll = function() 
  {
    var _this = this;
    var src;

    // load images
    for (var image in this.images) 
    {
      if (this.images.hasOwnProperty(image)) 
      {
        src = this.images[image];

        // create a closure for event binding
        (function(_this, image) {
          _this.images[image] = new Image();
          _this.images[image].status = 'loading';
          _this.images[image].name = image;
          _this.images[image].onload = function() { assetLoaded.call(_this, 'images', image) };
          _this.images[image].src = src;
        })(_this, image);
      }
    }

    // load sounds
    for (var sound in this.sounds) 
    {
      if (this.sounds.hasOwnProperty(sound)) 
      {
        src = this.sounds[sound];

        // create a closure for event binding
        (function(_this, sound) {
          _this.sounds[sound] = new Audio();
          _this.sounds[sound].status = 'loading';
          _this.sounds[sound].name = sound;
          _this.sounds[sound].addEventListener('canplay', function() 
          {
            _checkAudioState.call(_this, sound);
          });
          _this.sounds[sound].src = src;
          _this.sounds[sound].preload = 'auto';
          _this.sounds[sound].load();
        })(_this, sound);
      }
    }
  }

  return {
    images: this.images,
    sounds: this.sounds,
    totalAssest: this.totalAssest,
    downloadAll: this.downloadAll
  };
})();

/**
 * Show asset loading progress
 * @param {integer} progress - Number of assets loaded
 * @param {integer} total - Total number of assets
 */
assetLoader.progress = function(progress, total) 
{
  var pBar = document.getElementById('progress-bar');
  pBar.value = progress / total;
  document.getElementById('p').innerHTML = Math.round(pBar.value * 100) + "%";
}


//Load the splash screen first
assetLoader.finished = function() 
{
  splash();
}


/**
 * Creates a Spritesheet
 * @param {string} - Path to the image.
 * @param {number} - Width (in px) of each frame.
 * @param {number} - Height (in px) of each frame.
 */
function SpriteSheet(path, frameWidth, frameHeight) 
{
  this.image = new Image();
  this.frameWidth = frameWidth;
  this.frameHeight = frameHeight;

  // calculate the number of frames in a row after the image loads
  var self = this;
  this.image.onload = function() 
  {
    self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
  };

  this.image.src = path;
}

/**
 * Creates an animation from a spritesheet.
 * @param {SpriteSheet} - The spritesheet used to create the animation.
 * @param {number}      - Number of frames to wait for before transitioning the animation.
 * @param {array}       - Range or sequence of frame numbers for the animation.
 * @param {boolean}     - Repeat the animation once completed.
 */
function Animation(spritesheet, frameSpeed, startFrame, endFrame) 
{

  var animationSequence = [];  // array holding the order of the animation
  var currentFrame = 0;        // the current frame to draw
  var counter = 0;             // keep track of frame rate

  // start and end range for frames
  for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
    animationSequence.push(frameNumber);

  
   // Update the animation
  this.update = function() 
  {

    // update to the next frame if it is time
    if (counter == (frameSpeed - 1))
      currentFrame = (currentFrame + 1) % animationSequence.length;

    // update the counter
    counter = (counter + 1) % frameSpeed;
  };

  /**
   * Draw the current frame
   * @param {integer} x - X position to draw
   * @param {integer} y - Y position to draw
   */
  this.draw = function(x, y) 
  {
    // get the row and col of the frame
    var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
    var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

    context.drawImage(
      spritesheet.image,
      col * spritesheet.frameWidth, row * spritesheet.frameHeight,
      spritesheet.frameWidth, spritesheet.frameHeight,
      x, y,
      spritesheet.frameWidth, spritesheet.frameHeight);
  };
}

//Draw background
var background = (function() 
{

   this.draw = function() 
   {
    context.drawImage(assetLoader.images.bg, 0, 0);
    
   };

  //Reset background to zero
 
   this.reset = function() 
   {
     bg.x = 0;
     bg.y = 0;
   }
     
  return {
    draw: this.draw,
    reset: this.reset,
   
  };
})();

/**
 * A vector for 2d space.
 * @param {integer} x - Center x coordinate.
 * @param {integer} y - Center y coordinate.
 * @param {integer} dx - Change in x.
 * @param {integer} dy - Change in y.
 */
function Vector(x, y, dx, dy) 
{
  // position
  this.x = x || 0;
  this.y = y || 0;
  // direction
  this.dx = dx || 0;
  this.dy = dy || 0;
}


// Move the player advance the vectors position by dx,dy
Vector.prototype.advance = function() 
{
  this.x += this.dx;
  this.y += this.dy;
};

//vehicle attributes
var price, originality, condition, name;

var vehicle =(function(vehicle)
{
	vehicle.width       = 300;
	vehicle.height      = 300;
	vehicle.description = "";
	vehicle.condition   = 0;
	vehicle.originality = 0;
	vehicle.basePrice   = 0;
	
	//sprite sheet
	vehicle.sheet    = new SpriteSheet('images/vehicle.jpg', vehicle.width, vehicle.height);
	vehicle.drawAnim = new Animation(vehicle.sheet, 0, 0, 0);
	vehicle.anim     = vehicle.drawAnim;
	
	Vector.call(vehicle,  VEHICLE_XPOS,  VEHICLE_YPOS, 0, vehicle.dy);
	
	vehicle.Init = function(price, originality, condition, name)
	{
		vehicle.name = name;
		vehicle.description = ("Cost: $" + basePrice.toString() + " Originality: " + originality.toString() + " Condition: "  + "/n");
		vehicle[vehicle.length] = vehicle;
	}
	
	vehicle.update   = function()
	{
	  vehicle.anim = vehicle.drawAnim;
    }

   	
	vehicle.draw = function()
	{
		vehicle.anim.draw(vehicle.x, vehicle.y);
	};
	  
    vehicle.reset = function() 
    {
	   vehicle.x = VEHICLE_XPOS;
	   vehicle.y = VEHICLE_YPOS;
    
    }
    return vehicle;

	
})(Object.create(Vector.prototype));


// The player object
var player = (function(player) 
{
  // add properties directly to the player imported object
  player.width     = 60;
  player.height    = 96;
  player.speed     = 6;

  player.dy        = 0;
 
  // spritesheets
  player.sheet     = new SpriteSheet('images/normal_walk.png', player.width, player.height);
  player.walkAnim  = new Animation(player.sheet, 4, 0, 15);
  player.jumpAnim  = new Animation(player.sheet, 4, 15, 15);
  player.fallAnim  = new Animation(player.sheet, 4, 11, 11);
  player.anim      = player.walkAnim;

  Vector.call(player,  PLAYER_XPOS,  PLAYER_YPOS, 0, player.dy);

  //update
   player.update = function() 
  {
    player.anim = player.walkAnim;
    player.anim.update();
  };

  //Draw the player at it's current position
   
  player.draw = function() 
  {
    player.anim.draw(player.x, player.y);
  };

  
  // Reset the player's position
  player.reset = function() 
  {
    player.x = PLAYER_XPOS;
    player.y = PLAYER_YPOS;
  };

  return player;
})(Object.create(Vector.prototype));

/**
 * Sprites are anything drawn to the screen (ground, enemies, etc.)*/
function Sprite(x, y, type) 
{
  this.x      = x;
  this.y      = y;
  this.width  = standWidth;
  this.height = standWidth;
  this.type   = type;
  Vector.call(this, x, y, 0, 0);

  //Update the Sprite's position by the player's speed
   
  this.update = function() 
  {
    this.dx = -player.speed;
    this.advance();
  };

  // Draw the sprite at it's current position
  this.draw = function() 
  {
    context.save();
    context.translate(0.5,0.5);
    context.drawImage(assetLoader.images[this.type], this.x, this.y);
    context.restore();
  };
}
Sprite.prototype = Object.create(Vector.prototype);
//DT
function update()
{
    
	var deltaTime = (Date.now() - previousTime) / 1000;
    previousTime = Date.now();
    timer += deltaTime;

}

function updatePlayer() 
{
  
  player.update();
  player.draw();

}

function updateVehicles() 
{
 // vehicle.Init();
  vehicle.update();
  vehicle.draw();

}

//Request Animation Polyfill

var requestAnimFrame = (function()
{
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(callback, element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// enemy avatar
var slimer = new Image();
slimer.src = 'images/slime.png';

var curBidImage = new Image();
curBidImage.src = 'images/slime2.png';


//Update the Game Loop
function animate() 
{
    
  if (!stop) 
  {
    requestAnimFrame( animate );
    context.clearRect(0, 0, canvas.width, canvas.height);
	
    background.draw();
    document.getElementById('gameMenu').style.display = 'true';

  	update();
  	
   
    if(timer >= 400.00)
	{
	  mainMenu();
	}
	//Auction Mode Game Display and everything happening in Auction 
	if(inAuctionMode)
	{
		if(playerDidBid)
   		{
	  		auctionTimer ++;
    	}
    	
    		    
		enemyBids.push(1) * Math.random();
		enemyBids.push(2) * Math.random();
		enemyBids.push(3);
		enemyBids.push(4);
		enemyBids.push(5);
		enemyBids.push(6);
		
		
	
	    //Add four bidders
	    bidders.push("Bidder235:" );
		bidders.push("Bidder 2147" );
		bidders.push("katana" );
		bidders.push("Bobby" );
		/*
		for(var i = 0; i < bidders.length ; ++ i )
		{
		 // bidders[i].push * Math.random() * 0.2;
		 console.log(bidder[i]);
	
		}
		*/
		updateVehicles();
		updatePlayer();
		enemyBidding();
		currentBidder();
	    // draw the money HUD
	    context.fillText('Money :  ' + '$'+ money  , canvas.width - 240, 90);
	    //player bid
	    context.fillText('Player Bid :  '   +'$'+ playerBid  ,ENEMY_X, 90);
		
		var enemySpeed = 100;
		  
	  	var player1;
	  	var player2;
	  	var player3;
	  	var player4;
	  	
	  	 	//Player
	  	if( playerBid = currentBid)
	  	{
	  		player.y = 40;
	  	}
	  	else
	  	{
	  	  player.y = 300;
	  	}
	  	
	  	//Enemy 1
		//draw them depending on current bid
	  	if( enemyBids[0] >= currentBid)
	  	{
	  		player1 = context.drawImage(curBidImage,10,10) + context.fillText( bidders[0] + '$'+ enemyBids[0]  ,ENEMY_X , 70);

	  	}
	  	else
	  	{
	  		player1 = context.drawImage(slimer,10,100) + context.fillText( bidders[0] + '$'+ enemyBids[0]  ,ENEMY_X, 120);
	  	}
	    //Enemy 2
	  	if( enemyBids[1] >= currentBid)
	  	{
	  		player2 = context.drawImage(curBidImage,10,10) + context.fillText( bidders[1] + '$'+ enemyBids[1]  ,ENEMY_X , 70);

	  	}
	  	else
	  	{
	  		player2 = context.drawImage(slimer,10,130) + context.fillText(bidders[1] + '$'+ enemyBids[1]  ,ENEMY_X, 160);
	  	}
	  	//Enemy3
	  	if( enemyBids[2] >= currentBid)
	  	{
	  	    player3 = context.drawImage(curBidImage,10,10) + context.fillText( bidders[2] + '$'+ enemyBids[2]  ,ENEMY_X , 70);
	  	}
	  	else
	  	{
	  		 player3 = context.drawImage(slimer,10,150) + context.fillText(bidders[2] + '$'+ enemyBids[2]  ,ENEMY_X, 180);
	  	}
	  	//Enemy4
	  	if( enemyBids[3] >= currentBid)
	  	{
	  	    player4 = context.drawImage(curBidImage,10,10) + context.fillText( bidders[3] + '$'+ enemyBids[3]  ,ENEMY_X , 70);
	  	}
		else
		{
			player4 =  context.drawImage(slimer,10,170) + context.fillText(bidders[3] + '$'+ enemyBids[3]  ,ENEMY_X, 200);
		}
	
	   

	 
	      //current bid
	      var gorguts;
	      gorguts = context.drawImage(curBidImage,380,100)+ context.fillText('Current Bid :  ' + '$'+ currentBid  ,400, 120);
	    
	
		    //current bid
	    context.fillText('Vehicle Price :  ' + '$'+ vehiclePrice  ,400, 90);
	    
	    context.fillText('Auction Time :  ' + auctionTimer  ,200, 400);
	}
	else
	{
		inAuctionMode = false;
	}
   
	timer ++;
    ticker++;
  }
}

//Show the splash after loading all assets 
function splash() 
{
  document.getElementById('splash');
   
  animate();
  $('#progress').hide();
  $('#splash').show();
 
  $('.sound').show();
}
 
//Main Menu  
function mainMenu() 
{
  for (var sound in assetLoader.sounds) 
  {
    if (assetLoader.sounds.hasOwnProperty(sound)) 
    {
      assetLoader.sounds[sound].muted = !playSound;
    }
  }

  $('#progress').hide();
  $('#splash').hide();
  $('#main').show();
  $('#menu').addClass('main');
  $('.sound').show();
}

// Start the game - reset all variables and entities, spawn ground and water.
function startGame() 
{
  document.getElementById('game-over').style.display = 'none';
 
  player.reset();
  ticker = 0;
  stop = false;
  money = 50000;
  playerBid = 0;
  currentBid = 0;
   
  context.font = '26px arial, sans-serif';
  enemies = [];

  animate();
 
  update();

  assetLoader.sounds.gameOver.pause();
  assetLoader.sounds.bg.currentTime = 0;
  assetLoader.sounds.bg.loop = true;
  assetLoader.sounds.bg.play();
  //load auction button
      
}
function resetStates()
{
	inRepairMode = false;
	inAuctionMode = false;
	inAddFundsMode = false;
}

//Repair State
function repairState()
{
  document.getElementById('RepairShop').style.display = 'true';
  inRepairMode = true;
  
  /*
  for (var i = 0; i < matrix.length; i++)
  {
	for (var j = 0; j < matrix.length; j++)
	{
		document.write ("Element (" + i + ", " + j + ") is " + matrix[i][j] + " -- ");
	}
	document.write("<br>");
  }
*/
}
function addFundsMode()
{
  document.getElementById('AddFunds').style.display = 'true';
  inAddFundsMode = true;
}
//Auction State
function auctionMode() 
{
   context.clearRect(0, 0, canvas.width, canvas.height);

   document.getElementById('Auction').style.display = 'true';
   inAuctionMode = true;
 
   ticker = 0;
   stop = false;
   money = 50000;
   playerBid = 0;
 
   context.font = '26px arial, sans-serif';
   update();
   animate();
  
   auctionMode.update = function() 
   {
     console.log("Shithead");
     playerBidding();
	 currentBid = vehiclePrice + playerBid;
	 
   }
  
  $('#Auction').show();
  $('#menu').removeClass('gameMenu');
  $('#menu').addClass('Auction');
  $('.sound').show();

  
  assetLoader.sounds.gameOver.pause();
  assetLoader.sounds.bg.currentTime = 0;
  assetLoader.sounds.bg.loop = true;
  assetLoader.sounds.bg.play();
}
var playerDidBid = false;
var auctionTimer = 0;
var playerNextBid = vehiclePrice * 0.1;

//Player Bidding Function
function playerBidding() 
{ 
	
	playerBid = currentBid + playerNextBid;
	
	if(playerBid <= money)
	{
		playerDidBid = true;
	}
		
	if((enemyBid = 0)&&(enemyBid2 = 0)&&(enemyBid3 = 0)&&(enemyBid4 = 0)&& (money >= currentBid))
	{
	  money = money - currentBid;
	}
	
	if(money <= 0)
	{
		money = 0;
		gameOver();	
	}
}
//Player Bidding Function
var currentBid = 0;
function currentBidder()
{
	//Player has the current bid
	if((playerBid > enemyBids[0])&&(playerBid > enemyBids[1])&&(playerBid > enemyBids[2])&&(playerBid > enemyBids[3]))
	{
	   currentBid = playerBid;
	}
	
	//Find the player who has the highest bid dirty way enemy bidder 1 if it is not players bid then call func to find thru enemies
	else if((playerBid < enemyBids[0])||(playerBid < enemyBids[1])||(playerBid < enemyBids[2])||(playerBid < enemyBids[3]))
	{
	  bidFinder();
	}
	
}

function bidFinder()
{
	if((enemyBids[0] > enemyBids[1]) && (enemyBids[0] > enemyBids[2]) && (enemyBids[0] > enemyBids[3]))
	{
		currentBid = enemyBids[0]; 
	}
	else if((enemyBids[1] > enemyBids[0]) && (enemyBids[1] > enemyBids[2]) && (enemyBids[1] > enemyBids[3]))
	{
		currentBid = enemyBids[1];
	}
	else if((enemyBids[2] > enemyBids[0]) && (enemyBids[2] > enemyBids[1]) && (enemyBids[2] > enemyBids[3]))
	{
		currentBid = enemyBids[2];
	}
	else if((enemyBids[3] > enemyBids[0]) && (enemyBids[3] > enemyBids[1]) && (enemyBids[3] > enemyBids[2]))
	{
		currentBid = enemyBids[3];
	}
	

}
function enemyBidding() 
{
	
	if(auctionTimer > 10000)
	{
		gameOver();
	}
	//upPercentage of vehicle for next bid
	//var upPerc = vehiclePrice * 0.1 + currentBid;
	
	var startBid = vehiclePrice * 0.2;
	var upPerc = startBid ;
	
	if( (playerDidBid) )
	{
		if((playerBid <= money) && (playerDidBid) )
		{
			if((enemyBids[0] <= playerBid) && (enemyBids[0] < enemyCap) )
			{
			  enemyBids[0]  = currentBid + upPerc;
			}
			else if((enemyBids[1] < enemyBids[0]) || (enemyBids[1] < enemyCap2))
			{
			    enemyBids[1] = currentBid + upPerc;
			}
			else if((enemyBids[2] < currentBid) && (enemyBids[2] < enemyCap2) && (enemyBids[3] > currentBid))
			{
			    enemyBids[2] = currentBid + upPerc;
			}
			else if((enemyBids[3] < currentBid) && (enemyBids[3] < enemyCap3))
			{
			    enemyBids[3] = currentBid + upPerc;
			}

					
		}
		else if((playerBid >enemyBids[0]) && (playerBid >enemyBids[1]) && (playerBid >enemyBids[2]) &&(playerBid >enemyBids[3]))
		{
			sold();
			money = money - currentBid;
		}
	
	}
	/*
	else
	{
		playerBid = 0;
		playerDidBid = false;
	}
	*/
	/*
	for(var i = 0; i < bidders.length; i++)
	{
	  console.log(" " + i + ": " + bidders[i]);
	}
	*/	
}


//End the game and restart
function gameOver() 
{
  document.getElementById('game-over').style.display = 'true';
  stop = true;
  $('#money').html(money);
  $('#game-over').show();
  assetLoader.sounds.bg.pause();
  assetLoader.sounds.gameOver.currentTime = 0;
  assetLoader.sounds.gameOver.play();
}

//push vehicle in to inventory and tell player he won bidding
function sold() 
{
  document.getElementById('sold').style.display = 'true';
  stop = true;
  $('#enemyBid').html(enemyBid);
  $('#sold').show();
  assetLoader.sounds.bg.pause();
  assetLoader.sounds.gameOver.currentTime = 0;
  assetLoader.sounds.gameOver.play();
}

// Click handlers for the different menu screens
//Credits 
$('.credits').click(function() 
{
  $('#main').hide();
  
  $('#menu').addClass('credits');
  $('#credits').show();
});
//Credits Back button
$('.back').click(function() 
{
  $('#credits').hide();
  $('#menu').removeClass('credits');
});
//Menu state start game button
$('.play').click(function() 
{
  $('#menu').hide();
  $('#gameMenu').show();

  startGame();
  
});
//GameOver screen restart button
$('.restart').click(function() 
{
  $('#game-over').hide();
  $('#gameMenu').hide();

  startGame();
});

//InMenuButtons
//auction Button
$('#auction').click(function() 
{
	$('#auction').show();
	$('#gameMenu').hide();
	$('#menu').addClass('auction'); 	
	auctionMode();
});
//Auction State Back Button
$('#auctionBackButton').click(function()
{
	inAuctionMode = false;
	resetStates();
  
  $('#menu').removeClass('Auction');
  $('#Auction').hide();
 
  $('#menu').addClass('gameMenu');
  $('#gameMenu').show();
  
});
//Inside Auction Bid Button
$('#bid').click(function()
{
  playerBidding();
});

//Repair to menu Repair
$('#repair').click(function()
{
  
  $('#gameMenu').hide();
  $('#RepairShop').show();
  repairState();

});
//RepairMenu Back Button 
$('#repairBackButton').click(function()
{
  $('#RepairShop').hide();
  $('#gameMenu').show();

});
//Game Menu Add funds portal button
$('#addFunds').click(function() 
{
	$('#gameMenu').hide();
    $('#AddFunds').show();
    $('#menu').addClass('AddFunds');
	addFundsMode();
	
});
//Inside AddFunds State Bacjbutton 
$('#addFundsBackButton').click(function()
{
  $('#AddFunds').hide();
  $('#gameMenu').show();
  
});

//Sound Button
$('.sound').click(function() 
{
  var $this = $(this);
  // sound off
  if ($this.hasClass('sound-on')) 
  {
    $this.removeClass('sound-on').addClass('sound-off');
    playSound = false;
  }
  // sound on
  else 
  {
    $this.removeClass('sound-off').addClass('sound-on');
    playSound = true;
  }
  if (canUseLocalStorage) 
  {
    localStorage.setItem('kandi.playSound', playSound);
  }
  // mute or unmute all sounds
  for (var sound in assetLoader.sounds) 
  {
    if (assetLoader.sounds.hasOwnProperty(sound)) 
    {
      assetLoader.sounds[sound].muted = !playSound;
    }
  }
});

assetLoader.downloadAll();
})(jQuery);