import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity environment
const mockClarity = {
  contracts: {
    authenticationCertificate: {
      certificates: new Map(),
      itemCertificates: new Map(),
      lastCertificateId: 0,
      contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Mock principal
      blockHeight: 100, // Mock current block height
      certificateValidityPeriod: 52560, // ~1 year in blocks
      
      issueCertificate: function(itemId, certificateHash, sender) {
        if (sender !== this.contractOwner) {
          return { error: 403 };
        }
        
        const newId = this.lastCertificateId + 1;
        this.lastCertificateId = newId;
        
        const expiration = this.blockHeight + this.certificateValidityPeriod;
        
        this.certificates.set(newId, {
          itemId,
          issuer: sender,
          issueTime: this.blockHeight,
          expirationTime: expiration,
          revoked: false,
          certificateHash
        });
        
        this.itemCertificates.set(itemId, { certificateId: newId });
        
        return { value: newId };
      },
      
      revokeCertificate: function(certificateId, sender) {
        const cert = this.certificates.get(certificateId);
        
        if (!cert) {
          return { error: 404 };
        }
        
        if (sender !== this.contractOwner) {
          return { error: 403 };
        }
        
        cert.revoked = true;
        this.certificates.set(certificateId, cert);
        
        return { value: true };
      },
      
      getCertificate: function(certificateId) {
        return this.certificates.get(certificateId) || null;
      },
      
      getItemCertificate: function(itemId) {
        return this.itemCertificates.get(itemId) || null;
      },
      
      isCertificateValid: function(certificateId) {
        const cert = this.certificates.get(certificateId);
        
        if (!cert) {
          return false;
        }
        
        return !cert.revoked && this.blockHeight <= cert.expirationTime;
      },
      
      // Helper for tests to simulate time passing
      advanceBlockHeight: function(blocks) {
        this.blockHeight += blocks;
      }
    }
  }
};

describe('Authentication Certificate Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockClarity.contracts.authenticationCertificate.certificates = new Map();
    mockClarity.contracts.authenticationCertificate.itemCertificates = new Map();
    mockClarity.contracts.authenticationCertificate.lastCertificateId = 0;
    mockClarity.contracts.authenticationCertificate.blockHeight = 100;
  });
  
  it('should issue a certificate when called by contract owner', () => {
    const contract = mockClarity.contracts.authenticationCertificate;
    const owner = contract.contractOwner;
    const mockCertHash = new Uint8Array(32).fill(1);
    
    const result = contract.issueCertificate(1, mockCertHash, owner);
    
    expect(result.value).toBe(1);
    
    const cert = contract.getCertificate(1);
    expect(cert).not.toBeNull();
    expect(cert.itemId).toBe(1);
    expect(cert.issuer).toBe(owner);
    expect(cert.revoked).toBe(false);
    
    const itemCert = contract.getItemCertificate(1);
    expect(itemCert).not.toBeNull();
    expect(itemCert.certificateId).toBe(1);
  });
  
  it('should not issue a certificate when called by non-owner', () => {
    const contract = mockClarity.contracts.authenticationCertificate;
    const nonOwner = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const mockCertHash = new Uint8Array(32).fill(1);
    
    const result = contract.issueCertificate(1, mockCertHash, nonOwner);
    
    expect(result.error).toBe(403);
    expect(contract.getCertificate(1)).toBeNull();
    expect(contract.getItemCertificate(1)).toBeNull();
  });
  
  it('should revoke a certificate', () => {
    const contract = mockClarity.contracts.authenticationCertificate;
    const owner = contract.contractOwner;
    const mockCertHash = new Uint8Array(32).fill(1);
    
    // Issue certificate first
    contract.issueCertificate(1, mockCertHash, owner);
    
    // Revoke certificate
    const result = contract.revokeCertificate(1, owner);
    
    expect(result.value).toBe(true);
    
    const cert = contract.getCertificate(1);
    expect(cert.revoked).toBe(true);
    expect(contract.isCertificateValid(1)).toBe(false);
  });
  
  it('should consider expiration when checking certificate validity', () => {
    const contract = mockClarity.contracts.authenticationCertificate;
    const owner = contract.contractOwner;
    const mockCertHash = new Uint8Array(32).fill(1);
    
    // Issue certificate
    contract.issueCertificate(1, mockCertHash, owner);
    
    // Certificate should be valid initially
    expect(contract.isCertificateValid(1)).toBe(true);
    
    // Advance block height beyond expiration
    contract.advanceBlockHeight(contract.certificateValidityPeriod + 1);
    
    // Certificate should now be invalid due to expiration
    expect(contract.isCertificateValid(1)).toBe(false);
  });
});
