const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/puzzles.json', 'utf8'));

const newDays = [
  {
    day: 6,
    date: "2026-08-22",
    title: "THE DOCTOR'S SECRET",
    story: "(Journal Entry - Detective Elias Thorne, Sept 9, 1926)\nI took the morning train to Albany, following the ticket stub trail to the Blackwood Sanatorium. The head physician, Dr. Aris Thorne (no relation, thankfully), was remarkably uncooperative. He insisted patient records were strictly confidential. However, a sympathetic nurse slipped me a folded napkin as I left the grounds. It seems Clara Vance was here, registered under an assumed name, but she escaped three days before her father’s murder. Dr. Thorne has been receiving hefty monthly payments from Vance & Sterling Shipping Co. to keep her locked away. The nurse’s note contained two coded messages, likely passed between the doctor and his mysterious benefactors.",
    easy: "CLARA FLED ON SUNDAY.",
    hard: "THE DOCTOR KEPT HER DRUGGED TO PREVENT HER FROM REVEALING THE BOOTLEGGING ROUTES."
  },
  {
    day: 7,
    date: "2026-08-23",
    title: "THE MIDNIGHT RUNNER",
    story: "(Newspaper Clipping - The Waterfront Whisperer, Sept 10, 1926)\nA suspicious vessel, The Midnight Runner, was raided by the Coast Guard late last night in the harbor. Registered to Vance & Sterling Shipping Co., the cargo manifest claimed it was transporting textiles from Cuba. However, underneath the crates of silk, authorities uncovered hundreds of crates of premium Canadian whiskey! Rumors are swirling that Archibald Vance discovered the illegal use of his ships and threatened to expose the whole operation. Was he murdered to protect a million-dollar bootlegging empire? A cryptic ledger was found in the captain’s quarters, containing encoded entries that point fingers at high society.",
    easy: "STERLING IS THE BOSS.",
    hard: "VANCE FOUND THE FAKE MANIFESTS AND VOWED TO BURN THE SHIPS TO THE GROUND."
  },
  {
    day: 8,
    date: "2026-08-24",
    title: "THE BUTLER'S CONFESSION",
    story: "(Police Interrogation Transcript - Sept 11, 1926)\nI brought Reginald, the Vance family butler, in for questioning today. He has served the family for twenty years but looked as though he had aged a decade overnight. He finally broke under pressure, admitting he saw someone enter the study minutes before Archibald Vance was found dead. Reginald claims he was paid handsomely to look the other way and forget what he saw. When asked who paid him, Reginald refused to speak, terrified for his life. A search of his quarters turned up a roll of fifty-dollar bills and a matchbook from a notorious downtown speakeasy, The Blind Tiger, with a message scrawled inside.",
    easy: "A WOMAN IN A RED DRESS.",
    hard: "THE POISON WAS DELIVERED BY THE WIDOW BUT SHE DID NOT ACT ALONE."
  },
  {
    day: 9,
    date: "2026-08-25",
    title: "SECRETS IN THE SAFE",
    story: "(Journal Entry - Detective Elias Thorne, Sept 12, 1926)\nUsing the clue decoded from Beatrice’s charred note, I finally located the hidden wall safe in the library, concealed behind the painting of the red sailboat. The combination worked perfectly. Inside, I didn't find money or jewels, but an explosive collection of blackmail material. Archibald Vance had dirt on half of New York’s elite, including the Mayor, the Chief of Police, and, notably, his own partner, Arthur Sterling. There was also a birth certificate indicating Clara was not Beatrice’s stepdaughter, but her biological child—a scandal Beatrice desperately tried to hide from high society. Among the files were two coded documents.",
    easy: "BEATRICE LIED TO EVERYONE.",
    hard: "CLARA THREATENED TO EXPOSE THE BLACKMAIL RING TO THE PRESS IF HER FATHER DID NOT STOP."
  },
  {
    day: 10,
    date: "2026-08-26",
    title: "A VOICE FROM THE SHADOWS",
    story: "(Intercepted Letter - Sept 13, 1926)\nA letter arrived at the precinct today, addressed directly to me. It smelled faintly of lavender and damp earth. The handwriting was elegant but frantic. It was from Clara Vance. She reveals she is hiding in plain sight in the city, terrified for her life. She claims her father’s death was just the beginning, and that The Blind Tiger is the center of the conspiracy. She watched the murder happen from a secret passageway in the study but couldn't see the killer’s face—only a distinctive silver cane. She enclosed two ciphers, promising they hold the key to the killer's identity.",
    easy: "FIND THE SILVER CANE.",
    hard: "ARTHUR STERLING WALKS WITH A LIMP BUT I SAW THE WIDOW HOLDING THE CANE."
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

