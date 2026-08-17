const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/puzzles.json', 'utf8'));

const newDays = [
  {
    day: 21,
    date: "2026-09-06",
    title: "THE BAIT IS SET",
    story: "(Journal Entry - Detective Elias Thorne, Sept 24, 1926)\nWith the local police force hopelessly compromised by Sterling’s payroll, Clara and I cannot simply walk into a precinct. We need an airtight confession, and we need to draw the rats out of the shadows. We decided to set a trap. Using a trusted dockworker, I leaked a rumor that Clara possesses her father's original bootlegging ledger—complete with the Mayor’s signature—and is willing to trade it for her safe passage to Europe. We arranged a midnight meeting at the abandoned Pier 84. I only hope Arthur Sterling’s greed outweighs his caution. Two encoded messages were sent via courier to ensure the trap is sprung.",
    easy: "CLARA WILL MEET HIM TONIGHT.",
    hard: "STERLING BELIEVES WE HAVE THE LEDGER. HE WILL COME ALONE TO NEGOTIATE."
  },
  {
    day: 22,
    date: "2026-09-07",
    title: "A SHOCKING ARRIVAL",
    story: "(Police Evidence File - Narrative Account, Sept 25, 1926)\nThe trap at Pier 84 was set. Clara stood nervously by a single flickering lantern, clutching a decoy ledger. I was perched high above in the rusted iron rafters, my revolver drawn. A sleek black Packard silently rolled onto the damp wooden docks. The door opened, but it wasn't Arthur Sterling who stepped out. It was Beatrice Vance, wrapped in mink and holding a pearl-handled Derringer! She had posted bail, or her corrupt connections had sprung her. Aiming the gun at her stepdaughter, Beatrice laughed, confessing she had manipulated Sterling's mob connections from the start. She wanted the fortune all to herself.",
    easy: "BEATRICE PULLS THE STRINGS.",
    hard: "THE WIDOW PLAYED EVERYONE FOR FOOLS. SHE BLACKMAILED ARTHUR INTO DOING HER DIRTY WORK."
  },
  {
    day: 23,
    date: "2026-09-08",
    title: "HONOR AMONG THIEVES",
    story: "(Journal Entry - Detective Elias Thorne, Sept 26, 1926)\nBefore Beatrice could pull the trigger, the shadows around the Packard shifted. Arthur Sterling stepped forward, his heavy cane gleaming in the moonlight. He knew I was setting a trap, but he allowed Beatrice to walk into it first, using her as a shield. The two accomplices instantly turned on each other! Sterling revealed he had secretly kept the empty poison vial Beatrice used to murder her husband, intending to frame her if the police ever closed in. Mob enforcers melted out of the fog, surrounding both of them, guns drawn. A terrifying Mexican standoff ensued on the rotting planks of the pier.",
    easy: "THIEVES ALWAYS TURN ON EACH OTHER.",
    hard: "STERLING HAS THE POISON VIAL. HE INTENDS TO KILL BEATRICE AND BLAME THE MURDER ON HER."
  },
  {
    day: 24,
    date: "2026-09-09",
    title: "THE FEDS SWOOP IN",
    story: "(Newspaper Clipping - The New York Chronicle, Sept 27, 1926)\nThe standoff at Pier 84 was shattered by the wail of sirens. But it wasn't the corrupt NYPD—it was federal agents! Detective Thorne had secretly telegraphed the Bureau of Investigation with the ledger's coordinates. Bureau boys swarmed the pier with Tommy guns. A massive firefight erupted against the bootleggers. Beatrice Vance dropped her weapon and surrendered instantly, weeping for a lawyer. Arthur Sterling attempted to sprint toward a waiting speedboat, but Thorne tackled him to the dock, sending his silver cane plunging into the dark waters of the Hudson River. The reign of the Vance & Sterling crime syndicate has violently ended.",
    easy: "THE FEDS ARRIVED JUST IN TIME.",
    hard: "THE MOB ENFORCERS WERE ARRESTED. STERLING IS FINALLY IN CUSTODY BUT THE FIGHT IS NOT OVER."
  },
  {
    day: 25,
    date: "2026-09-10",
    title: "A CONFESSION UNDER NEON",
    story: "(Police Interrogation Transcript - Federal Bureau, Sept 28, 1926)\nSitting under the buzzing lights of a federal interrogation room, Arthur Sterling finally broke. With his mob muscle locked up and his corrupt police contacts facing federal indictments, he had no protection left to hide behind. Sweating and trembling, he confessed that Archibald Vance was preparing to turn the shipping company over to the authorities. Beatrice, terrified of losing her lavish lifestyle and social standing, approached Sterling with the cyanide. They plotted the murder together to protect their wealth. Behind the two-way mirror, Clara Vance stood beside me, watching the man who destroyed her family finally face justice.",
    easy: "STERLING SIGNS A FULL CONFESSION.",
    hard: "THE CONSPIRACY HAS BEEN BROKEN. THE GUILTY WILL FACE THE ELECTRIC CHAIR FOR THEIR CRIMES."
  }
];

newDays.forEach(d => {
  data.push({
    id: `day_${d.day}_easy`,
    editionDate: d.date,
    editionNumber: d.day,
    title: `Day ${d.day} - Easy`,
    headline: d.title,
    subheadline: d.story,
    authorOrSource: d.story.split('\n')[0].replace(/^\(|\)$/g, ''),
    originalText: d.easy,
    difficulty: "Easy",
    difficultyMode: "Easy",
    editionSlot: "Morning",
    theme: "1920s Mystery",
    category: "Daily Featured",
    hints: []
  });
  data.push({
    id: `day_${d.day}_hard`,
    editionDate: d.date,
    editionNumber: d.day,
    title: `Day ${d.day} - Hard`,
    headline: d.title,
    subheadline: d.story,
    authorOrSource: d.story.split('\n')[0].replace(/^\(|\)$/g, ''),
    originalText: d.hard,
    difficulty: "Hard",
    difficultyMode: "Hard",
    editionSlot: "Evening",
    theme: "1920s Mystery",
    category: "Daily Featured",
    hints: []
  });
});

fs.writeFileSync('src/data/puzzles.json', JSON.stringify(data, null, 2));

