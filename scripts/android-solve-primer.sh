#!/usr/bin/env bash
# Solves the Primer on a connected device, so the solved state can be looked at.
#
# The board reports each cell as "Cipher glyph <g>, unassigned" in reading
# order, and the Primer's plaintext is known, so the two line up. Assigning one
# letter fills every cell showing that glyph -- that is the game's whole
# mechanic -- so sixteen taps solve it.
#
# This exists because SolveBulletin, the live stats row and the share clipping
# had only ever been exercised by tests; nothing had rendered them on a device.
set -u

export MSYS_NO_PATHCONV=1
HERE="$(cd "$(dirname "$0")" && pwd)"
TOUR="$HERE/android-ui-tour.sh"
ADB="${ADB:-/c/Users/justin.dial/AppData/Local/Android/Sdk/platform-tools/adb.exe}"

# glyph:letter, in the order they first appear in
# "I CAN'T SEE THE WORD THE AND LOOK AT A DOUBLE LETTER TOO."
MAP=(
    "●:I" "W:C" "Z:A" "X:N" "⦿:T" "ᗡ:S" "Ɪ:E"
    "L:H" "S:W" "O:O" "□:R" "Q:D"
)

# Taps the first cell still showing $1, then the key for $2.
assign() {
    local glyph="$1" letter="$2" attempt
    for attempt in 1 2 3; do
        if bash "$TOUR" tapc "Cipher glyph $glyph, unassigned" >/dev/null 2>&1; then
            sleep 1
            bash "$TOUR" tap "$letter" >/dev/null 2>&1
            sleep 1
            echo "  $glyph -> $letter"
            return 0
        fi
        # Not on screen: the board scrolls, so bring more of it into view.
        "$ADB" shell input swipe 540 1400 540 900 200
        sleep 1
    done
    echo "  $glyph -> $letter  (no unassigned cell found)"
    return 1
}

echo "solving the Primer..."
for pair in "${MAP[@]}"; do
    assign "${pair%%:*}" "${pair##*:}"
done

echo
echo "still unassigned:"
bash "$TOUR" dump | grep -oE "Cipher glyph [^,]+, unassigned" | sort -u
