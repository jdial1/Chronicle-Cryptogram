const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/puzzles.json', 'utf8'));

const newDays = [
  {
    day: 16,
    date: "2026-09-01",
    title: "THE CHIEF'S DILEMMA",
    story: "(Journal Entry - Detective Elias Thorne, Sept 19, 1926)\nWith the Mayor stepping down and the Police Chief implicated in the blackmail ring, I realize I cannot trust my own department. I am entirely on my own. Last night, I broke into the Chief’s private office, searching for any indication of where Clara Vance might have been taken. The corrupt Chief had been feeding information directly to the mob. Under his blotter, I discovered a carbon copy of a secretly intercepted telegraph message, routed away from my desk. It contained coordinates and a chilling deadline. They are holding Clara somewhere on the waterfront, and they plan to silence her tonight.",
    easy: "TRUST NO ONE IN BLUE.",
    hard: "CLARA IS BEING HELD AT THE ABANDONED WAREHOUSE ON PIER FORTY FOUR. SHE HAS UNTIL MIDNIGHT."
  },
  {
    day: 17,
    date: "2026-09-02",
    title: "SHOOTOUT AT PIER 44",
    story: "(Newspaper Clipping - The Waterfront Whisperer, Sept 20, 1926)\nGunfire shattered the midnight quiet at Pier 44! A lone, rogue detective engaged in a fierce shootout with three known mob enforcers outside an abandoned warehouse. When the smoke cleared, the gangsters had fled into the foggy night, leaving behind a terrified but unharmed Clara Vance. The missing heiress has finally been found! Detective Thorne escorted her to a secure, undisclosed location. Rumors say Clara has agreed to testify about the night of her father's murder, and what she witnessed from the secret passage in his study changes the entire investigation. She carried two coded notes she stole from her captors.",
    easy: "CLARA IS SAFE NOW.",
    hard: "STERLING WAS AT THE SPEAKEASY DURING THE MURDER. HE IS A BOOTLEGGER BUT NOT THE KILLER."
  },
  {
    day: 18,
    date: "2026-09-03",
    title: "THE DAUGHTER'S TALE",
    story: "(Police Interrogation Transcript - Sept 21, 1926)\nClara sat trembling, drinking black coffee. \"I was hiding in the priest-hole behind the bookshelves,\" she whispered. \"My father was threatening to burn Sterling's smuggling ships, yes, but Arthur wasn't there that night. It was my stepmother, Beatrice. She wasn't alone.\" Clara detailed a horrifying scene: Beatrice Vance entered the locked study with a tall man wearing a tailored tuxedo. While the man held a pistol to Archibald's back, forcing his silence, Beatrice poured the poisoned drink and made him swallow it. The killers then wiped the glass and slipped out. Clara hastily sketched two ciphers, recalling details of the tall man.",
    easy: "TWO KILLERS IN THE ROOM.",
    hard: "BEATRICE POURED THE DRINK WHILE A TALL MAN IN A TAILORED SUIT HELD THE WEAPON."
  },
  {
    day: 19,
    date: "2026-09-04",
    title: "THE DOCTOR RETURNS",
    story: "(Journal Entry - Detective Elias Thorne, Sept 22, 1926)\nA tall man in a tailored tuxedo. The pieces rapidly clicked together. I immediately pulled the passenger train manifests traveling from Albany to New York on the day of the murder. There it was: Dr. Aris Thorne. The physician who kept Clara locked away in the sanatorium had arrived in the city mere hours before the gala. Beatrice and the Doctor had been exchanging letters for months. They conspired to eliminate Archibald, frame Arthur Sterling with the planted cyanide cane, and split the massive inheritance between them. A search of the Doctor's abandoned Albany office yielded a ledger filled with coded confessions.",
    easy: "DOCTOR THORNE WAS THERE.",
    hard: "THE DOCTOR SUPPLIED THE CYANIDE FROM HIS MEDICAL BAG AND HELPED BEATRICE BYPASS THE LOCK."
  },
  {
    day: 20,
    date: "2026-09-05",
    title: "LOVERS ON THE RUN",
    story: "(Newspaper Clipping - The New York Chronicle, Sept 23, 1926)\nFugitives! A city-wide manhunt is underway for socialite Beatrice Vance and Dr. Aris Thorne. Armed with Clara's testimony and the Albany train records, Detective Thorne kicked down the door to Beatrice's luxurious suite at the Plaza Hotel this morning. He found the room empty, the faint scent of expensive French perfume lingering in the air. The wall safe was open and completely cleaned out. The murderous lovers have fled with whatever cash and jewels they could carry. A terrified maid reported seeing them rushing toward the harbor, leaving behind a coded note on the vanity mirror meant to mock the police.",
    easy: "THEY ARE FLEEING THE CITY.",
    hard: "STOP THE STEAMER HEADING TO HAVANA. THEY CARRY THE STOLEN CASH IN A LEATHER TRUNK."
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

