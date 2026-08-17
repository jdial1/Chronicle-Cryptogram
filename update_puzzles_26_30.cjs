const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/puzzles.json', 'utf8'));

const newDays = [
  {
    day: 26,
    date: "2026-09-11",
    title: "THE WIDOW'S LAST STAND",
    story: "(Newspaper Clipping - The Waterfront Whisperer, Sept 29, 1926)\nIn federal custody, Beatrice Vance attempted one final, desperate play. She tried to seduce the federal prosecutor, offering him the location of a hidden off-shore vault containing a million dollars in gold bullion if he would drop her charges and pin the mastermind label solely on Sterling. The prosecutor, unswayed, recorded the entire conversation. Detective Thorne used the coordinates Beatrice foolishly revealed to locate the vault, securing the stolen wealth for the Vance estate. The trial of the century begins tomorrow, and the city's corrupt elite are trembling as subpoenas are handed out like candy.",
    easy: "SHE TRIED TO BRIBE THE LAWYER.",
    hard: "THE GOLD BULLION WILL BE RETURNED TO THE RIGHTFUL HEIR. BEATRICE WILL ROT IN PRISON."
  },
  {
    day: 27,
    date: "2026-09-12",
    title: "THE TRIAL OF THE CENTURY",
    story: "(Journal Entry - Detective Elias Thorne, Sept 30, 1926)\nThe courtroom was packed to the rafters as the trial of Arthur Sterling and Beatrice Vance commenced. Photographers' flashbulbs popped like firecrackers as Clara Vance took the witness stand. Dressed in a modest navy suit, she recounted her father’s murder and her harrowing abduction with a poise that won over the jury instantly. Sterling’s high-priced attorneys attempted to poke holes in my rogue investigation, but the federal prosecutor introduced the decoded bootlegging ledger as exhibit A. The jury deliberated for less than an hour. The hammer of justice has finally fallen on the Vance and Sterling syndicate.",
    easy: "JUSTICE HAS BEEN SERVED.",
    hard: "THE JURY DID NOT BELIEVE THE LIES TOLD BY THE DEFENSE. THE BOOTLEGGING EMPIRE IS CRUSHED."
  },
  {
    day: 28,
    date: "2026-09-13",
    title: "THE SECRET INHERITANCE",
    story: "(Police Evidence File - Narrative Account, Oct 1, 1926)\nWith the gavel falling on her stepmother, Clara Vance finally returned to her father's sprawling Long Island estate. Escorted by Detective Thorne, she met with Archibald's private attorney. It turns out, Archibald knew his life was in danger long before the gala. He had quietly transferred the majority of his legitimate assets, real estate, and shipping patents into a blind trust solely in Clara's name. Beatrice never stood a chance at inheriting the empire, even if her murderous plot had succeeded without a hitch. Among the legal documents, Thorne found two final cryptograms left by Archibald himself.",
    easy: "MY DAUGHTER INHERITS EVERYTHING.",
    hard: "I KNEW THEY WERE PLOTTING AGAINST ME. I ENSURED MY FORTUNE WOULD BE SAFE FROM THEIR GREED."
  },
  {
    day: 29,
    date: "2026-09-14",
    title: "A NEW DAWN",
    story: "(Newspaper Clipping - The New York Chronicle, Oct 2, 1926)\nA crisp autumn wind blew off the harbor as Clara Vance stood before the headquarters of the newly renamed Vance Maritime Company. Her first act as sole proprietor was to fire every dock manager, accountant, and captain with ties to Arthur Sterling's illegal operations. She dismantled the bootlegging empire overnight, replacing the corrupt fleet with honest crews and legitimate cargo manifests. Detective Thorne watched from the docks, a rare smile on his face, as the first clean ships set sail. The rot has been cut out of New York, but a few loose ends needed tying up in Thorne’s journal.",
    easy: "THE SHIPS SAIL WITH CLEAN CARGO.",
    hard: "CLARA WILL MAKE HER FATHER PROUD. SHE DESTROYED THE CRIME SYNDICATE AND SAVED THE COMPANY."
  },
  {
    day: 30,
    date: "2026-09-15",
    title: "CASE CLOSED",
    story: "(Journal Entry - Detective Elias Thorne, Oct 3, 1926)\nI sit in my favorite diner, watching the rain wash the city streets clean. The Vance case is officially closed. Arthur Sterling and Beatrice Vance are rotting in federal penitentiaries, and Mayor Harrison’s corrupt administration is nothing but a disgraced memory. My badge is back on my coat, polished and heavy. Before she left for a tour of Europe, Clara Vance sent me a parting gift: a gold pocket watch engraved with my name, and a small envelope containing two final ciphers. It’s a quiet morning, and for the first time in a long time, New York feels safe.",
    easy: "THANK YOU FOR SAVING MY LIFE.",
    hard: "YOU ARE A TRUE DETECTIVE. I WILL NEVER FORGET WHAT YOU DID FOR MY FAMILY THIS AUTUMN."
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

