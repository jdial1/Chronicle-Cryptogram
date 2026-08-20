import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();

const DISPATCH_BODY =
  "New Dispatch: Solved ciphers won't catch the culprit. Today's case file is ready.";
const INVALID = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

async function sendChunk(tokens: string[]) {
  const messaging = getMessaging();
  const result = await messaging.sendEachForMulticast({
    tokens,
    android: {
      collapseKey: 'morning-dispatch',
      priority: 'high',
    },
    data: {
      type: 'morning-dispatch',
      title: 'Chronicle Cryptogram',
      body: DISPATCH_BODY,
    },
  });
  const stale: string[] = [];
  result.responses.forEach((entry, index) => {
    if (entry.success) return;
    const code = entry.error?.code || '';
    if (INVALID.has(code)) stale.push(tokens[index]);
  });
  return stale;
}

export const morningDispatch = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'America/New_York',
  },
  async () => {
    const db = getFirestore();
    const snap = await db.collection('dispatchTokens').where('subscribed', '==', true).get();
    const tokens: string[] = [];
    const tokenDocs = new Map<string, string>();
    snap.forEach((doc) => {
      const token = doc.data().token;
      if (typeof token !== 'string' || token.length < 8) return;
      tokens.push(token);
      tokenDocs.set(token, doc.id);
    });
    const stale: string[] = [];
    for (let i = 0; i < tokens.length; i += 500) {
      stale.push(...(await sendChunk(tokens.slice(i, i + 500))));
    }
    await Promise.all(
      stale.map((token) => {
        const id = tokenDocs.get(token);
        return id ? db.collection('dispatchTokens').doc(id).delete() : Promise.resolve();
      })
    );
  }
);
