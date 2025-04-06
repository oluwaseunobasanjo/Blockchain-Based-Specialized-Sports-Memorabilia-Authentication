;; Player Verification Contract
;; Validates authenticity of athlete signatures

(define-map verified-players
  { player-id: (string-ascii 50) }
  {
    name: (string-ascii 100),
    sport: (string-ascii 50),
    verified: bool,
    verified-by: principal,
    verification-time: uint
  }
)

(define-map player-signatures
  {
    player-id: (string-ascii 50),
    item-id: uint
  }
  {
    signature-hash: (buff 32),
    verified: bool,
    verification-time: uint
  }
)

(define-constant contract-owner tx-sender)

(define-public (register-player
    (player-id (string-ascii 50))
    (name (string-ascii 100))
    (sport (string-ascii 50)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err u403))
    (map-set verified-players
      { player-id: player-id }
      {
        name: name,
        sport: sport,
        verified: true,
        verified-by: tx-sender,
        verification-time: block-height
      }
    )
    (ok true)
  )
)

(define-public (verify-signature
    (player-id (string-ascii 50))
    (item-id uint)
    (signature-hash (buff 32)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err u403))
    (asserts! (is-some (map-get? verified-players { player-id: player-id })) (err u404))
    (map-set player-signatures
      {
        player-id: player-id,
        item-id: item-id
      }
      {
        signature-hash: signature-hash,
        verified: true,
        verification-time: block-height
      }
    )
    (ok true)
  )
)

(define-read-only (is-signature-verified (player-id (string-ascii 50)) (item-id uint))
  (match (map-get? player-signatures { player-id: player-id, item-id: item-id })
    signature-data (get verified signature-data)
    false
  )
)

(define-read-only (get-player (player-id (string-ascii 50)))
  (map-get? verified-players { player-id: player-id })
)
