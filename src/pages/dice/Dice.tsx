import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import type { DiceSides } from '../../shared/dice';
import { rollFormula, rollModeNames, rollPool } from '../../shared/dice/rollPool';
import type { PoolResult, RollMode, RollRequest } from '../../shared/dice/rollPool';
import dieStyles from '../../features/dice-roller/ui/DiceRoller.module.scss';
import styles from './Dice.module.scss';

const diceSides: DiceSides[] = [4, 6, 8, 10, 12, 20, 100];
interface HistoryEntry { id: number; time: string; result: PoolResult }

function Breakdown({ result }: { result: PoolResult }) {
  return <div className={styles.breakdown} aria-label="Значения костей">
    {result.values.map((value, index) => <span key={index}
      className={result.keptIndex !== null && result.keptIndex !== index ? styles.discarded : styles.kept}
      aria-label={`${value}${result.keptIndex !== null ? result.keptIndex === index ? ', выбрано' : ', не учитывается' : ''}`}>{value}</span>)}
    {result.modifier !== 0 && <span className={styles.modifierValue}>{result.modifier > 0 ? '+' : '−'} {Math.abs(result.modifier)}</span>}
    <span className={styles.equationTotal}>= {result.total}</span>
  </div>;
}

export function Dice() {
  const [selectedSides, setSelectedSides] = useState<DiceSides>(20);
  const [count, setCount] = useState('1');
  const [modifier, setModifier] = useState('0');
  const [mode, setMode] = useState<RollMode>('normal');
  const [isRolling, setIsRolling] = useState(false);
  const [preview, setPreview] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [result, setResult] = useState<PoolResult | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const rolling = useRef(false);
  const nextId = useRef(0);
  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
    if (interval.current) clearInterval(interval.current);
  }, []);

  const valid = count.trim() !== '' && modifier.trim() !== '' && Number.isInteger(Number(count)) &&
    Number(count) >= 1 && Number(count) <= 20 && Number.isInteger(Number(modifier)) && Number(modifier) >= -100 && Number(modifier) <= 100;
  const canUseMode = selectedSides === 20 && Number(count) === 1;
  const request: RollRequest = { sides: selectedSides, count: Number(count), modifier: Number(modifier), mode: canUseMode ? mode : 'normal' };
  const formula = valid ? rollFormula(request) : '—';

  const startRoll = (settings: RollRequest) => {
    if (rolling.current) return;
    const outcome = rollPool(settings);
    const finish = () => {
      setResult(outcome);
      const entry = { id: ++nextId.current, time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), result: outcome };
      setHistory((current) => [entry, ...current].slice(0, 30));
      setIsRolling(false);
      rolling.current = false;
      timeout.current = null;
      if (interval.current) clearInterval(interval.current);
      interval.current = null;
    };
    rolling.current = true;
    setIsRolling(true);
    setPreview(1 + Math.floor(Math.random() * settings.sides));
    interval.current = setInterval(() => setPreview(1 + Math.floor(Math.random() * settings.sides)), 70);
    timeout.current = setTimeout(finish, 800);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid) startRoll(request);
  };
  const repeat = (previous: PoolResult) => {
    setSelectedSides(previous.sides); setCount(String(previous.count)); setModifier(String(previous.modifier)); setMode(previous.mode);
    startRoll({ sides: previous.sides, count: previous.count, modifier: previous.modifier, mode: previous.mode });
  };

  return (
    <PageFrame
      className={styles.page}
      eyebrow="Случай решает"
      title="Кости судьбы"
      description="Кидай дерьмо!"
    >
      <div className={styles.toolLayout}>
      <form className={styles.dicePanel} onSubmit={submit} aria-label="Настройки броска">
        <fieldset className={styles.settings} disabled={isRolling}>
        <legend className={styles.selectorLabel}>Выбери свою кость</legend>
        <div className={styles.diceSelector} role="group" aria-label="Тип кубика">
          {diceSides.map((sides) => (
            <button
              aria-pressed={selectedSides === sides}
              className={styles.dieOption}
              key={sides}
              onClick={() => { setSelectedSides(sides); setMode('normal'); }}
              type="button"
            >
              <span className={styles.optionIcon} aria-hidden="true">
                {sides === 4 ? '△' : sides === 6 ? '□' : '⬡'}
              </span>
              <span>d{sides}</span>
            </button>
          ))}
        </div>
        <div className={styles.parameters}>
          <label>Количество костей<input type="number" inputMode="numeric" min={1} max={20} step={1} required value={count}
            onChange={(event) => { setCount(event.target.value); setMode('normal'); }} aria-describedby="dice-count-help" /><span id="dice-count-help">От 1 до 20</span></label>
          <label>Модификатор<input type="number" min={-100} max={100} step={1} required value={modifier}
            onChange={(event) => setModifier(event.target.value)} aria-describedby="dice-mod-help" /><span id="dice-mod-help">От −100 до +100</span></label>
        </div>
        <div className={styles.modeSelector} role="group" aria-label="Режим броска">
          {(Object.entries(rollModeNames) as [RollMode, string][]).map(([key, label]) => <button type="button" key={key}
            aria-pressed={request.mode === key} disabled={key !== 'normal' && !canUseMode} onClick={() => setMode(key)}>{label}</button>)}
        </div>
        <p className={styles.modeHelp}>{canUseMode && mode !== 'normal' ? `Два d20: учитывается ${mode === 'advantage' ? 'большее' : 'меньшее'} значение, затем добавляется модификатор.` : 'Преимущество и помеха доступны для одного d20.'}</p>
        </fieldset>
        <div className={styles.rollArea}>
          <button className={`${dieStyles.dieButton} ${styles.toolDie} ${isRolling ? dieStyles.rolling : ''}`} data-sides={selectedSides}
            disabled={isRolling || !valid} aria-label={`Бросить ${formula}`} type="submit">
            <span className={dieStyles.dieFace}><span className={dieStyles.result}>{isRolling ? preview : '✦'}</span></span>
          </button>
          <button className={styles.rollButton} type="submit" disabled={isRolling || !valid}>{isRolling ? 'Бросаем…' : `Бросить ${formula}`}</button>
        </div>
        <section className={styles.resultPanel} aria-label="Последний результат" aria-live="polite" aria-atomic="true" aria-busy={isRolling}>
          {isRolling ? <p className={styles.resultHint}>Кости брошены…</p> : result ? <>
            <p className={styles.resultLabel}>{rollFormula(result)}{result.mode !== 'normal' && ` · ${rollModeNames[result.mode]}`}</p>
            <strong className={styles.total} data-natural={result.natural ?? undefined}>{result.total}</strong>
            {result.natural && <span className={styles.natural} data-natural={result.natural}>Натуральная {result.natural}</span>}
            <Breakdown result={result} />
          </> : <p className={styles.resultHint}>Здесь появятся результат и значения каждой кости.</p>}
        </section>
      </form>
      <section className={styles.historyPanel} aria-label="История бросков">
        <div className={styles.historyHeading}><h2>Броски</h2><button type="button" disabled={!history.length || isRolling} onClick={() => setHistory([])}>Очистить</button></div>
        <p className={styles.historyHint}>Последние 30 бросков. История сбрасывается при уходе со страницы или перезагрузке.</p>
        {history.length ? <ol className={styles.historyList}>{history.map((entry) => <li key={entry.id}>
          <div className={styles.historyRow}><span>{rollFormula(entry.result)}</span><strong data-natural={entry.result.natural ?? undefined}>{entry.result.total}</strong></div>
          {entry.result.mode !== 'normal' && <p className={styles.historyMode}>{rollModeNames[entry.result.mode]}</p>}
          <Breakdown result={entry.result} />
          <div className={styles.historyFooter}><time>{entry.time}</time><button type="button" disabled={isRolling} onClick={() => repeat(entry.result)} aria-label={`Повторить ${rollFormula(entry.result)}, бросок в ${entry.time}`}>Повторить ↻</button></div>
        </li>)}</ol> : <div className={styles.emptyHistory}>Пока ни одного броска.<br />Пусть кости решат судьбу.</div>}
      </section>
      </div>
    </PageFrame>
  );
}
