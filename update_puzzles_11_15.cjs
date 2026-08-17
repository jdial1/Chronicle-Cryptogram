const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/puzzles.json', 'utf8'));

const newDays = [
  {
    day: 11,
    date: "2026-08-27",
    title: "INTO THE TIGER'S DEN",
    story: "(Journal Entry - Detective Elias Thorne, Sept 14, 1926)\nFollowing the matchbook clue, I traded my detective's coat for a cheap suit and slinked into The Blind Tiger. The speakeasy was thick with cigar smoke, bathtub gin, and the frantic rhythm of a ragtime band. Through the haze, I spotted Arthur Sterling tucked away in a velvet VIP booth, sweating profusely while negotiating with two known enforcers from the East Side mob. The bartender was acting as their go-between, passing folded notes under cocktail napkins. I managed to swipe one of the napkins when a scuffle broke out by the roulette table. The criminal underground is firmly embedded in Vance's shipping empire, and these ciphers prove it.",
    easy: "STERLING MET WITH THE MOB.",
    hard: "THE BARTENDER SERVES MORE THAN DRINKS. HE DISTRIBUTES THE PAYOFFS FOR THE DOCKS."
  },
  {
    day: 12,
    date: "2026-08-28",
    title: "THE MURDER WEAPON FOUND?",
    story: "(Newspaper Clipping - The New York Chronicle, Sept 15, 1926)\nA major breakthrough in the Vance murder case! A local pawnshop owner stepped forward this morning with a silver-handled cane, matching the description provided by our anonymous sources. The owner claims a woman draped in black veils pawned the item for a fraction of its worth just hours after Archibald Vance was discovered dead. Upon police inspection, the cane was revealed to hollow, containing a hidden glass compartment. Residual tests confirmed the presence of bitter almonds—liquid cyanide. While Arthur Sterling is known to walk with a limp, whispers in the precinct suggest this evidence might be a meticulously planted frame-up.",
    easy: "THE CANE HOLDS THE POISON.",
    hard: "BEATRICE STOLE THE CANE FROM ARTHUR TO FRAME HIM FOR THE MURDER OF HER HUSBAND."
  },
  {
    day: 13,
    date: "2026-08-29",
    title: "AN EMPTY ROOM",
    story: "(Journal Entry - Detective Elias Thorne, Sept 16, 1926)\nUsing the postmarks from Clara's letter, I tracked her hideout to a run-down boarding house in the Bowery. I was too late. The door hung off its hinges, and the small room had been violently tossed. A shattered mirror and a knocked-over chair pointed to a desperate struggle. Clara Vance has been taken. On the remaining shards of the vanity mirror, someone—likely Clara in her final moments before capture—had hastily scrawled a message using red lipstick. The implications of this code are staggering. If this is true, the rot in this city goes much higher than a shipping company.",
    easy: "THEY FOUND ME.",
    hard: "THE MAYOR IS INVOLVED. HE ORDERED THE RAID ON THE SHIPS TO COVER HIS OWN TRACKS."
  },
  {
    day: 14,
    date: "2026-08-30",
    title: "A GRUESOME DISCOVERY",
    story: "(Police Evidence File - September 17, 1926)\nA body was pulled from the East River at dawn. My stomach dropped, fearing it was Clara, but the victim was identified as Reginald, the Vance family butler. His pockets were weighed down with cobblestones, a classic mob execution. Attached to his suspenders was a waterproof oilskin pouch. Inside, we found a torn page matching the missing 1923 maritime logbooks from Vance's office. Reginald must have stolen it for insurance, blackmailing the killer before they decided to permanently silence him. The logbook page contains shipping coordinates and a terrifying cipher that changes everything we know about the smuggling ring.",
    easy: "SILENCE HAS A PRICE.",
    hard: "THE LOGBOOK PROVES THAT STERLING WAS SMUGGLING WEAPONS ALONG WITH THE WHISKEY."
  },
  {
    day: 15,
    date: "2026-08-31",
    title: "THE MAYOR STEPS DOWN",
    story: "(Newspaper Clipping - The Long Island Tattler, Sept 18, 1926)\nIn a shocking morning press conference, Mayor H. Harrison announced his immediate resignation, citing \"sudden and severe health reasons.\" The city is buzzing with speculation, but our precinct knows the truth. Detective Thorne raided the Mayor’s private office just as the movers were packing his mahogany desk. Hidden in the false bottom of a cigar humidor, Thorne discovered the blackmail materials Archibald Vance had been using to bleed the Mayor dry. Vance had him in a vice grip, and the Mayor had every reason to want him dead. Thorne has submitted two coded threats from Vance to the lab for decryption.",
    easy: "RESIGN OR BE EXPOSED.",
    hard: "THE POLICE CHIEF IS ALSO ON THE PAYROLL. DO NOT TRUST ANYONE IN UNIFORM."
  }
];

newDays.forEach(d => {
  // Easy
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
  // Hard
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

