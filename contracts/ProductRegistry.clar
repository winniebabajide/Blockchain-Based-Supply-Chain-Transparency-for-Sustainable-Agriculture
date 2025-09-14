(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-BATCH-ID u101)
(define-constant ERR-INVALID-ORIGIN u102)
(define-constant ERR-INVALID-HASH u103)
(define-constant ERR-INVALID-CERT-ID u104)
(define-constant ERR-INVALID-TIMESTAMP u105)
(define-constant ERR-BATCH-ALREADY-EXISTS u106)
(define-constant ERR-BATCH-NOT-FOUND u107)
(define-constant ERR-INVALID-STATUS u108)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u109)
(define-constant ERR-INVALID-PRODUCT-TYPE u110)
(define-constant ERR-INVALID-QUANTITY u111)
(define-constant ERR-UPDATE-NOT-ALLOWED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-MAX-BATCHES-EXCEEDED u114)
(define-constant ERR-INVALID-LOCATION u115)
(define-constant ERR-INVALID-CURRENCY u116)
(define-constant ERR-INVALID-EXPIRY u117)
(define-constant ERR-INVALID-OWNER u118)
(define-constant ERR-INVALID-DESCRIPTION u119)
(define-constant ERR-INVALID-PRICE u120)

(define-data-var next-batch-id uint u0)
(define-data-var max-batches uint u10000)
(define-data-var registration-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map batches
  uint
  {
    hash: (buff 32),
    origin: principal,
    timestamp: uint,
    cert-id: uint,
    status: bool,
    product-type: (string-utf8 50),
    quantity: uint,
    location: (string-utf8 100),
    currency: (string-utf8 20),
    expiry: uint,
    owner: principal,
    description: (string-utf8 200),
    price: uint
  }
)

(define-map batches-by-hash
  (buff 32)
  uint)

(define-map batch-updates
  uint
  {
    update-hash: (buff 32),
    update-quantity: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-batch (id uint))
  (map-get? batches id)
)

(define-read-only (get-batch-updates (id uint))
  (map-get? batch-updates id)
)

(define-read-only (is-batch-registered (hash (buff 32)))
  (is-some (map-get? batches-by-hash hash))
)

(define-private (validate-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-HASH))
)

(define-private (validate-origin (origin principal))
  (if (not (is-eq origin 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-ORIGIN))
)

(define-private (validate-cert-id (cert uint))
  (if (> cert u0)
      (ok true)
      (err ERR-INVALID-CERT-ID))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-product-type (type (string-utf8 50)))
  (if (or (is-eq type "organic") (is-eq type "fair-trade") (is-eq type "sustainable"))
      (ok true)
      (err ERR-INVALID-PRODUCT-TYPE))
)

(define-private (validate-quantity (qty uint))
  (if (> qty u0)
      (ok true)
      (err ERR-INVALID-QUANTITY))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-currency (cur (string-utf8 20)))
  (if (or (is-eq cur "STX") (is-eq cur "USD") (is-eq cur "BTC"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-expiry (exp uint))
  (if (> exp block-height)
      (ok true)
      (err ERR-INVALID-EXPIRY))
)

(define-private (validate-owner (own principal))
  (if (not (is-eq own 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-OWNER))
)

(define-private (validate-description (desc (string-utf8 200)))
  (if (and (> (len desc) u0) (<= (len desc) u200))
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-price (pr uint))
  (if (>= pr u0)
      (ok true)
      (err ERR-INVALID-PRICE))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-origin contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-batches (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-MAX-BATCHES-EXCEEDED))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-batches new-max)
    (ok true)
  )
)

(define-public (set-registration-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set registration-fee new-fee)
    (ok true)
  )
)

(define-public (register-batch
  (batch-hash (buff 32))
  (origin principal)
  (cert-id uint)
  (product-type (string-utf8 50))
  (quantity uint)
  (location (string-utf8 100))
  (currency (string-utf8 20))
  (expiry uint)
  (owner principal)
  (description (string-utf8 200))
  (price uint)
)
  (let (
        (next-id (var-get next-batch-id))
        (current-max (var-get max-batches))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-BATCHES-EXCEEDED))
    (try! (validate-hash batch-hash))
    (try! (validate-origin origin))
    (try! (validate-cert-id cert-id))
    (try! (validate-product-type product-type))
    (try! (validate-quantity quantity))
    (try! (validate-location location))
    (try! (validate-currency currency))
    (try! (validate-expiry expiry))
    (try! (validate-owner owner))
    (try! (validate-description description))
    (try! (validate-price price))
    (asserts! (is-none (map-get? batches-by-hash batch-hash)) (err ERR-BATCH-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get registration-fee) tx-sender authority-recipient))
    )
    (map-set batches next-id
      {
        hash: batch-hash,
        origin: origin,
        timestamp: block-height,
        cert-id: cert-id,
        status: true,
        product-type: product-type,
        quantity: quantity,
        location: location,
        currency: currency,
        expiry: expiry,
        owner: owner,
        description: description,
        price: price
      }
    )
    (map-set batches-by-hash batch-hash next-id)
    (var-set next-batch-id (+ next-id u1))
    (print { event: "batch-registered", id: next-id })
    (ok next-id)
  )
)

(define-public (update-batch
  (batch-id uint)
  (update-hash (buff 32))
  (update-quantity uint)
)
  (let ((batch (map-get? batches batch-id)))
    (match batch
      b
        (begin
          (asserts! (is-eq (get owner b) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-hash update-hash))
          (try! (validate-quantity update-quantity))
          (let ((existing (map-get? batches-by-hash update-hash)))
            (match existing
              existing-id
                (asserts! (is-eq existing-id batch-id) (err ERR-BATCH-ALREADY-EXISTS))
              (begin true)
            )
          )
          (let ((old-hash (get hash b)))
            (if (is-eq old-hash update-hash)
                (ok true)
                (begin
                  (map-delete batches-by-hash old-hash)
                  (map-set batches-by-hash update-hash batch-id)
                  (ok true)
                )
            )
          )
          (map-set batches batch-id
            {
              hash: update-hash,
              origin: (get origin b),
              timestamp: block-height,
              cert-id: (get cert-id b),
              status: (get status b),
              product-type: (get product-type b),
              quantity: update-quantity,
              location: (get location b),
              currency: (get currency b),
              expiry: (get expiry b),
              owner: (get owner b),
              description: (get description b),
              price: (get price b)
            }
          )
          (map-set batch-updates batch-id
            {
              update-hash: update-hash,
              update-quantity: update-quantity,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "batch-updated", id: batch-id })
          (ok true)
        )
      (err ERR-BATCH-NOT-FOUND)
    )
  )
)

(define-public (get-batch-count)
  (ok (var-get next-batch-id))
)

(define-public (check-batch-existence (hash (buff 32)))
  (ok (is-batch-registered hash))
)