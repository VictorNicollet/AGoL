// Dimensions of the game world. Make sure that the rendering canvas is at least
// this large.
var height = 600, width = 800;

// The radius of a creature - used for both collision testing AND rendering.
var radius = 5;

// 2π, user for drawing circles with arc()
var twopi  = Math.PI * 2;

// How many steps it takes to reach maturity for a cost=1 creature.
// The actual number of steps is inversely proportional to the
// creation cost. The creature remains an egg for this amount of
// time.
var maturity  = 50;

// The maximum value of suffocation allowed before the creature 
// is forcibly removed from the game.
var suffocate = 80;

// How much energy does the average attack take from the victim ? 
// Increases with the difference between attacker offense and victim
// defense. How much energy the attacker actually receives is determined
// by its "eat" genes.
var bitesize  = 1;

// How fast does carrion lose energy ?
var carrion_decay = 0.05;

// Fit a given creature (or any object with x,y members) within the game world. 
function fit(o) {

    // Use !(a >= b) instead of (a < b) in order to handle NaN correctly.
    if (!(o.x >= radius)) o.x = radius;
    if (!(o.y >= radius)) o.y = radius;
    if (o.x > width  - radius) o.x = width  - radius;
    if (o.y > height - radius) o.y = height - radius;
}

// Compute the distance between two creatures (or two objects with x,y members).
function distance(o,t) {
    var dx = t.x - o.x, dy = t.y - o.y;
    return Math.sqrt (dx * dx + dy * dy);
}

// Move a creature (o) towards a target (t) at the provided speed. 
// - If no target is provided, a random point within the game world is 
//   used instead.
// - If the speed is greater than the distance between the points, the points 
//   will simply overlap.
// - If the speed is negative, the creature will move directly away from
//   the target at maximum speed.
// - Movement will never cause a creature to leave the game world.
function move(o,t,speed) {

    if (t == null) 
	t = { x : Math.random() * width, y : Math.random() * height };
    
    var dx = t.x - o.x, dy = t.y - o.y, d = Math.sqrt (dx * dx + dy * dy);

    if (d == 0) return;
    if (speed > d) { 
	o.x = t.x;
	o.y = t.y;
	return; 
    }
    
    o.x += dx * speed / d;
    o.y += dy * speed / d;
    
    fit(o);
}

// Enumerate a list of n evenly spaced points around creature o, 
// and call function f on them. Points can be found at a distance
// of (radius) from the creature's position.
function around(o,n,f) {

    if (n == 0) return;

    var offset = Math.random () * twopi;

    for (var i = 0; i < n; ++i) {
	var angle = offset + twopi * i / n;
	f(o.x + radius * Math.cos(angle), o.y + radius * Math.sin(angle));
    }
}

// These are the available "modules" - genes that may be part of the genome of a 
// creature.
var modules = [
    "off",  // How strong the creatures can attack. 
    "def",  // How well the creatures can defend against attack.
    "str",  // Strength ; increases speed, offense and defense. 
    "aut",  // Autotrophy ; feeding itself by just staying around.
    "hunt", // Radius of detection of potentially edible victims. 
    "flee", // Radius of detection of potential threats. 
    "kids", // Have more kids at the same time, at reduced cost. 
    "hide", // Foil detection by hunt/flee 
    "eat"   // Improve food-to-energy conversion when eating others. 
] ;

// The names of the modules
var module_names = {
    "off"  :  "Offense",
    "def"  :  "Defense",
    "str"  :  "Strength",
    "aut"  :  "Autotrophy", 
    "hunt" :  "Hunting",
    "flee" :  "Flight",
    "kids" :  "Fertility",
    "hide" :  "Camouflage",
    "eat"  :  "Digestion"
} ;

// The name of a genome based on modules.
function genome_name(genome) {
    var count = {};
    for (var i = 0; i < genome.length; ++i) 
	count[genome[i]] = (count[genome[i]] || 0) + 1;
    var items = [];
    for (var k in count) 
	items.push( count[k] === 1 ? module_names[k] : 
		    module_names[k] + " × " + count[k] );
    return items.join(", ");
}

// How many times does a given module appear in a genome ?
function in_genome(genome,module) {
    var count = 0;
    for (var i = 0; i < genome.length; ++i) if (genome[i] === module) count += 1;
    return count;
}

// Mutation probabilities for removing or adding a random gene
// (it's possible for both to happen at once!)
var p_remove = 0.05;
var p_add    = 0.025;

// Mutate a genome, returning a brand new genome. Genomes are always generated
// in a canonical form - genes being sorted alphabetically. 
function mutate(g) {

    var n = 0;
    
    g = g.slice(0);
    
    if (g.length > 0 && Math.random() < p_remove) {
	n = Math.floor(Math.random() * g.length);
	g = g.slice(0,n).concat(g.slice(n+1));
    }
    
    if (Math.random() < p_add) {
	n = Math.floor(Math.random() * modules.length);
	g.push(modules[n]);
    }
    
    return g.sort();

}

// Associate every gene with a prime factor. Useful for defining
// genome_prime below.
var prime = {
    "off"  : 2,
    "def"  : 3,
    "str"  : 5,
    "aut"  : 7,
    "hunt" : 11,
    "flee" : 13,
    "kids" : 17,
    "hide" : 19,
    "eat"  : 23
} ;

// Create a unique numerical representation of the genome (better for fast
// "has same genome" comparisons than an array of string) by multiplying
// together the primes associated with each gene.
function genome_prime(genome) {
    var p = 1;
    for (var i = 0; i < genome.length; ++i) p *= prime[genome[i]];
    return p;
}

// Create a genome back from a prime factorization.
function genome_of_prime(ifact) {
    if (ifact in genome_of_prime.cache) return genome_of_prime.cache[ifact];
    var g = [], fact = ifact;
    // console.log("Reversing %d...", fact);
    for (var i = 0; i < modules.length && fact > 1; ++i) {
	// console.log("Fact: %d, module : %s, prime: %d", fact, modules[i], prime[modules[i]]);
	if (fact % prime[modules[i]] === 0) {
	    g.push(modules[i]);
	    fact = fact / prime[modules[i]];
	    --i;
        } 
    } 
    genome_of_prime.cache[ifact] = g;
    return g;
}

// Cache reverse computations
genome_of_prime.cache = {};

// The individual cost (or amount of energy) that a given module represents.
// This determines both how much energy is required to have a kid with 
// a given set of modules, and how much energy can be gained from eating it.
var creation_cost = { 
    "off"  : 2,
    "def"  : 4,
    "str"  : 0.5,
    "aut"  : 1,
    "hunt" : 0.5,
    "flee" : 0.5,
    "kids" : 2,
    "hide" : 1,
    "eat"  : 1
} ;

// When giving birth, give the newborn an amount of energy equal to its total
// cost multiplied by this amount, so that it does not starve immediately after
// birth. 
var birth_multiplier = 6;

// How much a creature with an empty genome costs (this value is never used
// for non-empty genomes).
var base_creation_cost = 0.1;

// The total creation cost of a genome.
// This is the sum of individual costs for modules, plus the base cost.
function genome_creation_cost(genome) {
    var cost = 0;
    for (var i = 0; i < genome.length; ++i) cost += creation_cost[genome[i]];
    return Math.max(base_creation_cost, cost);
}

// The per-turn energy cost (or income) for every individual module. The total
// upkeep cost is based both on individual costs and on the number of modules.
var upkeep_cost = {
    "off"  :  0.002,  
    "def"  :  0.002,
    "str"  :  0.002,
    "aut"  : -0.008, // This value is negative : that's the entire point...
    "hunt" :  0.000,
    "flee" :  0.000,
    "kids" :  0.002,
    "hide" :  0.000,
    "eat"  :  0.000
} ;

// The multiplier used for the (squared) length of the genome in computing the
// total upkeep cost.
var quadratic_upkeep_scale = 0.0001;

// The total upkeep for a genome. Is the sum of the individual upkeep costs, 
// and the squared number of modules multiplied by the above upkeep constant.
function genome_upkeep_cost(genome) {
    var cost = genome.length * genome.length * quadratic_upkeep_scale;
    for (var i = 0; i < genome.length; ++i) cost += upkeep_cost[genome[i]];
    return cost;
}

// These two dictionaries define the colors associated with every module, for
// rendering purposes. Two colors are computed : inner (for the disc) and outer
// (for the stroke). They are determined by averaging all the colors that are
// not null. 

var inner_color = {
    "off"  :  null, 
    "def"  :  null,
    "str"  :  [ 1, 0, 0 ], // Red
    "aut"  :  [ 0, 1, 0 ], // Green
    "hunt" :  [ 1, 0, 1 ], // Magenta
    "flee" :  [ 0, 1, 1 ], // Cyan
    "kids" :  [ 0, 0, 1 ], // Blue
    "hide" :  [ 1, 1, 1 ], // White
    "eat"  :  null
} ;

var outer_color = {
    "off"  :  [ 1, 0, 0 ], // Red
    "def"  :  [ 0, 1, 0 ], // Green
    "str"  :  null, 
    "aut"  :  null, 
    "hunt" :  null, 
    "flee" :  null, 
    "kids" :  null, 
    "hide" :  [ 1, 1, 1 ], // White
    "eat"  :  [ 0, 0, 1 ]  // Blue
} ;

// Computes the genome colors and returns them as CSS-friendly 
// color definitions using rgb(). Returns an array [inner,outer]
// of CSS-ready strings.
// Note: to make repeated colors brighter, all colors are averaged
// with one half unit of black.
function genome_color(genome) {
    var ic = [0, 0, 0], oc = [0, 0, 0], nic = 0.5, noc = 0.5, g;
    for (var i = 0; i < genome.length; ++i) {

	if (g = inner_color[genome[i]]) {
	    nic   += 1;
	    ic[0] += g[0];
	    ic[1] += g[1];
	    ic[2] += g[2];
	}


	if (g = outer_color[genome[i]]) {
	    noc   += 1;
	    oc[0] += g[0];
	    oc[1] += g[1];
	    oc[2] += g[2];
	}
    }
    
    if (noc < 1) noc = 1;
    if (nic < 1) nic = 1;
    
    ic[0] *= Math.floor(255 / nic);
    ic[1] *= Math.floor(255 / nic);
    ic[2] *= Math.floor(255 / nic);
    
    oc[0] *= Math.floor(255 / noc);
    oc[1] *= Math.floor(255 / noc);
    oc[2] *= Math.floor(255 / noc);
    
    return ["rgb(" + ic.join() + ")","rgb("+oc.join()+")"];
}

// How much stored energy is necessary in order to have kids. This is a 
// function of the creation cost of the parent (we pretend no mutations 
// happen).
function genome_for_kids(g) {
    return genome_creation_cost(g) * birth_multiplier ;
}

// A creature class. Created with a genome at a position.
function creature(g,x,y) {

    // Set the position, make sure it's inside the game world.
    this.x = x;
    this.y = y;
    
    fit(this);
    
    // This is the amount of energy we have received from our 
    // parent - based on the genome we _should_ have received ...
    var full_energy = genome_creation_cost(g) * birth_multiplier;
    
    // ... but we allow the possibility for mutation !
    g = mutate(g);
    this.genome = g;
    this.prime  = genome_prime(g);
    
    // Current suffocation level, may change as time passes. 
    this.suffocate = 0;
    
    // Countdown to hatching (decreases by a variable amount
    // depending on creation cost).
    this.egg  = maturity;

    // Creation cost, never changes after conception
    this.cost   = genome_creation_cost(g);

    // The amount of energy from our parent that we get to keep !
    // We die when this amount reaches zero.
    this.energy = full_energy - this.cost;
    
    // Upkeep cost, never changes after birth.
    this.upkeep = genome_upkeep_cost(g);
    
    // Yes, Virginia, we are alive.
    this.alive  = true;
    
    // The offense - based on "off" and "str" modules.
    this.offense = in_genome(g,"off") * (1 + in_genome(g,"str")) ;

    // The defense - based on "def" and "str" modules.
    this.defense = in_genome(g,"def") * (1 + in_genome(g,"str")) ;

    // Speed (how many pixels do we move in one second?)
    // - Any creature can crawl
    // - Strength has the greatest impact (x4)
    // - Ability to flee or hunt has a significant impact, too (x3)
    // - Offensive power has a moderate impact (x2)
    // Speed is proportional to the radius. 
    this.speed   = (          in_genome(g,"str") 
		     + 0.75 * in_genome(g,"hunt") 
		     + 0.75 * in_genome(g,"flee")
                     + 0.5  * in_genome(g,"off")
                     + 0.25
                   ) * (radius / 8);

    // How far can we see interesting victims ?
    this.hunt    = 20 + radius + in_genome(g,"hunt") * 50 ;

    // How far can we see potential threats ?
    this.flee    = 3 * radius + in_genome(g,"flee") * 50 ;

    // Decrease the target's visibility by this amount when looking at us
    this.hide    = in_genome(g,"hide") * 40;
    
    // The percentage of eaten energy that is actually contributed 
    // to our energy store. 
    // - Changes exponentially
    // - "eat" has a positive contribution, obviously
    // - "aut" actually harms digestion
    this.digest  = 1 - Math.pow( 0.6, 1
				 +       in_genome(g,"eat")
				 - 0.5 * in_genome(g,"aut") );

    // The maximum range at which we could possibly care about another
    // creature - this is used for optimisation purposes when selecting
    // creatures we should see.
    this.sight   = Math.max(this.flee,this.hunt);

    // How many kids pop when we give birth? 
    this.kids    = 1 + in_genome(g,"kids");

    // How much stored energy do we need to give birth ?
    this.forkids = genome_for_kids(g);
    
    // The color, for rendering. This never changes until death.
    this.color   = genome_color(g);

    // Can we collide/be seen ? Changes on every step.
    this.collide = false;
    
    // Empty-genome creatures are stillborn.
    if (this.genome.length == 0) this.die();
}

// Create a random ["aut"] creature somewhere in the world
function random()
{
  var g = ["aut"];
  return new creature( g,
		       Math.random() * width, 
		       Math.random() * height );
}

creature.prototype = {

    // Become grey and defenseless.
    die : function() {
	this.alive   = false;
	this.defense = 0;
	this.offense = 0;
	this.color = ["#CCC","#EEE"];
    },
    
    // Render a disc and circle. The radius of rendering depends on the maturity,
    // suffocation and (if dead) remaining energy.
    render : function() {
	var r = radius;

	if (this.egg)  
	    r = radius * (maturity - this.egg) / maturity;

	if (this.suffocate) 
	    r = 1 + (radius - 1)* (suffocate - this.suffocate) / suffocate;

	if (!this.alive) 
	    r = Math.min(radius,radius * (this.cost + this.energy) / this.cost);

	if (r < 1) return;
	
	ctx.beginPath();
	ctx.fillStyle   = this.color[0];
	ctx.arc(this.x,this.y,r,0,twopi);
	ctx.fill();
	
	ctx.beginPath();
	ctx.strokeStyle = this.color[1];
	ctx.arc(this.x,this.y,r,0,twopi);
	ctx.stroke();
    },

    // For counting purposes, return the prime only if alive. 
    key : function() {
	return this.alive ? this.prime : null; 
    },

    // Compute one simulation step for this creature. Returns true if the 
    // creature shoudl be removed. 
    step : function(universe) {
	
	// Initially assume we need not collide with anything. The function 
	// will set this value to true if something relevant requires it.
	this.collide = false;
	
	// Recover from suffocation, slowly.
	if (this.suffocate)
	    if (this.suffocate-- >= suffocate)
		return true;
	
	// Grow up
	if (this.egg > 0) { 
	    this.egg = Math.max(0,this.egg - 1 / this.cost);
	    return; 
	}
	
	// Dead things are inactive...
	if (!this.alive) {
	    this.energy -= carrion_decay;
	    if (this.energy + this.cost < 0) return true;
	    this.collide = true;
	    return;
	}

	// Die of starvation
	this.energy -= this.upkeep;
	if (this.energy < 0)
	    return this.die();

	// Dealing with other creatures -----------------------------------

	// If we found a target, do we flee from it ?
	var flee = true;

	// Use this as a "best so far" for selecting the closest relevant
	// target.
        var best_distance = 999999999;

	// No comment.
        var self = this;

	// Are we eating from at least one victim? 
        var eating = false ;

	// An evasion vector for our neighbors (so as not to suffocate).
        var evade = { x : 0, y : 0 };

	// The best target found
	var target = null;

	// How many neighbors in suffocation range ?
        var neighbors = 0;

	universe.each_other(function(other,distance){
	    
	    // Do not collide eggs (this should not really happen anyway, but
	    // better be sure
	    if (other.egg) return;
	    
	    // Are we the same species as them ? 
	    var same_species = self.prime == other.prime && other.alive;
	    
	    // How many steps would it take us to kill them (ignoring 
	    // energy gain from eating us back)
	    var kill_in   = (self.offense > other.defense) 
		? (other.energy / (self.offense - other.defense)) 
		: 1000000;
	    
	    // how many steps would it take them to kill us (ignoring
	    // energy gain from eating them back) 
	    var killed_in = (self.defense < other.offense)
		? (self.energy   / (other.offense - self.defense))
		: 1000000;

	    // We can hunt anything we can kill before dying, is not of our
	    // species, and is within hunting range.
	    var can_hunt = 
		(kill_in < killed_in) 
		&& !same_species 
		&& (distance < self.hunt - other.hide);
	    
	    // We should flee anything that can kill us before dying, is
	    // not of our species, and is within flight range
	    var can_flee = 
		(kill_in > killed_in) 
		&& !same_species 
		&& (distance < self.flee - other.hide);
	    
	    // We found a better target than our current one ! 
	    if ((can_hunt || can_flee) && best_distance > distance) {
		// Flight is more important than hunting...
		flee          = can_flee;
		best_distance = distance;
		target        = other;
	    }
	
	    // Unless we have a specific target, evade anyone we can see     
	    // (including our own species, since they can still suffocate us)
	    var should_evade = 
		!target 
		&& distance < self.flee - other.hide 
		&& distance > 0 
		&& other.alive;
	    
	    if (should_evade) {
		// The closer they are, the larger their impact on our 
		// evasion vector
		evade.x += (self.x - other.x) / (distance * distance) ;
		evade.y += (self.y - other.y) / (distance * distance) ;
	    }

	    // What to do when TOUCHING someone else...
	    if (distance <= radius * 2) {

		// We can actually eat them ! 
		if (!other.egg && self.offense > other.defense && !same_species) {
		    // Determine the bite, eat the morsel, digest it, and say
		    // we are eating...
		    var bite = bitesize * (self.offense - other.defense);
		    self.energy  += self.digest * bite;
		    other.energy -= bite;
		    eating = true;
		}
      
		// They count toward the suffocation list
		if (other.alive) ++neighbors;
	    }
	    
	});
	
	// No target : evade.
	if (target === null) {
	    
	    // Move away from walls, too.
	    var too_left  = width * 0.1 - this.x,
                too_right = this.x - width * 0.9,
                too_up    = height * 0.1 - this.y,
                too_down  = this.y - height * 0.9;
	    
	    if (too_left  > 0) 
		evade.x += 0.00001*too_left*too_left;

	    if (too_right > 0) 
		evade.x -= 0.00001*too_right*too_right;

	    if (too_up   > 0) 
		evade.y += 0.00001*too_up*too_up;

	    if (too_down > 0)
		evade.y -= 0.00001*too_down*too_down;
	    
	    var d = Math.sqrt(evade.x * evade.x + evade.y * evade.y);
	    if (d < 0.01) d = 1;

	    // Move along the evasion vector as fast as possible.

	    flee = false;
	    target = {
		x : evade.x * this.speed / d + this.x,
		y : evade.y * this.speed / d + this.y
	    };
	}
	
	// If not eating, move towards the target we found (or away)
	if (!eating) move(this,target,flee ? -this.speed : this.speed);
	
	// Too crowded in here, die!
	if (!eating && neighbors > 1) this.suffocate += 2;
	
	// If fat enough, give birth
	if (this.energy > this.forkids) {
	    this.energy -= this.forkids;
	    var g = this.genome;
	    around(this,this.kids,function(x,y) {
		universe.add(new creature(g, x, y));
	    });
	}

	// We still have not returned ? we can collide !
	this.collide = true;
    }
    
};

// The life game world. 
function universe() {

    // List of things that can collide with each other. 
    // This list is kept sorted by x-position for fast culling.
    this.collidable = [];
    
    // List of all things, alive or dead.
    this.things     = [];

    // The index of the thing being updated.
    this.current    = 0;

    // The next extinction happens in this number of steps
    this.extinction = 1000;
}

universe.prototype = {

    // Remove the thing at that position without
    // messing up the currently updated thing
    remove : function(pos) {
	if (pos <= this.current) --this.current;
	this.things = this.things.slice(0,pos).concat(this.things.slice(pos+1));
    },


    // Update one thing, remove it if requested.    
    step : function() {

	var thing = this.things[this.current];
	
	// Mark it as "working" so as not to collide it with itelf
	thing.working = true;
	var result = thing.step(this);
	thing.working = false;
	
	if (result === true) this.remove(this.current);
	++this.current;
    },
    
    // Add a brand new thing to the universe.
    add : function(thing) {
	this.things.push(thing);
    },
    
    // Iterate through all the things that can be collided with.
    each_other : function(f) {

	if (this.collidable.length == 0) return;

	var c = this.things[this.current],

	    // Used for culling
            min_x = c.x - c.sight,
	    max_x = c.x + c.sight,
            min_y = c.y - c.sight, 
	    max_y = c.y + c.sight,
	
    	   // Used for binary search
           i1 = 0, i2 = this.collidable.length -1;

	// Perform a binary search to find the smallest x-value that 
	// is not culled.
	while (i2 - i1 > 2) {
	    var m = Math.floor( (i1 + i2) / 2 );
	    if (this.collidable[m].x < min_x) { i1 = m; continue; }
	    else { i2 = m; continue; }
	}

	// Iterate through all collidable values greater than the 
	// minimum x-value
	for (var i = i1; i < this.collidable.length; ++i) {

	    var thing = this.collidable[i];

	    // Early-out if the thing should not collide, but the next one might.
	    if (    thing.working || !thing.collide 
		 || thing.x < min_x || thing.y < min_y || thing.y > max_y
	       )
		continue;

	    // Stop if no more collisions are possible.
	    if (thing.x > max_x) return;
	    
	    var result = f(thing,distance(thing, c));	    
	}
    },

    // Loop through all things, updating them.
    loop : function() {

	this.current = 0;

	// Cause an extinction, now...
	if (--this.extinction <= 0) {

	    // Every creature has a 50% chance of dying
	    for (var i = 0; i < this.things.length; ++i) 
		if (Math.random() < 0.5) 
		    this.things[i].die();

	    this.extinction = 500 * (1 + Math.random());
	}

	// Rebuild the list of collidables and sort it by x-pos
	this.collidable.length = 0 ;
	
	for (var i = 0; i < this.things.length ; ++i)
	    if (this.things[i].collide)
		this.collidable.push(this.things[i]);
	
	this.collidable.sort(function(a,b) { return a.x - b.x; });

	// Step through all the things.
	while (this.current != this.things.length) this.step();

	// Rendering the creatures.
	ctx.globalCompositeOperation = 'destination-over';
	ctx.clearRect(0,0,width,height); 
	for (var i = 0; i < this.things.length; ++i) this.things[i].render();
	
	// Rendering the statistics (how many genomes...)
	var count = {};
	for (var i = 0; i < this.things.length; ++i) {
	    var k = this.things[i].key();
	    if (k) count[k] = (count[k] || 0) + 1;
	}

	var stats = [];
	for (var k in count) {
	    var g = genome_of_prime(k);
	    stats.push([count[k], g, genome_name(g)]);
	}
	
	stats.sort(function(a,b){ return a[0] - b[0] });
	stats.reverse();
	stats = stats.slice(0,10);
	
	var html = [];
      
	html.push("<table>");
	
	for (var i = 0; i < stats.length; ++i) {
	    var color = genome_color(stats[i][1]);
	    html.push("<tr><td><div style='width:16px;height:16px;float:left;background-color:",
	              color[0],
	              ";border:1px solid ",
	              color[1],
	              "'></div></td><td> ",
		      stats[i][2],
		      "</td><td><b> &times; ",
		      stats[i][0],
		      "</b></td></tr>");
	}
	
	html.push("</table>");
	
	list.innerHTML = html.join("");
    }
}

// Start a new universe, pop some creatures, start rendering them
function life() {

  var canvas = document.getElementById("canvas");
  window.ctx = canvas.getContext("2d");

  window.list = document.getElementById("list");
    
  var u = new universe();

  for (var i = 0; i < 50; ++i)
    u.add(random());

  function loop() {
    u.loop();
    setTimeout(loop,1);
  }

  loop();
}

