#!/usr/bin/env bash
# Drives the Android UI by accessibility label rather than by pixel guess.
#
# Every tap here resolves through uiautomator's dump, so a layout change moves
# the tap with it instead of silently hitting empty paper -- which is exactly
# how earlier passes captured screens that showed nothing had happened.
#
# Usage:  scripts/android-ui-tour.sh <command> [args]
#   tap   <content-desc>     tap the centre of the first match (exact)
#   tapc  <substring>        tap the centre of the first partial match
#   text  <visible text>     tap the centre of the first node with that text
#   shot  <name>             screencap into $SHOT_DIR
#   dump                     list every labelled node with its bounds
#   has   <substring>        exit 0 if a matching node exists
set -u

export MSYS_NO_PATHCONV=1
ADB="${ADB:-/c/Users/justin.dial/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
SHOT_DIR="${SHOT_DIR:-.}"
PKG=com.chroniclecryptogram

ui_xml() {
    "$ADB" shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
    "$ADB" shell cat /sdcard/ui.xml 2>/dev/null
}

# Prints "x y" for the centre of the first node whose $1 attribute matches $2.
centre_of() {
    local attr="$1" needle="$2" exact="$3"
    ui_xml | tr '>' '\n' | grep -F "$attr=\"" | while IFS= read -r line; do
        local value bounds
        value=$(printf '%s' "$line" | sed -nE "s/.*$attr=\"([^\"]*)\".*/\1/p")
        bounds=$(printf '%s' "$line" | sed -nE 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/p')
        [ -z "$bounds" ] && continue
        if [ "$exact" = "1" ]; then
            [ "$value" = "$needle" ] || continue
        else
            case "$value" in *"$needle"*) ;; *) continue ;; esac
        fi
        set -- $bounds
        echo $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 ))
        return 0
    done | head -1
}

tap_at() {
    local xy="$1" label="$2"
    if [ -z "$xy" ]; then
        echo "no match for: $label" >&2
        return 1
    fi
    # shellcheck disable=SC2086
    "$ADB" shell input tap $xy
    echo "tapped $label at $xy"
}

case "${1:-}" in
    tap)   tap_at "$(centre_of content-desc "$2" 1)" "$2" ;;
    tapc)  tap_at "$(centre_of content-desc "$2" 0)" "$2" ;;
    text)  tap_at "$(centre_of text "$2" 0)" "$2" ;;
    shot)  mkdir -p "$SHOT_DIR"; "$ADB" exec-out screencap -p > "$SHOT_DIR/$2.png"; echo "shot $2" ;;
    dump)
        ui_xml | tr '>' '\n' \
            | grep -oE '(content-desc|text)="[^"]+".*bounds="[^"]*"' \
            | sed -E 's/^(content-desc|text)="([^"]*)".*bounds="([^"]*)"$/\2  ->  \3/' \
            | grep -v '^ *-> *$'
        ;;
    has)   ui_xml | grep -qF "$2" && echo yes || echo no ;;
    launch)
        "$ADB" shell am force-stop $PKG
        "$ADB" shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
        ;;
    *) sed -n '3,16p' "$0"; exit 2 ;;
esac
