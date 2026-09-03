// Wallet state loaded from LocalStorage
let credits = parseInt(localStorage.getItem('royal_credits')) || 12450;
let bet = 50;
let activeGame = gamesData[0];
let isBusy = false;

// Engine-specific session variables
let dtChoice = 'dragon';
let ludoPos = 0;
let wheelDeg = 0;

// Central SPA View Switcher
function showPage(pageId) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById('view-' + pageId);
  const btn = document.getElementById('btn-nav-' + pageId);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Launching a specific game
function launchGame(id) {
  const g = gamesData.find(item => item.id === id);
  if (!g) return;
  activeGame = g;

  document.getElementById('stage-title').textContent = g.title;
  document.getElementById('stage-tag').textContent = g.tag.toUpperCase();
  document.getElementById('game-status').className = 'status-bar';
  document.getElementById('game-status').textContent = 'Ready to play!';

  buildArena(g);
  showPage('game');
}

// Render dynamic interface based on engine
function buildArena(g) {
  const container = document.getElementById('dynamic-arena');
  const actionBtn = document.getElementById('stage-action-btn');

  if (g.engine === 'dragontiger') {
    actionBtn.textContent = 'DEAL CARDS';
    container.innerHTML = `
      <div class="dt-table">
        <div class="dt-side">
          <h3 style="color:#ff5555">DRAGON</h3>
          <div class="dt-card back" id="dt-card-dragon">?</div>
        </div>
        <div style="font-size:24px; font-weight:900; color:var(--gold-primary)">VS</div>
        <div class="dt-side">
          <h3 style="color:#f5b041">TIGER</h3>
          <div class="dt-card back" id="dt-card-tiger">?</div>
        </div>
      </div>
      <div class="dt-bets">
        <button class="dt-bet-btn btn-dragon active" onclick="setDTChoice('dragon', this)">DRAGON (2x)</button>
        <button class="dt-bet-btn btn-tie" onclick="setDTChoice('tie', this)">TIE (8x)</button>
        <button class="dt-bet-btn btn-tiger" onclick="setDTChoice('tiger', this)">TIGER (2x)</button>
      </div>
    `;
  } else if (g.engine === 'ludo') {
    actionBtn.textContent = 'ROLL DICE';
    ludoPos = 0;
    container.innerHTML = `
      <div class="ludo-board">
        <p style="color:var(--text-muted); font-size:13px;">Roll the dice to advance your pawn across multipliers!</p>
        <div class="dice-box" id="ludo-dice">🎲</div>
        <div class="ludo-track">
          <div class="track-step active" id="step-0">Start</div>
          <div class="track-step" id="step-1">1.5x</div>
          <div class="track-step" id="step-2">2x</div>
          <div class="track-step" id="step-3">3x</div>
          <div class="track-step" id="step-4">5x</div>
          <div class="track-step" id="step-5">HOME 👑</div>
        </div>
      </div>
    `;
  } else if (g.engine === 'wheel') {
    actionBtn.textContent = 'SPIN WHEEL';
    container.innerHTML = `
      <div class="wheel-wrapper">
        <div class="wheel-pointer">▼</div>
        <div class="wheel-disc" id="wheel-disc">
          <div class="wheel-center">👑</div>
        </div>
      </div>
    `;
  } else {
    actionBtn.textContent = 'SPIN REELS';
    const s = g.symbols || ['👑','💎','🔥','🍀','🪙'];
    container.innerHTML = `
      <div class="slot-screen">
        <div class="reel" id="r1"><span>${s[0]}</span></div>
        <div class="reel" id="r2"><span>${s[0]}</span></div>
        <div class="reel" id="r3"><span>${s[0]}</span></div>
      </div>
    `;
  }
}

// Execution Router
function executeGamePlay() {
  if (isBusy) return;
  if (credits < bet) {
    setStatus('Insufficient Credits! Refill from profile.', false);
    return;
  }

  credits -= bet;
  syncCredits();
  isBusy = true;

  if (activeGame.engine === 'dragontiger') playDragonTiger();
  else if (activeGame.engine === 'ludo') playLudo();
  else if (activeGame.engine === 'wheel') playWheel();
  else playSlots();
}

// 1. Dragon Tiger Logic
function setDTChoice(choice, btn) {
  dtChoice = choice;
  document.querySelectorAll('.dt-bet-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function playDragonTiger() {
  setStatus('Dealing cards...', false);
  const cDragon = document.getElementById('dt-card-dragon');
  const cTiger = document.getElementById('dt-card-tiger');
  cDragon.className = 'dt-card back';
  cTiger.className = 'dt-card back';

  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const suits = ['♠','♥','♦','♣'];

  setTimeout(() => {
    const dVal = Math.floor(Math.random() * 13);
    const tVal = Math.floor(Math.random() * 13);
    const dSuit = suits[Math.floor(Math.random() * 4)];
    const tSuit = suits[Math.floor(Math.random() * 4)];

    cDragon.className = 'dt-card';
    cDragon.innerHTML = `${ranks[dVal]}<small style="font-size:14px;display:block">${dSuit}</small>`;
    cDragon.style.color = (dSuit === '♥' || dSuit === '♦') ? '#e74c3c' : '#111';

    cTiger.className = 'dt-card';
    cTiger.innerHTML = `${ranks[tVal]}<small style="font-size:14px;display:block">${tSuit}</small>`;
    cTiger.style.color = (tSuit === '♥' || tSuit === '♦') ? '#e74c3c' : '#111';

    let winner = 'tie';
    if (dVal > tVal) winner = 'dragon';
    else if (tVal > dVal) winner = 'tiger';

    isBusy = false;
    if (winner === dtChoice) {
      const multi = (winner === 'tie') ? 8 : 2;
      const winAmt = bet * multi;
      credits += winAmt;
      syncCredits();
      setStatus(`🎉 WIN! ${winner.toUpperCase()} won. +${winAmt} Credits!`, true);
    } else {
      setStatus(`Dealer won with ${winner.toUpperCase()}. Try again!`, false);
    }
  }, 700);
}

// 2. Ludo Logic
function playLudo() {
  const dice = document.getElementById('ludo-dice');
  dice.textContent = '🎲';
  setStatus('Rolling dice...', false);

  setTimeout(() => {
    const roll = Math.floor(Math.random() * 6) + 1;
    const diceFaces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    dice.textContent = diceFaces[roll - 1];

    ludoPos += (roll >= 4 ? 2 : 1);
    if (ludoPos > 5) ludoPos = 5;

    for (let i = 0; i <= 5; i++) {
      document.getElementById('step-' + i).classList.toggle('active', i === ludoPos);
    }

    isBusy = false;
    const mults = [0, 1.5, 2, 3, 5, 10];
    const win = Math.round(bet * mults[ludoPos]);
    credits += win;
    syncCredits();

    if (ludoPos === 5) {
      setStatus(`👑 HOME RUN! Rolled ${roll}. Jackpot +${win} Credits!`, true);
      ludoPos = 0;
    } else {
      setStatus(`Pawn advanced to Step ${ludoPos}! Won +${win} Credits.`, true);
    }
  }, 600);
}

// 3. Wheel Logic
function playWheel() {
  const disc = document.getElementById('wheel-disc');
  setStatus('Spinning the wheel...', false);

  const extraDeg = Math.floor(Math.random() * 360) + 1440;
  wheelDeg += extraDeg;
  disc.style.transform = `rotate(${wheelDeg}deg)`;

  setTimeout(() => {
    isBusy = false;
    const slices = [2, 5, 0, 10, 1.5, 0, 20, 3];
    const sliceIndex = Math.floor(((wheelDeg % 360)) / 45);
    const winMult = slices[sliceIndex] || 2;

    if (winMult > 0) {
      const win = Math.round(bet * winMult);
      credits += win;
      syncCredits();
      setStatus(`🎉 WHEEL STOPPED ON ${winMult}x! Won +${win} Credits!`, true);
    } else {
      setStatus(`0x segment hit. Better luck next spin!`, false);
    }
  }, 3500);
}

// 4. Teen Patti Logic
function playTeenPatti() {
  setStatus('Dealing 3 cards...', false);
  const ranks = ['A','K','Q','J','10','9','8'];

  setTimeout(() => {
    const c1 = ranks[Math.floor(Math.random() * ranks.length)];
    const c2 = ranks[Math.floor(Math.random() * ranks.length)];
    const c3 = ranks[Math.floor(Math.random() * ranks.length)];

    document.getElementById('tp-c1').textContent = c1 + '♠';
    document.getElementById('tp-c2').textContent = c2 + '♥';
    document.getElementById('tp-c3').textContent = c3 + '♦';

    isBusy = false;
    if (c1 === c2 && c2 === c3) {
      const win = bet * 20;
      credits += win;
      syncCredits();
      setStatus(`🔥 TRIO / TRAIL! Three ${c1}s. +${win} Credits!`, true);
    } else if (c1 === c2 || c2 === c3 || c1 === c3) {
      const win = bet * 3;
      credits += win;
      syncCredits();
      setStatus(`PAIR MATCH! Won +${win} Credits.`, true);
    } else {
      setStatus(`High card dealt. No pair formed. Try again!`, false);
    }
  }, 600);
}

// 5. Slot Logic
function playSlots() {
  setStatus('Reels rolling...', false);
  const r1 = document.getElementById('r1');
  const r2 = document.getElementById('r2');
  const r3 = document.getElementById('r3');
  r1.classList.add('spinning');
  r2.classList.add('spinning');
  r3.classList.add('spinning');

  const s = activeGame.symbols || ['👑','💎','🔥','🍀','🪙'];

  setTimeout(() => {
    r1.classList.remove('spinning');
    const s1 = s[Math.floor(Math.random() * s.length)];
    r1.querySelector('span').textContent = s1;

    setTimeout(() => {
      r2.classList.remove('spinning');
      const s2 = s[Math.floor(Math.random() * s.length)];
      r2.querySelector('span').textContent = s2;

      setTimeout(() => {
        r3.classList.remove('spinning');
        const s3 = s[Math.floor(Math.random() * s.length)];
        r3.querySelector('span').textContent = s3;

        isBusy = false;
        if (s1 === s2 && s2 === s3) {
          const win = bet * 15;
          credits += win;
          syncCredits();
          setStatus(`🎉 3x MATCH OF ${s1}! Won +${win} Credits!`, true);
        } else {
          setStatus('No line match. Try another spin!', false);
        }
      }, 250);
    }, 250);
  }, 400);
}

// Utility Helpers
function setStatus(msg, isWin) {
  const el = document.getElementById('game-status');
  el.textContent = msg;
  el.className = isWin ? 'status-bar winner' : 'status-bar';
}

function changeBet(delta) {
  if (isBusy) return;
  if (bet + delta >= 25 && bet + delta <= 1000) {
    bet += delta;
    document.getElementById('bet-val').textContent = bet;
  }
}

function syncCredits() {
  localStorage.setItem('royal_credits', credits);
  document.querySelectorAll('.dyn-credits').forEach(el => el.textContent = credits.toLocaleString());
  document.getElementById('top-balance').textContent = credits.toLocaleString();
}

function addBonus(amount) {
  credits += amount;
  syncCredits();
  showToast(`+${amount} Bonus Chips added!`);
}

function refillCredits(amount) {
  credits = amount;
  syncCredits();
  showToast(`Balance reset to ${amount}!`);
}

function showToast(msg) {
  const t = document.getElementById('toast-box');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2200);
}

// Card Renderer & Filters
function createCard(g) {
  return `
    <div class="game-card" onclick="launchGame(${g.id})">
      <div class="game-icon"><span>${g.icon}</span></div>
      <div class="game-info">
        <span class="tag">${g.tag}</span>
        <h3>${g.title}</h3>
        <span class="play-btn">PLAY NOW</span>
      </div>
    </div>
  `;
}

function renderLobby(cat = 'all', query = '') {
  const grid = document.getElementById('lobby-grid');
  const list = gamesData.filter(g => {
    const matchCat = (cat === 'all') || (g.tag === cat);
    const matchQ = g.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });
  grid.innerHTML = list.map(createCard).join('');
}

function filterLobby(cat, btn) {
  document.querySelectorAll('#lobby-cats .cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLobby(cat, document.getElementById('lobby-search').value);
}

document.getElementById('lobby-search').addEventListener('input', (e) => {
  renderLobby('all', e.target.value);
});

// Boot Application
document.getElementById('home-grid').innerHTML = gamesData.slice(0, 8).map(createCard).join('');
renderLobby();
syncCredits();
showPage('home');
// Profile Avatar & State Logic
const avatars = ['A', '👑', '🦁', '🐉', '🐯', '💎'];
let currentAvatarIdx = 0;

function cycleAvatar() {
  currentAvatarIdx = (currentAvatarIdx + 1) % avatars.length;
  const newAvatar = avatars[currentAvatarIdx];
  
  document.getElementById('profile-avatar-display').textContent = newAvatar;
  document.querySelector('.avatar-small').textContent = newAvatar;
  localStorage.setItem('royal_avatar', newAvatar);
  showToast(`Avatar updated to: ${newAvatar}`);
}

function saveProfileChanges() {
  const fName = document.getElementById('prof-fname').value.trim() || 'Alex';
  const lName = document.getElementById('prof-lname').value.trim() || 'Morgan';
  const fullName = `${fName} ${lName}`;

  document.getElementById('user-display-name').textContent = fullName;
  localStorage.setItem('royal_username', fullName);
  showToast('✓ Profile changes saved successfully!');
}

function clearDemoData() {
  if (confirm('Are you sure you want to reset all demo progress and credits?')) {
    localStorage.clear();
    credits = 10000;
    syncCredits();
    showToast('✓ Cache cleared! Restarting sandbox...');
    setTimeout(() => location.reload(), 1000);
  }
}

// Load saved profile data on startup
window.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('royal_username');
  const savedAvatar = localStorage.getItem('royal_avatar');

  if (savedName && document.getElementById('user-display-name')) {
    document.getElementById('user-display-name').textContent = savedName;
  }
  if (savedAvatar) {
    if (document.getElementById('profile-avatar-display')) {
      document.getElementById('profile-avatar-display').textContent = savedAvatar;
    }
    if (document.querySelector('.avatar-small')) {
      document.querySelector('.avatar-small').textContent = savedAvatar;
    }
  }
});
// ================= ADVANCED TEEN PATTI ENGINE =================
let tpState = {
  pot: 0,
  currentBet: 50,
  seen: false,
  packed: false,
  turn: 'player', // 'player', 'bot1', 'bot2'
  inRound: false,
  players: {
    player: { name: 'You', cards: [], chips: 0, packed: false, seen: false },
    bot1: { name: 'Vikram (AI)', cards: [], chips: 15000, packed: false, seen: false },
    bot2: { name: 'Priya (AI)', cards: [], chips: 18000, packed: false, seen: false }
  }
};

// Hand Ranking Constants
const TP_SUITS = ['♠', '♥', '♦', '♣'];
const TP_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Replace existing Teen Patti injection inside buildArena(g)
function setupTeenPattiArena() {
  const container = document.getElementById('dynamic-arena');
  document.querySelector('.controls-bar').style.display = 'none'; // Hide generic controls

  container.innerHTML = `
    <div class="tp-felt-table">
      <div class="tp-opponents">
        <div class="tp-seat" id="seat-bot1">
          <div class="tp-bubble" id="bubble-bot1">Chaal 50</div>
          <div class="tp-seat-avatar">🧔🏽</div>
          <div class="tp-cards-row" id="cards-bot1">
            <div class="card-3d back"></div>
            <div class="card-3d back"></div>
            <div class="card-3d back"></div>
          </div>
          <div class="tp-seat-info">
            <b>Vikram</b><br>
            <span class="gold-text" id="chips-bot1">🪙 15,000</span>
          </div>
        </div>

        <div class="tp-seat" id="seat-bot2">
          <div class="tp-bubble" id="bubble-bot2">Chaal 50</div>
          <div class="tp-seat-avatar">👩🏻</div>
          <div class="tp-cards-row" id="cards-bot2">
            <div class="card-3d back"></div>
            <div class="card-3d back"></div>
            <div class="card-3d back"></div>
          </div>
          <div class="tp-seat-info">
            <b>Priya</b><br>
            <span class="gold-text" id="chips-bot2">🪙 18,000</span>
          </div>
        </div>
      </div>

      <div class="tp-pot-center">
        <div class="tp-pot-label">TOTAL POT</div>
        <div class="tp-pot-val" id="tp-pot-display">🪙 150</div>
      </div>

      <div class="tp-player-area">
        <div class="tp-cards-row" id="cards-player">
          <div class="card-3d back"></div>
          <div class="card-3d back"></div>
          <div class="card-3d back"></div>
        </div>

        <div class="tp-action-grid">
          <button class="btn-tp btn-pack" id="tp-btn-pack" onclick="tpPlayerPack()">PACK (FOLD)</button>
          <button class="btn-tp btn-see" id="tp-btn-see" onclick="tpPlayerSee()">SEE CARDS</button>
          <button class="btn-tp btn-chaal" id="tp-btn-chaal" onclick="tpPlayerChaal()">CHAAL (50)</button>
          <button class="btn-tp btn-show" id="tp-btn-show" onclick="tpShowdown()">SHOW</button>
          <button class="btn-tp btn-chaal" id="tp-btn-start" style="display:none; background:#2ecc71" onclick="startTeenPattiRound()">NEW ROUND</button>
        </div>
      </div>
    </div>
  `;
  startTeenPattiRound();
}

// Generate & Shuffle Deck
function getTPDeck() {
  const deck = [];
  for (let s of TP_SUITS) {
    for (let i = 0; i < TP_RANKS.length; i++) {
      deck.push({ rank: TP_RANKS[i], val: i + 2, suit: s });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

// Start Round
function startTeenPattiRound() {
  if (credits < 50) {
    setStatus('Insufficient Credits for Boot Amount (50)!', false);
    return;
  }

  // Deduct Boot (₹50 each)
  credits -= 50;
  tpState.players.bot1.chips -= 50;
  tpState.players.bot2.chips -= 50;
  tpState.pot = 150;
  tpState.currentBet = 50;
  tpState.seen = false;
  tpState.packed = false;
  tpState.inRound = true;
  tpState.players.bot1.packed = false;
  tpState.players.bot2.packed = false;
  tpState.players.bot1.seen = false;
  tpState.players.bot2.seen = false;

  syncCredits();
  updateTPElements();

  const deck = getTPDeck();
  tpState.players.player.cards = [deck.pop(), deck.pop(), deck.pop()];
  tpState.players.bot1.cards = [deck.pop(), deck.pop(), deck.pop()];
  tpState.players.bot2.cards = [deck.pop(), deck.pop(), deck.pop()];

  // Reset Card UI
  renderTPPlayerCards(false);
  document.getElementById('cards-bot1').innerHTML = `<div class="card-3d back"></div><div class="card-3d back"></div><div class="card-3d back"></div>`;
  document.getElementById('cards-bot2').innerHTML = `<div class="card-3d back"></div><div class="card-3d back"></div><div class="card-3d back"></div>`;

  // Button States
  document.getElementById('tp-btn-start').style.display = 'none';
  document.getElementById('tp-btn-pack').style.display = 'inline-block';
  document.getElementById('tp-btn-see').style.display = 'inline-block';
  document.getElementById('tp-btn-chaal').style.display = 'inline-block';
  document.getElementById('tp-btn-show').style.display = 'inline-block';

  setStatus('Boot ₹50 collected. Your Turn! Play Blind or See Cards.', false);
  setTurn('player');
}

function updateTPElements() {
  document.getElementById('tp-pot-display').textContent = `🪙 ${tpState.pot.toLocaleString()}`;
  document.getElementById('chips-bot1').textContent = `🪙 ${tpState.players.bot1.chips.toLocaleString()}`;
  document.getElementById('chips-bot2').textContent = `🪙 ${tpState.players.bot2.chips.toLocaleString()}`;
  const betAmt = tpState.seen ? tpState.currentBet * 2 : tpState.currentBet;
  document.getElementById('tp-btn-chaal').textContent = `CHAAL (${betAmt})`;
}

function renderTPPlayerCards(revealed) {
  const container = document.getElementById('cards-player');
  if (!revealed) {
    container.innerHTML = `<div class="card-3d back"></div><div class="card-3d back"></div><div class="card-3d back"></div>`;
  } else {
    container.innerHTML = tpState.players.player.cards.map(c => {
      const isRed = c.suit === '♥' || c.suit === '♦';
      return `
        <div class="card-3d ${isRed ? 'red' : 'black'}">
          <div>${c.rank}</div>
          <div style="text-align:center; font-size:22px">${c.suit}</div>
          <div style="text-align:right">${c.rank}</div>
        </div>
      `;
    }).join('');
  }
}

function tpPlayerSee() {
  if (tpState.seen) return;
  tpState.seen = true;
  renderTPPlayerCards(true);
  document.getElementById('tp-btn-see').style.display = 'none';
  updateTPElements();
  setStatus('Cards revealed! Chaal amount is now 2x.', false);
}

function tpPlayerChaal() {
  if (!tpState.inRound) return;
  const cost = tpState.seen ? tpState.currentBet * 2 : tpState.currentBet;
  if (credits < cost) {
    setStatus('Insufficient Credits for Chaal!', false);
    return;
  }
  credits -= cost;
  tpState.pot += cost;
  syncCredits();
  updateTPElements();
  setStatus('You placed Chaal. Bot turns commencing...', false);
  setTurn('bot1');
  setTimeout(runBot1Turn, 1000);
}

function tpPlayerPack() {
  tpState.packed = true;
  tpState.inRound = false;
  setStatus('You packed (folded). Vikram & Priya will fight for the pot!', false);
  endTPOptions();
}

function setTurn(turn) {
  tpState.turn = turn;
  document.getElementById('seat-bot1').classList.toggle('turn', turn === 'bot1');
  document.getElementById('seat-bot2').classList.toggle('turn', turn === 'bot2');
  const btns = ['tp-btn-pack', 'tp-btn-see', 'tp-btn-chaal', 'tp-btn-show'];
  btns.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = (turn !== 'player');
  });
}

function botBubble(botId, msg) {
  const b = document.getElementById(`bubble-${botId}`);
  b.textContent = msg;
  b.style.display = 'block';
  setTimeout(() => { b.style.display = 'none'; }, 1800);
}

// Bot 1 AI
function runBot1Turn() {
  if (tpState.players.bot1.packed) {
    setTurn('bot2');
    setTimeout(runBot2Turn, 800);
    return;
  }
  const score = evaluateHand(tpState.players.bot1.cards).score;
  const cost = tpState.currentBet;

  if (score < 150 && Math.random() < 0.25) {
    tpState.players.bot1.packed = true;
    botBubble('bot1', 'PACK');
  } else {
    tpState.players.bot1.chips -= cost;
    tpState.pot += cost;
    botBubble('bot1', `CHAAL ${cost}`);
  }
  updateTPElements();
  setTurn('bot2');
  setTimeout(runBot2Turn, 1000);
}

// Bot 2 AI
function runBot2Turn() {
  if (tpState.players.bot2.packed) {
    setTurn('player');
    return;
  }
  const score = evaluateHand(tpState.players.bot2.cards).score;
  const cost = tpState.currentBet;

  if (score < 140 && Math.random() < 0.3) {
    tpState.players.bot2.packed = true;
    botBubble('bot2', 'PACK');
  } else {
    tpState.players.bot2.chips -= cost;
    tpState.pot += cost;
    botBubble('bot2', `CHAAL ${cost}`);
  }
  updateTPElements();

  // Check if both bots packed
  if (tpState.players.bot1.packed && tpState.players.bot2.packed && !tpState.packed) {
    credits += tpState.pot;
    syncCredits();
    setStatus(`🎉 ALL BOTS PACKED! You won the Pot of 🪙 ${tpState.pot}!`, true);
    endTPOptions();
    return;
  }

  setTurn('player');
  setStatus('Your Turn! Chaal or Show?', false);
}

// Hand Evaluator (Trio > Pure Seq > Seq > Color > Pair > High Card)
function evaluateHand(cards) {
  const c = [...cards].sort((a, b) => b.val - a.val);
  const isFlush = (c[0].suit === c[1].suit && c[1].suit === c[2].suit);
  const isSeq = (c[0].val - c[1].val === 1 && c[1].val - c[2].val === 1) || 
                (c[0].val === 14 && c[1].val === 3 && c[2].val === 2); // A-2-3

  // 1. Trail / Trio
  if (c[0].val === c[1].val && c[1].val === c[2].val) {
    return { name: `Trio of ${c[0].rank}s`, score: 5000 + c[0].val };
  }
  // 2. Pure Sequence
  if (isFlush && isSeq) {
    return { name: 'Pure Sequence (Straight Flush)', score: 4000 + c[0].val };
  }
  // 3. Normal Sequence
  if (isSeq) {
    return { name: 'Sequence (Straight)', score: 3000 + c[0].val };
  }
  // 4. Color / Flush
  if (isFlush) {
    return { name: 'Color (Flush)', score: 2000 + c[0].val };
  }
  // 5. Pair
  if (c[0].val === c[1].val || c[1].val === c[2].val || c[0].val === c[2].val) {
    const pairVal = (c[0].val === c[1].val) ? c[0].val : c[2].val;
    return { name: `Pair of ${pairVal}`, score: 1000 + pairVal };
  }
  // 6. High Card
  return { name: `High Card ${c[0].rank}`, score: c[0].val * 10 + c[1].val };
}

// Showdown Calculation
function tpShowdown() {
  tpState.inRound = false;

  // Reveal Bot Cards
  revealBotCards('cards-bot1', tpState.players.bot1.cards);
  revealBotCards('cards-bot2', tpState.players.bot2.cards);
  renderTPPlayerCards(true);

  const pHand = evaluateHand(tpState.players.player.cards);
  const b1Hand = evaluateHand(tpState.players.bot1.cards);
  const b2Hand = evaluateHand(tpState.players.bot2.cards);

  let winner = 'player';
  let bestScore = tpState.packed ? -1 : pHand.score;
  let winningDesc = pHand.name;

  if (!tpState.players.bot1.packed && b1Hand.score > bestScore) {
    winner = 'bot1';
    bestScore = b1Hand.score;
    winningDesc = `Vikram with ${b1Hand.name}`;
  }
  if (!tpState.players.bot2.packed && b2Hand.score > bestScore) {
    winner = 'bot2';
    bestScore = b2Hand.score;
    winningDesc = `Priya with ${b2Hand.name}`;
  }

  if (winner === 'player') {
    credits += tpState.pot;
    syncCredits();
    setStatus(`🏆 YOU WON THE POT! ${winningDesc} (+🪙 ${tpState.pot.toLocaleString()})`, true);
  } else {
    setStatus(`Winner: ${winningDesc}. Better luck next time!`, false);
  }

  endTPOptions();
}

function revealBotCards(containerId, cards) {
  document.getElementById(containerId).innerHTML = cards.map(c => {
    const isRed = c.suit === '♥' || c.suit === '♦';
    return `
      <div class="card-3d ${isRed ? 'red' : 'black'}">
        <div>${c.rank}</div>
        <div style="text-align:center; font-size:22px">${c.suit}</div>
        <div style="text-align:right">${c.rank}</div>
      </div>
    `;
  }).join('');
}

function endTPOptions() {
  document.getElementById('tp-btn-pack').style.display = 'none';
  document.getElementById('tp-btn-see').style.display = 'none';
  document.getElementById('tp-btn-chaal').style.display = 'none';
  document.getElementById('tp-btn-show').style.display = 'none';
  document.getElementById('tp-btn-start').style.display = 'inline-block';
}

// Hook Teen Patti setup in launchGame
const defaultLaunchGame = launchGame;
launchGame = function(id) {
  const g = gamesData.find(item => item.id === id);
  if (!g) return;

  if (g.engine === 'teenpatti') {
    activeGame = g;
    document.getElementById('stage-title').textContent = g.title;
    document.getElementById('stage-tag').textContent = g.tag.toUpperCase();
    setupTeenPattiArena();
    showPage('game');
  } else {
    document.querySelector('.controls-bar').style.display = 'flex';
    defaultLaunchGame(id);
  }
};
