/**
 * Simulates one launch with the locked 80/20 against mainnet, and sends
 * nothing: create_v2, create_fee_sharing_config and update_fee_shares_v2 in
 * one transaction, then checks the simulated accounts against the policy
 *
 *   npm run launch:dry-run -- <creator with SOL> <treasury> <lookup table>
 *
 * The creator only has to hold enough SOL for the simulation; no key is used
 */
import { Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { bondingCurvePda, feeSharingConfigPda } from "@pump-fun/pump-sdk";
import { launchInstructions, sharingFacts } from "@/lib/pump/shares";
import { launchPolicy, sharingProblems } from "@/lib/pump/share-rules";
const c = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
const creator = new PublicKey(process.argv[2]);
const treasury = new PublicKey(process.argv[3]);
const r = launchPolicy({ developer: creator.toBase58(), treasury: treasury.toBase58(), sponsor: null }) as any;
const table = (await c.getAddressLookupTable(new PublicKey(process.argv[4]))).value!;
const mint = Keypair.generate();
const ixs = await launchInstructions({ creator, mint: mint.publicKey, policy: r.policy, name: "Fornum Test Coin", symbol: "FTEST", uri: "https://gateway.pinata.cloud/ipfs/bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy" });
const { blockhash } = await c.getLatestBlockhash();
const tx = new VersionedTransaction(new TransactionMessage({ payerKey: creator, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message([table]));
tx.sign([mint]);
console.log("bytes", tx.serialize().length);
const sc = feeSharingConfigPda(mint.publicKey), bc = bondingCurvePda(mint.publicKey);
const before = await c.getBalance(creator);
const sim = await c.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true, accounts: { encoding: "base64", addresses: [sc, bc, mint.publicKey, creator].map(k => k.toBase58()) } });
console.log("err", JSON.stringify(sim.value.err), "CU", sim.value.unitsConsumed);
if (sim.value.err) { console.log((sim.value.logs || []).slice(-8).join("\n")); process.exit(0); }
const [s, b, m, w] = sim.value.accounts!;
const raw = (a: any) => ({ owner: new PublicKey(a.owner), data: Buffer.from(a.data[0], "base64"), lamports: a.lamports });
const f = sharingFacts({ mint: mint.publicKey, mintOwner: new PublicKey(m!.owner), sharing: raw(s), curve: raw(b), poolCoinCreator: null });
console.log({ version: f.version, adminRevoked: f.adminRevoked, curveCreatorIsSharing: f.curveCreator === f.sharingAddress, shareholders: f.shareholders });
console.log("problems", sharingProblems(f, r.policy));
console.log("launch cost lamports", before - w!.lamports);
