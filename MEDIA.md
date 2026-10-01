# Character animation and audio

Final ranks now use actual moving-character MP4 clips in `FinalFormReveal.tsx`, followed by the app's earned-form illustration. They replace the previous Canvas effects around still artwork. Five sources contain Legends ink-brush animation; Trunks uses a Sparking! Zero Sword of Hope action, Cell uses a Legends action, and Piccolo uses an Orange Piccolo transformation clip. These are sourced animations, not newly drawn or generated character motion. Source resolution and completeness vary. Goku's clip is cropped to its central character panel, removing the duplicated side panels.

The user approved using available animations of the same character where an exact final-form animation is unavailable. Vegeta's clip depicts Majin Vegeta, Gohan's depicts Super Saiyan 2, Frieza's depicts Golden Frieza, and Goku's depicts Ultra Instinct Sign. The earned rank names and thresholds remain unchanged. The clip caption identifies the depicted form separately from the earned-form heading.

`src/revealClips.json` records each source post, direct media URL, depicted form, source dimensions, duration, output size and SHA-256. Local files live in `public/cinematics/finals/`; all eight are precached for offline playback. Each is under 2 MB, totaling approximately 5.1 MB. No third-party embeds or requests run during playback. Final videos contain stereo AAC soundtracks from matching scene recordings. The original Tenor downloads had no audio tracks; this is reconstructed synchronization from other recordings of the same animation, not recovered Tenor audio. Frame matches guide the trims and pitch-preserving timing adjustments in `scripts/reveal_audio_sources.json`; Trunks has an edit requiring two audio segments. Source recordings may include game/movie music as well as voices and effects.

Audio sources: [Legends ink intros](https://www.youtube.com/watch?v=33S0W56E76A), [official Perfect Cell trailer](https://www.youtube.com/watch?v=QBGSkpQGPkw), [Sparking! Zero Trunks showcase](https://www.youtube.com/watch?v=k4sng91-TnA), [Orange Piccolo scene](https://www.youtube.com/watch?v=Dbz8G0swjZ4). Final reveals use the embedded track rather than the separately generated character cue. The existing volume/mute controls now control the video element. Skip, replay, errors and closing control sound and picture together. Reduced motion opens a static earned-form card with explicit play. Playback ends on the actual video's end event, not a fixed timer.

Rebuild reviewed assets with `python scripts/fetch_reveal_clips.py`, `python scripts/fetch_original_reveal_audio.py`, then `python scripts/build_reveal_clips.py`. Audio fetching uses yt-dlp installed in `tmp/media-tools`, Node for extraction, and imageio-ffmpeg. The discovery cache used by the visual fetch script is produced by `scripts/find_reveal_clips.py`; source URLs are also retained independently in the shipped manifest. `scripts/align_reveal_audio.py` is optional frame-matching research tooling using OpenCV installed in `tmp/media-tools`. Rights remain with Dragon Ball's original rights holders, Bandai Namco/Dimps, Toei Animation, and the respective creators. Attribution does not grant a redistribution license.

Character-specific **lift entrances** still use the original 1.8-second Canvas/CSS scene in `CharacterStage.tsx`. Their signatures and the voice archives are listed below.

| Character | Visual signature | Vocal archive |
| --- | --- | --- |
| Vegeta | Purple destruction gravity well and orbiting fragments | [Vegeta SSBE](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/446045/) |
| Broly | Green energy pillars and erupting rubble | [Broly DBS LF](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/445968/) |
| Future Trunks | Spirit blade and diagonal sword trails | [Future Trunks SSJ2](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/446039/) |
| Piccolo | Orange growth aura and spiral drill beam | [Piccolo Super Hero](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/446052/) |
| Gohan | Violet flame silhouette and branching red lightning | [Ultimate Gohan](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/445951/) |
| Frieza | Dark eclipse, golden orbital discs and radial beams | [Golden Frieza](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/443695/) |
| Cell | Cellular hexagon lattice and focused green beam | [Perfect Cell](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/443693/) |
| Goku | Silver flow lines and shifting afterimages | [Goku MUI](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/445944/) |

The 96 stereo cues in `public/audio/characters/` contain the respective character's real Dragon Ball Legends vocals, mixed with original character-specific energy effects. Each pack has three rotating entrance cues, six intermediate rank cues, one legacy final-form cue (now superseded by embedded scene audio), and two rotating saved-set cues. Vocals are from the credited character archives; they do not claim to be recordings of every depicted form. Voice pitch and speed are unchanged in these cue packs, and no voice cloning is used. Rights: Bandai Namco / Dimps and the original performers and rights holders.

`src/characterAudio.json` records the exact source filename, duration, source archive link, and SHA-256 for every rendered cue. Rebuild with `python scripts/fetch_character_voices.py` then `python scripts/build_character_audio.py`; the Goku archive is retained at `tmp/goku-voice.zip`. The scripts need requests, beautifulsoup4, numpy, and imageio-ffmpeg. This tooling is only for rebuilding assets; the app runs locally without Python or a network connection.

The older shared Goku cues and video below are retained as historical source work, but are no longer used by the app or included in its offline precache. Do not run the earlier audio builders to update the current character packs.

## Historical cinematic and shared audio


`public/cinematics/goku-ultra-instinct.mp4` is a 10.44-second local transformation cinematic: Dragon Ball Super Ultra Instinct animation, edited with a new soundtrack. The visual clip is from [this Tenor post](https://tenor.com/view/ultra-instinct-mastered-ultra-instinct-ultra-instinct-goku-mastered-ultra-instinct-goku-goku-ultra-instinct-gif-4184514171768397875), downloaded from its published MP4 URL (`https://media.tenor.com/OhJhd_3X4DMAAAPo/ultra-instinct-mastered-ultra-instinct.mp4`). Animation/characters: Dragon Ball / Toei Animation / original rights holders. The video is anime footage, not a newly generated animation or a Legends gameplay recording.

The vocal is Goku's 1.60-second anger-shout sample from Dragon Ball Legends, distributed in [The Sounds Resource's Goku (MUI) archive](https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/445944/): `Goku (MUI)/Greencard/arts_vc_gokuui_ex_angershout_003_Cue_0.ogg`. Original game audio: Bandai Namco / Dimps and original performers. It is mixed into the cinematic at 0.3 seconds with a short echo. No cloned voice is used.

`public/audio/card-open.mp3` is a 0.85-second stereo energy burst with Goku's short attack vocal, `Goku (MUI)/Battle/cha_vc_gokuui_477_019_vc_atk_s.ogg`, from the same archive. `rank-0.mp3` through `rank-6.mp3` use original quick energy effects with that attack vocal for the first two tiers and the anger shout credited above for higher tiers. The shared vocal is Goku across all lift cards; there are no character-specific voice packs yet. No voice cloning or League of Legends audio is used.

The historical eight-cue set was generated with `python scripts/build_dragon_audio.py` (numpy and imageio-ffmpeg; source archive retained at `tmp/goku-voice.zip`). The earlier `build_audio.py` and `build_ranked_audio.py` contain superseded sound designs: rerunning them overwrites current cues. `build_audio.py` also builds the unchanged cinematic, so rerun `build_dragon_audio.py` afterward if rebuilding both. Historical media remains in `public/`, excluded from offline precaching.

The earlier Goku final tier used that video. It is superseded by the character cinematic system described above.
