/**
 * A local page for sending the same amount of SOL to a list of addresses
 *
 *   node scripts/send-sol-ui.mts
 *   then open http://localhost:4545
 *
 * Listens on 127.0.0.1 only, so nothing outside this computer can reach it.
 * The key is used for the one request it arrives with and is never written to
 * disk or printed. "Check" only reads balances; nothing moves until "Send"
 */
import { createServer } from "node:http";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

const PORT = 4545;
const BATCH = 15;
const connection = new Connection(process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com", "confirmed");

function parseKey(raw: string) {
  const v = raw.trim();
  return v.startsWith("[")
    ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(v) as number[]))
    : Keypair.fromSecretKey(bs58.decode(v));
}

function parseAddresses(text: string) {
  const found = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g) ?? [];
  const good: string[] = [];
  for (const a of found) {
    try {
      new PublicKey(a);
      if (!good.includes(a)) good.push(a);
    } catch {
      // not an address
    }
  }
  return good;
}

async function plan(body: { key: string; text: string; sol: string }) {
  const sender = parseKey(body.key);
  const sol = Number(String(body.sol).replace(",", "."));
  if (!Number.isFinite(sol) || sol <= 0) throw new Error("Сумма должна быть больше нуля");
  const addresses = parseAddresses(body.text).filter((a) => a !== sender.publicKey.toBase58());
  if (addresses.length === 0) throw new Error("В файле не найдено ни одного адреса");
  const lamports = Math.round(sol * LAMPORTS_PER_SOL);
  const fees = Math.ceil(addresses.length / BATCH) * 10_000;
  const balance = await connection.getBalance(sender.publicKey);
  const total = lamports * addresses.length;
  return { sender, addresses, lamports, balance, total, fees, enough: balance >= total + fees };
}

const PAGE = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Рассылка SOL</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:15px system-ui;background:#111;color:#eee;max-width:720px;margin:30px auto;padding:0 16px}
label{display:block;margin:18px 0 6px;font-weight:600}input,textarea{width:100%;box-sizing:border-box;background:#1c1c1c;color:#eee;border:1px solid #333;border-radius:8px;padding:10px;font:14px monospace}
button{margin:20px 10px 0 0;padding:12px 22px;border:0;border-radius:8px;font-weight:700;cursor:pointer}#check{background:#ddd}#send{background:#22c55e;color:#000}button:disabled{opacity:.4}
pre{background:#1c1c1c;border-radius:8px;padding:12px;white-space:pre-wrap;word-break:break-all}.err{color:#f87171}.ok{color:#4ade80}</style></head><body>
<h2>Рассылка SOL по списку</h2>
<label>1. Файл с адресами (.txt или .csv)</label><input type="file" id="file" accept=".txt,.csv,text/plain">
<label>или вставь адреса сюда</label><textarea id="text" rows="5" placeholder="по одному адресу в строке"></textarea>
<label>2. Приватный ключ кошелька, с которого отправлять</label><input type="password" id="key" placeholder="base58 или [1,2,3,...]" autocomplete="off">
<label>3. Сколько SOL на каждый адрес</label><input id="sol" value="0.015">
<button id="check">Проверить</button><button id="send" disabled>Отправить</button>
<pre id="out">Сначала нажми «Проверить»: покажет баланс, адреса и сумму. Ничего не отправится.</pre>
<script>
const $=id=>document.getElementById(id);let fileText="";
$("file").onchange=async e=>{fileText=await e.target.files[0].text();$("send").disabled=true};
for(const id of ["text","key","sol"]) $(id).oninput=()=>$("send").disabled=true;
const body=()=>JSON.stringify({key:$("key").value,text:fileText+"\\n"+$("text").value,sol:$("sol").value});
$("check").onclick=async()=>{$("out").textContent="Проверяю...";const r=await fetch("/plan",{method:"POST",body:body()});const j=await r.json();
if(!r.ok){$("out").innerHTML='<span class="err">'+j.error+'</span>';return}
$("out").innerHTML="Отправитель: "+j.sender+"\\nБаланс: "+j.balance+" SOL\\nАдресов: "+j.count+"\\nПо "+j.sol+" SOL, всего "+j.total+" SOL + около "+j.fees+" SOL комиссии\\n\\n"+j.addresses.map((a,i)=>(i+1)+". "+a).join("\\n")+"\\n\\n"+(j.enough?'<span class="ok">Денег хватает. Можно отправлять.</span>':'<span class="err">Не хватает денег: этого баланса хватит на '+j.fits+' адресов.</span>');
$("send").disabled=!j.enough};
$("send").onclick=async()=>{if(!confirm("Отправить? Это реальные деньги, отменить нельзя."))return;$("send").disabled=true;$("check").disabled=true;$("out").textContent="Отправляю, не закрывай страницу...\\n";
const r=await fetch("/send",{method:"POST",body:body()});const rd=r.body.getReader();const dec=new TextDecoder();
for(;;){const {done,value}=await rd.read();if(done)break;$("out").textContent+=dec.decode(value)}$("check").disabled=false};
</script></body></html>`;

createServer(async (req, res) => {
  if (req.method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body: { key: string; text: string; sol: string };
  try {
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400).end();
    return;
  }

  if (req.url === "/plan") {
    try {
      const p = await plan(body);
      const sol = (n: number) => +(n / LAMPORTS_PER_SOL).toFixed(9);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          sender: p.sender.publicKey.toBase58(),
          balance: sol(p.balance),
          count: p.addresses.length,
          sol: sol(p.lamports),
          total: sol(p.total),
          fees: sol(p.fees),
          enough: p.enough,
          fits: Math.max(Math.floor((p.balance - p.fees) / p.lamports), 0),
          addresses: p.addresses,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error && /secret key|bad size|Non-base58|JSON/i.test(err.message)
        ? "Ключ не подходит: нужен приватный ключ Solana (base58 или массив чисел)"
        : err instanceof Error ? err.message : String(err);
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: msg }));
    }
    return;
  }

  if (req.url === "/send") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    try {
      const p = await plan(body);
      if (!p.enough) throw new Error("Не хватает денег на балансе");
      for (let i = 0; i < p.addresses.length; i += BATCH) {
        const chunk = p.addresses.slice(i, i + BATCH);
        const tx = new Transaction();
        for (const a of chunk) {
          tx.add(SystemProgram.transfer({ fromPubkey: p.sender.publicKey, toPubkey: new PublicKey(a), lamports: p.lamports }));
        }
        const sig = await sendAndConfirmTransaction(connection, tx, [p.sender], { commitment: "confirmed" });
        res.write(`Отправлено ${i + 1}-${i + chunk.length}: https://solscan.io/tx/${sig}\n`);
      }
      res.end("Готово, всё отправлено\n");
    } catch (err) {
      res.end(`Ошибка: ${err instanceof Error ? err.message : String(err)}\nТо, что выше отмечено как отправленное, уже ушло.\n`);
    }
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Открой http://localhost:${PORT}`);
});
