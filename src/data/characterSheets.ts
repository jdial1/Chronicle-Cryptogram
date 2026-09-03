export const STORY_SPAN = {
  start: '1926-09-04',
  end: '1926-10-03',
} as const;

export const WEEKLY_TENTPOLES = [
  {
    week: 1,
    span: { start: '1926-09-04', end: '1926-09-09' },
    title: 'The Panic',
    beats: [
      'The murder.',
      'The altered will.',
      'The flight from the asylum.',
    ],
  },
  {
    week: 2,
    span: { start: '1926-09-10', end: '1926-09-16' },
    title: 'The Sins Exposed',
    beats: [
      'The bootlegging reveal.',
      'The mother twist.',
      "Clara's capture.",
    ],
  },
  {
    week: 3,
    span: { start: '1926-09-17', end: '1926-09-23' },
    title: 'The Systemic Rot',
    beats: [
      'Systemic corruption (Mayor / Police Chief).',
      'Pier 44 shootout.',
      'Thorne goes rogue.',
    ],
  },
  {
    week: 4,
    span: { start: '1926-09-24', end: '1926-09-30' },
    title: 'The Rats Eat Each Other',
    beats: [
      'The Pier 84 trap.',
      'Beatrice kills the doctor.',
      'Sterling snitches.',
      'The trial.',
    ],
  },
  {
    week: 5,
    span: { start: '1926-10-01', end: '1926-10-03' },
    title: 'The New Dawn',
    beats: [
      "Archibald's posthumous victory.",
      'Clara takes over.',
      'Thorne leaves the badge.',
    ],
  },
] as const;

export const MASTER_CHRONOLOGY = [
  {
    day: 1,
    week: 1,
    date: '1926-09-04',
    weekday: 'Saturday',
    event: 'Archibald poisoned in study; telegram draft drafted; gala in progress.',
  },
  {
    day: 2,
    week: 1,
    date: '1926-09-05',
    weekday: 'Sunday',
    event: 'Clara escapes Blackwood Sanatorium; Beatrice interviewed; scorched scrap found (a revocation Archibald deliberately planted for her to burn as bait).',
  },
  {
    day: 3,
    week: 1,
    date: '1926-09-06',
    weekday: 'Monday',
    event: 'Will reading; Sterling panics; Albany transit receipt recovered.',
  },
  {
    day: 4,
    week: 1,
    date: '1926-09-07',
    weekday: 'Tuesday',
    event: 'Sterling scrubs shipping office; 1923 Cuban Silk manifest folders stolen.',
  },
  {
    day: 5,
    week: 1,
    date: '1926-09-08',
    weekday: 'Wednesday',
    event: 'Wire intercepted: Beatrice demands Plaza cut; Blackwood bluffs Sterling.',
  },
  {
    day: 6,
    week: 1,
    date: '1926-09-09',
    weekday: 'Thursday',
    event: 'Thorne confronts Blackwood in Albany; nurse reveals Clara fled Sunday. Thorne assumes Blackwood is strictly an upstate blackmailer.',
  },
  {
    day: 7,
    week: 2,
    date: '1926-09-10',
    weekday: 'Friday',
    event: 'Coast Guard raids The Midnight Runner; planted bootlegging ledger seized.',
  },
  {
    day: 8,
    week: 2,
    date: '1926-09-11',
    weekday: 'Saturday',
    event: "Reginald interrogated; admits the mortise lock works from both sides and that he let them in, sealed them, then locked the corpse in. Chief O'Malley prepares to release him on Sterling's orders.",
  },
  {
    day: 9,
    week: 2,
    date: '1926-09-12',
    weekday: 'Sunday',
    event: "Library wall safe cracked; birth certificate proves Beatrice is Clara's mother. O'Malley springs Reginald for insufficient evidence on Sterling's payroll.",
  },
  {
    day: 10,
    week: 2,
    date: '1926-09-13',
    weekday: 'Monday',
    event: "Clara's letter reveals she slipped into the priest-hole uninvited; silver cane and deep voice behind the wall. Thorne hunts a 'Manhattan phantom', blind to Albany.",
  },
  {
    day: 11,
    week: 2,
    date: '1926-09-14',
    weekday: 'Tuesday',
    event: 'Thorne infiltrates Blind Tiger; discovers Sterling hiring East Side muscle.',
  },
  {
    day: 12,
    week: 2,
    date: '1926-09-15',
    weekday: 'Wednesday',
    event: 'Pawned silver cane recovered; lab finds bitter almond cyanide traces. Sterling keeps a carbon from his crooked chemist.',
  },
  {
    day: 13,
    week: 2,
    date: '1926-09-16',
    weekday: 'Thursday',
    event: 'Bowery hideout raided by crooked cops; Clara abducted under City warrant.',
  },
  {
    day: 14,
    week: 3,
    date: '1926-09-17',
    weekday: 'Friday',
    event: "Reginald found dead in East River. Sprung by O'Malley, he tried to squeeze Sterling with a planted ledger scrap, linking rifles to Tammany armories. It cost him his life.",
  },
  {
    day: 15,
    week: 3,
    date: '1926-09-18',
    weekday: 'Saturday',
    event: 'Mayor Harrison resigns after Thorne raids humidor blackmail file.',
  },
  {
    day: 16,
    week: 3,
    date: '1926-09-19',
    weekday: 'Sunday',
    event: "Thorne raids Chief's blotter; uncovers midnight execution order at Pier 44.",
  },
  {
    day: 17,
    week: 3,
    date: '1926-09-20',
    weekday: 'Monday',
    event: "Pier 44 shootout; Thorne kills corrupt Police Chief O'Malley; Clara rescued.",
  },
  {
    day: 18,
    week: 3,
    date: '1926-09-21',
    weekday: 'Tuesday',
    event: "Clara testifies: she slipped into the priest-hole uninvited; mortise lock worked both sides; cyanide toast dropped him in seconds.",
  },
  {
    day: 19,
    week: 3,
    date: '1926-09-22',
    weekday: 'Wednesday',
    event: "Blackwood's Grand Central bag seized. Contains cyanide residue and travel alias. Thorne finally realizes the Albany doctor took a phantom train down for the murder.",
  },
  {
    day: 20,
    week: 3,
    date: '1926-09-23',
    weekday: 'Thursday',
    event: 'Dempsey-Tunney fight night; Plaza emptied; steamer is a decoy; pair goes to ground in a Packard; Blackwood gets cold feet.',
  },
  {
    day: 21,
    week: 4,
    date: '1926-09-24',
    weekday: 'Friday',
    event: 'Thorne weaponizes one of Archibald\'s vague shipping breadcrumbs, leaking rumors of "offshore gold" at Pier 84; Beatrice keeps Blackwood in the Packard to claim it all.',
  },
  {
    day: 22,
    week: 4,
    date: '1926-09-25',
    weekday: 'Saturday',
    event: 'Pier 84 ambush; Beatrice shoots Blackwood in Packard to keep the fortune.',
  },
  {
    day: 23,
    week: 4,
    date: '1926-09-26',
    weekday: 'Sunday',
    event: 'Sterling uses Beatrice as human shield; Thorne captures both. Sterling reveals he kept the chemist receipt because Blackwood used his crooked supplier.',
  },
  {
    day: 24,
    week: 4,
    date: '1926-09-27',
    weekday: 'Monday',
    event: "Federal Treasury agents sweep Pier 84; Thorne writes that he is executing Archibald's vengeance, not merely closing a murder.",
  },
  {
    day: 25,
    week: 4,
    date: '1926-09-28',
    weekday: 'Tuesday',
    event: 'Federal neon tank: Sterling confesses Beatrice poured the champagne.',
  },
  {
    day: 26,
    week: 4,
    date: '1926-09-29',
    weekday: 'Wednesday',
    event: "Beatrice offers offshore fortune for a plea; Treasury finds the real vault in Clara's name. Thorne's bait was Archibald's map.",
  },
  {
    day: 27,
    week: 4,
    date: '1926-09-30',
    weekday: 'Thursday',
    event: 'Capital murder trial; Exhibit A ledger delivers electric chair verdict.',
  },
  {
    day: 28,
    week: 5,
    date: '1926-10-01',
    weekday: 'Friday',
    event: "Thaddeus Vance opens the death lockbox; 1923 dead-man's trust triggers; patents and fleet were never theirs.",
  },
  {
    day: 29,
    week: 5,
    date: '1926-10-02',
    weekday: 'Saturday',
    event: 'Clara purges manifests; burns blackmail cache; takes over maritime line.',
  },
  {
    day: 30,
    week: 5,
    date: '1926-10-03',
    weekday: 'Sunday',
    event: 'Thorne leaves badge on diner counter; Clara boards Paris steamer; gold watch delivered.',
  },
] as const;

export const LOCKED_ROOM = {
  victim: 'Archibald Vance',
  method:
    'Poisoned champagne (cyanide). The toast was talked through first; the glass dropped him in seconds. No lingering conversation after the sip.',
  poisoner: 'Beatrice Vance poured the poison.',
  cyanideSource: "Smuggled in Dr. Blackwood's cane.",
  presentInRoom: ['Beatrice Vance', 'Dr. Aris Blackwood'],
  neverInRoom: ['Arthur Sterling'],
  lock:
    'The study uses a mortise lock: thumb-turn inside, master key in the hall, same deadbolt. Archibald threw it from the desk. Reginald drew it back, let Beatrice and Blackwood in, threw it shut from the hallway, then opened it after the cyanide dropped him and locked the corpse in for morning.',
  rule: 'No new evidence can contradict this mechanical sequence.',
} as const;

export const ROLE_RULES = [
  {
    id: 'timeline',
    title: 'The Grand Timeline',
    rule: 'These events are fixed in amber. Any new scene must fit between these chronological tentpoles.',
  },
  {
    id: 'locked-room',
    title: 'The Locked Room Reality',
    rule: 'The locked-room mystery is solved. No new evidence can contradict the mechanical sequence in LOCKED_ROOM.',
  },
  {
    id: 'archibalds-ghost',
    title: "The Archibald's Ghost Principle",
    rule: 'Archibald Vance was not a passive victim. He planted evidence before he was killed, knowing the syndicate would come for him. He did not stage the gala-night murder, and he did not know Clara had slipped into the priest-hole. Even the "Phantom Gold" rumor Thorne leaks in Week 4 is based on a breadcrumb Archibald purposefully left to ensure the rats would eat each other.',
  },
  {
    id: 'no-redemption',
    title: 'The No-Redemption Clause',
    rule: 'The syndicate members (Beatrice, Sterling, Blackwood) do not feel remorse. As the weeks progress, their only character growth is becoming more ruthless and willing to betray one another.',
  },
  {
    id: 'puzzle-purpose',
    title: 'The Puzzle Purpose Principle',
    rule: 'Capitalized puzzles must always reveal a concrete fact that moves Thorne from Point A to Point B. They cannot be atmospheric fluff. If a puzzle does not reveal a secret motive, a location, or an alibi, it gets cut.',
  },
  {
    id: 'information-quarantine',
    title: 'The Information Quarantine',
    rule: "Never name the killer before the timeline dictates. Week 2 establishes the WEAPON (hollow cane). Thorne's blind spot must remain intact: he thinks the Albany doctor is just an extorter, and that a 'New York Phantom' committed the murder. Week 3 shatters this when the travel alias proves Blackwood took a sleeper train down.",
  },
  {
    id: 'posthumous-executor',
    title: 'The Posthumous Executor',
    rule: "Every clue is a breadcrumb Archibald planted. Thorne does not get lucky. By Week 4 he is not merely solving a murder; he is acting as the posthumous executor of Vance's vengeance. The Pier 84 gold rumor is a map the old man left in the open, not a lie Thorne invented. The gala-night killing was theirs. The board it landed on was his.",
  },
] as const;

export interface CharacterSheet {
  id: string;
  name: string;
  role: string;
  motivation: string;
  /** null where the bible leaves the trait open. */
  immutableTrait: string | null;
  storyFunction: string;
  /** null where the character is keeping nothing back. */
  secret: string | null;
  boundary: string;
}

export const CHARACTERS: readonly CharacterSheet[] = [
  {
    id: 'thorne',
    name: 'Detective Elias Thorne',
    role: 'The Protagonist / The Lens of the Reader',
    motivation: 'Uncovering the absolute truth, regardless of who it hurts.',
    immutableTrait:
      'He is deeply observant but perpetually exhausted. He relies on intellect (ciphers, logic) rather than brute force.',
    storyFunction:
      'He is the connective tissue. He never assumes; he only moves forward when a decoded puzzle gives him the proof.',
    secret: null,
    boundary:
      'Thorne is purely an investigator. He has no prior personal relationship with the Vance family. Until Day 19 he treats Blackwood as an Albany jailer, not the man in the study.',
  },
  {
    id: 'archibald',
    name: 'Archibald Vance',
    role: 'The Catalyst / The Ghost',
    motivation: 'Guilt and redemption (pre-death).',
    immutableTrait: null,
    storyFunction:
      "His sudden attack of conscience triggered the whole plot. He did not hand Clara the keys in 1923. He sealed a dead-man's trust that slept until unnatural death, let the syndicate siphon a company they never owned, and planted the evidence that would burn them. He left the revocation where Beatrice would snoop, pinned the birth certificate in the safe, and left a Pier 84 gold map in the open so the rats would eat each other. He prepared for the death he knew was coming. He did not stage the gala-night killing, and he never knew Clara had slipped into the priest-hole.",
    secret: 'He built his empire on dirty money (Cuban Silk bootlegging).',
    boundary: 'He is definitively dead. No faked-death twists.',
  },
  {
    id: 'beatrice',
    name: 'Beatrice Vance',
    role: 'The Femme Fatale / Inside Woman',
    motivation:
      'Greed and independence. She wants the fortune without the baggage of her husband or his partners.',
    immutableTrait: null,
    storyFunction: 'High-society assassinations. She poured the cyanide.',
    secret:
      'She argued with Archibald about the will and took the bait, burning a revocation he deliberately left out for her to find, unaware it pointed directly to her ruin (Clara).',
    boundary:
      'She is not loyal to Sterling or Blackwood. She will sell out or murder anyone to save herself, heavily motivated by the rumor of the "Offshore Gold" in Week 4.',
  },
  {
    id: 'sterling',
    name: 'Arthur Sterling',
    role: 'The Bootlegging Partner / The Fixer',
    motivation:
      'Self-preservation. Keeping the 1923 smuggling ring a secret and staying out of the electric chair.',
    immutableTrait: null,
    storyFunction: 'Docks, bribes, muscle, and logistics. Not the poisoner.',
    secret:
      "He orchestrated locking the heiress (Clara) away in 1923. He also kept the carbon copy receipt of Blackwood's cyanide purchase, since the arrogant doctor used Sterling's crooked chemist.",
    boundary:
      'Sterling is the muscle and logistics guy, not the poisoner. He was never in the locked room. He bought a crooked chemist for Albany morphine. Blackwood reused that bench for cyanide and the cane. Sterling kept the carbon as insurance after Day 12.',
  },
  {
    id: 'blackwood',
    name: 'Dr. Aris Blackwood',
    role: 'The Blackmailer',
    motivation: 'Sustaining his lavish lifestyle via extortion.',
    immutableTrait: null,
    storyFunction: 'Supplied the cyanide. Present in the locked room. Used a travel alias to sneak down from Albany, remaining a New York phantom to Thorne.',
    secret: 'His captive, Clara, escaped on Sunday, Sept 5.',
    boundary:
      "His identity as the poison-smuggler must remain strictly anonymous to Thorne until Week 3 (Clara's testimony and the medical bag). In Week 2, he is only known as 'a shadow' or 'a deep voice'. Day 6 Albany is a four-hour alibi in Thorne's mind, not a confession.",
  },
  {
    id: 'clara',
    name: 'Clara',
    role: 'The Missing Heiress / The Ward',
    motivation: 'Survival and vengeance.',
    immutableTrait: null,
    storyFunction: 'The whistleblower. Beatrice is her biological mother. She slipped into the priest-hole uninvited on gala night; Archibald never knew she was in the wall.',
    secret:
      'She is not insane. She was locked up in 1923 because she saw the shipping manifests proving Vance and Sterling were running rum from Havana.',
    boundary:
      'Clara is not a helpless victim. If she left a clue, it was intentional. She is actively trying to bring Sterling down from the shadows. She put herself in the priest-hole; Archibald did not place her there.',
  },
  {
    id: 'reginald',
    name: 'Reginald',
    role: 'The Butler',
    motivation: 'Self-preservation under blackmail and hush money.',
    immutableTrait: null,
    storyFunction:
      "Let Beatrice and Blackwood into the locked study on a mortise lock that works from both sides, then locked the corpse in for morning. Sprung from jail by Chief O'Malley only to be murdered by the mob for blackmailing Sterling.",
    secret: 'He is the hall-side key on the locked-room murder: in, sealed, out, locked on the corpse.',
    boundary: 'He is not the poisoner and not the mastermind.',
  },
] as const;

export const WEEKLY_SHEETS = [
  {
    week: 1,
    title: 'The Panic',
    postures: {
      thorne:
        'The by-the-book gumshoe. Working within the bounds of the law, relying on standard detective work, ciphers, and interviews.',
      clara:
        'The hunted ghost. Detoxing from morphine, terrified, and running. She communicates only in desperate, garbled shadows.',
      beatrice:
        'The ice queen. Playing the grieving widow perfectly. She thinks she has won by burning the revocation and just needs to grab the cash.',
      sterling:
        'The sweating fixer. Panicking over the missing will and the 1923 files. He is bleeding money to cover up his tracks.',
      blackwood:
        'The grifter. Confident he can bluff his way to a payday. Lying to the cops and Sterling to keep the extortion money flowing.',
      archibald: 'Dead. His planted will and wire are already in motion.',
    },
  },
  {
    week: 2,
    title: 'The Sins Exposed',
    postures: {
      thorne:
        'The undercover hound. Official channels are useless. He trades his badge for a cheap suit. He is completely blind to Blackwood as the physical killer, assuming the Albany doctor is just a remote extorter and the poisoner is a Manhattan phantom.',
      clara:
        'The vengeful daughter. Her memory is returning. She realizes Beatrice is her biological mother. Fear turns to absolute fury, though she is physically vulnerable and captured by cops.',
      beatrice:
        'The unmasked monster. The facade drops. She is revealed not just as a greedy widow, but as the physical poisoner and a mother who abandoned her child.',
      sterling:
        'The mob boss. He stops panicking and tries to consolidate power. He buys East Side muscle and uses city officials to do his dirty work.',
      blackwood:
        'The unidentified bribing shadow. Forced to spend his own money to keep Reginald quiet. His hubris catches up with him as his hollow cane is found, though his name remains a ghost to Thorne.',
      archibald: 'Dead. The bootlegging files he hid begin to surface as his trap.',
    },
  },
  {
    week: 3,
    title: 'The Systemic Rot',
    postures: {
      thorne:
        'The rogue vigilante. Betrayed by his own Police Chief. He becomes a lethal protector, willing to kill corrupt cops at Pier 44 to save Clara. Entirely outside the law.',
      clara:
        'The eyewitness. Rescued and secure. Her trauma crystallizes into cold, Vance-like resolve. She provides the crucial testimony of the two wolves.',
      beatrice:
        'The fugitive. Stripped of her societal armor. She goes on the run with Blackwood, relying on decoy boats and desperate maneuvers.',
      sterling:
        'The bureaucrat of death. He distances himself from the actual violence, using his purchased badges (Chief O\'Malley) to arrange releases and executions from afar.',
      blackwood:
        'The cornered lover. His identity as the cyanide supplier is burned when his travel alias is found. He is pale, frantic, and entirely dependent on Beatrice for survival.',
      archibald: 'Dead. City-level rot is the machinery his empire fed.',
    },
  },
  {
    week: 4,
    title: 'The Rats Eat Each Other',
    postures: {
      thorne:
        'The puppet master. No longer investigating — he is orchestrating. He weaponizes a breadcrumb of phantom gold Archibald left behind to set a trap at Pier 84, letting the factions destroy each other.',
      clara:
        'The decoy and heir. She bravely acts as bait at the pier. She later discovers she is the true owner of the offshore syndicate wealth.',
      beatrice:
        'The ultimate betrayer. She shoots her own lover (Blackwood) in the chest to keep the money. When caught, she tries to bribe the federal government. Utterly remorseless.',
      sterling:
        'The coward. When the guns draw, he uses Beatrice as a human shield. Once captured, he immediately snitches, signing a confession and turning over the chemist receipt to throw Beatrice under the bus.',
      blackwood: 'Deceased. Shot by Beatrice at Pier 84.',
      archibald: 'Dead. The offshore vault and planted evidence finish his trap.',
    },
  },
  {
    week: 5,
    title: 'The New Dawn',
    postures: {
      thorne:
        'The cynical civilian. He turns in his badge, knowing the law is a joke but satisfied that he did the right thing. He accepts the gold watch (and the blood on it) as a testament to his survival.',
      clara:
        'The matriarch. Fully transformed from a drugged, frightened ward into the ruthless (but moral) head of the Vance empire. She purges the syndicate with a red pen and leaves for Europe, victorious.',
      beatrice: 'The condemned. Sitting in Sing Sing. No more moves to play.',
      sterling: 'The condemned. Awaiting the electric chair. His empire dismantled.',
      blackwood: 'Deceased.',
      archibald:
        'The mastermind. Revealed to be the smartest man in the room all along. He knew they would kill him eventually, but he did not invite them into the study that night, and he never knew his daughter was in the wall. He made sure they would burn for it.',
    },
  },
] as const;

export const EVIDENCE_REGISTRY = [
  {
    id: 'tuxedo-wire',
    name: "Archibald's Pocket Telegraph Draft",
    origin: 'Archibald Vance (Planted)',
    recoveredDay: 1,
    recoveryLocation: 'Vance Study / Tuxedo Pocket',
    proves: 'Archibald intended to expose the 1923 Cuban Silk ring before he died.',
    finalDisposition: 'Precinct Evidence Locker #1',
  },
  {
    id: 'scorched-will',
    name: 'Charred Will Fragment',
    origin: 'Archibald Vance (Planted Bait) / Beatrice Vance (Attempted Arson)',
    recoveredDay: 2,
    recoveryLocation: "Beatrice's Boudoir Fireplace",
    proves: 'Archibald deliberately left the revocation out for Beatrice to find; points to Red Sailboat wall safe. Archibald wanted her to burn it.',
    finalDisposition: 'District Attorney Archive',
  },
  {
    id: 'planted-ledger',
    name: 'Bootlegging Ledger Page from The Midnight Runner',
    origin: 'Archibald Vance (Planted trap)',
    recoveredDay: 7,
    recoveryLocation: "Captain's quarters, The Midnight Runner",
    proves: 'The old man wrote the rum books and left them for the Coast Guard to burn his partners. A second planted page (rifles under whiskey) was recovered from Reginald’s oilskin on Day 14; he was silenced for fishing it.',
    finalDisposition: 'Court Exhibit A (Trial Ledger)',
  },
  {
    id: 'hollow-cane',
    name: 'Silver-Headed Mobility Cane / Flask',
    origin: 'Dr. Aris Blackwood',
    recoveredDay: 12,
    recoveryLocation: 'Bowery Pawnshop (Pawned by veiled Beatrice)',
    proves: 'Cyanide delivery vessel; glass interior held potassium cyanide.',
    finalDisposition: 'Court Exhibit B (Murder Weapon)',
  },
  {
    id: 'apothecary-receipt',
    name: 'Apothecary Receipt for Cyanide / Cane Work',
    origin: 'Arthur Sterling (Blackmail paper)',
    recoveredDay: 23,
    recoveryLocation: 'Overheard and recovered at Pier 84 rafters / Sterling person',
    proves: "Blackwood used Sterling's crooked chemist to buy the cyanide. Sterling kept the carbon copy to hang the doctor if needed. Sterling never held the flask.",
    finalDisposition: 'Federal Bureau File',
  },
  {
    id: 'brass-lockbox',
    name: 'Posthumous Lockbox & Secret Directive',
    origin: 'Archibald Vance (1923)',
    recoveredDay: 28,
    recoveryLocation: 'Vance Study (Delivered by Attorney)',
    proves:
      "Dead-man's trust, not a live 1923 handover. The empire, fleet, and patents transferred to Clara on Archibald's unnatural death. Until then the syndicate ran a board they did not own.",
    finalDisposition: 'Clara Vance Personal Estate',
  },
] as const;

export const SECONDARY_CHARACTERS = [
  {
    id: 'mayor-harrison',
    name: 'Mayor H. Harrison',
    role: 'Tammany Hall Puppet / The Gun Buyer',
    fate: 'Resigned in disgrace on Sept 18 (Day 15); fled public life.',
    boundary:
      'Never committed physical violence; strictly took kickbacks, purchased smuggled rifles for municipal armories, and signed illicit warrants. After Day 15 he does not act in official capacity. Week 4 onward is federal (Treasury) jurisdiction; copy may remember him only in the past tense.',
  },
  {
    id: 'police-chief',
    name: "Police Chief O'Malley",
    role: "Sterling's Purchased Badge / Reginald's Executioner",
    fate: 'Killed in the line of fire by Detective Thorne at Pier 44 on Sept 20 (Day 17).',
    boundary:
      "Directly sprung Reginald from lockup to be killed and ordered Clara's midnight execution to protect municipal kickbacks. After Day 17 he is a corpse. No official orders, raids, or precinct commands in his name. Week 4 onward is federal jurisdiction.",
  },
  {
    id: 'nurse-evelyn',
    name: 'Nurse Evelyn',
    role: 'Albany Sanatorium Whistleblower',
    fate: 'Slipped Thorne the napkin clue on Sept 9 (Day 6); stayed in Albany.',
    boundary: "Only source of honest medical testimony outside Blackwood's control.",
  },
  {
    id: 'archibald-attorney',
    name: 'Thaddeus Vance, Esq.',
    role: "Archibald's Private Executor",
    fate: 'Executes the posthumous 1923 lockbox on Oct 1 (Day 28).',
    boundary:
      'Completely unbribable; held the true will under sealed seal-of-death instructions.',
  },
] as const;

export const WORLD_GEOGRAPHY = {
  manhattan: {
    precinct: "Downtown 4th Precinct (Thorne's desk)",
    estate: 'Vance Upper East Side Mansion (Study, Priest-Hole, Boudoir)',
    speakeasy: 'The Blind Tiger (Lower East Side / Bowery)',
    piers: {
      pier44: 'Waterfront industrial pier (Police Chief ambush / Shootout)',
      pier84: 'Hudson River deepwater slip (Final trap, Packard showdown, Federal raid)',
    },
  },
  upstate: {
    albanySanatorium: 'Blackwood Psychiatric Institute (4-hour sleeper train from Grand Central)',
  },
  transitRules:
    'Travel between Manhattan and Albany requires minimum half-day transit by steam rail.',
} as const;

export const STITCH_RULES = [
  {
    id: 'standalone-decode',
    rule: 'originalText is a standalone decoded fact. It must not name or trail into the next edition headline.',
  },
  {
    id: 'no-fluff-endings',
    rule: 'Every puzzle that ends a week must provide a forensic fact, an action item, or a confirmed destination.',
  },
] as const;
