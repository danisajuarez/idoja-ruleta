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
- `facts`: Plotty's local list of facts; one changes every 12 seconds, including during rounds. “Otro dato” shows another immediately. These are curated local texts, not an online AI chatbot.
- `careers`: four career choices, with `all` labeled “Otra carrera”.
- `careerCategories`: career ID → allowed category IDs. Each specialty includes its own category plus `culture` and `printing`; `all` includes only `culture` and `printing`. Questions remain in `categories`, without duplicated career banks.
- `prizes`: seven entries, each with a unique `id`, full `name`, one to three short label `lines` (up to 20 characters each), six-digit hex `color`, and positive numeric `weight`. A prize's appearance probability is its weight divided by the sum of all weights; the phone holder and 50% discount must have identical weights.
- `prizesAreExamples`: `false` for the real client prize list. `probabilitiesAreProvisional`: `true` while the proposed distribution awaits review. Unequal appearance probabilities must be disclosed; equal-size wheel sectors do not mean equal chances.
- `studentOffer`: editable `title`, `benefit`, and `details` for the independent UAI student offer. The default is 10% off for UAI students, with conditions to be confirmed at the stand. It appears after both correct and incorrect answers, without a follow requirement. It is not an inventory item or automatically redeemed coupon.

Real prizes and provisional appearance probabilities: 10% discount (30%), 15% discount (23%), 20% discount (15%), IDOJA stickers (20%), $10,000 purchase voucher (8%), 50% discount (2%), and IDOJA phone holder (2%). These are draw probabilities, not guaranteed award rates: a correct answer is required. Confirm validity dates, eligible products, purchase minimums and redemption conditions before the event; none are inferred by the game. There is no inventory, participant registry or redemption tracking.

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

The entire game fits the viewport without page scrolling. On a TV, use landscape full-screen mode at 100% browser zoom. Plotty stays alongside the game on wider displays; compact previews put its bubble beneath the wheel. Questions replace the wheel area during a round. Secondary facts are hidden during spinning and questions to keep attention on the game.

Plotty hosts the game with stage-specific speech and a larger appearance while presenting questions. Launch movement is disabled to reduce distraction; the fact timer continues internally while facts are hidden. Reduced-motion preferences disable mascot movement while retaining the shorter user-triggered wheel spin. These are local animations and prepared messages, not voice generation or an online AI service.

Instagram uses the public handle shown in the supplied IDOJA artwork (`idojaestudiografico`); confirm the profile and scan the QR before the event. Following is explicitly optional and is never checked or required to continue. There is no contact form or personal-data collection. Adding one later requires an explicit storage, access and consent decision; do not collect contact details on a shared TV by default.

Before the event, test the final questions, QR scanning distance, browser zoom, HDMI display and full-screen mode on the actual television.

