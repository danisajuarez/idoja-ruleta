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
test.each([0, 1])('answer %i shows correction and explanation without retries', async (answer) => { render(<App spinDuration={0}/>); await choose(); await question(); expect(screen.getByText('¡Por este premio… responde esta pregunta!')).toBeTruthy(); expect(screen.getByTestId('prize-at-stake').textContent).toContain(data.prizes[0].name); expect(screen.queryByTestId('plotty-fact')).toBeNull(); const buttons = screen.getAllByRole('button', { name: /^[AB] / }); fireEvent.click(buttons[answer]); expect(screen.getByTestId('answer-explanation').textContent).toContain(first().explanation); expect(screen.getByText(first().options[first().answer]).parentElement?.textContent).toContain('La respuesta correcta'); expect(Boolean(screen.queryByTestId('awarded-prize'))).toBe(answer === first().answer); expect(screen.queryByRole('button', { name: /Volver a la ruleta/ })).toBeNull(); expect(screen.getByRole('button', { name: /Siguiente participante/ })).toBe(document.activeElement); if (answer === first().answer)
    expect(screen.getByText(/Retira tu premio en el stand/)).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: /Siguiente participante/ })); expect(screen.getByRole('heading', { name: '¿Qué carrera estudias?' })).toBeTruthy(); });
test.each(['Diseño gráfico', 'Arquitectura', 'Diseño de interiores', 'Otra carrera'])('restricts questions for %s', async (name) => { render(<App spinDuration={0}/>); await choose(name); await question(); const career = data.careers.find(c => c.name === name)!; const eligible = data.careerCategories[career.id as keyof typeof data.careerCategories]; const expected = data.categories.find(c => eligible.includes(c.id))!.questions[0]; expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(expected.text); });
test.each([0, 1, 2, 3, 4, 5, 6])('weighted draw and pointer align for prize %i', async (index) => { const preceding = data.prizes.slice(0, index).reduce((sum, p) => sum + p.weight, 0); const random = (preceding + .01) / 100; expect(drawPrize(data.prizes, random)).toBe(index); vi.mocked(Math.random).mockReturnValueOnce(random).mockReturnValue(0); const { container } = render(<App spinDuration={0}/>); await choose(); await question(); const rotation = Number((container.querySelector('.wheel') as SVGElement).style.transform.match(/[\d.]+/)![0]); expect((rotation + (index + .5) * 360 / 7) % 360).toBeCloseTo(0); expect(screen.getByTestId('prize-at-stake').textContent).toContain(data.prizes[index].name); });
test('weight boundaries and invalid configuration', () => { expect(drawPrize(data.prizes, 0)).toBe(0); expect(drawPrize(data.prizes, .30)).toBe(1); expect(drawPrize(data.prizes, .999999)).toBe(6); expect(() => validateData({ ...data, prizes: data.prizes.map((p, i) => ({ ...p, weight: i ? p.weight : 0 })) })).toThrow(); expect(() => validateData({ ...data, prizes: data.prizes.map(p => ({ ...p, weight: p.id === 'phoneholder' ? 3 : p.weight })) })).toThrow(); expect(() => validateData({ ...data, careerCategories: { all: ['missing'] } })).toThrow(); expect(() => validateData({ ...data, prizes: [] })).toThrow(); });
test.each([false, true])('duration and reset respect reduced motion %s', async (reduced) => { const previous = window.matchMedia; window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }); try {
    const { container } = render(<App />);
    await choose();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: /Girar la ruleta/ }));
    const duration = reduced ? 1200 : 7000;
    expect((container.querySelector('.wheel') as SVGElement).style.transitionDuration).toBe(`${duration}ms`);
    act(() => vi.advanceTimersByTime(duration - 1));
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    act(() => vi.advanceTimersByTime(1));
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
test('Instagram remains optional with local QR and legacy prize defaults', async () => { const { prizes, ...legacy } = data; vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...legacy, instagramUrl: 'https://www.instagram.com/idoja/' }) } as Response); render(<App />); const link = await screen.findByRole('link', { name: /Síguenos en Instagram/ }); expect(link.querySelector('svg')).toBeTruthy(); expect(screen.getByText(/Seguirnos es opcional/)).toBeTruthy(); await choose(); expect(screen.getAllByTestId('prize')).toHaveLength(6); });
