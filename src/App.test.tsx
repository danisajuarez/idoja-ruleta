import {afterEach,expect,test,vi, beforeEach} from 'vitest';
import {cleanup,fireEvent,render,screen,act} from '@testing-library/react';
import App,{validateData} from './App';
import data from '../public/event.json';
beforeEach(()=>{
  vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>data} as Response);
  vi.spyOn(Math,'random').mockReturnValue(0);
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
async function chooseCareer(name='Diseño gráfico'){
  fireEvent.click(await screen.findByRole('button',{name:new RegExp(`^${name}`)}));
  fireEvent.click(screen.getByRole('button',{name:/Continuar a la ruleta/}));
}
test('asks career first; cannot spin before selecting and continuing',async()=>{
  render(<App spinDuration={0}/>);
  await screen.findByRole('heading',{name:'¿Qué carrera estudias?'});
  expect(screen.queryByRole('button',{name:/Girar la ruleta/})).toBeNull();
  expect(screen.getByRole('button',{name:/Continuar a la ruleta/}).hasAttribute('disabled')).toBe(true);
  await chooseCareer();
  expect(screen.getAllByTestId('prize')).toHaveLength(6);
  expect(screen.getByRole('button',{name:/Girar la ruleta/})).toBeTruthy();
});
test('shows drawn prize, then career question; correct answer wins only that prize',async()=>{
  render(<App spinDuration={0}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  fireEvent.click(await screen.findByRole('button',{name:/A.*CMYK/}));
  expect(screen.getByRole('heading',{name:'¡Ganaste!'})).toBeTruthy();
  expect(screen.getByTestId('awarded-prize').textContent).toBe('Pack de stickers');
  expect(screen.getByTestId('score').textContent).toContain('1');
  fireEvent.click(screen.getByRole('button',{name:/Siguiente participante/}));
  expect(screen.getByRole('heading',{name:'¿Qué carrera estudias?'})).toBeTruthy();
  expect(screen.getByRole('button',{name:/Continuar a la ruleta/}).hasAttribute('disabled')).toBe(true);
});
test('wrong answer reveals correction and does not award prize',async()=>{
  render(<App spinDuration={0}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  fireEvent.click(await screen.findByRole('button',{name:/B.*RGB/}));
  expect(screen.getByText('¡Casi! Sigue explorando.')).toBeTruthy();
  expect(screen.queryByTestId('awarded-prize')).toBeNull();
  expect(screen.getByText('CMYK').parentElement?.textContent).toContain('La respuesta correcta es: CMYK');
  expect(screen.getByTestId('score').textContent).toContain('0 aciertos / 1 jugadas');
});
test('reset during spin cancels question and returns to career choice',async()=>{
  render(<App spinDuration={50}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  fireEvent.click(screen.getByRole('button',{name:/Reiniciar/}));
  await new Promise(resolve=>setTimeout(resolve,90));
  expect(screen.queryByRole('button',{name:/^A /})).toBeNull();
  expect(screen.getByRole('heading',{name:'¿Qué carrera estudias?'})).toBeTruthy();
  expect(screen.getByTestId('score').textContent).toContain('/ 0 jugadas');
});
test('can go back and choose another career before spinning',async()=>{
  render(<App spinDuration={0}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Cambiar carrera/}));
  await chooseCareer('Arquitectura');
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  expect((await screen.findByRole('heading',{level:2})).textContent).toBe(data.careerQuestions.architecture.graphic[0].text);
});
test.each([0,1,2,3,4,5])('pointer and question refer to the drawn prize %i',async(prize)=>{
  vi.mocked(Math.random).mockReturnValueOnce((prize+.1)/6).mockReturnValue(0);
  const {container}=render(<App spinDuration={0}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  await screen.findByRole('button',{name:/^A /});
  const rotation=Number((container.querySelector('.wheel') as SVGElement).style.transform.match(/[\d.]+/)![0]);
  expect((rotation+prize*60+30)%360).toBe(0);
  expect(screen.getByTestId('prize-at-stake').textContent).toContain(data.prizes[prize].name);
});
test('Instagram QR is optional and generated locally',async()=>{
  vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({...data,instagramUrl:'https://www.instagram.com/idoja/'})} as Response);
  render(<App/>);
  const link=await screen.findByRole('link',{name:/Síguenos en Instagram/});
  expect(link.getAttribute('href')).toBe('https://www.instagram.com/idoja/');
  expect(link.querySelector('svg')).not.toBeNull();
});
test('invalid JSON and invalid prize arrays are rejected',async()=>{
  vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({categories:[]})} as Response);
  render(<App/>);
  expect((await screen.findByRole('alert')).textContent).toContain('event.json');
  expect(()=>validateData({...data,prizes:[]})).toThrow();
  expect(()=>validateData({...data,prizes:data.prizes.map(p=>({...p,id:'duplicate'}))})).toThrow();
});
test('old JSON without prizes still works with explicit demo defaults',async()=>{
  const {prizes,...legacy}=data;
  vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>legacy} as Response);
  render(<App/>);
  await chooseCareer();
  expect(screen.getAllByTestId('prize')).toHaveLength(6);
  expect(screen.getByText(/Premios de ejemplo/)).toBeTruthy();
});
test('Plotty facts rotate independently during a question',async()=>{
  const {rerender}=render(<App spinDuration={0} factInterval={999999}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  const question=await screen.findByRole('heading',{level:2});
  const text=question.textContent,before=screen.getByTestId('plotty-fact').textContent;
  vi.useFakeTimers();
  rerender(<App spinDuration={0} factInterval={12000}/>);
  act(()=>vi.advanceTimersByTime(12000));
  expect(screen.getByTestId('plotty-fact').textContent).not.toBe(before);
  expect(question.textContent).toBe(text);
  expect(screen.getByTestId('score').textContent).toContain('/ 0 jugadas');
});
test('reduced-motion spin stays visible and question waits until it ends',async()=>{
  const previous=window.matchMedia;
  window.matchMedia=vi.fn().mockReturnValue({matches:true});
  try{
    const {container}=render(<App/>);
    await chooseCareer();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
    expect((container.querySelector('.wheel') as SVGElement).style.transitionDuration).toBe('1200ms');
    expect(screen.queryByRole('heading',{level:2})).toBeNull();
    act(()=>vi.advanceTimersByTime(1199));
    expect(screen.queryByRole('heading',{level:2})).toBeNull();
    act(()=>vi.advanceTimersByTime(1));
    expect(screen.getByRole('heading',{level:2})).toBeTruthy();
  }finally{window.matchMedia=previous;}
});
test('Plotty hosts each stage and grows when asking the question',async()=>{
  const {container}=render(<App spinDuration={50}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  expect(container.querySelector('.plotty-panel.is-spinning')).not.toBeNull();
  expect(screen.getByTestId('plotty-speech').textContent).toContain('¡Yo giro la ruleta!');
  await screen.findByRole('button',{name:/A.*CMYK/});
  expect(container.querySelector('.plotty-panel.is-asking')).not.toBeNull();
  expect(screen.getByTestId('plotty-speech').textContent).toContain('Pack de stickers');
});
test('student benefit and social invitation do not depend on winning or following',async()=>{
  render(<App spinDuration={0}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  fireEvent.click(await screen.findByRole('button',{name:/B.*RGB/}));
  expect(screen.getByTestId('student-offer').textContent).toContain('10% de descuento');
  expect(screen.getByText('Seguirnos es opcional. No es un requisito para jugar.')).toBeTruthy();
  expect(screen.getByRole('button',{name:/Siguiente participante/}).hasAttribute('disabled')).toBe(false);
  expect(screen.queryByRole('textbox')).toBeNull();
});
test.each([0,1])('shows thank-you artwork after answer %i and restores normal Plotty for next participant',async(answer)=>{
  render(<App spinDuration={0}/>);
  await chooseCareer();
  expect(screen.getByRole('img',{name:'Plotty, la mascota de IDOJA'}).getAttribute('src')).toBe('./plotty-normal.png');
  expect(screen.queryByRole('img',{name:/abrazando planos/})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  fireEvent.click(await screen.findByRole('button',{name:answer===0?/A.*CMYK/:/B.*RGB/}));
  expect(screen.getByRole('img',{name:'Plotty abrazando planos: gracias por confiar'}).getAttribute('src')).toBe('./plotty-thanks.png');
  fireEvent.click(screen.getByRole('button',{name:/Siguiente participante/}));
  expect(screen.getByRole('img',{name:'Plotty, la mascota de IDOJA'}).getAttribute('src')).toBe('./plotty-normal.png');
  expect(screen.queryByRole('img',{name:/abrazando planos/})).toBeNull();
});
test('a wrong answer offers another spin with the same career and keeps attempt totals',async()=>{
  render(<App spinDuration={0}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  fireEvent.click(await screen.findByRole('button',{name:/B.*RGB/}));
  expect(screen.getByText(/RESPUESTA INCORRECTA/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Volver a la ruleta/}));
  expect(screen.getByRole('button',{name:/Cambiar carrera Diseño gráfico/})).toBeTruthy();
  expect(screen.getByTestId('score').textContent).toContain('0 aciertos / 1 jugadas');
  expect(screen.getByRole('img',{name:'Plotty, la mascota de IDOJA'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  expect((await screen.findByRole('heading',{level:2})).textContent).toBe('¿Qué es el kerning?');
  fireEvent.click(await screen.findByRole('button',{name:/B.*ajuste entre pares/}));
  expect(screen.getByRole('heading',{name:'¡Ganaste!'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Volver a la ruleta/})).toBeNull();
  expect(screen.getByTestId('score').textContent).toContain('1 aciertos / 2 jugadas');
});
test.each([0,1])('shows explanation clearly after answer %i but not before',async(answer)=>{
  render(<App spinDuration={0}/>);
  await chooseCareer();
  fireEvent.click(screen.getByRole('button',{name:/Girar la ruleta/}));
  const choice=await screen.findByRole('button',{name:answer===0?/A.*CMYK/:/B.*RGB/});
  expect(screen.queryByTestId('answer-explanation')).toBeNull();
  fireEvent.click(choice);
  expect(screen.getByRole('heading',{name:'¿Por qué es correcta?'})).toBeTruthy();
  expect(screen.getByTestId('answer-explanation').textContent).toContain(data.careerQuestions.graphic.graphic[0].explanation);
});
