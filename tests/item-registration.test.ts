import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity environment
const mockClarity = {
  contracts: {
    itemRegistration: {
      lastItemId: 0,
      items: new Map(),
      
      registerItem: function(name, description, sport, year) {
        const newId = this.lastItemId + 1;
        this.lastItemId = newId;
        
        this.items.set(newId, {
          name,
          description,
          sport,
          year,
          registeredBy: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Mock principal
          registrationTime: 100 // Mock block height
        });
        
        return { value: newId };
      },
      
      getItem: function(itemId) {
        return this.items.get(itemId) || null;
      },
      
      getLastItemId: function() {
        return this.lastItemId;
      }
    }
  }
};

describe('Item Registration Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockClarity.contracts.itemRegistration.lastItemId = 0;
    mockClarity.contracts.itemRegistration.items = new Map();
  });
  
  it('should register a new item and return the item ID', () => {
    const contract = mockClarity.contracts.itemRegistration;
    
    const result = contract.registerItem(
        'Signed Baseball',
        'Baseball signed by Babe Ruth',
        'Baseball',
        1932
    );
    
    expect(result.value).toBe(1);
    expect(contract.getLastItemId()).toBe(1);
  });
  
  it('should store item details correctly', () => {
    const contract = mockClarity.contracts.itemRegistration;
    
    contract.registerItem(
        'Championship Ring',
        'NBA Championship ring from 2023',
        'Basketball',
        2023
    );
    
    const item = contract.getItem(1);
    
    expect(item).not.toBeNull();
    expect(item.name).toBe('Championship Ring');
    expect(item.description).toBe('NBA Championship ring from 2023');
    expect(item.sport).toBe('Basketball');
    expect(item.year).toBe(2023);
  });
  
  it('should increment item IDs sequentially', () => {
    const contract = mockClarity.contracts.itemRegistration;
    
    contract.registerItem('Item 1', 'Description 1', 'Sport 1', 2021);
    contract.registerItem('Item 2', 'Description 2', 'Sport 2', 2022);
    contract.registerItem('Item 3', 'Description 3', 'Sport 3', 2023);
    
    expect(contract.getLastItemId()).toBe(3);
    
    const item1 = contract.getItem(1);
    const item2 = contract.getItem(2);
    const item3 = contract.getItem(3);
    
    expect(item1.name).toBe('Item 1');
    expect(item2.name).toBe('Item 2');
    expect(item3.name).toBe('Item 3');
  });
});
