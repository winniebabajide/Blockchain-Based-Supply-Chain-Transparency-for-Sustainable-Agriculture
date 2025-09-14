import { describe, it, expect, beforeEach } from "vitest";
import { bufferCV, stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_BATCH_ID = 101;
const ERR_INVALID_ORIGIN = 102;
const ERR_INVALID_HASH = 103;
const ERR_INVALID_CERT_ID = 104;
const ERR_INVALID_TIMESTAMP = 105;
const ERR_BATCH_ALREADY_EXISTS = 106;
const ERR_BATCH_NOT_FOUND = 107;
const ERR_INVALID_STATUS = 108;
const ERR_AUTHORITY_NOT_VERIFIED = 109;
const ERR_INVALID_PRODUCT_TYPE = 110;
const ERR_INVALID_QUANTITY = 111;
const ERR_UPDATE_NOT_ALLOWED = 112;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_MAX_BATCHES_EXCEEDED = 114;
const ERR_INVALID_LOCATION = 115;
const ERR_INVALID_CURRENCY = 116;
const ERR_INVALID_EXPIRY = 117;
const ERR_INVALID_OWNER = 118;
const ERR_INVALID_DESCRIPTION = 119;
const ERR_INVALID_PRICE = 120;

interface Batch {
  hash: Buffer;
  origin: string;
  timestamp: number;
  certId: number;
  status: boolean;
  productType: string;
  quantity: number;
  location: string;
  currency: string;
  expiry: number;
  owner: string;
  description: string;
  price: number;
}

interface BatchUpdate {
  updateHash: Buffer;
  updateQuantity: number;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class ProductRegistryMock {
  state: {
    nextBatchId: number;
    maxBatches: number;
    registrationFee: number;
    authorityContract: string | null;
    batches: Map<number, Batch>;
    batchUpdates: Map<number, BatchUpdate>;
    batchesByHash: Map<string, number>;
  } = {
    nextBatchId: 0,
    maxBatches: 10000,
    registrationFee: 500,
    authorityContract: null,
    batches: new Map(),
    batchUpdates: new Map(),
    batchesByHash: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];
  constructor() {
    this.reset();
  }
  reset() {
    this.state = {
      nextBatchId: 0,
      maxBatches: 10000,
      registrationFee: 500,
      authorityContract: null,
      batches: new Map(),
      batchUpdates: new Map(),
      batchesByHash: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
  }
  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }
  setRegistrationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.registrationFee = newFee;
    return { ok: true, value: true };
  }
  registerBatch(
    batchHash: Buffer,
    origin: string,
    certId: number,
    productType: string,
    quantity: number,
    location: string,
    currency: string,
    expiry: number,
    owner: string,
    description: string,
    price: number
  ): Result<number> {
    if (this.state.nextBatchId >= this.state.maxBatches) return { ok: false, value: ERR_MAX_BATCHES_EXCEEDED };
    if (batchHash.length !== 32) return { ok: false, value: ERR_INVALID_HASH };
    if (origin === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_ORIGIN };
    if (certId <= 0) return { ok: false, value: ERR_INVALID_CERT_ID };
    if (!["organic", "fair-trade", "sustainable"].includes(productType)) return { ok: false, value: ERR_INVALID_PRODUCT_TYPE };
    if (quantity <= 0) return { ok: false, value: ERR_INVALID_QUANTITY };
    if (!location || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!["STX", "USD", "BTC"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (expiry <= this.blockHeight) return { ok: false, value: ERR_INVALID_EXPIRY };
    if (owner === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_OWNER };
    if (!description || description.length > 200) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (price < 0) return { ok: false, value: ERR_INVALID_PRICE };
    const hashStr = batchHash.toString('hex');
    if (this.state.batchesByHash.has(hashStr)) return { ok: false, value: ERR_BATCH_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.stxTransfers.push({ amount: this.state.registrationFee, from: this.caller, to: this.state.authorityContract });
    const id = this.state.nextBatchId;
    const batch: Batch = {
      hash: batchHash,
      origin,
      timestamp: this.blockHeight,
      certId,
      status: true,
      productType,
      quantity,
      location,
      currency,
      expiry,
      owner,
      description,
      price,
    };
    this.state.batches.set(id, batch);
    this.state.batchesByHash.set(hashStr, id);
    this.state.nextBatchId++;
    return { ok: true, value: id };
  }
  getBatch(id: number): Batch | null {
    return this.state.batches.get(id) || null;
  }
  updateBatch(id: number, updateHash: Buffer, updateQuantity: number): Result<boolean> {
    const batch = this.state.batches.get(id);
    if (!batch) return { ok: false, value: false };
    if (batch.owner !== this.caller) return { ok: false, value: false };
    if (updateHash.length !== 32) return { ok: false, value: false };
    if (updateQuantity <= 0) return { ok: false, value: false };
    const hashStr = updateHash.toString('hex');
    if (this.state.batchesByHash.has(hashStr) && this.state.batchesByHash.get(hashStr) !== id) {
      return { ok: false, value: false };
    }
    const updated: Batch = {
      ...batch,
      hash: updateHash,
      timestamp: this.blockHeight,
      quantity: updateQuantity,
    };
    this.state.batches.set(id, updated);
    this.state.batchesByHash.delete(batch.hash.toString('hex'));
    this.state.batchesByHash.set(hashStr, id);
    this.state.batchUpdates.set(id, {
      updateHash,
      updateQuantity,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }
  getBatchCount(): Result<number> {
    return { ok: true, value: this.state.nextBatchId };
  }
  checkBatchExistence(batchHash: Buffer): Result<boolean> {
    return { ok: true, value: this.state.batchesByHash.has(batchHash.toString('hex')) };
  }
}

describe("ProductRegistry", () => {
  let contract: ProductRegistryMock;
  beforeEach(() => {
    contract = new ProductRegistryMock();
    contract.reset();
  });
  it("registers a batch successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    const result = contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const batch = contract.getBatch(0);
    expect(batch?.hash).toEqual(hash);
    expect(batch?.origin).toBe("ST3ORIGIN");
    expect(batch?.certId).toBe(1);
    expect(batch?.productType).toBe("organic");
    expect(batch?.quantity).toBe(100);
    expect(batch?.location).toBe("FarmA");
    expect(batch?.currency).toBe("STX");
    expect(batch?.expiry).toBe(100000);
    expect(batch?.owner).toBe("ST4OWNER");
    expect(batch?.description).toBe("Fresh produce");
    expect(batch?.price).toBe(50);
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST2TEST" }]);
  });
  it("rejects duplicate batch hashes", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    const result = contract.registerBatch(
      hash,
      "ST5ORIGIN",
      2,
      "fair-trade",
      200,
      "FarmB",
      "USD",
      200000,
      "ST6OWNER",
      "Organic fruits",
      100
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_BATCH_ALREADY_EXISTS);
  });
  it("rejects registration without authority contract", () => {
    const hash = Buffer.alloc(32, 1);
    const result = contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });
  it("rejects invalid hash length", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(31, 1);
    const result = contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_HASH);
  });
  it("rejects invalid quantity", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    const result = contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      0,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_QUANTITY);
  });
  it("rejects invalid product type", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    const result = contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "invalid",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PRODUCT_TYPE);
  });
  it("updates a batch successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const oldHash = Buffer.alloc(32, 1);
    contract.registerBatch(
      oldHash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST1TEST",
      "Fresh produce",
      50
    );
    const newHash = Buffer.alloc(32, 2);
    const result = contract.updateBatch(0, newHash, 150);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const batch = contract.getBatch(0);
    expect(batch?.hash).toEqual(newHash);
    expect(batch?.quantity).toBe(150);
    const update = contract.state.batchUpdates.get(0);
    expect(update?.updateHash).toEqual(newHash);
    expect(update?.updateQuantity).toBe(150);
    expect(update?.updater).toBe("ST1TEST");
  });
  it("rejects update for non-existent batch", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    const result = contract.updateBatch(99, hash, 150);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
  it("rejects update by non-owner", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    contract.caller = "ST5FAKE";
    const newHash = Buffer.alloc(32, 2);
    const result = contract.updateBatch(0, newHash, 150);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
  it("sets registration fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setRegistrationFee(1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.registrationFee).toBe(1000);
    const hash = Buffer.alloc(32, 1);
    contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });
  it("rejects registration fee change without authority", () => {
    const result = contract.setRegistrationFee(1000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
  it("returns correct batch count", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash1 = Buffer.alloc(32, 1);
    contract.registerBatch(
      hash1,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    const hash2 = Buffer.alloc(32, 2);
    contract.registerBatch(
      hash2,
      "ST5ORIGIN",
      2,
      "fair-trade",
      200,
      "FarmB",
      "USD",
      200000,
      "ST6OWNER",
      "Organic fruits",
      100
    );
    const result = contract.getBatchCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });
  it("checks batch existence correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    const result = contract.checkBatchExistence(hash);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const fakeHash = Buffer.alloc(32, 3);
    const result2 = contract.checkBatchExistence(fakeHash);
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });
  it("rejects batch registration with invalid expiry", () => {
    contract.setAuthorityContract("ST2TEST");
    const hash = Buffer.alloc(32, 1);
    contract.blockHeight = 100;
    const result = contract.registerBatch(
      hash,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      99,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_EXPIRY);
  });
  it("rejects batch registration with max batches exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxBatches = 1;
    const hash1 = Buffer.alloc(32, 1);
    contract.registerBatch(
      hash1,
      "ST3ORIGIN",
      1,
      "organic",
      100,
      "FarmA",
      "STX",
      100000,
      "ST4OWNER",
      "Fresh produce",
      50
    );
    const hash2 = Buffer.alloc(32, 2);
    const result = contract.registerBatch(
      hash2,
      "ST5ORIGIN",
      2,
      "fair-trade",
      200,
      "FarmB",
      "USD",
      200000,
      "ST6OWNER",
      "Organic fruits",
      100
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_BATCHES_EXCEEDED);
  });
  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });
  it("rejects invalid authority contract", () => {
    const result = contract.setAuthorityContract("SP000000000000000000002Q6VF78");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
});