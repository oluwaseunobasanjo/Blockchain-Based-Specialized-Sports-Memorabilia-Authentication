import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity environment
const mockClarity = {
  contracts: {
    provenance: {
      ownershipHistory: new Map(),
      currentOwnership: new Map(),
      
      recordInitialOwnership: function(itemId, transactionNotes, sender) {
        const sequence = 1;
        const key = `${itemId}-${sequence}`;
        
        this.ownershipHistory.set(key, {
          owner: sender,
          acquiredFrom: sender,
          transactionTime: 100, // Mock block height
          transactionType: "initial",
          transactionNotes
        });
        
        this.currentOwnership.set(itemId, {
          owner: sender,
          sequence
        });
        
        return { value: sequence };
      },
      
      transferOwnership: function(itemId, newOwner, transactionType, transactionNotes, sender) {
        const currentRecord = this.currentOwnership.get(itemId);
        
        if (!currentRecord) {
          return { error: 404 };
        }
        
        if (currentRecord.owner !== sender) {
          return { error: 403 };
        }
        
        const currentSequence = currentRecord.sequence;
        const newSequence = currentSequence + 1;
        const key = `${itemId}-${newSequence}`;
        
        this.ownershipHistory.set(key, {
          owner: newOwner,
          acquiredFrom: sender,
          transactionTime: 100, // Mock block height
          transactionType,
          transactionNotes
        });
        
        this.currentOwnership.set(itemId, {
          owner: newOwner,
          sequence: newSequence
        });
        
        return { value: newSequence };
      },
      
      getCurrentOwner: function(itemId) {
        return this.currentOwnership.get(itemId) || null;
      },
      
      getOwnershipRecord: function(itemId, sequence) {
        const key = `${itemId}-${sequence}`;
        return this.ownershipHistory.get(key) || null;
      }
    }
  }
};

describe('Provenance Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockClarity.contracts.provenance.ownershipHistory = new Map();
    mockClarity.contracts.provenance.currentOwnership = new Map();
  });
  
  it('should record initial ownership', () => {
    const contract = mockClarity.contracts.provenance;
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    const result = contract.recordInitialOwnership(1, 'Original acquisition', sender);
    
    expect(result.value).toBe(1);
    
    const currentOwner = contract.getCurrentOwner(1);
    expect(currentOwner).not.toBeNull();
    expect(currentOwner.owner).toBe(sender);
    expect(currentOwner.sequence).toBe(1);
    
    const record = contract.getOwnershipRecord(1, 1);
    expect(record).not.toBeNull();
    expect(record.owner).toBe(sender);
    expect(record.transactionType).toBe('initial');
    expect(record.transactionNotes).toBe('Original acquisition');
  });
  
  it('should transfer ownership to a new owner', () => {
    const contract = mockClarity.contracts.provenance;
    const originalOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const newOwner = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    // Record initial ownership
    contract.recordInitialOwnership(1, 'Original acquisition', originalOwner);
    
    // Transfer ownership
    const result = contract.transferOwnership(
        1,
        newOwner,
        'sale',
        'Sold at auction',
        originalOwner
    );
    
    expect(result.value).toBe(2);
    
    const currentOwner = contract.getCurrentOwner(1);
    expect(currentOwner.owner).toBe(newOwner);
    expect(currentOwner.sequence).toBe(2);
    
    const record = contract.getOwnershipRecord(1, 2);
    expect(record.owner).toBe(newOwner);
    expect(record.acquiredFrom).toBe(originalOwner);
    expect(record.transactionType).toBe('sale');
    expect(record.transactionNotes).toBe('Sold at auction');
  });
  
  it('should not allow non-owners to transfer ownership', () => {
    const contract = mockClarity.contracts.provenance;
    const originalOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const newOwner = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const nonOwner = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    // Record initial ownership
    contract.recordInitialOwnership(1, 'Original acquisition', originalOwner);
    
    // Attempt transfer by non-owner
    const result = contract.transferOwnership(
        1,
        newOwner,
        'sale',
        'Attempted unauthorized sale',
        nonOwner
    );
    
    expect(result.error).toBe(403);
    
    // Ownership should remain unchanged
    const currentOwner = contract.getCurrentOwner(1);
    expect(currentOwner.owner).toBe(originalOwner);
    expect(currentOwner.sequence).toBe(1);
  });
});
