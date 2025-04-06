;; Item Registration Contract
;; Records details of collectible sports items

(define-data-var last-item-id uint u0)

(define-map items
  { item-id: uint }
  {
    name: (string-ascii 100),
    description: (string-ascii 500),
    sport: (string-ascii 50),
    year: uint,
    registered-by: principal,
    registration-time: uint
  }
)

(define-public (register-item
    (name (string-ascii 100))
    (description (string-ascii 500))
    (sport (string-ascii 50))
    (year uint))
  (let
    ((new-id (+ (var-get last-item-id) u1)))
    (begin
      (var-set last-item-id new-id)
      (map-set items
        { item-id: new-id }
        {
          name: name,
          description: description,
          sport: sport,
          year: year,
          registered-by: tx-sender,
          registration-time: block-height
        }
      )
      (ok new-id)
    )
  )
)

(define-read-only (get-item (item-id uint))
  (map-get? items { item-id: item-id })
)

(define-read-only (get-last-item-id)
  (var-get last-item-id)
)
