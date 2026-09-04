# Chronicle Cryptogram

A vintage newspaper cryptogram: each day’s dispatch is written in Zodiac-style glyphs, and solving it advances a serialized 1920s New York mystery.

Tap a glyph, assign a letter, and every copy of that glyph fills at once. Morning Editions use a simple one-glyph-per-letter cipher. Night Extras (unlocked after the morning solve) split common letters across several glyphs, so frequency counting no longer gives the answer away.

Solved quotes feed a case file that tracks Detective Elias Thorne, the Vance family, and the people around them.

## The opening

New agents start on a Bureau primer, then the first real edition hits the stands: **Tragedy at the Vance Estate**, dated September 4, 1926.

Railroad and shipping tycoon Archibald Vance is found dead in his locked study during his annual gala. There is no weapon. The air smells of bitter almonds. In his tuxedo pocket is a drafted telegraph to the District Attorney — a last ultimatum threatening to burn down his partner’s empire. The Morning Edition asks the question the whole city will be asking: suicide, or poisoned champagne before he could send it?

Each later day is another clipping, journal, or night extra in that investigation.

## Offline

Decoding does not need the wire. The serial, cipher engine, case file, and typefaces ship in the paper. Progress, hints, and streak stay on this device.

To take a confirmed copy into the field, open **Bureau File** (the agent plate or Sign in in the masthead) and choose **Keep a full copy of the press**. That stores type, woodcut plates, and the serial on this desk so the edition still opens with the network down. First visit still plays from the installed paper; packing is for commutes, airplanes, and dead zones.

The Android app and the web app use the same Bureau File control. After packing, a dropped connection retries the cached edition before it reports the wire down. When a newer plate hits the stands, Bureau File asks you to refresh the packed press.

Sign-in, the bureau board, and live solver counts stay on the network. Local notes remain either way.

The Codebreaker's Handbook (Guide) has a Press tab with the same field instructions.

---

## Building this yourself

`npm run dev` serves the web app.

The Android app is being rewritten natively in Kotlin and Jetpack Compose, in
[`android/`](android). `cd android && ./gradlew test` runs it; no credentials
are needed, and the game is fully playable without them. See
**[docs/ANDROID-REWRITE.md](docs/ANDROID-REWRITE.md)** for what is built, what
is verified, and what still has to happen on a real device.

`mobile/` is the older Expo WebView shell. It still builds and is still the only
Android path that has shipped an artifact; it goes when the native app has run
on hardware.

Deploying, or building either Android app for release, needs credentials — see
**[docs/SECRETS.md](docs/SECRETS.md)** for what each one is, where it goes, and
how to get it.
