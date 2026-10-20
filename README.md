# IDOJA · Design Roulette

Local event MVP for a 1920 × 1080 display. React, Vite, TypeScript and Tailwind CSS. No backend, remote fonts, analytics, or runtime CDN requests.

## Run the ready-to-use build

Install Node.js 20.19+ or 22.12+ on the event computer beforehand. Internet is only needed for this initial runtime installation, not to play.

1. Open a terminal in this folder and run `node server.mjs`.
2. Open http://127.0.0.1:4173 in a browser.
3. Use the full-screen button. Keep the terminal open; Ctrl+C stops the server.

On Windows, `Start-Windows.cmd` runs the same server. On macOS, run `sh Start-Mac.command` from a terminal in this folder. Do not double-click `dist/index.html`: the app reads its local JSON through HTTP.

### Event computer: macOS

The event will use a Mac connected to the TV. Copy the **entire extracted project folder**, including `dist/` and `server.mjs`, to that Mac. Install Node.js before the event, open Terminal in the folder and run `sh Start-Mac.command`. Keep Terminal open and visit http://127.0.0.1:4173 in the browser. This command does not require making the `.command` file executable. No Windows-specific runtime is used.

The Mac does not need `npm install` to run the supplied build. Do one rehearsal with Wi-Fi disabled, HDMI attached, browser zoom at 100%, and the game's full-screen control. macOS/Safari/HDMI behavior must still be verified on the actual Mac; development checks on Windows are not a substitute for that rehearsal.

The local server binds only to this computer. No internet, accounts, database or backend service is required. Instagram itself requires internet on the participant's phone.

## Edit event content without rebuilding

Edit `dist/event.json` and refresh the browser. Keep the five question categories and at least one question in each category. Each question has exactly two `options`, an `answer` (`0` for the first, `1` for the second), and an `explanation`.

The 50 questions, answers and explanations are imported from the client's `preguntas.docx`, with ten questions in each of five categories. The first screen asks for a career. The wheel shows seven real prizes, not question categories. A question is chosen from the selected specialty and the shared culture/printing categories; “Otra carrera” uses only the shared categories.

- `instagramUrl`: leave empty to hide the QR, or enter `https://www.instagram.com/your_profile/`. The QR is generated locally, with no online image service.
- `logoUrl`: optional extra event logo, e.g. `./event-logo.png` placed in `dist/`.
- `color`: six-digit hexadecimal sector color.
- `idoja-logo.png`: the supplied original horizontal logo, displayed without cropping or distortion.
- `plotty-normal.png`: the supplied waving mascot, displayed during career selection, spin and question.
- `plotty-thanks.png`: the supplied mascot hugging plans with “GRACIAS POR CONFIAR!”, displayed after every answer, correct or incorrect. The next participant and reset restore normal Plotty. Original transparency and aspect ratio are preserved.
- `slogan`: the approved brand tagline.
- `facts`: Plotty's seven business messages about printing quality, turnaround, professional finishes, opening hours, paper advice, file checks and coordinated UAI deliveries; one changes every 25 seconds, including during rounds. “Otro dato” shows another immediately. These are curated local texts, not an online AI chatbot.
- `careers`: four career choices, with `all` labeled “Otra carrera”.
- `careerCategories`: career ID → allowed category IDs. Each specialty includes its own category plus `culture` and `printing`; `all` includes only `culture` and `printing`. Questions remain in `categories`, without duplicated career banks.
- `prizes`: seven entries, each with a unique `id`, full `name`, one to three short label `lines` (up to 20 characters each), six-digit hex `color`, and positive numeric `weight`. A prize's appearance probability is its weight divided by the sum of all weights; the phone holder and 50% discount must have identical weights.
- `prizesAreExamples`: `false` for the real client prize list. `probabilitiesAreProvisional`: `true` while the proposed distribution awaits review. Unequal appearance probabilities must be disclosed; equal-size wheel sectors do not mean equal chances.
- `studentOffer`: editable `title`, `benefit`, and `details` for the independent UAI student offer. The default is 10% off for UAI students, with conditions to be confirmed at the stand. It appears after both correct and incorrect answers, without a follow requirement. It is not an inventory item or automatically redeemed coupon.

Real prizes and provisional appearance probabilities: 10% discount (30%), 15% discount (23%), 20% discount (15%), IDOJA sticker (20%), $10,000 purchase voucher (8%), 50% discount (2%), and IDOJA phone holder (2%). These are draw probabilities, not guaranteed award rates: a correct answer is required. Confirm validity dates, eligible products, purchase minimums and redemption conditions before the event; none are inferred by the game. There is no inventory, participant registry or redemption tracking.

Montserrat Regular (400) and Semibold (600) are bundled in `public/fonts/Montserrat.ttf`, from the Google Fonts Montserrat distribution. The SIL Open Font License is included in `public/fonts/OFL.txt` and copied into the offline build. No Google Fonts network call is made during use.

Also update `public/event.json` when developing: a new build replaces `dist/event.json` from this source.

## Develop and verify

```sh
npm ci
npm run dev
npm test
npm run build
```

Development dependencies need internet to install once. The built `dist/` and `server.mjs` are sufficient to run offline using Node.js; `node_modules/` is not required for event use.

## Play

Choose a career card, then press “Continuar a la ruleta”. Use “Girar la ruleta” or the wheel center. The pointer selects a prize; a two-option question from the chosen career then appears with that prize at stake. A correct answer wins the selected prize. A wrong answer reveals the correction but awards nothing. The standard spin lasts seven seconds with final deceleration. Configurable weighted prize choice and question choice are independent. Career cards use native buttons with selected state and keyboard support.

“Cambiar carrera” returns to career selection before spinning. Career changes are blocked during a round. “Siguiente participante” returns to the initial career screen, clearing the selection but preserving session totals. “Reiniciar” clears totals and cancels any active spin, also returning to career selection. Refreshing clears the session. Keyboard users can Tab to a control and press Enter or Space. Reduced-motion preferences use a shorter, single-turn user-triggered spin instead of removing the visual feedback. No personal data or results are saved.

After a wrong answer, an explicit incorrect-answer message appears with the correct option and explanation, but no prize or retry. Correct answers show the explanation, the won prize and instructions to collect it at the stand. Both outcomes lead to “Siguiente participante”. Each person has one question and one attempt; stand staff enforce one participation per person. The local app cannot identify people or prevent repeat participation after a refresh or a staff reset. The next draw avoids repeating the previous question in a topic when alternatives exist. Each answered attempt counts as a play.

The TV-first composition targets a 1920 × 1080 viewport, landscape full-screen mode and 100% browser zoom, with a rehearsal at approximately two metres. The header shares the event stage; career selection, the wheel, questions and results each have a distinct visual hierarchy. At the target viewport, the current bank's longest question, options and explanation fit without scrolling, including both result outcomes. Smaller windows and phone previews keep readable text with internal scrolling as a fallback. Plotty stays beside the game on wider displays and beneath it on phones. Secondary facts are shown only during career selection and before spinning, never during questions or results.

Plotty hosts the game with stage-specific speech and a larger appearance while presenting questions. Plotty cheers during spinning and after wins; the fact timer continues internally while facts are hidden. Reduced-motion preferences disable mascot movement while retaining the shorter user-triggered wheel spin. These are local animations and prepared messages, not voice generation or an online AI service.

Instagram has a separate invitation with its icon, a coloured accent, "Escanea y sígueme", and the handle derived from `instagramUrl`. Its locally generated black-on-white QR displays at 224 px on the target TV viewport, 180 px in compact desktop previews, and 144 px during questions, when the invitation is visually subdued. The invitation is hidden during the spin/reveal and on phone previews. The default profile is `idojaestudiografico`; confirm the destination and scan the QR on the actual TV before the event. Following is explicitly optional and is never checked or required to continue. There is no contact form or personal-data collection. Adding one later requires an explicit storage, access and consent decision; do not collect contact details on a shared TV by default.

Before the event, test the final questions, QR scanning distance, browser zoom, HDMI display and full-screen mode on the actual television.

## Visual effects and readability

Winning triggers a brief local 60-particle confetti burst and prize reveal. The wheel glows while spinning; Plotty cheers on wins and nods after an incorrect answer. These effects use CSS only. Reduced-motion preferences are respected automatically, with no on-screen effects toggle. Use the browser menu for full-screen display; the game has no full-screen button.

Questions replace the wheel in normal layout flow. Long copy remains readable, with internal scrolling as a fallback on smaller screens rather than clipped answers. Wheel labels use short display text; the legend and prize result retain the full prize name.

## Spotlight spin

During spinning, the existing wheel moves into a foreground stage beside Plotty, with a dimmed background. Facts, QR and secondary text are hidden until the question. The normal spin lasts twelve seconds; the selected prize is then shown for 1.5 seconds before the question. Spin buttons remain locked throughout both stages, and `Reiniciar` cancels either stage. Narrow screens put Plotty below the wheel. Reduced motion keeps the same composition without the entrance zoom or mascot jumps, unless effects are explicitly enabled; its existing shorter wheel spin remains unchanged.

Consecutive rounds avoid the previous question text across career changes, including shared question banks. If the eligible bank contains no alternative, repetition is unavoidable.
