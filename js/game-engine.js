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
  } else if (g.engine === 'teenpatti') {
    actionBtn.textContent = 'DEAL HAND';
    container.innerHTML = `
      <div class="tp-table">
        <p style="text-align:center; color:var(--gold-primary); font-size:12px; font-weight:800">PLAYER'S 3-CARD HAND</p>
        <div class="tp-hand">
          <div class="tp-card" id="tp-c1">🂠</div>
          <div class="tp-card" id="tp-c2">🂠</div>
          <div class="tp-card" id="tp-c3">🂠</div>
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
  else if (activeGame.engine === 'teenpatti') playTeenPatti();
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
