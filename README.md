# Spellbook Organizer for The Realms - User Study

## Overview
Welcome to my study! Please read the entire instructions before continuing.

This project was made by Ian Perry for CS3031: Human-Computer Interactions. 
It is a spellbook organizer for The Realms, allowing users to design their builds and organize their spellbook digitally.
This version of the project is instrumented for AB testing and may not be reflective of the final project. Many features may be missing.

## Instructions
Please read the entire instructions before continuing.

- To begin, open /src/pages/index.html
- You will be presented with a randomly generated build (possibly including options for armor, buydowns, alchemy, or regionals). Your task is to re-create this build. This will be displayed next to your spell list later, so you will be able to reference back to it.
- For your first run, choose randomly between version A or B. Flip a coin or roll a die, ***do not*** just pick one manually.
- For subsequent runs, alternate between choosing version A or version B. 
- Please run the project 6-10 times.
- You may return to the home page at any time by pressing Restart in the header. Before your first run, play around a little bit in the spellbook creator (but ***do not*** complete the listed spell build) to get a feel for the UI, and then restart. I'd recommend re-creating your own spell build as a test run, if you have one.

   ### Using the UI
   Spellcaster Info:
   - Upon starting, you will see the Spellcaster Info page. This is the cover of the spellbook. For this study, you ***do not*** need to fill out a name or select which type of spellbook it is - just skip past them.
   - You ***will*** need to select the path and whether or not you're using armor. Armor is always enabled for 1-paths.
   - You may navigate this UI by mouse or keyboard. To navigate by keyboard, use the Arrow Keys and either Space or Enter to make a selection. Try both methods at least once, and then using whatever you prefer from there.
   - Select Spell List (either at the bottom of the page or in the header) to continue. You may return to this page by selecting Spellcaster Info in the header.

   Spell List:
   - On this page, a list of all of your selected spells is displayed. The grid is organized up by circles (rows) and paths (columns).
   - You will also see the target build from the start page. A spell colored in red still needs to be selected. The spells must be selected in the same order as in the spell list, and you must have the correct number of paths/armor selection.
   - You ***do not*** need to fill out the Spell Options textbox (this would be used for noting down things such as Familiar selections, but is not tested in this study).
   - You may navigate this UI by mouse or keyboard. To navigate by keyboard, use the Arrow Keys and either Space or Enter to make a selection. Try both methods at least once, and then using whatever you prefer from there.
   - The clear button will deselect all options.
   - Selecting any spell slot will move to a new page to select that spell. You may return to this page at any time by selecting Spell List in the header.

   Spell Selection:
   - On this page, a list of all available spells is displayed. The right side of the page displays spells (organized by circle and then alphabetical order), and the left side displays a few options.
   - The search bar will filter the spells. Spells which do not include the search input will be hidden.
   - No Spell will deselect a spell.
   - The Buydowns switch will toggle buydowns - if it is off, you may only select a spell in the same circle. If it is on, you may select a spell from lower circles as well.
   - The Alternatives switch will toggle the Alchemy and Regional options.
   - Alchemy will select Alchemy with the appropriate number of alchemy points; Regional will select Regional.

After completing the build, you will be redirected to a survey question. Answer according to your experience with your latest run. Release versions of this UI would be able to view the information of selected spells and print a spellbook, ***do not*** consider the absence of these features in your decision.

After your final run, click **Download CSV** on the metrics page. Send the downloaded file to me at "araneaae" on Discord.