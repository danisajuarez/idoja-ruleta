import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App, { validateData, drawPrize } from './App';
import data from '../public/event.json';
beforeEach(() => { vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => data } as Response); vi.spyOn(Math, 'random').mockReturnValue(0); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
async function choose(name = 'Diseño gráfico') { fireEvent.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) })); fireEvent.click(screen.getByRole('button', { name: /Continuar a la ruleta/ })); }
async function question() { fireEvent.click(screen.getByRole('button', { name: /Girar la ruleta/ })); await screen.findByRole('heading', { level: 2 }); }
const first = () => data.categories[0].questions[0];
test('career comes first and seven prizes follow', async () => { render(<App />); await screen.findByRole('heading', { name: '¿Qué carrera estudias?' }); expect(screen.queryByRole('button', { name: /Girar la ruleta/ })).toBeNull(); expect(screen.getByRole('button', { name: /Continuar/ }).hasAttribute('disabled')).toBe(true); expect(screen.getByText(/Un intento por persona/)).toBeTruthy(); await choose(); expect(screen.getAllByTestId('prize')).toHaveLength(7); });
test.each([0, 1])('answer %i shows correction and explanation without retries', async (answer) => { render(<App spinDuration={0} revealDuration={0}/>); await choose(); await question(); expect(screen.getByText('¡Por este premio… responde esta pregunta!')).toBeTruthy(); expect(screen.getByTestId('prize-at-stake').textContent).toContain(data.prizes[0].name); expect(screen.queryByTestId('plotty-fact')).toBeNull(); const buttons = screen.getAllByRole('button', { name: /^[AB] / }); fireEvent.click(buttons[answer]); expect(screen.getByTestId('answer-explanation').textContent).toContain(first().explanation); expect(screen.getByText(first().options[first().answer]).parentElement?.textContent).toContain('La respuesta correcta'); expect(Boolean(screen.queryByTestId('awarded-prize'))).toBe(answer === first().answer); expect(screen.queryByRole('button', { name: /Volver a la ruleta/ })).toBeNull(); expect(screen.getByRole('button', { name: /Siguiente participante/ })).toBe(document.activeElement); if (answer === first().answer)
    expect(screen.getByText(/Retira tu premio en el stand/)).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: /Siguiente participante/ })); expect(screen.getByRole('heading', { name: '¿Qué carrera estudias?' })).toBeTruthy(); });
test.each(['Diseño gráfico', 'Arquitectura', 'Diseño de interiores', 'Otra carrera'])('restricts questions for %s', async (name) => { render(<App spinDuration={0} revealDuration={0}/>); await choose(name); await question(); const career = data.careers.find(c => c.name === name)!; const eligible = data.careerCategories[career.id as keyof typeof data.careerCategories]; const expected = data.categories.find(c => eligible.includes(c.id))!.questions[0]; expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(expected.text); });
test.each([0, 1, 2, 3, 4, 5, 6])('weighted draw and pointer align for prize %i', async (index) => { const preceding = data.prizes.slice(0, index).reduce((sum, p) => sum + p.weight, 0); const random = (preceding + .01) / 100; expect(drawPrize(data.prizes, random)).toBe(index); vi.mocked(Math.random).mockReturnValueOnce(random).mockReturnValue(0); const { container } = render(<App spinDuration={0} revealDuration={0}/>); await choose(); fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/})); const rotation = Number((container.querySelector('.wheel') as SVGElement).style.transform.match(/[\d.]+/)![0]); expect((rotation + (index + .5) * 360 / 7) / 360).toBeCloseTo(Math.round((rotation + (index + .5) * 360 / 7) / 360)); expect((await screen.findByTestId('prize-at-stake')).textContent).toContain(data.prizes[index].name); });
test('weight boundaries and invalid configuration', () => { expect(drawPrize(data.prizes, 0)).toBe(0); expect(drawPrize(data.prizes, .30)).toBe(1); expect(drawPrize(data.prizes, .999999)).toBe(6); expect(() => validateData({ ...data, prizes: data.prizes.map((p, i) => ({ ...p, weight: i ? p.weight : 0 })) })).toThrow(); expect(() => validateData({ ...data, prizes: data.prizes.map(p => ({ ...p, weight: p.id === 'phoneholder' ? 3 : p.weight })) })).toThrow(); expect(() => validateData({ ...data, careerCategories: { all: ['missing'] } })).toThrow(); expect(() => validateData({ ...data, prizes: [] })).toThrow(); });
test.each([false, true])('duration and reset respect reduced motion %s', async (reduced) => { const previous = window.matchMedia; window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }); try {
    const { container } = render(<App />);
    await choose();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: /Girar la ruleta/ }));
    const duration = reduced ? 1200 : 12000;
    expect((container.querySelector('.wheel') as SVGElement).style.transitionDuration).toBe(`${duration}ms`);
    act(() => vi.advanceTimersByTime(duration - 1));
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Diseño gráfico/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Girar la ruleta/ }));
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar/ }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
}
finally {
    window.matchMedia = previous;
} });
test('Instagram remains optional with local QR and legacy prize defaults', async () => { const { prizes, ...legacy } = data; vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...legacy, instagramUrl: 'https://www.instagram.com/idoja/' }) } as Response); render(<App />); const link = await screen.findByRole('link', { name: /Sígueme en Instagram/ }); expect(link.querySelector('svg')).toBeTruthy(); expect(screen.getByText(/Seguirme es opcional/)).toBeTruthy(); await choose(); expect(screen.getAllByTestId('prize')).toHaveLength(6); });


test.each([true, false])('celebration appears only for a win: %s', async (win) => {
  const { container } = render(<App spinDuration={0} revealDuration={0}/>);
  await choose();
  await question();
  expect(screen.queryByTestId('confetti')).toBeNull();
  const answers = screen.getAllByRole('button', { name: /^[AB] / });
  fireEvent.click(answers[win ? first().answer : 1 - first().answer]);
  expect(Boolean(screen.queryByTestId('confetti'))).toBe(win);
  expect(container.querySelector(win ? '.plotty-panel.is-winner' : '.plotty-panel.is-encouraging')).toBeTruthy();
  if (win) {
    expect(screen.getByTestId('confetti').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByTestId('confetti').children).toHaveLength(60);
  }
  fireEvent.click(screen.getByRole('button', { name: /Siguiente participante/ }));
  expect(screen.queryByTestId('confetti')).toBeNull();
});

test('lights appear only while the wheel spins', async () => {
  const { container } = render(<App spinDuration={7000}/>);
  await choose();
  expect(container.querySelector('.wheel-frame.is-spinning')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Girar la ruleta/ }));
  expect(container.querySelector('.wheel-frame.is-spinning')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Reiniciar/ }));
  expect(container.querySelector('.wheel-frame.is-spinning')).toBeNull();
});


test('brand slogan is grouped below the logo', async () => {
  render(<App/>);
  const logo = await screen.findByAltText(/^IDOJA/);
  expect(logo.parentElement?.className).toBe('brand-lockup');
  expect(logo.nextElementSibling?.textContent).toBe(data.slogan);
});

test('Plotty leaves 25 seconds to read each fact', async () => {
  vi.useFakeTimers({toFake:['setInterval','clearInterval']});
  render(<App/>);
  const fact = await screen.findByTestId('plotty-fact');
  const initial = fact.textContent;
  act(() => vi.advanceTimersByTime(24999));
  expect(fact.textContent).toBe(initial);
  act(() => vi.advanceTimersByTime(1));
  expect(fact.textContent).not.toBe(initial);
});

test('normal spin uses three full turns plus alignment', async () => {
  const {container} = render(<App spinDuration={0} revealDuration={0}/>);
  await choose();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  const rotation = Number((container.querySelector('.wheel') as SVGElement).style.transform.match(/[\d.]+/)![0]);
  expect(rotation).toBeGreaterThanOrEqual(1080);
  expect(rotation).toBeLessThan(1440);
});


test('question replaces wheel rather than overlapping it', async () => {
  const {container}=render(<App spinDuration={0} revealDuration={0}/>);
  await choose(); await question();
  expect(container.querySelector('.wheel-screen')).toBeNull();
  expect(container.querySelector('.question-overlay')).toBeTruthy();
});

test('reduced-motion users can explicitly enable game effects', async () => {
  const previous=window.matchMedia;
  window.matchMedia=vi.fn().mockReturnValue({matches:true});
  try {
    const {container}=render(<App/>);
    fireEvent.click(await screen.findByRole('button',{name:/Activar efectos/}));
    expect(container.querySelector('.app-shell.motion-enabled')).toBeTruthy();
    await choose();
    fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
    expect((container.querySelector('.wheel') as SVGElement).style.transitionDuration).toBe('12000ms');
  } finally {window.matchMedia=previous;}
});


test('spotlight reuses wheel and Plotty, then reveals the prize for 1500ms', async () => {
  const {container}=render(<App/>);
  await choose();
  const wheel=container.querySelector('.wheel');
  const mascot=container.querySelector('.plotty');
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  expect(container.querySelector('.game-layout.is-spotlight')).toBeTruthy();
  expect(container.querySelector('.wheel')).toBe(wheel);
  expect(container.querySelector('.plotty')).toBe(mascot);
  expect(screen.getByTestId('plotty-speech').textContent).toBe('\u00a1Voy por ese premio!');
  expect(screen.queryByTestId('plotty-fact')).toBeNull();
  expect(screen.queryByRole('link',{name:/Instagram/})).toBeNull();
  const calls=vi.mocked(Math.random).mock.calls.length;
  act(()=>vi.advanceTimersByTime(12000));
  expect(screen.getByTestId('prize-reveal').textContent).toContain(data.prizes[0].name);
  expect(screen.queryByRole('heading',{level:2})).toBeNull();
  fireEvent.click(container.querySelector('.wheel-center')!);
  expect(vi.mocked(Math.random).mock.calls.length).toBe(calls);
  act(()=>vi.advanceTimersByTime(1499));
  expect(screen.queryByRole('heading',{level:2})).toBeNull();
  act(()=>vi.advanceTimersByTime(1));
  expect(screen.getByTestId('prize-at-stake').textContent).toContain(data.prizes[0].name);
  expect(container.querySelector('.is-spotlight')).toBeNull();
});

test.each([100,12100])('reset cancels spotlight timers at %ims', async (elapsed)=>{
  const {container}=render(<App/>);
  await choose();
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  act(()=>vi.advanceTimersByTime(elapsed));
  fireEvent.click(screen.getByRole('button',{name:/Reiniciar/}));
  act(()=>vi.advanceTimersByTime(20000));
  expect(screen.getByRole('heading',{name:'\u00bfQu\u00e9 carrera estudias?'})).toBeTruthy();
  expect(container.querySelector('.is-spotlight')).toBeNull();
  expect(screen.queryByTestId('prize-reveal')).toBeNull();
  expect(screen.queryByRole('heading',{level:2})).toBeNull();
  expect(screen.getByTestId('score').textContent).toContain('0 aciertos / 0 jugadas');
});


test('unmount during prize reveal clears both timer sources', async ()=>{
  const {unmount}=render(<App/>);
  await choose();
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  act(()=>vi.advanceTimersByTime(12000));
  expect(screen.getByTestId('prize-reveal')).toBeTruthy();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  act(()=>vi.advanceTimersByTime(20000));
  expect(screen.queryByRole('heading',{level:2})).toBeNull();
});

test.each([true, false])('result presentation distinguishes winning: %s', async (winning) => {
  const { container } = render(<App spinDuration={0} revealDuration={0}/>);
  await choose();
  await question();
  const option = winning ? first().answer : 1 - first().answer;
  fireEvent.click(screen.getAllByRole('button', { name: /^[AB] / })[option]);
  expect(Boolean(container.querySelector('.is-result.is-incorrect'))).toBe(!winning);
  expect(screen.getByTestId('student-offer')).toBeTruthy();
  expect(screen.getByTestId('answer-explanation').textContent).toContain(first().explanation);
  expect(Boolean(screen.queryByTestId('awarded-prize'))).toBe(winning);
  expect(screen.getByRole('button', { name: /Siguiente participante/ })).toBeTruthy();
  if (!winning) expect(screen.getByText('RESPUESTA INCORRECTA')).toBeTruthy();
});

test('Instagram QR is larger without changing its destination', async () => {
  render(<App/>);
  const link = await screen.findByRole('link', { name: /Sígueme en Instagram/ });
  expect(link.getAttribute('href')).toBe(data.instagramUrl);
  expect(link.querySelector('.instagram-qr')?.getAttribute('width')).toBe('224');
  expect(link.querySelector('.instagram-qr')?.getAttribute('height')).toBe('224');
});

test.each([true, false])('TV result keeps the essential content and removes competing facts: %s', async (winning) => {
  const questions = data.categories.flatMap(c => c.questions);
  const longest = {
    text: questions.reduce((a, q) => q.text.length > a.length ? q.text : a, ''),
    options: [0, 1].map(i => questions.reduce((a, q) => q.options[i].length > a.length ? q.options[i] : a, '')),
    answer: 0,
    explanation: questions.reduce((a, q) => q.explanation.length > a.length ? q.explanation : a, ''),
  };
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...data, categories: data.categories.map(c => ({ ...c, questions: [longest] })) }) } as Response);
  const { container } = render(<App spinDuration={0} revealDuration={0}/>);
  await choose();
  await question();
  expect(screen.getByRole('heading', {level: 2}).textContent).toBe(longest.text);
  fireEvent.click(screen.getAllByRole('button', { name: /^[AB] / })[winning ? 0 : 1]);
  expect(screen.getByTestId('answer-explanation').textContent).toContain(longest.explanation);
  expect(container.querySelector('.result-learning')?.textContent).toContain(longest.options[0]);
  expect(container.querySelector('.result-footer [data-testid="student-offer"]')).toBeTruthy();
  expect(screen.queryByTestId('plotty-fact')).toBeNull();
  expect(Boolean(screen.queryByTestId('awarded-prize'))).toBe(winning);
  expect(screen.getByRole('button', { name: /Siguiente participante/ })).toBe(document.activeElement);
});

test('Instagram invitation has its own identity and derives the handle from configuration', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...data, instagramUrl: 'https://www.instagram.com/another_studio/' }) } as Response);
  render(<App/>);
  const link = await screen.findByRole('link', { name: /Sígueme en Instagram/ });
  expect(link.querySelector('.instagram-icon')).toBeTruthy();
  expect(screen.getByText('Escanea y sígueme')).toBeTruthy();
  expect(screen.getByText('@another_studio')).toBeTruthy();
  expect(screen.getByText(/Seguirme es opcional/)).toBeTruthy();
  expect(link.getAttribute('href')).toBe('https://www.instagram.com/another_studio/');
});

test('empty Instagram configuration hides the entire invitation', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...data, instagramUrl: '' }) } as Response);
  render(<App/>);
  await screen.findByRole('heading', { name: '¿Qué carrera estudias?' });
  expect(screen.queryByRole('link', { name: /Instagram/ })).toBeNull();
  expect(screen.queryByText('Escanea y sígueme')).toBeNull();
});
test('welcome uses the requested invitation', async () => { render(<App />); await screen.findByRole('heading', { name: '¿Qué carrera estudias?' }); expect(screen.getByText(/^Elige tu carrera y juguemos\./)).toBeTruthy(); });

test('Plotty presents the seven business messages in order and cycles', async () => {
  const messages = [
    'El 90% de mis clientes me eligen por mi calidad de impresión, el otro 10% por la rapidez en la entrega.',
    'Me especializo en impresiones facultativas con terminación profesional',
    'Convertí tus entregas en trabajos profesionales',
    'Atiendo de 6 AM a 1 AM de LUNES a LUNES',
    'Te asesoro en la elección del papel',
    'Reviso tus archivos para que salgan bien impresos',
    'Hago envíos gratis Martes y Jueves a coordinar a la UAI.',
  ];
  expect(data.facts).toEqual(messages);
  render(<App />);
  const fact = await screen.findByTestId('plotty-fact');
  for (const message of messages) {
    expect(fact.textContent).toBe(message);
    fireEvent.click(screen.getByRole('button', { name: 'Otro dato curioso' }));
  }
  expect(fact.textContent).toBe(messages[0]);
});
