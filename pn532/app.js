const el = (id) => document.getElementById(id);
const state = { reader: null, busy: false, scanning: false, scanTask: null, cards: [], profiles: [] };
const store = {
  read(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { log('瀏覽器儲存失敗'); } },
};
state.cards = store.read('pcr532-scans-v1');
state.profiles = store.read('pcr532-profiles-v1');

function log(message, detail) {
  const time = new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
  el('log').textContent += '[' + time + '] ' + message + (detail ? ' — ' + detail : '') + '\n';
  el('log').scrollTop = el('log').scrollHeight;
}
function notify(message, kind = 'info') {
  el('notice').className = 'alert alert-' + kind;
  el('notice').textContent = message;
}
function showResult(title, message, kind) {
  el('resultTitle').textContent = title;
  el('resultTitle').className = 'modal-title fs-5 text-' + kind;
  el('resultMessage').textContent = message;
  if (window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(el('resultModal')).show();
  else window.alert(title + '\n' + message);
}
function errorText(error) { return (error?.name || 'Error') + ': ' + (error?.message || String(error)); }
function connected() { return !!state.reader?.$adapter?.isOpen?.(); }
function requireReader() {
  if (!connected()) throw new Error('BLE 連線已中斷，請重新連接 PCR532。');
  return state.reader;
}
function refreshControls() {
  el('connectBtn').disabled = state.busy || state.scanning || !navigator.bluetooth;
  el('disconnectBtn').disabled = state.busy || !state.reader;
  el('firmwareBtn').disabled = state.busy || state.scanning || !connected();
  document.querySelectorAll('.needs-connection').forEach((button) => { button.disabled = state.busy || state.scanning || !connected(); });
  el('scanStopBtn').disabled = !state.scanning;
}
async function run(label, action, popupOnError = false) {
  if (state.busy || state.scanning) return;
  state.busy = true; refreshControls(); log(label);
  try { await action(); }
  catch (error) {
    const message = error.message || String(error);
    notify(message, 'danger'); log('操作失敗', errorText(error));
    if (popupOnError) showResult('寫入失敗', message, 'danger');
  }
  finally { state.busy = false; refreshControls(); }
}
async function connect() {
  if (!window.Pn532?.Pn532 || !window.Pn532Hf14a || !window.Pn532WebbleAdapter || !window.Crypto1) {
    throw new Error('pn532.js 載入失敗，請確認網路連線後重新整理。');
  }
  if (state.reader) await disconnect();
  const reader = new window.Pn532.Pn532();
  await reader.use(new window.Pn532WebbleAdapter());
  await reader.use(new window.Pn532Hf14a());
  notify('正在選擇 BLE 裝置…');
  await reader.$adapter.connect();
  state.reader = reader;
  el('connectionStatus').textContent = 'BLE 已連線';
  log('BLE 已連線');
  try { await readFirmware(); }
  catch (error) { notify('BLE 已連線，但讀取韌體失敗：' + error.message, 'warning'); log('韌體讀取失敗', errorText(error)); }
  refreshControls();
}
async function disconnect() {
  state.scanning = false;
  if (state.scanTask) await state.scanTask;
  if (state.reader) {
    try { await state.reader.$adapter.disconnect(); }
    finally { state.reader = null; }
  }
  el('connectionStatus').textContent = '尚未連線';
  el('firmwareValue').textContent = '—';
  notify('已中斷連線。', 'secondary');
  log('BLE 已中斷');
  refreshControls();
}
async function readFirmware() {
  const version = await requireReader().getFirmwareVersion();
  el('firmwareValue').textContent = (version.ic || 'PN532') + ' ' + (version.firmware || '');
  notify('PCR532 已連線，可以選擇下方工具。', 'success');
  log('韌體資訊', JSON.stringify(version));
}
function showTab(name) {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    const active = button.dataset.tab === name;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tool-panel').forEach((panel) => panel.classList.toggle('d-none', panel.id !== name + 'Panel'));
}

function packetHex(packet) { return packet?.hex?.toUpperCase() || ''; }
function recordCard(card) {
  if (!card?.uid) return false;
  const item = { time: Date.now(), uid: packetHex(card.uid), atqa: packetHex(card.atqa), sak: packetHex(card.sak) };
  state.cards = [item, ...state.cards.filter((old) => old.uid !== item.uid || old.atqa !== item.atqa || old.sak !== item.sak)].slice(0, 500);
  store.write('pcr532-scans-v1', state.cards);
  renderScans();
  log('讀到卡片', 'UID ' + item.uid + '；ATQA ' + item.atqa + '；SAK ' + item.sak);
  return true;
}
function renderScans() {
  const body = el('scanRows'); body.replaceChildren();
  if (!state.cards.length) {
    const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.className = 'text-secondary'; cell.textContent = '尚無紀錄'; return;
  }
  for (const item of state.cards) {
    const row = body.insertRow();
    [new Date(item.time).toLocaleString('zh-TW'), item.uid, item.atqa, item.sak].forEach((value, index) => {
      const cell = row.insertCell(); cell.textContent = value;
      if (index) {
        cell.classList.add('copyable'); cell.title = '點選複製';
        cell.addEventListener('click', async () => { await navigator.clipboard.writeText(value); notify('已複製：' + value, 'success'); });
      }
    });
  }
}
async function scanOnce() {
  const card = await requireReader().$hf14a.mfSelectCard({ timeout: 1500 });
  if (recordCard(card)) notify('讀卡成功：' + packetHex(card.uid), 'success');
  else notify('未偵測到卡片。', 'warning');
}
async function startScanning() {
  if (state.scanning || state.busy) return;
  requireReader();
  state.scanning = true; refreshControls(); notify('正在連續掃描，按「停止」可結束。');
  log('開始連續掃描');
  state.scanTask = (async () => {
    while (state.scanning && connected()) {
      try {
        const card = await state.reader.$hf14a.mfSelectCard({ timeout: 1000 });
        recordCard(card);
      } catch (error) {
        if (!connected()) { log('BLE 連線中斷', errorText(error)); break; }
      }
      if (state.scanning) await new Promise((resolve) => setTimeout(resolve, 150));
    }
    state.scanning = false; state.scanTask = null; refreshControls();
    notify(connected() ? '已停止掃描。' : '掃描已結束；BLE 連線可能已中斷。', connected() ? 'secondary' : 'warning');
    log('停止連續掃描');
  })();
}
function csvCell(value) { return '"' + String(value ?? '').replaceAll('"', '""') + '"'; }
function download(name, blob) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function exportScans() {
  const rows = [['time', 'uid', 'atqa', 'sak'], ...state.cards.map((x) => [new Date(x.time).toISOString(), x.uid, x.atqa, x.sak])];
  download('pcr532-uid-scans.csv', new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}

const Packet = () => window.Pn532.Packet;
function requiredHex(value, bytes, label) {
  const hex = String(value).trim().toUpperCase();
  if (!new RegExp('^[0-9A-F]{' + bytes * 2 + '}$').test(hex)) throw new Error(label + ' 需要 ' + bytes * 2 + ' 位十六進位數字。');
  return Packet().fromHex(hex);
}
function parseKeys(value) {
  const parts = value.trim().split(/[\s,;]+/).filter(Boolean);
  if (!parts.length) throw new Error('請先提供至少一組金鑰。');
  return [...new Set(parts.map((x) => requiredHex(x, 6, '金鑰').hex))].map((x) => Packet().fromHex(x));
}
function parseEml() {
  const source = el('emlData').value;
  if (/[^0-9a-fA-F\s]/.test(source)) throw new Error('EML 只接受十六進位數字與空白。');
  const hex = source.replace(/\s/g, '');
  if (hex.length !== 2048) throw new Error('M1 1K EML 應有 1024 bytes；目前為 ' + hex.length / 2 + ' bytes。');
  return Packet().fromHex(hex);
}
function setEml(data) {
  el('emlData').value = Array.from(data.chunk(16), (block) => block.hex.toUpperCase()).join('\n');
  updateEmlSize();
}
function updateEmlSize() {
  const value = el('emlData').value;
  const count = value.replace(/\s/g, '').length / 2;
  el('emlSize').textContent = '目前 ' + count + ' / 1024 bytes';
  el('emlSize').className = 'form-text' + (count && count !== 1024 ? ' text-danger' : '');
}
function readEmlResult(result, operation) {
  const flags = Array.isArray(result.success) ? result.success : result.success?.read || [];
  const count = flags.filter(Boolean).length;
  log(operation, count + ' / 64 blocks');
  return count;
}
async function readEml(kind) {
  const hf = requireReader().$hf14a;
  const result = kind === 'gen1a' ? await hf.mfReadCardGen1a() : await hf.mfReadCardByKeys({ keys: parseKeys(el('emlKeys').value) });
  setEml(result.data);
  const count = readEmlResult(result, '讀取 EML');
  notify('讀取完成：' + count + '/64 blocks。' + (count < 64 ? '未讀到的 Block 在映像中會是 00，請勿直接當作完整備份寫回。' : ''), count === 64 ? 'success' : 'warning');
}
async function compareEml(kind) {
  const expected = parseEml();
  const hf = requireReader().$hf14a;
  const result = kind === 'gen1a' ? await hf.mfReadCardGen1a() : await hf.mfReadCardByKeys({ keys: parseKeys(el('emlKeys').value) });
  const count = readEmlResult(result, '比對 EML');
  if (count !== 64) throw new Error('只有 ' + count + '/64 blocks 成功讀取，無法完整比對。');
  const same = result.data.hex === expected.hex;
  notify(same ? '比對成功：64 個 Block 均相同。' : '比對完成：卡片資料與 EML 不同。', same ? 'success' : 'warning');
  log('EML 比對', same ? '相同' : '不同');
}
async function writeEml(kind) {
  const data = parseEml();
  const name = kind === 'gen1a' ? 'Gen1a UID' : 'Gen2 CUID';
  const keys = kind === 'gen1a' ? null : parseKeys(el('emlKeys').value);
  if (!confirm('確定要將完整 1024-byte EML 寫入目前的 ' + name + ' 特殊卡嗎？此操作會覆蓋金鑰與存取位，且可能部分成功。')) return;
  const hf = requireReader().$hf14a;
  const result = kind === 'gen1a' ? await hf.mfWriteCardGen1a({ data }) : await hf.mfWriteCardByKeys({ keys, data });
  const count = readEmlResult(result, '寫入 EML');
  const message = '寫入完成：' + count + '/64 blocks。' + (count < 64 ? '已有部分資料可能被改寫，請檢查卡片。' : '');
  notify(message, count === 64 ? 'success' : 'warning');
  showResult(count === 64 ? 'EML 寫入成功' : 'EML 寫入未完成', message, count === 64 ? 'success' : 'warning');
}
function blankEml() {
  if (el('emlData').value.trim() && !confirm('目前映像資料會被空白範本取代，繼續嗎？')) return;
  const data = new (Packet())(1024);
  data.set(Packet().fromHex('0102030404080400000000000000BEAF'), 0);
  const trailer = Packet().fromHex('FFFFFFFFFFFF08778F00FFFFFFFFFFFF');
  for (let sector = 0; sector < 16; sector++) data.set(trailer, sector * 64 + 48);
  setEml(data); notify('已建立空白 1K 映像。尚未寫入任何卡片。', 'secondary');
}
function extractKeys() {
  const data = parseEml();
  const existing = el('emlKeys').value.match(/[0-9a-fA-F]{12}/g) || [];
  for (let sector = 0; sector < 16; sector++) {
    const start = sector * 64 + 48;
    existing.push(data.subarray(start, start + 6).hex, data.subarray(start + 10, start + 16).hex);
  }
  el('emlKeys').value = [...new Set(existing.map((x) => x.toUpperCase()))].join('\n');
  notify('已從 EML 的扇區尾塊提取金鑰欄位；00 欄位可能代表原卡金鑰無法讀取。', 'secondary');
}

function readWriterFields() {
  return {
    uid: requiredHex(el('writerUid').value, 4, 'UID'),
    atqa: requiredHex(el('writerAtqa').value, 2, 'ATQA'),
    sak: requiredHex(el('writerSak').value, 1, 'SAK'),
  };
}
async function readWriterCard() {
  const card = await requireReader().$hf14a.mfSelectCard();
  if (!card?.uid) throw new Error('沒有讀到卡片。');
  el('writerUid').value = packetHex(card.uid);
  el('writerAtqa').value = packetHex(card.atqa);
  el('writerSak').value = packetHex(card.sak);
  notify('已讀取來源卡：' + packetHex(card.uid), 'success');
  log('讀取來源卡', packetHex(card.uid));
}
function renderProfiles() {
  const select = el('writerSaved'); select.replaceChildren();
  select.add(new Option('選擇卡號…', ''));
  state.profiles.forEach((p, i) => select.add(new Option(p.name + ' — ' + p.uid, String(i))));
}
function saveProfile() {
  const fields = readWriterFields();
  const name = prompt('請輸入卡片名稱', fields.uid.hex);
  if (!name?.trim()) return;
  state.profiles.unshift({ name: name.trim(), uid: fields.uid.hex, atqa: fields.atqa.hex, sak: fields.sak.hex });
  store.write('pcr532-profiles-v1', state.profiles); renderProfiles();
  notify('卡號已保存在此瀏覽器。', 'success');
}
function selectedProfile() {
  const i = Number(el('writerSaved').value);
  if (el('writerSaved').value === '' || !state.profiles[i]) throw new Error('請先選擇已儲存的卡號。');
  return [i, state.profiles[i]];
}
function loadProfile() {
  const [, p] = selectedProfile();
  el('writerUid').value = p.uid; el('writerAtqa').value = p.atqa; el('writerSak').value = p.sak;
  notify('已載入：' + p.name, 'secondary');
}
function deleteProfile() {
  const [i, p] = selectedProfile();
  if (!confirm('刪除已儲存卡號「' + p.name + '」嗎？')) return;
  state.profiles.splice(i, 1); store.write('pcr532-profiles-v1', state.profiles); renderProfiles();
  notify('已刪除儲存的卡號。', 'secondary');
}
function exportProfiles() {
  if (!window.Papa) throw new Error('CSV 函式庫尚未載入。');
  const fields = ['uid', 'sak', 'atqa', 'name'];
  const data = state.profiles.map((p) => fields.map((key) => p[key]));
  download('pcr532-saved-cards.csv', new Blob([window.Papa.unparse({ fields, data })], { type: 'text/csv;charset=utf-8' }));
}
async function importProfiles(file) {
  if (!window.Papa) throw new Error('CSV 函式庫尚未載入。');
  const result = window.Papa.parse(await file.text(), { header: true, skipEmptyLines: true });
  if (result.errors.length) throw new Error('CSV 格式有誤：' + result.errors[0].message);
  const profiles = result.data.map((row, index) => {
    const uid = requiredHex(row.uid, 4, '第 ' + (index + 1) + ' 筆 UID').hex;
    const sak = requiredHex(row.sak, 1, '第 ' + (index + 1) + ' 筆 SAK').hex;
    const atqa = requiredHex(row.atqa, 2, '第 ' + (index + 1) + ' 筆 ATQA').hex;
    return { uid, sak, atqa, name: String(row.name || uid).trim() };
  });
  if (!confirm('匯入 ' + profiles.length + ' 筆卡號並取代目前儲存的清單嗎？')) return;
  state.profiles = profiles; store.write('pcr532-profiles-v1', profiles); renderProfiles();
  notify('已匯入 ' + profiles.length + ' 筆卡號。', 'success');
}
async function writeUid() {
  const fields = readWriterFields();
  const kind = el('writerType').value;
  const keys = kind === 'gen1a' ? null : parseKeys(el('writerKeys').value);
  const label = { auto: 'Gen1a 或 Gen2 CUID', gen1a: 'Gen1a UID', gen2: 'Gen2 CUID' }[kind];
  if (!label) throw new Error('請選擇目標卡類型。');
  if (!confirm('確定要將 UID ' + fields.uid.hex + ' 寫入目前放在讀卡機上的 ' + label + ' 特殊卡嗎？')) return;
  const hf = requireReader().$hf14a;
  let writtenBy = kind;
  if (kind === 'gen2') {
    log('嘗試 CUID 寫入');
    try { await hf.mfSetUidGen2({ ...fields, keys }); }
    catch (error) { throw new Error('CUID 寫入失敗（' + error.message + '）。請確認目標卡支援改寫 Block 0，且金鑰清單包含目前的 Key A／B。'); }
  } else {
    log('嘗試 Gen1a 後門寫入');
    try { await hf.mfSetUidGen1a(fields); }
    catch (error) {
      if (kind === 'gen1a') throw new Error('Gen1a 寫入失敗（' + error.message + '）。此卡可能不是 Gen1a UID 卡；可改選自動模式或 CUID。');
      if (error.message !== 'Failed to open backdoor') throw error;
      log('Gen1a 後門無法開啟', '改用金鑰嘗試 CUID');
      try { await hf.mfSetUidGen2({ ...fields, keys }); writtenBy = 'gen2'; }
      catch (fallbackError) {
        throw new Error('Gen1a 後門無法開啟；CUID 寫入也失敗（' + fallbackError.message + '）。請確認目標是可改 UID 的特殊卡，並檢查 CUID 金鑰。');
      }
    }
  }
  const card = await hf.mfSelectCard();
  if (packetHex(card?.uid) !== fields.uid.hex) throw new Error('已送出寫入命令，但複驗 UID 不一致。');
  const message = '寫入並複驗成功：' + fields.uid.hex + '（' + (writtenBy === 'gen1a' ? 'Gen1a' : 'CUID') + '）';
  notify(message, 'success');
  showResult('UID 寫入成功', message, 'success');
  log('寫入 UID 成功', fields.uid.hex + '；' + writtenBy);
}

function detectorUid() { return requiredHex(el('detectorUid').value, 4, '模擬 UID'); }
function detectorBlock() {
  const block = Number(el('detectorBlock').value);
  if (!Number.isInteger(block) || block < 0 || block > (el('detectorType').value === '0' ? 63 : 255)) throw new Error('Block 超出卡片範圍。');
  return block;
}
function sectorOf(block) { return block < 128 ? Math.floor(block / 4) : 32 + Math.floor((block - 128) / 16); }
async function releaseDetector(reader) {
  if (reader?.$adapter?.isOpen?.()) await reader.inRelease().catch(() => {});
}
async function readDetectorUid() {
  const card = await requireReader().$hf14a.mfSelectCard();
  if (!card?.uid || card.uid.length !== 4) throw new Error('此流程需要 4-byte UID 的來源卡。');
  el('detectorUid').value = packetHex(card.uid);
  el('detectorType').value = packetHex(card.atqa) === '0002' && packetHex(card.sak) === '18' ? '1' : '0';
  notify('已讀取來源卡 UID：' + packetHex(card.uid), 'success');
}
async function setDetector() {
  const uid = detectorUid();
  const type = Number(el('detectorType').value);
  if (!confirm('請確認讀卡機上現在放的是「單卡嗅探王」特殊卡。要將模擬 UID 設為 ' + uid.hex + ' 嗎？')) return;
  const reader = requireReader();
  try {
    await reader.$hf14a.inListPassiveTarget();
    await reader.inSelect({ tg: 1 });
    await reader.inCommunicateThru({ data: Packet().fromHex('E000') });
    await reader.inCommunicateThru({ data: new (Packet())([...Packet().fromHex('0A0000AE010201'), ...uid, type]) });
    await reader.inCommunicateThru({ data: Packet().fromHex('0B0000AE01030100') });
  } finally { await releaseDetector(reader); }
  const card = await reader.$hf14a.mfSelectCard();
  if (packetHex(card?.uid) !== uid.hex) throw new Error('設定後複驗 UID 不一致。');
  notify('特殊卡模擬 UID 設定成功：' + uid.hex, 'success');
  log('設定單卡嗅探王', uid.hex);
}
async function calculateDetectorKey() {
  const reader = requireReader();
  let card, records = [];
  try {
    card = (await reader.$hf14a.inListPassiveTarget())?.[0];
    if (!card?.uid) throw new Error('讀不到單卡嗅探王。');
    await reader.inSelect({ tg: 1 });
    await reader.inCommunicateThru({ data: Packet().fromHex('E000') });
    const status = (await reader.inCommunicateThru({ data: Packet().fromHex('0A0000AE000300') })).data;
    if (!status || status[2] < 2) throw new Error('紀錄不足，特殊卡需要至少兩筆相同扇區的驗證紀錄。');
    for (const command of ['0B0000AE000000', '0A0000AE000100']) {
      const data = (await reader.inCommunicateThru({ data: Packet().fromHex(command) })).data;
      if (!data || data.length < 12) throw new Error('特殊卡回傳的紀錄格式不完整。');
      records.push({ block: data[3], isKb: Number(data[2] === 0x61), nt: 0, nr: data.subarray(4, 8), ar: data.subarray(8, 12) });
    }
  } finally { await releaseDetector(reader); }
  if (sectorOf(records[0].block) !== sectorOf(records[1].block) || records[0].isKb !== records[1].isKb) {
    throw new Error('兩筆紀錄不屬於同一扇區與金鑰類型。');
  }
  const key = window.Crypto1.mfkey32v2({
    uid: card.uid, nt0: records[0].nt, nr0: records[0].nr, ar0: records[0].ar,
    nt1: records[1].nt, nr1: records[1].nr, ar1: records[1].ar,
  });
  el('detectorBlock').value = records[0].block;
  el('detectorKeyType').value = String(records[0].isKb);
  el('detectorKey').value = key.hex;
  notify('已計算出候選金鑰，可按「測試讀取」驗證。', 'success');
  log('計算候選 Key', 'Block ' + records[0].block + '，' + (records[0].isKb ? 'Key B' : 'Key A') + ' ' + key.hex);
}
async function testDetectorKey() {
  const block = detectorBlock();
  const isKb = Number(el('detectorKeyType').value);
  const key = requiredHex(el('detectorKey').value, 6, '金鑰');
  const data = await requireReader().$hf14a.mfReadBlock({ block, isKb, key });
  notify('測試成功：已讀取 Block ' + block + '。', 'success');
  log('Key 測試成功', 'Block ' + block + '：' + packetHex(data));
}

document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
el('connectBtn').addEventListener('click', () => run('連接 BLE', connect));
el('disconnectBtn').addEventListener('click', async () => {
  state.scanning = false;
  if (state.scanTask) await state.scanTask;
  await run('中斷 BLE', disconnect);
});
el('firmwareBtn').addEventListener('click', () => run('讀取韌體', readFirmware));
el('scanOnceBtn').addEventListener('click', () => run('掃描一次', scanOnce));
el('scanStartBtn').addEventListener('click', () => startScanning().catch((e) => { notify(e.message, 'danger'); log('掃描失敗', errorText(e)); }));
el('scanStopBtn').addEventListener('click', () => { state.scanning = false; refreshControls(); });
el('scanCsvBtn').addEventListener('click', exportScans);
el('scanClearBtn').addEventListener('click', () => { if (state.cards.length && !confirm('清空此瀏覽器的 UID 掃描紀錄嗎？')) return; state.cards = []; store.write('pcr532-scans-v1', []); renderScans(); });
el('emlData').addEventListener('input', updateEmlSize);
el('emlReadNormalBtn').addEventListener('click', () => run('讀取一般 M1／CUID', () => readEml('normal')));
el('emlReadGen1Btn').addEventListener('click', () => run('讀取 Gen1a UID 卡', () => readEml('gen1a')));
el('emlCompareNormalBtn').addEventListener('click', () => run('比對一般 M1／CUID', () => compareEml('normal')));
el('emlCompareGen1Btn').addEventListener('click', () => run('比對 Gen1a UID 卡', () => compareEml('gen1a')));
el('emlWriteGen1Btn').addEventListener('click', () => run('寫入 Gen1a UID 卡', () => writeEml('gen1a'), true));
el('emlWriteGen2Btn').addEventListener('click', () => run('寫入 Gen2 CUID 卡', () => writeEml('gen2'), true));
el('emlBlankBtn').addEventListener('click', () => run('建立空白 EML', blankEml));
el('emlExtractKeysBtn').addEventListener('click', () => run('從 EML 提取金鑰', extractKeys));
el('emlCopyBtn').addEventListener('click', () => run('複製 EML', async () => { parseEml(); await navigator.clipboard.writeText(el('emlData').value); notify('已複製 EML。', 'success'); }));
el('emlDownloadBtn').addEventListener('click', () => run('下載 EML', () => { const p = parseEml(); download('pcr532-card.eml', new Blob([Array.from(p.chunk(16), (x) => x.hex).join('\n')], { type: 'text/plain' })); }));
el('emlFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size === 1024) setEml(Packet().fromView(new Uint8Array(await file.arrayBuffer())));
    else { el('emlData').value = await file.text(); parseEml(); updateEmlSize(); }
    notify('已匯入 EML，尚未寫入卡片。', 'success');
  } catch (error) { notify(error.message, 'danger'); }
  finally { event.target.value = ''; }
});
el('writerReadBtn').addEventListener('click', () => run('讀取來源卡', readWriterCard));
el('writerWriteBtn').addEventListener('click', () => run('寫入 4-byte UID', writeUid, true));
el('writerSaveBtn').addEventListener('click', () => run('儲存卡號', saveProfile));
el('writerLoadBtn').addEventListener('click', () => run('載入卡號', loadProfile));
el('writerDeleteBtn').addEventListener('click', () => run('刪除卡號', deleteProfile));
el('writerCsvBtn').addEventListener('click', () => run('匯出卡號 CSV', exportProfiles));
el('writerCsvFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  await run('匯入卡號 CSV', () => importProfiles(file));
  event.target.value = '';
});
el('detectorReadUidBtn').addEventListener('click', () => run('從來源卡讀 UID', readDetectorUid));
el('detectorSetBtn').addEventListener('click', () => run('設定單卡嗅探王', setDetector));
el('detectorKeyBtn').addEventListener('click', () => run('計算候選 Key', calculateDetectorKey));
el('detectorTestBtn').addEventListener('click', () => run('用 Key 測試讀取', testDetectorKey));
el('detectorCopyKeyBtn').addEventListener('click', () => run('複製 Key', async () => {
  const key = requiredHex(el('detectorKey').value, 6, '金鑰');
  await navigator.clipboard.writeText(key.hex); notify('已複製 Key。', 'success');
}));
el('copyLogBtn').addEventListener('click', () => run('複製操作紀錄', async () => { await navigator.clipboard.writeText(el('log').textContent); notify('已複製紀錄。', 'success'); }));

renderScans(); renderProfiles(); updateEmlSize();
if (!window.isSecureContext) notify('需要 HTTPS 或 localhost 才能使用藍牙。', 'warning');
else if (!navigator.bluetooth) notify('此瀏覽器不支援 Web Bluetooth；請使用支援 BLE 的 Chrome。', 'warning');
else notify('可使用 BLE。請先按「連接 PCR532」。');
refreshControls();
log('工具箱已就緒', 'BLE 連線');
