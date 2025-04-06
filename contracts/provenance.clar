;; Provenance Contract
;; Documents history and chain of custody

(define-map ownership-history
  {
    item-id: uint,
    sequence: uint
  }
  {
    owner: principal,
    acquired-from: principal,
    transaction-time: uint,
    transaction-type: (string-ascii 20),
    transaction-notes: (string-ascii 200)
  }
)

(define-map current-ownership
  { item-id: uint }
  {
    owner: principal,
    sequence: uint
  }
)

(define-public (record-initial-ownership
    (item-id uint)
    (transaction-notes (string-ascii 200)))
  (let
    ((sequence u1))
    (begin
      (map-set ownership-history
        {
          item-id: item-id,
          sequence: sequence
        }
        {
          owner: tx-sender,
          acquired-from: tx-sender,
          transaction-time: block-height,
          transaction-type: "initial",
          transaction-notes: transaction-notes
        }
      )
      (map-set current-ownership
        { item-id: item-id }
        {
          owner: tx-sender,
          sequence: sequence
        }
      )
      (ok sequence)
    )
  )
)

(define-public (transfer-ownership
    (item-id uint)
    (new-owner principal)
    (transaction-type (string-ascii 20))
    (transaction-notes (string-ascii 200)))
  (let
    ((current-record (unwrap! (map-get? current-ownership { item-id: item-id }) (err u404)))
     (current-owner (get owner current-record))
     (current-sequence (get sequence current-record))
     (new-sequence (+ current-sequence u1)))
    (begin
      (asserts! (is-eq current-owner tx-sender) (err u403))
      (map-set ownership-history
        {
          item-id: item-id,
          sequence: new-sequence
        }
        {
          owner: new-owner,
          acquired-from: tx-sender,
          transaction-time: block-height,
          transaction-type: transaction-type,
          transaction-notes: transaction-notes
        }
      )
      (map-set current-ownership
        { item-id: item-id }
        {
          owner: new-owner,
          sequence: new-sequence
        }
      )
      (ok new-sequence)
    )
  )
)

(define-read-only (get-current-owner (item-id uint))
  (map-get? current-ownership { item-id: item-id })
)

(define-read-only (get-ownership-record (item-id uint) (sequence uint))
  (map-get? ownership-history { item-id: item-id, sequence: sequence })
)
