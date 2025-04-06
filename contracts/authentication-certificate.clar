;; Authentication Certificate Contract
;; Issues verifiable proof of legitimacy

(define-map certificates
  { certificate-id: uint }
  {
    item-id: uint,
    issuer: principal,
    issue-time: uint,
    expiration-time: uint,
    revoked: bool,
    certificate-hash: (buff 32)
  }
)

(define-map item-certificates
  { item-id: uint }
  { certificate-id: uint }
)

(define-data-var last-certificate-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant certificate-validity-period u52560) ;; ~1 year in blocks (assuming 10 min blocks)

(define-public (issue-certificate
    (item-id uint)
    (certificate-hash (buff 32)))
  (let
    ((new-id (+ (var-get last-certificate-id) u1))
     (expiration (+ block-height certificate-validity-period)))
    (begin
      (asserts! (is-eq tx-sender contract-owner) (err u403))
      (var-set last-certificate-id new-id)
      (map-set certificates
        { certificate-id: new-id }
        {
          item-id: item-id,
          issuer: tx-sender,
          issue-time: block-height,
          expiration-time: expiration,
          revoked: false,
          certificate-hash: certificate-hash
        }
      )
      (map-set item-certificates
        { item-id: item-id }
        { certificate-id: new-id }
      )
      (ok new-id)
    )
  )
)

(define-public (revoke-certificate (certificate-id uint))
  (let
    ((cert (unwrap! (map-get? certificates { certificate-id: certificate-id }) (err u404))))
    (begin
      (asserts! (is-eq tx-sender contract-owner) (err u403))
      (map-set certificates
        { certificate-id: certificate-id }
        (merge cert { revoked: true })
      )
      (ok true)
    )
  )
)

(define-read-only (get-certificate (certificate-id uint))
  (map-get? certificates { certificate-id: certificate-id })
)

(define-read-only (get-item-certificate (item-id uint))
  (map-get? item-certificates { item-id: item-id })
)

(define-read-only (is-certificate-valid (certificate-id uint))
  (match (map-get? certificates { certificate-id: certificate-id })
    cert (and
           (not (get revoked cert))
           (<= block-height (get expiration-time cert)))
    false
  )
)
