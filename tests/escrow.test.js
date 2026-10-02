import test from 'node:test';
import assert from 'node:assert/strict';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory } from 'ethers';
import solc from 'solc';
import { readFileSync } from 'node:fs';
import { parseUSDC, formatUSDC, normalizeInvoice } from '../frontend/utils.js';

const artifact = JSON.parse(readFileSync(new URL('../artifacts/PayGuard.json', import.meta.url)));
const mockSource = `pragma solidity ^0.8.20; contract MockToken {
 mapping(address=>uint) public balanceOf; mapping(address=>mapping(address=>uint)) public allowance;
 function mint(address to,uint n) external {balanceOf[to]+=n;}
 function approve(address to,uint n) external returns(bool){allowance[msg.sender][to]=n;return true;}
 function transfer(address to,uint n) external returns(bool){require(balanceOf[msg.sender]>=n);balanceOf[msg.sender]-=n;balanceOf[to]+=n;return true;}
 function transferFrom(address from,address to,uint n) external returns(bool){require(allowance[from][msg.sender]>=n && balanceOf[from]>=n); allowance[from][msg.sender]-=n;balanceOf[from]-=n;balanceOf[to]+=n;return true;}
}`;
const out = JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'Mock.sol':{content:mockSource}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode']}}}})));
const mock = out.contracts['Mock.sol'].MockToken;
async function fixture(t) {
 const rpc = ganache.provider({logging:{quiet:true},chain:{hardfork:'shanghai'},wallet:{totalAccounts:4}});
 t.after(()=>rpc.disconnect());
 const provider = new BrowserProvider(rpc); provider.pollingInterval=10;
 const [owner,payer,payee,other] = await Promise.all([0,1,2,3].map(i=>provider.getSigner(i)));
 const token=await new ContractFactory(mock.abi,mock.evm.bytecode.object,owner).deploy();await token.waitForDeployment();
 const escrow=await new ContractFactory(artifact.abi,artifact.bytecode,owner).deploy(await token.getAddress(),await owner.getAddress());await escrow.waitForDeployment();
 await (await token.mint(await payer.getAddress(),100000000n)).wait();
 const block=await provider.getBlock('latest'); const deadline=block.timestamp+100;
 await (await escrow.connect(payer).createInvoice(await payee.getAddress(),10000000n,deadline,'Example work')).wait();
 await (await token.connect(payer).approve(await escrow.getAddress(),10000000n)).wait();
 return {rpc,owner,payer,payee,other,token,escrow,deadline};
}

test('exact decimal parsing and tuple decoding',()=>{
 assert.equal(parseUSDC('9007199254740993.123456'),9007199254740993123456n);
 assert.equal(formatUSDC(1234567n),'1.234567');
 for(const x of ['1e3','-1','NaN','0.0000001','1.']) assert.throws(()=>parseUSDC(x));
 assert.equal(normalizeInvoice(['payer','payee',1n,2n,'<script>',1,3n]).description,'<script>');
});
test('payee cannot accept work; payer accepts before release; invoice fee is fixed',async t=>{
 const {escrow,token,payer,payee,owner,other}=await fixture(t);
 await assert.rejects(escrow.connect(other).fundInvoice.staticCall(1));
 await (await escrow.connect(payer).fundInvoice(1)).wait();
 await assert.rejects(escrow.connect(payee).confirmComplete.staticCall(1));
 await assert.rejects(escrow.connect(payee).release.staticCall(1));
 await (await escrow.setFee(1000)).wait();
 await (await escrow.connect(payer).confirmComplete(1)).wait();
 await (await escrow.connect(payee).release(1)).wait();
 assert.equal(await token.balanceOf(await payee.getAddress()),9750000n);
 assert.equal(await token.balanceOf(await owner.getAddress()),250000n);
 assert.equal((await escrow.invoices(1)).status,3n);
 await assert.rejects(escrow.connect(payee).release.staticCall(1));
});
test('deadline blocks funding and permits payer refund after funding',async t=>{
 const {escrow,token,payer,payee,rpc}=await fixture(t);
 await (await escrow.connect(payer).fundInvoice(1)).wait();
 await assert.rejects(escrow.connect(payer).refund.staticCall(1));
 const now=Number((await escrow.invoices(1)).deadline)+100;
 await (await escrow.connect(payer).createInvoice(await payee.getAddress(),1n,now,'Late invoice')).wait();
 await rpc.request({method:'evm_increaseTime',params:[250]}); await rpc.request({method:'evm_mine',params:[]});
 await assert.rejects(escrow.connect(payer).fundInvoice.staticCall(2));
 await (await escrow.connect(payer).refund(1)).wait();
 assert.equal(await token.balanceOf(await payer.getAddress()),100000000n);
 assert.equal((await escrow.invoices(1)).status,4n);
});
test('dispute resolution requires owner and handles refund and release',async t=>{
 const {escrow,payer,payee,token}=await fixture(t);
 await (await escrow.connect(payer).fundInvoice(1)).wait();
 await assert.rejects(escrow.connect(payee).dispute.staticCall(1));
 await (await escrow.connect(payer).dispute(1)).wait();
 await assert.rejects(escrow.connect(payee).resolveDispute.staticCall(1,true));
 await (await escrow.resolveDispute(1,false)).wait();
 assert.equal(await token.balanceOf(await payer.getAddress()),100000000n);
 const deadline=Number((await escrow.invoices(1)).deadline)+100;
 await (await escrow.connect(payer).createInvoice(await payee.getAddress(),10000000n,deadline,'Second')).wait();
 await (await token.connect(payer).approve(await escrow.getAddress(),10000000n)).wait();
 await (await escrow.connect(payer).fundInvoice(2)).wait();
 await (await escrow.connect(payer).dispute(2)).wait();
 await (await escrow.resolveDispute(2,true)).wait();
 assert.equal(await token.balanceOf(await payee.getAddress()),9750000n);
});
test('invalid invoice parameters and excessive fees are rejected',async t=>{
 const {escrow,payer,payee,deadline}=await fixture(t);
 await assert.rejects(escrow.connect(payer).createInvoice.staticCall(await payer.getAddress(),1n,deadline,'Self'));
 await assert.rejects(escrow.connect(payer).createInvoice.staticCall(await payee.getAddress(),0n,deadline,'Zero'));
 await assert.rejects(escrow.setFee.staticCall(1001));
 await assert.rejects(escrow.connect(payer).setFee.staticCall(1));
});
