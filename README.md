AGoL (Another Game of Life) simulates an ecosystem of single-celled organisms that breed, die, evolve and eat each other.

## Installing AGoL

Just make sure than `jslife.js` is available within the same path as `index.html` 

## The rules of the simulation

Organisms are single cells that all have the same radius. Every cell has a *genome* which is transmitted to its descendants and determines a certain number of properties that the cell has. 

Cells store **energy** that they collect from various sources and spend on effects:

 - Eating other cells, including dead cells, provides nourishment in the form of energy. 
 - Conversely, being eaten causes a loss of energy.
 - Every gene requires a small amount of energy as upkeep. That amount increases quadratically with the number of genes in the cell's genome.
 - An exception is the `Autotrophy` gene, which provides a constant amount of energy.
 - When the cell accumulates enough energy, it gives birth to another cell by splitting. 

A cell that reaches zero energy dies. It leaves behind a body that can be scavenged for a small amount of energy, and that quickly fades away.

When two cells touch, it can have two effects: either they fight, or they suffocate. 

If a cell is **suffocated** by at least two others, it starts shrinking until it disappears. If the suffocation stops before the cell has disappeared, it slowly recovers and grows back to its initial size. 

When two cells **fight**, each cell gains or loses energy based on several factors. The offensive capability of a cell increases how much energy damage it inflicts. Conversely, the defensive capability decreases the damage it receives. Damage is actually *feeding*, so each cell gains some amount of energy from feeding.

 - `Offense` and `Strength` genes improve the offensive capability.
 - `Defense` and `Strength` genes improve the defensive capability.
 - `Digestion` increases the percentage of energy that is obtained from feeding.
 - `Autotrophy` has the side-effect of *decreasing* the percentage of energy from feeding.

The fight stops when one cell runs out of energy.

Two cells that share the same genome never fight, but they might suffocate each other.

Cells move around. Their speed is primarily affected by `Strength` genes. `Offense` genes also cause a small increase in movement speed.

The main reason for cells to move is to avoid suffocation - they try to keep away from any nearby cells they see, and avoid the four edges of the world whenever possible.

Another reason for moving is to **flee** a predator - any cell that would win in a one-on-one fight against them. Cells move away at full speed from the closest predator they see. The detection range of predators is quite small, and hardly extends away from the cell's edge. However, the `Flee` gene greatly extends the detection range, allowing a cell to detect a predator before the predator can detect it.

Yet another reason for moving is to **hunt** a prey - any cell that would lose in a one-on-one fight against them. Cells move at full speed towards the closest prey they see (but this behavior has a lower priority than fleeing). The detection range for hunting is slightly wider than that of flight, and can be increased by `Hunt` genes. 

Both `Flee` and `Hunt` genes slightly improve movement speed.

A cell my have the `Camouflage` gene to make it harder to detect - effectively reducing the flee and hunt ranges for any other cells trying to detect it. As such, this aids in both hunting and in evading predators.

Cells reproduce through division. A cell gives birth to one new cell per reproductive cycle, though each `Fertility` gene increases this number by one. Each child can have a random mutation : removing a gene, adding a gene or replacing a gene with another gene.

Cells die when they run out of energy (through starvation or fighting) or are suffocated. They also have a 50% of dying during randomly-occurring extinction events. Suffocation leaves no body behind.