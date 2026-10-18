import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Question = {
  text: string;
  options: [string, string];
  answer: 0 | 1;
  explanation: string;
};
type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  questions: Question[];
};
type Career = { id: string; name: string };
type Prize = {
  id: string;
  name: string;
  lines: string[];
  color: string;
  weight?: number;
};
const demoPrizes: Prize[] = [
  {
    id: "stickers",
    name: "Pack de stickers",
    lines: ["Pack de", "stickers"],
    color: "#53b99d",
  },
  {
    id: "a3",
    name: "Impresión A3",
    lines: ["Impresión", "A3"],
    color: "#cee7dc",
  },
  {
    id: "discount10",
    name: "10% de descuento",
    lines: ["10% de", "descuento"],
    color: "#9ecfbd",
  },
  {
    id: "bookmark",
    name: "Separador de diseño",
    lines: ["Separador", "de diseño"],
    color: "#e5e2d9",
  },
  { id: "a4", name: "Lámina A4", lines: ["Lámina", "A4"], color: "#7cc4af" },
  {
    id: "discount20",
    name: "20% de descuento",
    lines: ["20% de", "descuento"],
    color: "#b7dacc",
  },
];
type EventData = {
  title: string;
  subtitle: string;
  instagramUrl: string;
  logoUrl: string;
  categories: Category[];
  slogan?: string;
  careers?: Career[];
  facts?: string[];
  careerQuestions?: Record<string, Record<string, Question[]>>;
  prizes?: Prize[];
  prizesAreExamples?: boolean;
  probabilitiesAreProvisional?: boolean;
  careerCategories?: Record<string, string[]>;
  studentOffer?: { title: string; benefit: string; details: string };
};
function validateQuestions(questions: Question[]) {
  if (!Array.isArray(questions) || !questions.length)
    throw Error("Cada categoría necesita preguntas.");
  for (const q of questions) {
    if (
      !q ||
      typeof q.text !== "string" ||
      !q.text.trim() ||
      !Array.isArray(q.options) ||
      q.options.length !== 2 ||
      q.options.some((o) => typeof o !== "string" || !o.trim()) ||
      ![0, 1].includes(q.answer) ||
      typeof q.explanation !== "string"
    )
      throw Error("Cada pregunta debe tener dos opciones y answer 0 o 1.");
  }
}
export function validateData(value: unknown): EventData {
  const d = value as EventData;
  if (
    !d ||
    typeof d.title !== "string" ||
    typeof d.subtitle !== "string" ||
    typeof d.logoUrl !== "string" ||
    typeof d.instagramUrl !== "string" ||
    !Array.isArray(d.categories) ||
    d.categories.length < 1
  )
    throw Error("Se necesita al menos una categoría.");
  const ids = new Set<string>();
  for (const c of d.categories) {
    if (
      !c ||
      typeof c.id !== "string" ||
      !c.id ||
      ids.has(c.id) ||
      typeof c.name !== "string" ||
      !c.name.trim() ||
      typeof c.icon !== "string" ||
      !/^#[a-f\d]{6}$/i.test(c.color)
    )
      throw Error("Revisa las categorías.");
    ids.add(c.id);
    validateQuestions(c.questions);
  }
  if (
    d.instagramUrl &&
    !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/.test(
      d.instagramUrl,
    )
  )
    throw Error(
      "Instagram debe ser una URL de perfil https://www.instagram.com/usuario/.",
    );
  if (
    d.facts !== undefined &&
    (!Array.isArray(d.facts) ||
      !d.facts.length ||
      d.facts.some((f) => typeof f !== "string" || !f.trim()))
  )
    throw Error("facts debe contener textos no vacíos.");
  if (d.slogan !== undefined && typeof d.slogan !== "string")
    throw Error("Revisa el eslogan.");
  if (
    d.studentOffer !== undefined &&
    (!d.studentOffer ||
      ["title", "benefit", "details"].some(
        (k) =>
          typeof d.studentOffer![k as keyof typeof d.studentOffer] !== "string",
      ))
  )
    throw Error("Revisa studentOffer.");
  if (
    d.prizesAreExamples !== undefined &&
    typeof d.prizesAreExamples !== "boolean"
  )
    throw Error("Revisa prizesAreExamples.");
  if (d.prizes !== undefined) {
    if (!Array.isArray(d.prizes) || d.prizes.length < 2)
      throw Error("La ruleta necesita al menos dos premios.");
    const prizeIds = new Set<string>();
    for (const p of d.prizes) {
      if (
        !p ||
        typeof p.id !== "string" ||
        !p.id ||
        prizeIds.has(p.id) ||
        typeof p.name !== "string" ||
        !p.name.trim() ||
        !/^#[a-f\d]{6}$/i.test(p.color) ||
        !Array.isArray(p.lines) ||
        p.lines.length < 1 ||
        p.lines.length > 3 ||
        p.lines.some(
          (line) =>
            typeof line !== "string" || !line.trim() || line.length > 20,
        )
      )
        throw Error("Revisa los premios y sus etiquetas.");
      if (
        p.weight !== undefined &&
        (!Number.isFinite(p.weight) || p.weight <= 0)
      )
        throw Error("Los pesos deben ser positivos y finitos.");
      prizeIds.add(p.id);
    }
  }
  if (d.careers !== undefined) {
    if (!Array.isArray(d.careers) || !d.careers.length)
      throw Error("Revisa las carreras.");
    const careerIds = new Set<string>();
    for (const c of d.careers) {
      if (
        !c ||
        typeof c.id !== "string" ||
        !c.id ||
        careerIds.has(c.id) ||
        typeof c.name !== "string" ||
        !c.name.trim()
      )
        throw Error("Revisa las carreras.");
      careerIds.add(c.id);
    }
    if (!careerIds.has("all"))
      throw Error("Incluye la carrera all para preguntas generales.");
  }
  if (d.careerQuestions !== undefined) {
    if (
      !d.careerQuestions ||
      typeof d.careerQuestions !== "object" ||
      Array.isArray(d.careerQuestions)
    )
      throw Error("Revisa careerQuestions.");
    for (const [career, banks] of Object.entries(d.careerQuestions)) {
      if (
        !d.careers?.some((c) => c.id === career) ||
        !banks ||
        typeof banks !== "object" ||
        Array.isArray(banks)
      )
        throw Error("Carrera desconocida.");
      for (const [id, questions] of Object.entries(banks)) {
        if (!ids.has(id)) throw Error("Categoría desconocida.");
        validateQuestions(questions);
      }
    }
  }
  if (
    d.probabilitiesAreProvisional !== undefined &&
    typeof d.probabilitiesAreProvisional !== "boolean"
  )
    throw Error("Revisa probabilitiesAreProvisional.");
  const special = d.prizes?.find((p) => p.id === "discount50"),
    holder = d.prizes?.find((p) => p.id === "phoneholder");
  if (special && holder && (special.weight ?? 1) !== (holder.weight ?? 1))
    throw Error("El 50% y el porta celular deben tener el mismo peso.");
  if (d.careerCategories !== undefined) {
    if (
      !d.careerCategories ||
      typeof d.careerCategories !== "object" ||
      Array.isArray(d.careerCategories)
    )
      throw Error("Revisa careerCategories.");
    for (const c of d.careers ?? [{ id: "all" }]) {
      const list = d.careerCategories[c.id];
      if (
        !Array.isArray(list) ||
        !list.length ||
        list.some((id) => !ids.has(id)) ||
        new Set(list).size !== list.length
      )
        throw Error("Revisa las categorías de cada carrera.");
    }
    if (
      Object.keys(d.careerCategories).some(
        (id) => !(d.careers ?? [{ id: "all" }]).some((c) => c.id === id),
      )
    )
      throw Error("Carrera desconocida.");
  }
  return d;
}

export function drawPrize(prizes: Prize[], random = Math.random()) {
  let target = random * prizes.reduce((sum, p) => sum + (p.weight ?? 1), 0);
  for (let i = 0; i < prizes.length; i++) {
    target -= prizes[i].weight ?? 1;
    if (target < 0) return i;
  }
  return prizes.length - 1;
}
export default function App({
  spinDuration = 9000,
  factInterval = 25000,
  revealDuration = 1500,
}: {
  spinDuration?: number;
  factInterval?: number;
  revealDuration?: number;
}) {
  const [motionEnabled, setMotionEnabled] = useState(false);
  const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [data, setData] = useState<EventData | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<
    "career" | "idle" | "spinning" | "revealing" | "question" | "result"
  >("career");
  const [angle, setAngle] = useState(0);
  const [animationDuration, setAnimationDuration] = useState(spinDuration);
  const [round, setRound] = useState<{
    prize: number;
    category: number;
    question: Question;
  } | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, played: 0 });
  const [career, setCareer] = useState("");
  const [factIndex, setFactIndex] = useState(0);
  const [fullscreenError, setFullscreenError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const locked = useRef(false);
  const history = useRef<Record<string, number>>({});
  const focusTarget = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("./event.json", { signal: controller.signal, cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error("No se pudo cargar el archivo.");
        return r.json();
      })
      .then(validateData)
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(`No se pudo leer event.json. ${e.message}`);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    focusTarget.current?.focus({ preventScroll: true });
  }, [phase]);
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  function nextFact() {
    const length = data?.facts?.length || 1;
    setFactIndex((i) =>
      length < 2
        ? 0
        : (i + 1 + Math.floor(Math.random() * (length - 1))) % length,
    );
  }
  useEffect(() => {
    if (!data?.facts?.length) return;
    const interval = setInterval(() => {
      const length = data.facts!.length;
      setFactIndex((i) =>
        length < 2
          ? 0
          : (i + 1 + Math.floor(Math.random() * (length - 1))) % length,
      );
    }, factInterval);
    return () => clearInterval(interval);
  }, [data, factInterval]);
  function spin() {
    if (!data || !career || locked.current || phase !== "idle") return;
    locked.current = true;
    const prizes = data.prizes ?? demoPrizes;
    const prize = drawPrize(prizes);
    const eligible = data.categories
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) =>
          !data.careerCategories ||
          data.careerCategories[career].includes(c.id),
      );
    const { i: category, c } =
      eligible[Math.floor(Math.random() * eligible.length)];
    const questions = data.careerQuestions?.[career]?.[c.id] ?? c.questions;
    let index = Math.floor(Math.random() * questions.length);
    const historyKey = `${career}/${c.id}`;
    if (questions.length > 1 && history.current[historyKey] === index)
      index = (index + 1) % questions.length;
    history.current[historyKey] = index;
    setRound({ prize, category, question: questions[index] });
    setAnswer(null);
    setPhase("spinning");
    const reduced = reducedMotion && !motionEnabled;
    const duration = reduced ? Math.min(spinDuration, 1200) : spinDuration;
    setAnimationDuration(duration);
    const target = (360 - ((prize + 0.5) * 360) / prizes.length) % 360;
    setAngle(
      (previous) =>
        previous +
        (reduced ? 360 : 1080) +
        ((target - (previous % 360) + 360) % 360),
    );
    timer.current = setTimeout(() => {
      setPhase("revealing");
      timer.current = setTimeout(() => {
        locked.current = false;
        setPhase("question");
      }, revealDuration);
    }, duration);
  }
  function select(value: number) {
    if (phase !== "question" || !round || locked.current) return;
    locked.current = true;
    setAnswer(value);
    setScore((s) => ({
      played: s.played + 1,
      correct: s.correct + Number(value === round.question.answer),
    }));
    setPhase("result");
  }
  function next() {
    locked.current = false;
    setPhase("career");
    setCareer("");
    setRound(null);
    setAnswer(null);
  }
  function reset() {
    clearTimeout(timer.current);
    next();
    setScore({ correct: 0, played: 0 });
    history.current = {};
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else throw Error();
      setFullscreenError("");
    } catch {
      setFullscreenError(
        "Activa la pantalla completa desde el menú del navegador.",
      );
    }
  }
  if (error)
    return (
      <main className="loading">
        <div role="alert">
          <h1>No pudimos preparar el juego.</h1>
          <p>{error}</p>
          <button className="primary" onClick={() => location.reload()}>
            Volver a intentar
          </button>
        </div>
      </main>
    );
  if (!data)
    return (
      <main className="loading" role="status">
        Preparando el juego…
      </main>
    );
  const correct = answer === round?.question.answer;
  const careers = data.careers ?? [{ id: "all", name: "Todas las carreras" }];
  const prizes = data.prizes ?? demoPrizes;
  const prize = round ? prizes[round.prize] : null;
  const examples = data.prizesAreExamples ?? true;
  const offer = data.studentOffer ?? {
    title: "¿Estudias en la UAI?",
    benefit: "10% de descuento",
    details:
      "Un beneficio para estudiantes UAI. Consulta vigencia y condiciones en el stand.",
  };
  const careerDetails: Record<string, { icon: string; description: string }> = {
    graphic: { icon: "Aa", description: "Color, tipografía y composición" },
    architecture: { icon: "⌂", description: "Planos, espacios y estructuras" },
    interiors: { icon: "▧", description: "Materiales, luz y ambientes" },
    all: { icon: "✳", description: "Preguntas generales de diseño" },
  };
  const instagramHandle = data.instagramUrl ? `@${new URL(data.instagramUrl).pathname.split("/").filter(Boolean)[0] ?? "Instagram"}` : "";
  const questionOpen = phase === "question" || phase === "result";
  const spotlight = phase === "spinning" || phase === "revealing";
  const hostSpeech =
    phase === "career"
      ? "¡Hola! Soy Plotty. Elige tu carrera y jugamos."
      : phase === "idle"
        ? "¡Todo listo! Pídeme que gire y busquemos tu premio."
        : phase === "spinning"
          ? "¡Vamos por ese premio!"
          : phase === "revealing"
            ? `¡Está en juego: ${prize?.name}!`
          : phase === "question"
            ? `¡Puedes ganar ${prize?.name}! Yo pregunto, tú eliges la respuesta.`
            : correct
              ? `¡Bien hecho! Ganaste ${prize?.name}. ¡Gracias por jugar conmigo!`
              : "Esta vez no fue. ¡Gracias por jugar! Si estudias en la UAI, mira tu beneficio.";
  return (
    <div className={`app-shell phase-${phase} ${motionEnabled ? "motion-enabled" : ""} ${spotlight ? "spotlight-active" : ""}`}>
      {phase === "result" && correct && (
        <div className="confetti" data-testid="confetti" aria-hidden="true">
          {Array.from({ length: 60 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                background: ["#4cb594", "#f5c95e", "#e9a6bc", "#83bde0"][i % 4],
                animationDelay: `${(i % 9) * 0.09}s`,
                animationDuration: `${4 + (i % 5) * 0.2}s`,
                width: `${10 + (i % 4)}px`,
                height: `${14 + (i % 5)}px`,
              }}
            />
          ))}
        </div>
      )}
      <header className="app-header">
        <div className="brand-lockup">
          <img
            className="brand-logo"
            src="./idoja-logo.png"
            alt="IDOJA | Estudio gráfico"
          />
          <p className="slogan">
            {data.slogan ?? "Convierto tus entregas en trabajos profesionales"}
          </p>
        </div>
        <div className="header-actions">{reducedMotion&&<button className="secondary motion-toggle" onClick={()=>setMotionEnabled(v=>!v)} aria-pressed={motionEnabled}>{motionEnabled?'Reducir efectos':'Activar efectos'}</button>}
          <span className="event-tag">UAI · EN VIVO</span>
          <button
            className="secondary fullscreen"
            onClick={fullscreen}
            aria-label={
              isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
          >
            {isFullscreen ? "↙" : "⛶"}{" "}
            <span>{isFullscreen ? "Salir" : "Pantalla completa"}</span>
          </button>
        </div>
      </header>
      {fullscreenError && (
        <div className="screen-hint" role="status">
          {fullscreenError}
        </div>
      )}
      <main className={`game-layout ${questionOpen ? "show-question" : ""} ${spotlight ? "is-spotlight" : ""}`}>
        <section
          className="play-area"
          aria-label={
            phase === "career" ? "Selección de carrera" : "Ruleta de premios"
          }
        >
          <ol className="game-steps" aria-label="Pasos del juego">
            <li aria-current={phase === "career" ? "step" : undefined}>
              <span>1</span> Tu carrera
            </li>
            <li
              aria-current={
                phase === "idle" || spotlight ? "step" : undefined
              }
            >
              <span>2</span> Tu premio
            </li>
            <li aria-current={questionOpen ? "step" : undefined}>
              <span>3</span> Tu pregunta
            </li>
          </ol>
          {phase === "career" ? (
            <div className="career-welcome">
              <div className="welcome-title">
                <p className="step-label">EMPECEMOS POR TI</p>
                <h1>¿Qué carrera estudias?</h1>
                <p>
                  Elige tu carrera. Gira por un premio.
                  <br />
                  Responde bien y llévatelo.
                </p>
                <p className="attempt-notice">
                  Un intento por persona · participación controlada por el
                  personal.
                </p>
              </div>
              <div className="career-cards">
                {careers.map((c, i) => (
                  <button
                    ref={i === 0 ? focusTarget : undefined}
                    key={c.id}
                    aria-pressed={career === c.id}
                    onClick={() => setCareer(c.id)}
                    aria-label={`${c.name}. ${careerDetails[c.id]?.description ?? "Preguntas de tu carrera"}`}
                  >
                    <span className="career-icon" aria-hidden="true">
                      {careerDetails[c.id]?.icon ?? "✳"}
                    </span>
                    <span className="career-card-copy">
                      <strong>{c.name}</strong>
                      <small>
                        {careerDetails[c.id]?.description ??
                          "Preguntas de tu carrera"}
                      </small>
                    </span>
                    <span className="choice-check" aria-hidden="true">
                      {career === c.id ? "✓" : "→"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="primary welcome-continue"
                disabled={!career}
                onClick={() => {
                  if (career) {
                    setPhase("idle");
                    locked.current = false;
                  }
                }}
              >
                Continuar a la ruleta <span>→</span>
              </button>
            </div>
          ) : !questionOpen ? (
            <div className="wheel-screen">
              <div className="play-heading">
                <h1>
                  ¿Qué premio <span>te tocará?</span>
                </h1>
                <button
                  className="secondary change-career"
                  disabled={phase !== "idle"}
                  onClick={() => setPhase("career")}
                >
                  ← Cambiar carrera{" "}
                  <strong>{careers.find((c) => c.id === career)?.name}</strong>
                </button>
              </div>
              <div className="wheel-stage">
                {spotlight && <div className="spotlight-copy" role="status">
                  {phase === "revealing" ? <><span>¡Este premio está en juego!</span><strong data-testid="prize-reveal">{prize?.name}</strong></> : <span>Tu premio está en camino…</span>}
                </div>}
                <div
                  className={`wheel-frame ${phase === "spinning" ? "is-spinning" : ""}`}
                >
                  <div className="pointer" aria-hidden="true" />
                  <svg
                    className="wheel"
                    viewBox="0 0 600 600"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transitionDuration: `${animationDuration}ms`,
                    }}
                    aria-hidden="true"
                  >
                    {prizes.map((c, i) => {
                      const sector = (2 * Math.PI) / prizes.length;
                      const start = i * sector - Math.PI / 2,
                        end = start + sector,
                        mid = start + sector / 2;
                      const x = (a: number, r = 288) => 300 + r * Math.cos(a),
                        y = (a: number, r = 288) => 300 + r * Math.sin(a);
                      const discount = c.id.match(/^discount(\d+)$/);
                      const lines = discount ? [`${discount[1]}%`, 'OFF'] : c.id === 'voucher' ? ['$10.000', 'Voucher'] : c.id === 'phoneholder' ? ['Porta', 'celular'] : c.id === 'stickers' ? ['Stickers', 'IDOJA'] : c.lines;
                      const labelX = x(mid, 192),
                        labelY = y(mid, 192);
                      return (
                        <g key={c.id}>
                          <path
                            d={`M300 300 L${x(start)} ${y(start)} A288 288 0 0 1 ${x(end)} ${y(end)} Z`}
                            fill={c.color}
                            stroke="#f5f5ef"
                            strokeWidth="4"
                          />
                          <g
                            className="sector-text"
                            style={{
                              transform: `rotate(${-angle}deg)`,
                              transformOrigin: `${labelX}px ${labelY}px`,
                              transitionDuration: `${animationDuration}ms`,
                            }}
                          >
                            <text
                              x={labelX}
                              y={labelY - 16}
                              textAnchor="middle"
                              className="sector-number"
                            >
                              0{i + 1}
                            </text>
                            <text
                              x={labelX}
                              y={labelY + 12}
                              textAnchor="middle"
                              className="sector-label"
                              style={{
                                fill:
                                  parseInt(c.color.slice(1, 3), 16) * 0.299 +
                                    parseInt(c.color.slice(3, 5), 16) * 0.587 +
                                    parseInt(c.color.slice(5, 7), 16) * 0.114 <
                                  130
                                    ? "#ffffff"
                                    : "#173c31",
                              }}
                            >
                              {lines.map((line, j) => (
                                <tspan key={j} x={labelX} dy={j === 0 ? 0 : 24}>
                                  {line}
                                </tspan>
                              ))}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                  <button
                    className="wheel-center"
                    onClick={spin}
                    disabled={phase !== "idle"}
                    aria-label="Girar desde el centro de la ruleta"
                  >
                    <span>{phase === "spinning" ? "…" : "GIRAR"}</span>
                    <small>↻</small>
                  </button>
                </div>
              </div>
              <div className="spin-controls">
                <button
                  ref={!questionOpen ? focusTarget : undefined}
                  className="primary spin-button"
                  aria-label={
                    phase === "spinning"
                      ? "Girando…"
                      : "Girar la ruleta con Plotty"
                  }
                  onClick={spin}
                  disabled={phase !== "idle"}
                >
                  {phase === "spinning"
                    ? "¡Plotty está girando!"
                    : "¡Plotty, gira!"}{" "}
                  <span aria-hidden="true">↻</span>
                </button>
                <p className="wheel-caption" role="status">
                  {phase === "spinning"
                    ? "Tu premio está por aparecer…"
                    : "Plotty gira la ruleta y te hace una pregunta para ganar."}
                </p>
              </div>
              <p className="probability-notice">
                Los premios tienen distintas probabilidades de aparecer.
                {data.probabilitiesAreProvisional &&
                  " Distribución provisional: pendiente de confirmación."}
              </p>
              <div className="category-legend" aria-label="Premios">
                {prizes.map((p, i) => (
                  <div key={p.id} data-testid="prize">
                    <i style={{ background: p.color }} />
                    <span>
                      {i + 1}. {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {questionOpen && (
            <section
              className={`question-overlay ${phase === "result" ? `is-result ${!correct ? "is-incorrect" : ""}` : ""}`}
              aria-label="Pregunta del juego"
            >
              <div className="question-category">
                {careers.find((c) => c.id === career)?.name}{" "}
                <span>· Pregunta por tu premio</span>
              </div>
              <div className="question-content" aria-live="polite">
                {phase === "question" && (
                  <p className="prize-at-stake" data-testid="prize-at-stake">
                    ¡Por este premio… responde esta pregunta!{" "}
                    <strong>{prize?.name}</strong>
                  </p>
                )}
                <div className={phase === "result" ? "result-summary" : "question-title"}>
                  <p
                    className={`step-label ${phase === "result" && !correct ? "answer-error" : ""}`}
                  >
                    {phase === "question"
                      ? "PLOTTY TE PREGUNTA · RESPONDE Y GANA"
                      : correct
                        ? "¡RESPUESTA CORRECTA!"
                        : "RESPUESTA INCORRECTA"}
                  </p>
                  <h2>
                    {phase === "question"
                      ? round!.question.text
                      : correct
                        ? "¡Ganaste!"
                        : "¡Casi! Sigue explorando."}
                  </h2>
                  {phase === "result" && correct && (
                    <>
                      <p
                        className="awarded-prize"
                        data-testid="awarded-prize"
                      >
                        {prize?.name}
                      </p>
                      <p className="claim-prize">
                        Retira tu premio en el stand.
                      </p>
                    </>
                  )}
                </div>
                {phase === "question" ? (
                  <div className="answers">
                    {round!.question.options.map((option, i) => (
                      <button
                        ref={i === 0 ? focusTarget : undefined}
                        onClick={() => select(i)}
                        key={i}
                      >
                        <span>{i === 0 ? "A" : "B"}</span>
                        {option}
                        <b>→</b>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="result-learning">
                      <p className="answer-reveal">
                        La respuesta correcta es:{" "}
                        <strong>
                          {round!.question.options[round!.question.answer]}
                        </strong>
                      </p>
                      <div
                        className="explanation-card"
                        data-testid="answer-explanation"
                      >
                        <h3>¿Por qué es correcta?</h3>
                        <p className="explanation">
                          {round!.question.explanation}
                        </p>
                      </div>
                    </div>
                    <div className="result-footer">
                      <div className="student-offer" data-testid="student-offer">
                        <span className="offer-badge">BENEFICIO UAI</span>
                        <div>
                          <h3>
                            {offer.title} <strong>{offer.benefit}</strong>
                          </h3>
                          <p>{offer.details}</p>
                        </div>
                      </div>
                      <div className="result-actions">
                        <button
                          ref={focusTarget}
                          className="primary"
                          onClick={next}
                        >
                          Siguiente participante <span>→</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        </section>
        <aside
          className={`plotty-panel ${phase === "spinning" ? "is-spinning" : ""} ${phase === "question" ? "is-asking" : ""} ${phase === "result" ? (correct ? "is-celebrating is-winner" : "is-encouraging") : ""}`}
          aria-label="Plotty, anfitrión del juego"
        >
          <div className="plotty-title">
            <span className="live-dot" /> PLOTTY, TU ANFITRIÓN
          </div>
          <div className="speech-bubble">
            <p
              className="host-speech"
              data-testid="plotty-speech"
              role="status"
            >
              {hostSpeech}
            </p>
            {(phase === "career" || phase === "idle") && (
              <div className="fact-block">
                <span className="fact-label">¿SABÍAS QUE…?</span>
                <p data-testid="plotty-fact">
                  {data.facts?.[factIndex] ??
                    "El diseño empieza con una buena pregunta."}
                </p>
                <button
                  className="fact-next"
                  onClick={nextFact}
                  aria-label="Otro dato curioso"
                >
                  Otro dato <span>↻</span>
                </button>
              </div>
            )}
          </div>
          <img
            className={`plotty ${phase === "result" ? "plotty-thanks" : ""}`}
            src={
              phase === "result" ? "./plotty-thanks.png" : "./plotty-normal.png"
            }
            alt={
              phase === "result"
                ? "Plotty abrazando planos: gracias por confiar"
                : "Plotty, la mascota de IDOJA"
            }
          />
          {!spotlight && data.instagramUrl && <div className="social-invite">
              <a className="qr-panel" href={data.instagramUrl} target="_blank" rel="noreferrer" aria-label="Síguenos en Instagram">
                <span className="instagram-brand">
                  <svg className="instagram-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                  Instagram
                </span>
                <strong className="instagram-cta">Escanea y síguenos</strong>
                <QRCodeSVG className="instagram-qr" value={data.instagramUrl} size={224} marginSize={4} />
                <span className="instagram-handle">{instagramHandle}</span>
              </a>
              <p className="social-note">Seguirnos es opcional. No es un requisito para jugar.</p>
          </div>}
        </aside>
      </main>
      <footer className="app-footer">
        <span>
          {examples
            ? "Premios de ejemplo · por confirmar"
            : "Diseño en juego × IDOJA"}
        </span>
        {data.logoUrl && (
          <img
            className="extra-logo"
            src={data.logoUrl}
            alt="Marca del evento"
          />
        )}
        <div>
          <span data-testid="score" className="score">
            <b>{score.correct}</b> aciertos{" "}
            <span>/ {score.played} jugadas</span>
          </span>
          <button className="secondary reset" onClick={reset}>
            ↺ Reiniciar
          </button>
        </div>
      </footer>
    </div>
  );
}
