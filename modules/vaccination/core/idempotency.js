const _idempotency = new Set();

function isDuplicate(key){ return _idempotency.has(key); }

function markDone(key){
  _idempotency.add(key);
  if(_idempotency.size>5000) _idempotency.clear();
}

module.exports = { isDuplicate, markDone };