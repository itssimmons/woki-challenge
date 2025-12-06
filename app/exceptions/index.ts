namespace Exception {
  export class OutOfWindow extends Error {}
  export class NoCapacity extends Error {}
  export class NotFound extends Error {}
  export class MissingIdempotencyKey extends Error {}
  export class Mutex extends Error {}
}

export default Exception;
