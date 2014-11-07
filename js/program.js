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
var PLAYER_XPOS = 150;
var PLAYER_YPOS = 100;
//Bidder Pos
var BIDDER_XPOS = 650;
var BIDDER_YPOS = 250;

var VEHICLE_XPOS = 200;
var VEHICLE_YPOS = 250;

//Buttons functions
var auctionButton = {};
var repairButton = {};
var bidButton = {};
var inventoryButton = {};

var enemies = [];


//AuctionMode Game HUD bool 
var inAuctionMode = false;


//AI Variables
var playerBid = 0;
//temp
var bidAmount = 200;
var enemyBid = 0;
var currentBid = 0;
var vehiclePrice = 20000;
var enemyCap = 0.8 * vehiclePrice;


var timer = 0;
var previousTime = Date.now();


window.performance = window.performance || {};
performance.now = (function() {
    return performance.now       ||
        performance.mozNow    ||
        performance.msNow     ||
        performance.oNow      ||
        performance.webkitNow ||            
        Date.now  /*none found - fallback to browser default */
})();




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
Init();

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

  /**
   * Ensure all assets are loaded before using them
   * @param {number} dic  - Dictionary name ('images', 'sounds', 'fonts')
   * @param {number} name - Asset name in the dictionary
   */
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


function Init()
{
	
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

/**
 * Move the player advance the vectors position by dx,dy
 */
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


//AI robots
var bidder =(function(bidder)
{
	bidder.width       = 40;
	bidder.height      = 30;
	bidder.description = "";
	bidder.high        = 0;
	bidder.low         = 0;
	//bid percentage
	bidder.bidcap      = 0;
	bidder.enemyBid    = 0;
	
	//sprite sheet
	bidder.sheet    = new SpriteSheet('images/slime.png', bidder.width, bidder.height);
	bidder.drawAnim = new Animation(bidder.sheet, 0, 0, 0);
	bidder.anim     = bidder.drawAnim;
	
	Vector.call(bidder,  BIDDER_XPOS,  BIDDER_YPOS, 0, bidder.dy);
	
	bidder.update   = function()
	{
	  bidder.anim = bidder.drawAnim;
	 // bidder.bid = bidder.bid();
    }
    /*
	bidder.bid  = function()
	{
	 context.fillText('Silme Bid :  ' + '$'+ slimeBid  ,0, 90);
	}
   	*/
	bidder.draw = function()
	{
		bidder.anim.draw(bidder.x, bidder.y);
	};
	
	
    bidder.reset = function() 
    {
	   bidder.x = BIDDER_XPOS;
	   bidder.y = BIDDER_YPOS;
    
    }
    return bidder;

	
})(Object.create(Vector.prototype));




// The player object
var player = (function(player) 
{
  // add properties directly to the player imported object
  player.width     = 60;
  player.height    = 96;
  player.speed     = 6;

  // jumping
  player.gravity   = 1;
  player.dy        = 0;
  player.jumpDy    = -10;
  player.isFalling = false;
  player.isJumping = false;

  // spritesheets
  player.sheet     = new SpriteSheet('images/normal_walk.png', player.width, player.height);
  player.walkAnim  = new Animation(player.sheet, 4, 0, 15);
  player.jumpAnim  = new Animation(player.sheet, 4, 15, 15);
  player.fallAnim  = new Animation(player.sheet, 4, 11, 11);
  player.anim      = player.walkAnim;

  Vector.call(player,  PLAYER_XPOS,  PLAYER_YPOS, 0, player.dy);

  var jumpCounter = 0;  // how long the jump button can be pressed down

  /**
   * Update the player's position and animation
   */
  player.update = function() 
  {

    
    this.advance();

    player.anim = player.walkAnim;
    

    player.anim.update();
  };

  /**
   * Draw the player at it's current position
   */
  player.draw = function() 
  {
    player.anim.draw(player.x, player.y);
  };

  /**
   * Reset the player's position
   */
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

  /**
   * Update the Sprite's position by the player's speed
   */
  this.update = function() 
  {
    this.dx = -player.speed;
    this.advance();
  };

  /**
   * Draw the sprite at it's current position
   */
  this.draw = function() 
  {
    context.save();
    context.translate(0.5,0.5);
    context.drawImage(assetLoader.images[this.type], this.x, this.y);
    context.restore();
  };
}
Sprite.prototype = Object.create(Vector.prototype);


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
function updateBidders() 
{
  
  bidder.update();
  bidder.draw();

}



//Mouse clicks
var clicked = false;
function mouseDownHandler(event)
{
    for (var i = 0; i < images.length; ++i)
    {
        if (images[i] === event.target)
        {
			clicked = true;
        }
    }
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

function animate() 
{
    
  if (!stop) 
  {
    requestAnimFrame( animate );
    context.clearRect(0, 0, canvas.width, canvas.height);
	
    background.draw();
    document.getElementById('gameMenu').style.display = 'true';

  	update();
    
    updatePlayer();
	updateVehicles();
	//draw enemies
	updateBidders();
	enemyBidding();
	currentBidder();
    
    if(playerDidBid)
    {
	  auctionTimer ++;
    }
    if(timer >= 400.00)
	{
	  mainMenu();
	}
	if(inAuctionMode)
	{
	    // draw the money HUD
	    context.fillText('Money :  ' + '$'+ money  , canvas.width - 240, 90);
	    //player bid
	    context.fillText('Player Bid :  ' + '$'+ playerBid  ,0, 90);
	
		  //enemy bid
	    context.fillText('Slimer Bids :  ' + '$'+ enemyBid  ,0, 120);
	    
	      //current bid
	    context.fillText('Current Bid :  ' + '$'+ currentBid  ,400, 120);
	
		    //current bid
	    context.fillText('Vehicle Price :  ' + '$'+ vehiclePrice  ,400, 90);
	    
	     context.fillText('Auction Time :  ' + auctionTimer  ,200, 400);
	}
	else
	{
		inAuctionMode = false;
	}
    // spawn a new Sprite
  
    
 
	timer ++;
    ticker++;
  }
}

/**
 * Show the splash after loading all assets
 */
 
 
function splash() 
{
  document.getElementById('splash');
   
  animate();
  $('#progress').hide();
  $('#splash').show();
 
  $('.sound').show();
}
 
 
 
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

/**
 * Start the game - reset all variables and entities, spawn ground and water.
 */
function startGame() 
{
  document.getElementById('game-over').style.display = 'none';
 
  player.reset();
  ticker = 0;
  stop = false;
  money = 50000;
  playerBid = 0;
  enemyBid = 0;
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

function auctionMode() 
{
 // context.clearRect(0, 0, canvas.width, canvas.height);

  document.getElementById('Auction').style.display = 'true';
  inAuctionMode = true;
 
  ticker = 0;
  stop = false;
  money = 50000;
  enemyBid = 0;
  playerBid = 0;
 
  context.font = '26px arial, sans-serif';
  update();
 // updateAuctionMode(); 
  animate();
  
  
  console.log("AuctionMode");
  
   auctionMode.update = function() 
   {
     console.log("Shithead");
     playerBidding();
    
	
	
	 currentBid = vehiclePrice + playerBid;
	 
   }
  
 //background.draw();
    //inventoryMenu.draw();

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

//Player Bidding Function
function playerBidding() 
{ 
	
	console.log("you're a dick man");
	
	
	playerBid = enemyBid + 400;
	playerDidBid = true;
	if(enemyBid = 0)
	{
	 money = money - currentBid;
	}
	
	playerDidBid = true;

	if(money <= 0)
	{
		money = 0;
		 // draw the money HUD
       

		gameOver();
		
	}
}
//Player Bidding Function

var currentBid = 0;
function currentBidder()
{
	if(playerBid > enemyBid)
	{
	  currentBid = playerBid;
	}
	if(playerBid < enemyBid)
	{
	  currentBid = enemyBid;
	}
}


function enemyBidding() 
{
	
	if(auctionTimer > 10000)
	{
		gameOver();
	}
	//currentBid != 0.8 * vehiclePrice
	if(playerBid > enemyBid)
	{
		if(playerBid <= enemyCap)
		{
	
			enemyBid = currentBid + 200;	
			
		}
		else if(playerBid >= enemyCap)
		{
			sold();
			money = money - currentBid;
		}
	
	}
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


$('.play').click(function() 
{
  $('#menu').hide();
  $('#gameMenu').show();

  startGame();
  
});
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
	$('#menu').hide();
	$('#auction').show();
	$('#menu').removeClass('gameMenu');
	$('#gameMenu').hide();
	$('#Menu').addClass('auction'); 	
	auctionMode();
});
//Inside Auction Bid Button
$('#bid').click(function()
{
  playerBidding();
});

//Repair to menu Repair
$('#repair').click(function()
{
      //Some code
  $('#menu').hide();
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